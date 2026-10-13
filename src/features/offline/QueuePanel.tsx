import React from 'react';
import { View } from 'react-native';
import { useOffline } from './OfflineProvider';
import { useBooking } from '../booking/BookingProvider';
import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme/ThemeProvider';
import { formatDate, clinicDate, formatSlotTime } from '../booking/dates';
const labels = {
  queued: 'Queued · awaiting connection',
  syncing: 'Syncing…',
  confirmed: 'Confirmed',
  conflict: 'Needs a new time',
  error: 'Sync failed · retry',
};
export function QueuePanel() {
  const q = useOffline();
  const { controller } = useBooking();
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.md }}>
      {q.error ? (
        <>
          <AppText accessibilityRole="alert">{q.error}</AppText>
          <Button
            label="Retry"
            onPress={() => {
              void (q.ready ? q.queue.sync(true) : q.queue.hydrate());
            }}
          />
        </>
      ) : null}
      {q.items.length ? (
        <>
          <AppText variant="title">Offline booking</AppText>
          <Button
            label="Sync now"
            secondary
            disabled={
              !q.online || q.items.some(item => item.status === 'syncing')
            }
            onPress={() => {
              void q.queue.sync(true);
            }}
          />
        </>
      ) : null}
      {q.items.map(item => (
        <View
          testID={`queued-${item.slot.id}`}
          key={item.id}
          style={{
            padding: t.spacing.md,
            gap: t.spacing.sm,
            backgroundColor: t.colours.surface,
            borderRadius: t.radius.card,
          }}
        >
          <AppText weight="bold" accessibilityLiveRegion="polite">
            {labels[item.status]}
          </AppText>
          <AppText>{item.service?.name ?? item.doctor.name}</AppText>
          <AppText variant="small">
            {formatDate(clinicDate(new Date(item.slot.startsAt)))} ·{' '}
            {formatSlotTime(item.slot.startsAt)} IST
          </AppText>
          {item.status === 'confirmed' ? (
            <AppText variant="caption">{item.booking?.id}</AppText>
          ) : (
            <AppText variant="caption">
              Your request is saved on this device. It is not confirmed yet.
            </AppText>
          )}
          {item.status === 'conflict' ? (
            <Button
              label="Choose another time"
              onPress={() => {
                if (item.service)
                  controller.openService(item.service, item.doctor);
                else controller.openDoctor(item.doctor);
              }}
            />
          ) : null}
          {item.status !== 'syncing' && item.status !== 'confirmed' ? (
            <Button
              label="Remove request"
              secondary
              onPress={() => {
                void q.queue.remove(item.id).catch(() => {});
              }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}
