import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import App from '../App';
import { doseStorageKey } from '../src/storage/doseRepository';

const morning = 'dose-rx-family-care-daily-supplement-morning';
const afternoon = 'dose-rx-family-care-daily-supplement-afternoon';
const night = 'dose-rx-family-care-daily-supplement-night';
describe('prescription screens and saved doses', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-13T04:30:00Z'));
  });
  afterEach(() => jest.restoreAllMocks());
  async function launch() {
    const result = render(<App />);
    await screen.findByText(/A little care/, {}, { timeout: 3000 });
    return result;
  }
  async function openPrescription() {
    fireEvent.press(screen.getByRole('button', { name: 'Medicines' }));
    fireEvent.press(await screen.findByTestId('prescription-rx-family-care'));
    await screen.findByTestId(morning);
  }
  it('opens a dated list and schedule, tracks separate times/dates, and restores history after restart', async () => {
    const app = await launch();
    fireEvent.press(screen.getByRole('button', { name: 'Medicines' }));
    expect(screen.getByLabelText('Loading prescriptions')).toBeTruthy();
    fireEvent.press(await screen.findByTestId('prescription-rx-family-care'));
    expect(await screen.findByTestId(morning)).not.toBeChecked();
    fireEvent.press(screen.getByTestId(morning));
    await waitFor(() => expect(screen.getByTestId(morning)).toBeChecked());
    expect(screen.getByTestId(afternoon)).not.toBeChecked();
    expect(screen.getByTestId(night)).not.toBeChecked();
    expect(screen.getByText('1 of 5 doses taken today')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Previous dose date' }));
    expect(screen.getByTestId(morning)).not.toBeChecked();
    fireEvent.press(screen.getByTestId(night));
    await waitFor(() => expect(screen.getByTestId(night)).toBeChecked());
    fireEvent.press(screen.getByRole('button', { name: 'Back to today' }));
    expect(screen.getByTestId(morning)).toBeChecked();
    expect(screen.getByTestId(night)).not.toBeChecked();
    fireEvent.press(
      screen.getByRole('button', { name: 'Back to prescriptions' }),
    );
    expect(screen.getByTestId('prescription-rx-family-care')).toHaveTextContent(
      /1 of 5 doses taken today/,
    );
    app.unmount();
    await launch();
    await openPrescription();
    expect(screen.getByTestId(morning)).toBeChecked();
    expect(screen.getByTestId(night)).not.toBeChecked();
    fireEvent.press(screen.getByRole('button', { name: 'Previous dose date' }));
    expect(screen.getByTestId(night)).toBeChecked();
    expect(screen.getByTestId(morning)).not.toBeChecked();
  });
  it('keeps future dates read-only and supports a persisted undo on today’s schedule', async () => {
    await launch();
    await openPrescription();
    fireEvent.press(screen.getByRole('button', { name: 'Next dose date' }));
    expect(screen.getByTestId(morning)).toBeDisabled();
    expect(
      screen.getByText('You can mark these doses when this date arrives.'),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Back to today' }));
    fireEvent.press(screen.getByTestId(morning));
    await waitFor(() => expect(screen.getByTestId(morning)).toBeChecked());
    fireEvent.press(screen.getByTestId(morning));
    await waitFor(() => expect(screen.getByTestId(morning)).not.toBeChecked());
    const saved = JSON.parse(
      (await AsyncStorage.getItem(doseStorageKey('lakshmi-rao'))) ?? '{}',
    );
    expect(saved.entries).toEqual([]);
  });
  it('renders retryable API failure and empty prescriptions with usable navigation', async () => {
    await launch();
    fireEvent.press(screen.getByRole('button', { name: 'Profile' }));
    fireEvent(
      screen.getByLabelText('Fail prescriptions fetch'),
      'valueChange',
      true,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Medicines' }));
    expect(
      await screen.findByText('We couldn’t load your prescriptions'),
    ).toBeTruthy();
    fireEvent.press(
      screen.getByRole('button', { name: 'Retry prescriptions' }),
    );
    expect(screen.getByLabelText('Loading prescriptions')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Profile' }));
    fireEvent(
      screen.getByLabelText('Fail prescriptions fetch'),
      'valueChange',
      false,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Medicines' }));
    expect(
      await screen.findByTestId('prescription-rx-family-care'),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Profile' }));
    fireEvent(
      screen.getByLabelText('Return no prescriptions'),
      'valueChange',
      true,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Medicines' }));
    expect(
      await screen.findByText('Your prescriptions will appear here'),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Back to home' }));
    expect(screen.getByText(/A little care/)).toBeTruthy();
  });
  it('keeps a failed storage change untaken and lets the same dose retry successfully', async () => {
    await launch();
    fireEvent.press(screen.getByRole('button', { name: 'Profile' }));
    fireEvent(
      screen.getByLabelText('Fail dose history saves'),
      'valueChange',
      true,
    );
    await openPrescription();
    fireEvent.press(screen.getByTestId(morning));
    expect(
      await screen.findByText('We couldn’t save this change. Try again.'),
    ).toBeTruthy();
    expect(screen.getByTestId(morning)).not.toBeChecked();
    fireEvent.press(screen.getByRole('button', { name: 'Profile' }));
    fireEvent(
      screen.getByLabelText('Fail dose history saves'),
      'valueChange',
      false,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Medicines' }));
    fireEvent.press(screen.getByTestId(morning));
    await waitFor(() => expect(screen.getByTestId(morning)).toBeChecked());
    expect(
      screen.queryByText('We couldn’t save this change. Try again.'),
    ).toBeNull();
  });
  it('keeps a previous prescription usable after refresh failure and handles a removed prescription', async () => {
    await launch();
    await openPrescription();
    fireEvent.press(screen.getByRole('button', { name: 'Profile' }));
    fireEvent(
      screen.getByLabelText('Fail prescriptions fetch'),
      'valueChange',
      true,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Medicines' }));
    expect(
      await screen.findByText(
        'We couldn’t refresh your prescriptions. Your previous list is still here.',
      ),
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId(morning));
    await waitFor(() => expect(screen.getByTestId(morning)).toBeChecked());
    fireEvent.press(screen.getByRole('button', { name: 'Profile' }));
    fireEvent(
      screen.getByLabelText('Fail prescriptions fetch'),
      'valueChange',
      false,
    );
    fireEvent(
      screen.getByLabelText('Return no prescriptions'),
      'valueChange',
      true,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Medicines' }));
    expect(await screen.findByText('Prescription unavailable')).toBeTruthy();
    fireEvent.press(
      screen.getByRole('button', { name: 'Back to prescriptions' }),
    );
    expect(
      screen.getByText('Your prescriptions will appear here'),
    ).toBeTruthy();
    expect(
      JSON.parse(
        (await AsyncStorage.getItem(doseStorageKey('lakshmi-rao'))) ?? '{}',
      ).entries,
    ).toHaveLength(1);
  });
});
