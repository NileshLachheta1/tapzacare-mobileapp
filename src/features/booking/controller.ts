import { z } from 'zod';
import {
  isAbortError,
  MockApiError,
  type MockSettings,
} from '../../api/mockApi';
import {
  doctorSchema,
  type Doctor,
  type ServiceItem,
} from '../../config/schema';
import {
  bookingSchema,
  slotSchema,
  type Appointment,
  type BookingRequest,
  type BookingResponse,
  type BookingTarget,
  type Slot,
} from './contracts';
import { addClinicDays, canBookSlot, clinicDate, dateChoices } from './dates';
import {
  bookingReducer,
  initialBookingState,
  type BookingAction,
} from './reducer';

export interface BookingApi {
  getDoctors(settings: MockSettings, signal?: AbortSignal): Promise<Doctor[]>;
  getSlots(
    doctorId: string,
    date: string,
    settings: MockSettings,
    signal?: AbortSignal,
  ): Promise<Slot[]>;
  postBooking(
    body: BookingRequest,
    settings: MockSettings,
    signal?: AbortSignal,
  ): Promise<BookingResponse>;
}
type Dependencies = {
  api: BookingApi;
  settings(): MockSettings;
  consumeConfirmationSettings(): MockSettings;
  now?: () => number;
  offline?: () => boolean;
  enqueue?: (appointment: Appointment) => Promise<void>;
};

