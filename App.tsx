import React from 'react';
import { RemindersProvider } from './src/features/reminders/RemindersProvider';
import { OfflineProvider } from './src/features/offline/OfflineProvider';
import { PreferencesProvider } from './src/features/settings/Preferences';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { ConfigProvider } from './src/config/ConfigProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { BookingProvider } from './src/features/booking/BookingProvider';
import { DoseProvider } from './src/features/prescriptions/DoseProvider';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <PreferencesProvider>
          <ConfigProvider>
            <OfflineProvider>
              <BookingProvider>
                <DoseProvider>
                  <RemindersProvider>
                    <AppNavigator />
                  </RemindersProvider>
                </DoseProvider>
              </BookingProvider>
            </OfflineProvider>
          </ConfigProvider>
        </PreferencesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 } });
