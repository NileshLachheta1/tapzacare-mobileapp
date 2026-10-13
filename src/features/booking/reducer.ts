import type { Doctor } from '../../config/schema';
import type { Appointment, Booking, BookingTarget, Slot } from './contracts';

export type BookingFlow = {
  session: number;
  target: BookingTarget | null;
  date: string;
  providerStatus: 'loading' | 'ready' | 'error';
  slotStatus: 'idle' | 'loading' | 'ready' | 'empty' | 'error';
  slots: Slot[];
  selectedSlotId: string | null;
  confirmation:
    | 'selecting'
    | 'submitting'
    | 'success'
    | 'queued'
    | 'error'
    | 'conflict';
  confirmed: Appointment | null;
};
export type BookingState = {
  flow: BookingFlow;
  appointments: Appointment[];
  availabilityRevision: number;
};
export const emptyFlow = (): BookingFlow => ({
  session: 0,
  target: null,
  date: '',
  providerStatus: 'loading',
  slotStatus: 'idle',
  slots: [],
  selectedSlotId: null,
  confirmation: 'selecting',
  confirmed: null,
});
export const initialBookingState = (): BookingState => ({
  flow: emptyFlow(),
  appointments: [],
  availabilityRevision: 0,
});
export type BookingAction =
  | { type: 'open'; session: number; target: BookingTarget; date: string }
  | { type: 'close' }
  | { type: 'providerReady'; session: number; doctor: Doctor }
  | { type: 'providerError'; session: number }
  | { type: 'providerLoading'; session: number }
  | { type: 'date'; date: string }
  | { type: 'slotsLoading'; session: number; date: string }
  | { type: 'slotsReady'; session: number; date: string; slots: Slot[] }
  | { type: 'slotsError'; session: number; date: string }
  | { type: 'select'; slotId: string }
  | { type: 'submit'; appointment: Appointment }
  | { type: 'confirmed'; session: number; clientId: string; booking: Booking }
  | {
      type: 'queued';
      session: number;
      clientId: string;
      appointment: Appointment;
    }
  | { type: 'failed'; session: number; clientId: string; conflict: boolean };

export function bookingReducer(
  state: BookingState,
  action: BookingAction,
): BookingState {
  const f = state.flow;
  switch (action.type) {
    case 'open':
      return {
        ...state,
        flow: {
          ...emptyFlow(),
          session: action.session,
          target: action.target,
          date: action.date,
          providerStatus: action.target.doctor ? 'ready' : 'loading',
          slotStatus: 'loading',
        },
      };
    case 'close':
      return f.confirmation === 'submitting'
        ? state
        : { ...state, flow: emptyFlow() };
    case 'providerLoading':
      return action.session === f.session
        ? { ...state, flow: { ...f, providerStatus: 'loading' } }
        : state;
    case 'providerReady':
      return action.session === f.session &&
        f.target?.doctorId === action.doctor.id
        ? {
            ...state,
            flow: {
              ...f,
              target: { ...f.target, doctor: action.doctor },
              providerStatus: 'ready',
            },
          }
        : state;
    case 'providerError':
      return action.session === f.session
        ? { ...state, flow: { ...f, providerStatus: 'error' } }
        : state;
    case 'date':
      return f.confirmation === 'submitting'
        ? state
        : {
            ...state,
            flow: {
              ...f,
              date: action.date,
              selectedSlotId: null,
              slots: [],
              slotStatus: 'loading',
              confirmation: 'selecting',
              confirmed: null,
            },
          };
    case 'slotsLoading':
      return action.session === f.session && action.date === f.date
        ? {
            ...state,
            flow: {
              ...f,
              slotStatus: 'loading',
              selectedSlotId: null,
              slots: [],
            },
          }
        : state;
    case 'slotsReady':
      return action.session === f.session && action.date === f.date
        ? {
            ...state,
            flow: {
              ...f,
              slots: action.slots,
              selectedSlotId: null,
              slotStatus: action.slots.some(slot => slot.available)
                ? 'ready'
                : 'empty',
            },
          }
        : state;
    case 'slotsError':
      return action.session === f.session && action.date === f.date
        ? {
            ...state,
            flow: {
              ...f,
              slots: [],
              selectedSlotId: null,
              slotStatus: 'error',
            },
          }
        : state;
    case 'select':
      return f.confirmation !== 'submitting' &&
        f.confirmation !== 'success' &&
        f.slotStatus === 'ready' &&
        f.slots.some(slot => slot.id === action.slotId && slot.available)
        ? {
            ...state,
            flow: {
              ...f,
              selectedSlotId: action.slotId,
              confirmation: 'selecting',
            },
          }
        : state;
    case 'submit':
      return f.confirmation !== 'submitting' &&
        f.confirmation !== 'success' &&
        f.target &&
        f.providerStatus === 'ready' &&
        f.slotStatus === 'ready' &&
        action.appointment.status === 'pending' &&
        action.appointment.doctor.id === f.target.doctorId &&
        action.appointment.slot.doctorId === f.target.doctorId &&
        f.slots.some(
          slot => slot.id === action.appointment.slot.id && slot.available,
        ) &&
        f.selectedSlotId === action.appointment.slot.id
        ? {
            ...state,
            flow: { ...f, confirmation: 'submitting' },
            appointments: [action.appointment, ...state.appointments],
          }
        : state;
    case 'confirmed': {
      const pending = state.appointments.find(
        item => item.id === action.clientId && item.status === 'pending',
      );
      if (!pending) {
        return state;
      }
      const confirmed: Appointment = {
        ...pending,
        id: action.booking.id,
        status: 'confirmed',
        booking: action.booking,
      };
      return {
        ...state,
        availabilityRevision: state.availabilityRevision + 1,
        appointments: state.appointments.map(item =>
          item.id === action.clientId ? confirmed : item,
        ),
        flow:
          f.session === action.session
            ? { ...f, confirmation: 'success', confirmed }
            : f,
      };
    }
    case 'queued':
      return {
        ...state,
        appointments: state.appointments.filter(
          item => item.id !== action.clientId,
        ),
        flow:
          f.session === action.session
            ? { ...f, confirmation: 'queued', confirmed: action.appointment }
            : f,
      };
    case 'failed':
      return {
        ...state,
        availabilityRevision:
          state.availabilityRevision + (action.conflict ? 1 : 0),
        appointments: state.appointments.filter(
          item => item.id !== action.clientId,
        ),
        flow:
          f.session === action.session
            ? {
                ...f,
                confirmation: action.conflict ? 'conflict' : 'error',
                selectedSlotId: action.conflict ? null : f.selectedSlotId,
              }
            : f,
      };
  }
}
