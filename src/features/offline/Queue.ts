import { z } from 'zod';
import { doctorSchema, serviceItem } from '../../config/schema';
import {
  bookingSchema,
  slotSchema,
  type Appointment,
  type Booking,
} from '../booking/contracts';
import { MockApiError } from '../../api/mockApi';
export const queueItemSchema = z.object({
  id: z.string(),
  doctor: doctorSchema,
  service: serviceItem.nullable(),
  slot: slotSchema,
  feeInr: z.number().nonnegative(),
  status: z.enum(['queued', 'syncing', 'confirmed', 'conflict', 'error']),
  booking: bookingSchema.nullable(),
});
export type QueueItem = z.infer<typeof queueItemSchema>;
export interface QueueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export class OfflineQueue {
  private state: { items: QueueItem[]; ready: boolean; error: string } = {
    items: [],
    ready: false,
    error: '',
  };
  private listeners = new Set<() => void>();
  private writes = Promise.resolve();
  private syncing = false;
  constructor(
    private store: QueueStorage,
    private submit: (item: QueueItem) => Promise<Booking>,
    private online: () => boolean,
    private now = Date.now,
  ) {}
  getSnapshot = () => this.state;
  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };
  private publish(patch: Partial<typeof this.state>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(cb => cb());
  }
  hydrate = async () => {
    try {
      const raw = await this.store.getItem('tapza.queue.v1');
      const items = raw
        ? z
            .array(queueItemSchema)
            .parse(JSON.parse(raw))
            .map(item => ({
              ...item,
              status:
                item.status === 'syncing' ? ('queued' as const) : item.status,
            }))
        : [];
      this.publish({ items, ready: true, error: '' });
    } catch {
      this.publish({
        ready: false,
        error: 'Could not read saved requests. Retry before booking offline.',
      });
    }
  };
  private change(fn: (items: QueueItem[]) => QueueItem[]): Promise<void> {
    const task = this.writes.then(async () => {
      const items = fn(this.state.items);
      await this.store.setItem('tapza.queue.v1', JSON.stringify(items));
      this.publish({ items, error: '' });
    });
    this.writes = task.catch(() => {
      this.publish({ error: 'Could not save booking requests. Please retry.' });
    });
    return task;
  }
  enqueue = async (appointment: Appointment) => {
    if (!this.state.ready) throw new Error('Queue unavailable');
    await this.change(items => {
      if (
        items.some(
          item =>
            item.slot.id === appointment.slot.id &&
            ['queued', 'syncing', 'confirmed'].includes(item.status),
        )
      )
        throw new Error('Request already saved');
      return [
        {
          ...appointment,
          id: `queue-${this.now()}-${Math.random().toString(36).slice(2)}`,
          status: 'queued',
          booking: null,
        },
        ...items,
      ];
    });
  };
  remove = async (id: string) => {
    if (this.syncing) return;
    await this.change(items => items.filter(item => item.id !== id));
  };
  sync = async (retryErrors = false) => {
    if (this.syncing || !this.state.ready || !this.online()) return;
    this.syncing = true;
    try {
      for (const original of this.state.items) {
        if (!this.online()) break;
        if (
          original.status !== 'queued' &&
          !(retryErrors && original.status === 'error')
        )
          continue;
        const replace = (patch: Partial<QueueItem>) =>
          this.change(items =>
            items.map(item =>
              item.id === original.id ? { ...item, ...patch } : item,
            ),
          );
        // A persisted response is consulted before expiry checks in submit, so a process
        // death after acceptance can still reconcile without submitting twice.
        await replace({ status: 'syncing' });
        try {
          const booking = bookingSchema.parse(await this.submit(original));
          if (
            booking.doctorId !== original.doctor.id ||
            booking.slotId !== original.slot.id ||
            booking.startsAt !== original.slot.startsAt ||
            booking.endsAt !== original.slot.endsAt
          )
            throw new Error('Mismatched booking response');
          await replace({ status: 'confirmed', booking });
        } catch (error) {
          await replace({
            status:
              error instanceof MockApiError && error.status === 409
                ? 'conflict'
                : 'error',
          });
        }
      }
    } catch {
      this.publish({
        items: this.state.items.map(item =>
          item.status === 'syncing' ? { ...item, status: 'error' } : item,
        ),
      });
    } finally {
      this.syncing = false;
    }
  };
}
