import React from 'react';
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
        <ConfigProvider>
          <BookingProvider>
            <DoseProvider>
              <AppNavigator />
            </DoseProvider>
          </BookingProvider>
        </ConfigProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 } });
