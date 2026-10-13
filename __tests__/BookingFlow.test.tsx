import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import App from '../App';
import { mockApi, resetMockBookings } from '../src/api/mockApi';

describe('booking screen integration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetMockBookings();
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-13T02:00:00Z'));
  });
  afterEach(() => jest.restoreAllMocks());
  async function launch() {
    render(<App />);
    await screen.findByText(/A little care/, {}, { timeout: 3000 });
  }
  async function openService() {
    revealCards();
    fireEvent.press(await screen.findByTestId('service-checkup'));
    return screen.findByTestId('native-booking-sheet');
  }
  function revealCards() {
    const list = screen.getByTestId('home-section-list');
    fireEvent(list, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 800 } },
    });
    fireEvent(list, 'contentSizeChange', 390, 3000);
    fireEvent.scroll(list, {
      nativeEvent: {
        contentOffset: { x: 0, y: 900 },
        contentSize: { width: 390, height: 3000 },
        layoutMeasurement: { width: 390, height: 800 },
      },
    });
  }
  async function selectFirst() {
    const slot = await screen.findByTestId(
      'booking-slot-ananya_2026-10-13_09:00',
    );
    fireEvent.press(slot);
  }
  it('books from a doctor card, changes date, shows pending then success, and opens the confirmed visit', async () => {
    await launch();
    revealCards();
    fireEvent.press(
      await screen.findByTestId('doctor-ananya', {}, { timeout: 3000 }),
    );
    expect(screen.getByLabelText('Loading available times')).toBeTruthy();
    fireEvent.press(screen.getByTestId('booking-date-2026-10-14'));
    fireEvent.press(
      await screen.findByTestId('booking-slot-ananya_2026-10-14_09:00'),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Confirm booking' }));
    expect(screen.getByText('Saving your visit…')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Close booking' }),
    ).toBeDisabled();
    expect(await screen.findByText('You’re all booked.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'View my booking' }));
    expect(await screen.findByText('Your bookings')).toBeTruthy();
    expect(screen.getByText('Confirmed')).toBeTruthy();
    expect(screen.queryByTestId('appointment-pending-1')).toBeNull();
    expect(
      within(screen.getByTestId('appointment-tapza-1')).getByText('₹500'),
    ).toBeTruthy();
  });
  it('books a service, rolls back a forced 409, then confirms a different slot with the service fee', async () => {
    await launch();
    fireEvent.press(screen.getByRole('button', { name: 'Profile' }));
    fireEvent.press(
      screen.getByRole('button', { name: 'Conflict next slot (409)' }),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Home' }));
    await openService();
    await selectFirst();
    fireEvent.press(screen.getByRole('button', { name: 'Confirm booking' }));
    expect(await screen.findByText('That slot was just booked.')).toBeTruthy();
    await waitFor(() =>
      expect(
        screen.getByTestId('booking-slot-ananya_2026-10-13_09:00'),
      ).toBeDisabled(),
    );
    expect(
      screen.getByRole('button', { name: 'Confirm booking' }),
    ).toBeDisabled();
    fireEvent.press(screen.getByTestId('booking-slot-ananya_2026-10-13_09:30'));
    fireEvent.press(screen.getByRole('button', { name: 'Confirm booking' }));
    expect(await screen.findByText('You’re all booked.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'View my booking' }));
    const visit = within(await screen.findByTestId('appointment-tapza-1'));
    expect(visit.getByText('Health check')).toBeTruthy();
    expect(visit.getByText('₹999')).toBeTruthy();
  });
  it('shows a generic confirmation error and retries without duplicate appointments', async () => {
    await launch();
    fireEvent.press(screen.getByRole('button', { name: 'Profile' }));
    fireEvent.press(
      screen.getByRole('button', { name: 'Fail next confirmation (503)' }),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Home' }));
    await openService();
    await selectFirst();
    fireEvent.press(screen.getByRole('button', { name: 'Confirm booking' }));
    expect(
      await screen.findByText('We couldn’t confirm your visit'),
    ).toBeTruthy();
    fireEvent.press(
      screen.getByRole('button', { name: 'Try confirmation again' }),
    );
    expect(await screen.findByText('You’re all booked.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'View my booking' }));
    expect(screen.getAllByText('Confirmed')).toHaveLength(1);
  });
  it('renders empty availability and a retryable slot error from scoped demo controls', async () => {
    await launch();
    fireEvent.press(screen.getByRole('button', { name: 'Profile' }));
    fireEvent(
      screen.getByLabelText('Return no available times'),
      'valueChange',
      true,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Home' }));
    await openService();
    expect(
      await screen.findByText('No available times on this date'),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Check next date' }));
    expect(screen.getByLabelText('Loading available times')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Close booking' }));
    fireEvent.press(screen.getByRole('button', { name: 'Profile' }));
    fireEvent(
      screen.getByLabelText('Return no available times'),
      'valueChange',
      false,
    );
    fireEvent(
      screen.getByLabelText('Fail available times fetch'),
      'valueChange',
      true,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Home' }));
    const getSlots = jest.spyOn(mockApi, 'getSlots');
    await openService();
    expect(await screen.findByText('Times couldn’t be loaded')).toBeTruthy();
    const calls = getSlots.mock.calls.length;
    fireEvent.press(screen.getByRole('button', { name: 'Retry times' }));
    await waitFor(() => expect(getSlots).toHaveBeenCalledTimes(calls + 1));
    expect(
      screen.getByRole('button', { name: 'Confirm booking' }),
    ).toBeDisabled();
  });
});