/** Owns the booking transaction independently of rendering and native sheet gestures. */
export class BookingController {
  private state = initialBookingState();
  private listeners = new Set<() => void>();
  private session = 0;
  private nextClientId = 0;
  private slotRequest: AbortController | null = null;
  private providerRequest: AbortController | null = null;
  private confirmationRequest: AbortController | null = null;
  private readonly now: () => number;
  constructor(private readonly deps: Dependencies) {
    this.now = deps.now ?? Date.now;
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private send(action: BookingAction) {
    const next = bookingReducer(this.state, action);
    if (next !== this.state) {
      this.state = next;
      this.listeners.forEach(listener => listener());
    }
  }
  openDoctor = (doctor: Doctor) =>
    this.open({ doctorId: doctor.id, doctor, service: null });
  openService = (service: ServiceItem, doctor: Doctor | null = null) =>
    this.open({
      doctorId: service.doctorId,
      doctor: doctor?.id === service.doctorId ? doctor : null,
      service,
    });
  private open(target: BookingTarget) {
    if (this.state.flow.confirmation === 'submitting') {
      return;
    }
    this.slotRequest?.abort();
    this.providerRequest?.abort();
    this.send({
      type: 'open',
      session: ++this.session,
      target,
      date: clinicDate(this.now()),
    });
    if (!target.doctor) {
      void this.retryProvider();
    }
    void this.refreshSlots();
  }
  close = (): boolean => {
    if (this.state.flow.confirmation === 'submitting') {
      return false;
    }
    this.slotRequest?.abort();
    this.providerRequest?.abort();
    this.send({ type: 'close' });
    return true;
  };
  selectDate = (date: string) => {
    const f = this.state.flow;
    if (
      !f.target ||
      f.confirmation === 'submitting' ||
      f.confirmation === 'success' ||
      f.confirmation === 'queued' ||
      !dateChoices(this.now()).includes(date)
    ) {
      return;
    }
    this.send({ type: 'date', date });
    void this.refreshSlots();
  };
  nextDate = () => {
    const f = this.state.flow;
    if (!f.target) {
      return;
    }
    this.selectDate(addClinicDays(f.date, 1));
  };
  selectSlot = (slotId: string) => {
    const f = this.state.flow;
    const slot = f.slots.find(item => item.id === slotId);
    if (
      slot &&
      f.target &&
      f.confirmation !== 'success' &&
      canBookSlot(slot, f.target.doctorId, f.date, this.now())
    ) {
      this.send({ type: 'select', slotId });
    }
  };
  retryProvider = async () => {
    const f = this.state.flow;
    if (
      !f.target ||
      f.confirmation === 'submitting' ||
      f.confirmation === 'success' ||
      f.confirmation === 'queued'
    ) {
      return;
    }
    this.providerRequest?.abort();
    const controller = new AbortController();
    this.providerRequest = controller;
    this.send({ type: 'providerLoading', session: f.session });
    try {
      const doctors = z
        .array(doctorSchema)
        .parse(
          await this.deps.api.getDoctors(
            this.deps.settings(),
            controller.signal,
          ),
        );
      if (controller.signal.aborted) {
        return;
      }
      const doctor = doctors.find(item => item.id === f.target?.doctorId);
      if (!doctor) {
        throw new Error('Provider unavailable');
      }
      this.send({ type: 'providerReady', session: f.session, doctor });
    } catch (error) {
      if (!isAbortError(error) && !controller.signal.aborted) {
        this.send({ type: 'providerError', session: f.session });
      }
    }
  };
  refreshSlots = async () => {
    const f = this.state.flow;
    if (
      !f.target ||
      f.confirmation === 'submitting' ||
      f.confirmation === 'success' ||
      f.confirmation === 'queued'
    ) {
      return;
    }
    this.slotRequest?.abort();
    const controller = new AbortController();
    this.slotRequest = controller;
    const doctorId = f.target.doctorId;
    this.send({ type: 'slotsLoading', session: f.session, date: f.date });
    try {
      const slots = z
        .array(slotSchema)
        .parse(
          await this.deps.api.getSlots(
            f.target.doctorId,
            f.date,
            this.deps.settings(),
            controller.signal,
          ),
        );
      if (controller.signal.aborted) {
        return;
      }
      const matching = slots
        .filter(
          slot =>
            slot.doctorId === doctorId &&
            clinicDate(new Date(slot.startsAt)) === f.date,
        )
        .map(slot => ({
          ...slot,
          available: canBookSlot(slot, doctorId, f.date, this.now()),
        }));
      this.send({
        type: 'slotsReady',
        session: f.session,
        date: f.date,
        slots: matching,
      });
    } catch (error) {
      if (!isAbortError(error) && !controller.signal.aborted) {
        this.send({ type: 'slotsError', session: f.session, date: f.date });
      }
    }
  };
  confirm = async () => {
    const f = this.state.flow;
    if (
      !f.target?.doctor ||
      f.providerStatus !== 'ready' ||
      f.slotStatus !== 'ready' ||
      f.confirmation === 'submitting' ||
      f.confirmation === 'success' ||
      f.confirmation === 'queued'
    ) {
      return;
    }
    const slot = f.slots.find(item => item.id === f.selectedSlotId);
    if (!slot) {
      return;
    }
    if (!canBookSlot(slot, f.target.doctorId, f.date, this.now())) {
      void this.refreshSlots();
      return;
    }
    const clientId = `pending-${++this.nextClientId}`;
    const appointment: Appointment = {
      id: clientId,
      status: 'pending',
      doctor: f.target.doctor,
      service: f.target.service,
      slot,
      feeInr: f.target.service?.priceInr ?? f.target.doctor.feeInr,
      booking: null,
    };
    this.send({ type: 'submit', appointment });
    const controller = new AbortController();
    this.confirmationRequest = controller;
    try {
      if (this.deps.offline?.()) {
        if (!this.deps.enqueue) throw new Error('Offline queue unavailable');
        await this.deps.enqueue(appointment);
        if (!controller.signal.aborted)
          this.send({
            type: 'queued',
            session: f.session,
            clientId,
            appointment,
          });
        return;
      }
      const response = await this.deps.api.postBooking(
        { doctorId: f.target.doctorId, slotId: slot.id },
        this.deps.consumeConfirmationSettings(),
        controller.signal,
      );
      if (controller.signal.aborted) {
        return;
      }
      const booking = bookingSchema.parse(response.data);
      if (
        response.status !== 201 ||
        booking.doctorId !== f.target.doctorId ||
        booking.slotId !== slot.id ||
        booking.startsAt !== slot.startsAt ||
        booking.endsAt !== slot.endsAt
      ) {
        throw new Error('Booking response did not match the selection');
      }
      this.send({ type: 'confirmed', session: f.session, clientId, booking });
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) {
        return;
      }
      const conflict = error instanceof MockApiError && error.status === 409;
      this.send({ type: 'failed', session: f.session, clientId, conflict });
      if (conflict) {
        await this.refreshSlots();
      }
    } finally {
      if (this.confirmationRequest === controller) {
        this.confirmationRequest = null;
      }
    }
  };
  dispose = () => {
    this.slotRequest?.abort();
    this.providerRequest?.abort();
    this.confirmationRequest?.abort();
    // A cancelled client transaction must not survive as a pending appointment.
    this.state = {
      ...this.state,
      flow: initialBookingState().flow,
      appointments: this.state.appointments.filter(
        item => item.status === 'confirmed',
      ),
    };
  };
}
