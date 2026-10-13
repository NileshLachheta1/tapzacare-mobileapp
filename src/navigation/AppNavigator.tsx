import { useDeepLinks } from './useDeepLinks';
import { SharedPrescriptionProvider } from './SharedPrescription';
import { useTranslate } from '../i18n';
import React, { useMemo, useState } from 'react';
import { StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConfig } from '../config/ConfigProvider';
import { useTheme } from '../theme/ThemeProvider';
import { CareIcon } from '../components/ui/CareIcon';
import { HomeScreen } from '../features/home/HomeScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { BookingsScreen } from '../features/booking/BookingsScreen';
import { BookingSheet } from '../features/booking/BookingSheet';
import { useBooking } from '../features/booking/BookingProvider';
import type { RootTabParams } from './types';
import { PrescriptionsNavigator } from './PrescriptionsNavigator';
import { AppText } from '../components/ui/AppText';
import { tabBarHeight } from './layout';

const Tabs = createBottomTabNavigator<RootTabParams>();
const screens = {
  home: HomeScreen,
  bookings: BookingsScreen,
  prescriptions: PrescriptionsNavigator,
  profile: ProfileScreen,
};
export function AppNavigator() {
  const { config } = useConfig();
  const navigation = useNavigationContainerRef<RootTabParams>();
  const t = useTheme();
  const tr = useTranslate();
  const [ready, setReady] = useState(false);
  useDeepLinks(navigation, ready);
  const { flow } = useBooking();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: t.colours.mode === 'dark',
      colors: {
        ...DefaultTheme.colors,
        primary: t.colours.primary,
        background: t.colours.background,
        card: t.colours.surface,
        text: t.colours.textPrimary,
        border: t.colours.border,
        notification: t.colours.primary,
      },
    }),
    [t],
  );
  return (
    <NavigationContainer
      ref={navigation}
      theme={navigationTheme}
      onReady={() => setReady(true)}
    >
      <SharedPrescriptionProvider>
        <StatusBar
          barStyle={
            t.colours.mode === 'dark' ? 'light-content' : 'dark-content'
          }
        />
        <View
          style={styles.tabs}
          collapsable={false}
          importantForAccessibility={
            flow.target ? 'no-hide-descendants' : 'auto'
          }
          accessibilityElementsHidden={Boolean(flow.target)}
        >
          <Tabs.Navigator
            initialRouteName="home"
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: t.colours.primary,
              tabBarInactiveTintColor: t.colours.textSecondary,
              tabBarStyle: {
                backgroundColor: t.colours.surface,
                borderTopColor: t.colours.border,
                height:
                  tabBarHeight(
                    t,
                    width,
                    fontScale,
                    config.tabs.map(tab => tab.label),
                  ) + insets.bottom,
                paddingTop: t.spacing.xs,
              },
              tabBarItemStyle: { minHeight: t.metrics.touch },
              tabBarLabelStyle: {
                fontSize: t.type.caption,
                fontWeight: t.weight.medium,
              },
              tabBarAllowFontScaling: true,
              animation: 'none',
            }}
          >
            {config.tabs.map(tab => (
              <Tabs.Screen
                key={tab.id}
                name={tab.screen}
                component={screens[tab.screen]}
                options={{
                  title: tab.label,
                  tabBarAccessibilityLabel: tr(tab.label),
                  tabBarLabel: ({ color }) => (
                    <AppText
                      variant="caption"
                      weight="medium"
                      style={[styles.tabLabel, { color }]}
                    >
                      {tab.label}
                    </AppText>
                  ),
                  tabBarIcon: ({ color }) => (
                    <CareIcon name={tab.icon} colour={color} />
                  ),
                }}
              />
            ))}
          </Tabs.Navigator>
        </View>
        <BookingSheet
          bookingsAvailable={config.tabs.some(tab => tab.screen === 'bookings')}
          onViewBookings={() => {
            if (
              config.tabs.some(tab => tab.screen === 'bookings') &&
              navigation.isReady()
            ) {
              navigation.navigate('bookings');
            }
          }}
        />
      </SharedPrescriptionProvider>
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({
  tabs: { flex: 1 },
  tabLabel: { textAlign: 'center', alignSelf: 'stretch', maxWidth: '100%' },
});
