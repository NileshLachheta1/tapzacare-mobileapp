import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
export function haptic(
  enabled: boolean,
  kind: 'selection' | 'success' | 'error' = 'selection',
) {
  if (enabled)
    ReactNativeHapticFeedback.trigger(
      kind === 'selection'
        ? 'selection'
        : kind === 'success'
        ? 'notificationSuccess'
        : 'notificationError',
      { enableVibrateFallback: false, ignoreAndroidSystemSettings: false },
    );
}
