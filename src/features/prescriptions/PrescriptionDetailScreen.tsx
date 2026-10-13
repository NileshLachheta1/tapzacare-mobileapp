import { SharedPrescriptionHeader } from '../../navigation/SharedPrescription';
import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PrescriptionStackParams } from '../../navigation/types';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/tokens';
import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';
import { CareIcon } from '../../components/ui/CareIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { addClinicDays, formatDate } from '../booking/dates';
import { doseTimings } from './contracts';
import {
  doseKey,
  doseProgress,
  prescriptionEnd,
  prescriptionStart,
  scheduleDate,
  scheduledDoses,
  timingIcons,
  timingLabels,
} from './schedule';
import { usePrescriptions } from './PrescriptionsProvider';
import { useDoses } from './DoseProvider';
import { useClinicToday } from './useClinicToday';
import {
  DoseStorageNotice,
  PrescriptionFetchNotice,
  PrescriptionSkeleton,
} from './PrescriptionStates';

export function PrescriptionDetailScreen({
  navigation,
  route,
}: NativeStackScreenProps<PrescriptionStackParams, 'PrescriptionDetail'>) {
  const { prescriptions, loading, failed, retry } = usePrescriptions();
  const doses = useDoses();
  const today = useClinicToday();
  const [chosenDate, setChosenDate] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const s = useStyles(makeStyles);
  const prescription = prescriptions.find(
    item => item.id === route.params.prescriptionId,
  );
  const date = prescription
    ? chosenDate ?? scheduleDate(prescription, today)
    : today;
  const progress = prescription
    ? doseProgress(prescription, date, doses.patientId, doses.records)
    : { taken: 0, total: 0 };
  const dayDoses = prescription ? scheduledDoses(prescription, date) : [];
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to prescriptions"
          onPress={() => navigation.goBack()}
          style={s.back}
        >
          <CareIcon name="arrow-left" />
        </Pressable>
        <AppText
          variant="title"
          weight="bold"
          accessibilityRole="header"
          style={s.flex}
        >
          Your medicine schedule
        </AppText>
      </View>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={loading && Boolean(prescription)}
            onRefresh={retry}
            tintColor={t.colours.primary}
            colors={[t.colours.primary]}
          />
        }
      >
        {!prescription ? (
          loading ? (
            <PrescriptionSkeleton detail />
          ) : (
            <EmptyState
              title={
                failed
                  ? 'We couldn’t load this prescription'
                  : 'Prescription unavailable'
              }
              message={
                failed
                  ? 'Try again to load your medicines.'
                  : 'Return to your list to see the clinic’s current prescriptions.'
              }
              icon="notebook-tabs"
              actionLabel={
                failed ? 'Retry prescriptions' : 'View prescription list'
              }
              onAction={failed ? retry : () => navigation.goBack()}
            />
          )
        ) : (
          <>
            <PrescriptionFetchNotice />
            <View style={s.summary}>
              <SharedPrescriptionHeader
                id={prescription.id}
                name={prescription.doctorName}
                destination
              />
              <AppText variant="small" tone="muted">
                {prescription.clinicName}
              </AppText>
              <AppText variant="caption" tone="muted">
                Issued{' '}
                {formatDate(prescriptionStart(prescription), {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </AppText>
            </View>
            <DoseStorageNotice />
            {!prescription.medicines.length ? (
              <EmptyState
                title="No medicines in this prescription"
                message="This visit has no medicine schedule to track."
                icon="pill"
              />
            ) : (
              <>
                <View style={s.dateCard}>
                  <AppText variant="small" weight="semibold">
                    {date === today
                      ? 'Today’s schedule'
                      : date > today
                      ? 'Upcoming schedule'
                      : 'Dose history'}
                  </AppText>
                  <View style={s.row}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Previous dose date"
                      accessibilityState={{
                        disabled: date <= prescriptionStart(prescription),
                      }}
                      disabled={date <= prescriptionStart(prescription)}
                      onPress={() => setChosenDate(addClinicDays(date, -1))}
                      style={[
                        s.back,
                        date <= prescriptionStart(prescription) && {
                          opacity: t.opacity.disabled,
                        },
                      ]}
                    >
                      <CareIcon name="arrow-left" />
                    </Pressable>
                    <AppText
                      weight="semibold"
                      style={s.dateText}
                      accessibilityLiveRegion="polite"
                    >
                      {formatDate(date, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </AppText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Next dose date"
                      accessibilityState={{
                        disabled: date >= prescriptionEnd(prescription),
                      }}
                      disabled={date >= prescriptionEnd(prescription)}
                      onPress={() => setChosenDate(addClinicDays(date, 1))}
                      style={[
                        s.back,
                        date >= prescriptionEnd(prescription) && {
                          opacity: t.opacity.disabled,
                        },
                      ]}
                    >
                      <CareIcon name="arrow-right" />
                    </Pressable>
                  </View>
                  {date !== today &&
                    today >= prescriptionStart(prescription) &&
                    today <= prescriptionEnd(prescription) && (
                      <Button
                        label="Back to today"
                        secondary
                        onPress={() => setChosenDate(null)}
                      />
                    )}
                  {date > today && (
                    <AppText variant="caption" tone="muted">
                      You can mark these doses when this date arrives.
                    </AppText>
                  )}
                  {today > prescriptionEnd(prescription) && (
                    <AppText variant="caption" tone="muted">
                      This course has ended. You can review your saved dose
                      history.
                    </AppText>
                  )}
                  <AppText
                    variant="small"
                    tone="primary"
                    weight="semibold"
                    accessibilityLiveRegion="polite"
                  >
                    {doses.status === 'ready'
                      ? `${progress.taken} of ${progress.total} doses taken${
                          date === today ? ' today' : ' on this date'
                        }`
                      : 'Waiting for saved dose history'}
                  </AppText>
                  {doses.status === 'ready' && progress.total > 0 && (
                    <View
                      style={s.progressTrack}
                      accessibilityRole="progressbar"
                      accessibilityLabel="Doses taken"
                      accessibilityValue={{
                        min: 0,
                        max: progress.total,
                        now: progress.taken,
                      }}
                    >
                      <View
                        style={[
                          s.progressFill,
                          {
                            width: `${
                              (progress.taken / progress.total) * 100
                            }%`,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
                {doseTimings.map(timing => {
                  const scheduled = dayDoses.filter(
                    item => item.timing === timing,
                  );
                  return (
                    <View key={timing} style={s.group}>
                      <View style={s.row}>
                        <View style={s.timingIcon}>
                          <CareIcon name={timingIcons[timing]} />
                        </View>
                        <AppText
                          variant="title"
                          weight="semibold"
                          accessibilityRole="header"
                          style={s.flex}
                        >
                          {timingLabels[timing]}
                        </AppText>
                        <AppText variant="caption" tone="muted">
                          {scheduled.length}{' '}
                          {scheduled.length === 1 ? 'dose' : 'doses'}
                        </AppText>
                      </View>
                      {!scheduled.length ? (
                        <AppText variant="small" tone="muted" style={s.noDoses}>
                          No doses scheduled for {timing}.
                        </AppText>
                      ) : (
                        scheduled.map(({ medicine }) => {
                          const key = doseKey({
                            patientId: doses.patientId,
                            prescriptionId: prescription.id,
                            medicineId: medicine.id,
                            date,
                            timing,
                          });
                          const taken = Boolean(doses.records[key]);
                          const saving = doses.saving.includes(key);
                          const saveFailed = doses.errors.includes(key);
                          const disabled =
                            saving || doses.status !== 'ready' || date > today;
                          return (
                            <View key={medicine.id} style={s.medicine}>
                              <View style={s.row}>
                                <CareIcon name="pill" />
                                <AppText weight="semibold" style={s.flex}>
                                  {medicine.name}
                                </AppText>
                              </View>
                              <AppText variant="small" tone="muted">
                                {medicine.dose} · {medicine.days}{' '}
                                {medicine.days === 1 ? 'day' : 'days'}
                              </AppText>
                              <Pressable
                                testID={`dose-${prescription.id}-${medicine.id}-${timing}`}
                                accessibilityRole="checkbox"
                                accessibilityLabel={`${medicine.name}, ${
                                  timingLabels[timing]
                                }, ${taken ? 'Taken. Undo' : 'Mark taken'}`}
                                accessibilityState={{
                                  checked: taken,
                                  disabled,
                                  busy: saving,
                                }}
                                disabled={disabled}
                                onPress={() => {
                                  void doses.tracker.toggle(
                                    prescription,
                                    medicine.id,
                                    date,
                                    timing,
                                  );
                                }}
                                style={({ pressed }) => [
                                  s.doseAction,
                                  taken && s.takenAction,
                                  {
                                    opacity: disabled
                                      ? t.opacity.disabled
                                      : pressed
                                      ? t.opacity.pressed
                                      : 1,
                                  },
                                ]}
                              >
                                <CareIcon
                                  name={
                                    saving
                                      ? 'clock-3'
                                      : taken
                                      ? 'check'
                                      : 'plus'
                                  }
                                  colour={
                                    taken
                                      ? t.colours.primary
                                      : t.colours.onPrimary
                                  }
                                />
                                <AppText
                                  variant="small"
                                  weight="semibold"
                                  style={[
                                    s.actionText,
                                    {
                                      color: taken
                                        ? t.colours.primary
                                        : t.colours.onPrimary,
                                    },
                                  ]}
                                >
                                  {saving
                                    ? 'Saving…'
                                    : taken
                                    ? 'Taken · Undo'
                                    : 'Mark taken'}
                                </AppText>
                              </Pressable>
                              {saveFailed && (
                                <AppText
                                  variant="small"
                                  style={{ color: t.colours.danger }}
                                  accessibilityLiveRegion="polite"
                                >
                                  We couldn’t save this change. Try again.
                                </AppText>
                              )}
                            </View>
                          );
                        })
                      )}
                    </View>
                  );
                })}
              </>
            )}
            <AppText variant="caption" tone="muted">
              Dose history is saved on this device. Each medicine’s course
              starts on the issue date.
            </AppText>
          </>
        )}
      </ScrollView>
    </View>
  );
}
const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colours.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.xs,
      gap: t.spacing.sm,
    },
    back: {
      width: t.metrics.touch,
      height: t.metrics.touch,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: t.radius.pill,
      backgroundColor: t.colours.surfaceAlt,
    },
    content: {
      padding: t.spacing.lg,
      paddingTop: t.spacing.xs,
      gap: t.spacing.lg,
      paddingBottom: t.spacing.xxl,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
    flex: { flex: 1 },
    summary: {
      backgroundColor: t.colours.surface,
      padding: t.spacing.lg,
      gap: t.spacing.sm,
      borderRadius: t.radius.card,
    },
    dateCard: {
      backgroundColor: t.colours.secondary,
      borderRadius: t.radius.card,
      padding: t.spacing.md,
      gap: t.spacing.sm,
    },
    dateText: { flex: 1, textAlign: 'center' },
    progressTrack: {
      height: t.spacing.xs,
      borderRadius: t.radius.pill,
      backgroundColor: t.colours.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: t.colours.primary,
      borderRadius: t.radius.pill,
    },
    group: { gap: t.spacing.sm },
    timingIcon: {
      width: t.metrics.touch,
      height: t.metrics.touch,
      backgroundColor: t.colours.secondary,
      borderRadius: t.radius.button,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noDoses: { padding: t.spacing.md },
    medicine: {
      padding: t.spacing.md,
      gap: t.spacing.sm,
      backgroundColor: t.colours.surface,
      borderRadius: t.radius.card,
      borderWidth: t.metrics.border,
      borderColor: t.colours.border,
    },
    doseAction: {
      minHeight: t.metrics.touch,
      padding: t.spacing.sm,
      borderRadius: t.radius.button,
      backgroundColor: t.colours.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing.xs,
    },
    takenAction: { backgroundColor: t.colours.secondary },
    actionText: { flexShrink: 1 },
  });
