import React, { useRef } from 'react';
import {
  SharedPrescriptionHeader,
  useSharedPrescription,
} from '../../navigation/SharedPrescription';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  PrescriptionStackParams,
  RootTabParams,
} from '../../navigation/types';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/tokens';
import { AppText } from '../../components/ui/AppText';
import { CareIcon } from '../../components/ui/CareIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../booking/dates';
import { usePrescriptions } from './PrescriptionsProvider';
import { demoPatient, useDoses } from './DoseProvider';
import { useClinicToday } from './useClinicToday';
import { doseProgress, prescriptionEnd, prescriptionStart } from './schedule';
import {
  DoseStorageNotice,
  PrescriptionFetchNotice,
  PrescriptionSkeleton,
} from './PrescriptionStates';

export function PrescriptionListScreen({
  navigation,
}: NativeStackScreenProps<PrescriptionStackParams, 'PrescriptionList'>) {
  const shared = useSharedPrescription();
  const sources = useRef<Record<string, React.ElementRef<typeof View> | null>>(
    {},
  );
  const { prescriptions, loading, failed, retry } = usePrescriptions();
  const doses = useDoses();
  const today = useClinicToday();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const s = useStyles(makeStyles);
  const initialLoading = loading && !prescriptions.length;
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.heading}>
        <AppText variant="hero" weight="bold" accessibilityRole="header">
          Your prescriptions
        </AppText>
        <AppText variant="small" tone="muted">
          {demoPatient.name} · A little care, every day.
        </AppText>
      </View>
      {initialLoading ? (
        <ScrollView contentContainerStyle={s.content}>
          <PrescriptionSkeleton />
        </ScrollView>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={item => item.id}
          contentContainerStyle={s.content}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={retry}
              tintColor={t.colours.primary}
              colors={[t.colours.primary]}
            />
          }
          ListHeaderComponent={
            prescriptions.length ? (
              <View style={s.notices}>
                <PrescriptionFetchNotice />
                <DoseStorageNotice />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            failed ? (
              <EmptyState
                title="We couldn’t load your prescriptions"
                message="Try again to see your clinic’s prescriptions and medicine schedule."
                icon="wifi-off"
                actionLabel="Retry prescriptions"
                onAction={retry}
              />
            ) : (
              <EmptyState
                title="Your prescriptions will appear here"
                message="After a clinic visit, your medicines and daily schedule will be together here."
                icon="notebook-tabs"
                actionLabel="Back to home"
                onAction={() =>
                  navigation
                    .getParent<BottomTabNavigationProp<RootTabParams>>()
                    ?.navigate('home')
                }
              />
            )
          }
          renderItem={({ item }) => {
            const progress = doseProgress(
              item,
              today,
              doses.patientId,
              doses.records,
            );
            const status = !item.medicines.length
              ? 'No medicines'
              : today < prescriptionStart(item)
              ? `Starts ${formatDate(prescriptionStart(item))}`
              : today > prescriptionEnd(item)
              ? 'Course complete'
              : doses.status === 'ready'
              ? `${progress.taken} of ${progress.total} doses taken today`
              : 'Dose history unavailable';
            return (
              <Pressable
                testID={`prescription-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${formatDate(prescriptionStart(item))}, ${
                  item.doctorName
                }, ${item.medicines.length} medicines. View medicines.`}
                onPress={() =>
                  shared.begin(
                    item.id,
                    item.doctorName,
                    sources.current[item.id] ?? null,
                    () =>
                      navigation.navigate('PrescriptionDetail', {
                        prescriptionId: item.id,
                      }),
                  )
                }
                style={({ pressed }) => [
                  s.card,
                  { opacity: pressed ? t.opacity.pressed : 1 },
                ]}
              >
                <View style={s.row}>
                  <View style={s.icon}>
                    <CareIcon name="notebook-tabs" />
                  </View>
                  <View style={s.flex}>
                    <AppText variant="caption" tone="muted">
                      Issued{' '}
                      {formatDate(prescriptionStart(item), {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </AppText>
                    <View
                      ref={node => {
                        sources.current[item.id] = node;
                      }}
                      collapsable={false}
                    >
                      <SharedPrescriptionHeader
                        id={item.id}
                        name={item.doctorName}
                      />
                    </View>
                  </View>
                  <CareIcon name="chevron-right" />
                </View>
                <AppText variant="small" tone="muted">
                  {item.clinicName}
                </AppText>
                <View style={s.row}>
                  <CareIcon name="pill" />
                  <AppText variant="small" style={s.flex}>
                    {item.medicines.length}{' '}
                    {item.medicines.length === 1 ? 'medicine' : 'medicines'}
                  </AppText>
                  <AppText
                    variant="small"
                    tone="primary"
                    weight="semibold"
                    style={s.actionLabel}
                  >
                    View medicines
                  </AppText>
                </View>
                <View style={s.progress}>
                  <AppText variant="caption" tone="primary" weight="medium">
                    {status}
                  </AppText>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colours.background },
    heading: { padding: t.spacing.lg, gap: t.spacing.xs },
    content: {
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.xl,
      gap: t.spacing.md,
      flexGrow: 1,
    },
    notices: { gap: t.spacing.sm },
    card: {
      minHeight: t.metrics.touch,
      padding: t.spacing.lg,
      gap: t.spacing.md,
      backgroundColor: t.colours.surface,
      borderRadius: t.radius.card,
      borderWidth: t.metrics.border,
      borderColor: t.colours.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    flex: { flex: 1 },
    actionLabel: { flexShrink: 1 },
    icon: {
      width: t.metrics.touch,
      height: t.metrics.touch,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: t.radius.button,
      backgroundColor: t.colours.secondary,
    },
    progress: {
      padding: t.spacing.sm,
      borderRadius: t.radius.small,
      backgroundColor: t.colours.secondary,
    },
  });
