import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { PrescriptionsProvider } from '../features/prescriptions/PrescriptionsProvider';
import { PrescriptionListScreen } from '../features/prescriptions/PrescriptionListScreen';
import { PrescriptionDetailScreen } from '../features/prescriptions/PrescriptionDetailScreen';
import type { PrescriptionStackParams } from './types';

const Stack = createNativeStackNavigator<PrescriptionStackParams>();
export function PrescriptionsNavigator() {
  const t = useTheme();
  const reduced = useReducedMotion();
  return (
    <PrescriptionsProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.colours.background },
          animation: reduced ? 'none' : 'default',
        }}
      >
        <Stack.Screen
          name="PrescriptionList"
          component={PrescriptionListScreen}
        />
        <Stack.Screen
          name="PrescriptionDetail"
          component={PrescriptionDetailScreen}
        />
      </Stack.Navigator>
    </PrescriptionsProvider>
  );
}
