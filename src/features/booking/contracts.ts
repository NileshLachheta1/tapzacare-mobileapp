import { z } from 'zod';
import type { Doctor, ServiceItem } from '../../config/schema';

const id = z.string().min(1);
const timestamp = z.iso.datetime({ offset: true });
export const slotSchema = z
  .object({
    id,
    doctorId: id,
    startsAt: timestamp,
    endsAt: timestamp,
    available: z.boolean(),
  })
  .refine(
    slot => Date.parse(slot.endsAt) > Date.parse(slot.startsAt),
    'A slot must end after it starts',
  );
export type Slot = z.infer<typeof slotSchema>;
export const bookingSchema = z
  .object({
    id,
    doctorId: id,
    slotId: id,
    startsAt: timestamp,
    endsAt: timestamp,
    status: z.literal('confirmed'),
  })
  .refine(
    booking => Date.parse(booking.endsAt) > Date.parse(booking.startsAt),
    'A booking must end after it starts',
  );
export type Booking = z.infer<typeof bookingSchema>;
export const bookingRequestSchema = z
  .object({ doctorId: id, slotId: id })
  .strict();
export type BookingRequest = z.infer<typeof bookingRequestSchema>;
export type BookingResponse = { status: 201; data: Booking };
export type BookingTarget = {
  doctorId: string;
  doctor: Doctor | null;
  service: ServiceItem | null;
};
export type Appointment = {
  id: string;
  status: 'pending' | 'confirmed';
  doctor: Doctor;
  service: ServiceItem | null;
  slot: Slot;
  feeInr: number;
  booking: Booking | null;
};
