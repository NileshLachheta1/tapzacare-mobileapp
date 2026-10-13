import { AppState, type AppStateStatus } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useClinicToday } from '../src/features/prescriptions/useClinicToday';

it('advances an open schedule at IST midnight and refreshes the date after resuming', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-13T18:29:59.900Z'));
  let onState!: (state: AppStateStatus) => void;
  const remove = jest.fn();
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, callback) => {
      onState = callback;
      return { remove };
    });
  try {
    const hook = renderHook(() => useClinicToday());
    expect(hook.result.current).toBe('2026-10-13');
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(hook.result.current).toBe('2026-10-14');
    jest.setSystemTime(new Date('2026-10-15T19:00:00Z'));
    act(() => onState('active'));
    expect(hook.result.current).toBe('2026-10-16');
    hook.unmount();
    expect(remove).toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
    jest.restoreAllMocks();
  }
});
