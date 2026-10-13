import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootTabParams } from '../../navigation/types';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/tokens';
import { AppText } from '../../components/ui/AppText';
import { CareIcon } from '../../components/ui/CareIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatInr } from '../home/sections';
import { useBooking } from './BookingProvider';
import { clinicDate, formatDate, formatSlotTime } from './dates';

export function BookingsScreen() {
  const { appointments } = useBooking();
  const t = useTheme();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParams>>();
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <AppText
        variant="hero"
        weight="bold"
        accessibilityRole="header"
        style={s.title}
      >
        Your bookings
      </AppText>
      <FlatList
        data={appointments}
        keyExtractor={item => item.id}
        contentContainerStyle={s.content}
        ListEmptyComponent={
          <EmptyState
            title="Your next visit starts here"
            message="Meet the doctors at your neighbourhood clinic."
            icon="calendar-days"
            actionLabel="Explore your clinic"
            onAction={() => navigation.navigate('home')}
          />
        }
        renderItem={({ item }) => (
          <View style={s.card} testID={`appointment-${item.id}`}>
            <View style={s.row}>
              <CareIcon
                name={item.status === 'confirmed' ? 'check' : 'clock-3'}
              />
              <AppText
                variant="small"
                weight="semibold"
                tone="primary"
                accessibilityLiveRegion="polite"
              >
                {item.status === 'confirmed'
                  ? 'Confirmed'
                  : 'Pending confirmation'}
              </AppText>
            </View>
            <AppText variant="title" weight="semibold">
              {item.service?.name ?? 'Doctor consultation'}
            </AppText>
            <AppText variant="small">
              {item.doctor.name} · {item.doctor.specialty}
            </AppText>
            <AppText variant="small">
              {formatDate(clinicDate(new Date(item.slot.startsAt)))} ·{' '}
              {formatSlotTime(item.slot.startsAt)} IST
            </AppText>
            <AppText variant="small" tone="muted">
              Tapza Family Clinic · Madhapur, Hyderabad
            </AppText>
            <View style={s.row}>
              <AppText variant="small" weight="semibold" style={s.flex}>
                {formatInr(item.feeInr)}
              </AppText>
              <AppText variant="caption" tone="muted">
                {item.booking?.id ?? 'Saving…'}
              </AppText>
            </View>
          </View>
        )}
        ListFooterComponent={
          appointments.length ? (
            <AppText
              variant="caption"
              tone="muted"
              style={{ color: t.colours.textSecondary }}
            >
              Bookings shown for this demo session.
            </AppText>
          ) : undefined
        }
      />
    </View>
  );
}
const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colours.background },
    title: { padding: t.spacing.lg },
    content: {
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.xl,
      gap: t.spacing.md,
      flexGrow: 1,
    },
    card: {
      backgroundColor: t.colours.surface,
      borderRadius: t.radius.card,
      padding: t.spacing.lg,
      gap: t.spacing.sm,
      borderWidth: t.metrics.border,
      borderColor: t.colours.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
    flex: { flex: 1 },
  });
