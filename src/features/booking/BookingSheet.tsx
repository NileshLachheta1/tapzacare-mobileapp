import { useOffline } from '../offline/OfflineProvider';
import { usePreferences } from '../settings/Preferences';
import { haptic } from '../settings/haptics';
import { useTranslate } from '../../i18n';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  View,
} from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  TouchableOpacity,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '../../components/ui/AppText';
import { CareIcon } from '../../components/ui/CareIcon';
import { ConfiguredImage } from '../../components/ui/ConfiguredImage';
import { Skeleton } from '../../components/ui/Skeleton';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/tokens';
import { formatInr } from '../home/sections';
import { useBooking } from './BookingProvider';
import { clinicDate, dateChoices, formatDate, formatSlotTime } from './dates';
import type { Appointment } from './contracts';

function SheetButton({
  label,
  onPress,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress(): void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const { haptics } = usePreferences();
  const tr = useTranslate();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      accessibilityLabel={tr(label)}
      onPress={() => {
        haptic(haptics);
        onPress();
      }}
      activeOpacity={t.opacity.pressed}
    >
      <View
        style={[
          s.button,
          secondary && s.secondaryButton,
          disabled && { opacity: t.opacity.disabled },
        ]}
      >
        <AppText
          variant="small"
          weight="semibold"
          style={[
            s.center,
            {
              color: secondary ? t.colours.primary : t.colours.onPrimary,
            },
          ]}
        >
          {label}
        </AppText>
      </View>
    </TouchableOpacity>
  );
}
function StateMessage({
  title,
  message,
  action,
  onAction,
}: {
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
}) {
  const s = useStyles(makeStyles);
  return (
    <View style={s.state} accessibilityLiveRegion="polite">
      <AppText weight="semibold">{title}</AppText>
      <AppText variant="small" tone="muted">
        {message}
      </AppText>
      {action && onAction && (
        <SheetButton secondary label={action} onPress={onAction} />
      )}
    </View>
  );
}
const AnimatedPath = Animated.createAnimatedComponent(Path);
function SuccessMark() {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    progress.value = reduced
      ? 1
      : withTiming(1, { duration: t.motion.success });
  }, [progress, reduced, t.motion.success]);
  const scale = useSharedValue(reduced ? 1 : t.motion.successStartScale);
  useEffect(() => {
    scale.value = reduced ? 1 : withSpring(1, { damping: 14, stiffness: 170 });
  }, [scale, reduced]);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const check = useAnimatedProps(() => ({
    strokeDashoffset: 36 * (1 - progress.value),
  }));
  return (
    <Animated.View style={[s.successMark, animated]} accessible={false}>
      <Svg
        width={t.metrics.largeIcon}
        height={t.metrics.largeIcon}
        viewBox="0 0 40 40"
      >
        <AnimatedPath
          animatedProps={check}
          d="M8 21 L16 29 L32 12"
          fill="none"
          stroke={t.colours.primary}
          strokeWidth={t.metrics.stroke * 2}
          strokeDasharray={36}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}
function VisitSummary({ appointment }: { appointment: Appointment }) {
  const s = useStyles(makeStyles);
  return (
    <View style={s.summary}>
      <AppText variant="title" weight="semibold">
        {appointment.service?.name ?? 'Doctor consultation'}
      </AppText>
      <AppText variant="small">
        {appointment.doctor.name} · {appointment.doctor.specialty}
      </AppText>
      <View style={s.row}>
        <CareIcon name="calendar-days" />
        <AppText variant="small" style={s.flex}>
          {formatDate(clinicDate(new Date(appointment.slot.startsAt)), {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </AppText>
      </View>
      <View style={s.row}>
        <CareIcon name="clock-3" />
        <AppText variant="small">
          {formatSlotTime(appointment.slot.startsAt)} · IST
        </AppText>
      </View>
      <AppText variant="small" tone="muted">
        Tapza Family Clinic · Madhapur, Hyderabad
      </AppText>
      <AppText weight="semibold">
        Visit fee · {formatInr(appointment.feeInr)}
      </AppText>
    </View>
  );
}

export function BookingSheet({
  onViewBookings,
  bookingsAvailable = true,
}: {
  onViewBookings(): void;
  bookingsAvailable?: boolean;
}) {
  const { flow: f, appointments, controller } = useBooking();
  const t = useTheme();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const modal = useRef<BottomSheetModal>(null);
  const presented = useRef(false);
  const closing = useRef(false);
  const open = f.target !== null;
  const { online } = useOffline();
  const { haptics } = usePreferences();
  const busy = f.confirmation === 'submitting';
  useEffect(() => {
    if (open && !closing.current) {
      presented.current = true;
      modal.current?.present();
    } else if (!open && presented.current && !closing.current) {
      closing.current = true;
      modal.current?.dismiss();
    }
  }, [open, f.session]);
  const onDismiss = useCallback(() => {
    const wasClosing = closing.current;
    closing.current = false;
    presented.current = false;
    const latest = controller.getSnapshot().flow;
    // Finish a programmatic close before presenting a newly opened booking.
    if (wasClosing) {
      if (latest.target) {
        presented.current = true;
        modal.current?.present();
      }
      return;
    }
    if (latest.target && !controller.close()) {
      presented.current = true;
      modal.current?.present();
    }
  }, [controller]);
  useEffect(() => {
    if (!open) {
      return;
    }
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      controller.close();
      return true;
    });
    return () => listener.remove();
  }, [controller, open]);
  useEffect(() => {
    if (f.confirmation === 'success') {
      haptic(haptics, 'success');
      AccessibilityInfo.announceForAccessibility('Your visit is confirmed.');
    }
    if (f.confirmation === 'error' || f.confirmation === 'conflict')
      haptic(haptics, 'error');
    if (f.confirmation === 'conflict') {
      AccessibilityInfo.announceForAccessibility(
        'That slot was just booked. Choose another available time.',
      );
    }
  }, [f.confirmation, haptics]);
  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={busy ? 'none' : 'close'}
        opacity={t.booking.backdropOpacity}
      />
    ),
    [busy, t.booking.backdropOpacity],
  );
  const selected = f.slots.find(slot => slot.id === f.selectedSlotId);
  const pending = appointments.find(item => item.status === 'pending');
  const target = f.target;
  const dates = dateChoices();
  const canConfirm = Boolean(
    selected?.available &&
      f.providerStatus === 'ready' &&
      f.slotStatus === 'ready' &&
      !busy,
  );
  return (
    <BottomSheetModal
      ref={modal}
      index={1}
      snapPoints={t.booking.snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={!busy}
      enableHandlePanningGesture={!busy}
      enableContentPanningGesture={!busy}
      enableDismissOnClose
      backdropComponent={backdrop}
      topInset={insets.top}
      backgroundStyle={s.sheet}
      handleIndicatorStyle={s.handle}
      onDismiss={onDismiss}
    >
      {target && (
        <BottomSheetScrollView
          contentContainerStyle={[
            s.content,
            { paddingBottom: insets.bottom + t.spacing.xl },
          ]}
          accessibilityViewIsModal
          showsVerticalScrollIndicator={false}
        >
          <View style={s.row}>
            <AppText
              variant="title"
              weight="bold"
              accessibilityRole="header"
              style={s.flex}
            >
              {f.confirmation === 'success'
                ? 'Visit confirmed'
                : busy
                ? 'Confirming your visit'
                : 'Book a clinic visit'}
            </AppText>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close booking"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={controller.close}
              style={s.close}
            >
              <CareIcon
                name="x"
                colour={busy ? t.colours.textSecondary : t.colours.primary}
              />
            </TouchableOpacity>
          </View>
          {f.confirmation === 'queued' ? (
            <StateMessage
              title="Saved for sync"
              message="Your request is saved on this device. It is not confirmed yet."
              action="View my booking"
              onAction={() => {
                if (controller.close()) onViewBookings();
              }}
            />
          ) : f.confirmation === 'success' && f.confirmed ? (
            <>
              <View style={s.success}>
                <SuccessMark />
                <AppText variant="hero" weight="bold" style={s.center}>
                  You’re all booked.
                </AppText>
                <AppText variant="small" tone="muted" style={s.center}>
                  We’ll be ready to welcome you.
                </AppText>
              </View>
              <VisitSummary appointment={f.confirmed} />
              <AppText variant="caption" tone="muted">
                Booking reference · {f.confirmed.booking?.id}
              </AppText>
              <SheetButton
                label={bookingsAvailable ? 'View my booking' : 'Back to care'}
                onPress={() => {
                  if (controller.close()) {
                    onViewBookings();
                  }
                }}
              />
            </>
          ) : busy && pending ? (
            <>
              <View
                style={s.state}
                accessibilityRole="progressbar"
                accessibilityLabel="Confirming your booking"
              >
                <ActivityIndicator color={t.colours.primary} />
                <AppText weight="semibold">Saving your visit…</AppText>
                <AppText tone="muted" variant="small">
                  Your appointment is pending while the clinic confirms this
                  time.
                </AppText>
              </View>
              <VisitSummary appointment={pending} />
            </>
          ) : (
            <>
              <View style={s.provider}>
                <ConfiguredImage
                  url={
                    target.service?.imageUrl ?? target.doctor?.photoUrl ?? ''
                  }
                  label={
                    target.service?.name ?? target.doctor?.name ?? 'Clinic care'
                  }
                  initials={
                    target.doctor?.name
                      .replace('Dr. ', '')
                      .split(' ')
                      .map(part => part[0])
                      .join('') ?? 'TC'
                  }
                  style={s.photo}
                />
                <View style={s.flex}>
                  <AppText weight="semibold">
                    {target.service?.name ??
                      target.doctor?.name ??
                      'Clinic visit'}
                  </AppText>
                  <AppText variant="small" tone="muted">
                    {target.service
                      ? target.service.description
                      : target.doctor?.specialty}
                  </AppText>
                  <AppText variant="small" tone="primary" weight="semibold">
                    {target.service
                      ? formatInr(target.service.priceInr)
                      : target.doctor
                      ? formatInr(target.doctor.feeInr)
                      : ''}
                  </AppText>
                </View>
              </View>
              {target.service && target.doctor && (
                <AppText variant="small" tone="muted">
                  With {target.doctor.name} · {target.doctor.specialty}
                </AppText>
              )}
              {f.providerStatus === 'loading' && (
                <View
                  accessibilityRole="progressbar"
                  accessibilityLabel="Loading your doctor"
                >
                  <Skeleton style={s.providerSkeleton} />
                </View>
              )}
              {f.providerStatus === 'error' && (
                <StateMessage
                  title="We couldn’t load your doctor"
                  message="Try again to book this service with its clinic provider."
                  action="Retry doctor"
                  onAction={() => {
                    void controller.retryProvider();
                  }}
                />
              )}
              <AppText weight="semibold" accessibilityRole="header">
                Choose a date
              </AppText>
              <GestureScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.dates}
              >
                {dates.map((date, index) => (
                  <TouchableOpacity
                    key={date}
                    testID={`booking-date-${date}`}
                    accessibilityRole="button"
                    accessibilityLabel={formatDate(date, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                    accessibilityState={{ selected: f.date === date }}
                    onPress={() => controller.selectDate(date)}
                    style={[s.date, f.date === date && s.selected]}
                  >
                    <AppText
                      variant="caption"
                      tone={f.date === date ? 'primary' : 'muted'}
                    >
                      {index === 0
                        ? 'Today'
                        : formatDate(date, { weekday: 'short' })}
                    </AppText>
                    <AppText
                      variant="title"
                      weight="semibold"
                      tone={f.date === date ? 'primary' : 'default'}
                    >
                      {formatDate(date, { day: 'numeric' })}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {formatDate(date, { month: 'short' })}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </GestureScrollView>
              <View style={s.row}>
                <AppText
                  weight="semibold"
                  accessibilityRole="header"
                  style={s.flex}
                >
                  Choose a time
                </AppText>
                <AppText variant="caption" tone="muted">
                  Clinic time · IST
                </AppText>
              </View>
              {f.confirmation === 'conflict' && (
                <View style={s.warning} accessibilityRole="alert">
                  <AppText weight="semibold">
                    That slot was just booked.
                  </AppText>
                  <AppText variant="small">
                    Choose another available time. Your doctor and date are
                    saved.
                  </AppText>
                </View>
              )}
              {f.confirmation === 'error' && (
                <View style={s.warning} accessibilityRole="alert">
                  <AppText weight="semibold">
                    We couldn’t confirm your visit
                  </AppText>
                  <AppText variant="small">
                    No appointment was saved. Try confirming again.
                  </AppText>
                </View>
              )}
              {f.slotStatus === 'loading' && (
                <View
                  accessibilityRole="progressbar"
                  accessibilityLabel="Loading available times"
                  style={s.slots}
                >
                  {[0, 1, 2, 3, 4, 5].map(key => (
                    <Skeleton key={key} style={s.slotSkeleton} />
                  ))}
                </View>
              )}
              {f.slotStatus === 'error' && (
                <StateMessage
                  title="Times couldn’t be loaded"
                  message="Check again for available appointments on this date."
                  action="Retry times"
                  onAction={() => {
                    void controller.refreshSlots();
                  }}
                />
              )}
              {f.slotStatus === 'empty' && (
                <StateMessage
                  title="No available times on this date"
                  message="Choose another date to find your next visit."
                  action={
                    f.date !== dates[dates.length - 1]
                      ? 'Check next date'
                      : undefined
                  }
                  onAction={controller.nextDate}
                />
              )}
              {(f.slotStatus === 'ready' ||
                (f.slotStatus === 'empty' && f.slots.length > 0)) && (
                <View style={s.slots}>
                  {f.slots.map(slot => (
                    <TouchableOpacity
                      key={slot.id}
                      testID={`booking-slot-${slot.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${formatSlotTime(slot.startsAt)}${
                        slot.available ? '' : ', unavailable'
                      }`}
                      accessibilityState={{
                        disabled: !slot.available,
                        selected: slot.id === f.selectedSlotId,
                      }}
                      disabled={!slot.available}
                      onPress={() => controller.selectSlot(slot.id)}
                      style={[
                        s.slot,
                        slot.id === f.selectedSlotId && s.selected,
                        !slot.available && {
                          backgroundColor: t.colours.surfaceAlt,
                        },
                      ]}
                    >
                      <View
                        style={[
                          s.slotLabel,
                          !slot.available && { opacity: t.opacity.disabled },
                        ]}
                      >
                        <AppText
                          variant="small"
                          tone={
                            slot.id === f.selectedSlotId ? 'primary' : 'default'
                          }
                          weight="medium"
                        >
                          {formatSlotTime(slot.startsAt)}
                        </AppText>
                        {!slot.available && (
                          <AppText variant="caption" tone="muted">
                            Unavailable
                          </AppText>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={s.summary}>
                <AppText variant="small" tone="muted">
                  {selected
                    ? `${formatDate(f.date)} · ${formatSlotTime(
                        selected.startsAt,
                      )} IST`
                    : 'Select a date and available time to continue.'}
                </AppText>
                <AppText variant="small">
                  Tapza Family Clinic · Madhapur, Hyderabad
                </AppText>
                <AppText weight="semibold">
                  Visit fee ·{' '}
                  {formatInr(
                    target.service?.priceInr ?? target.doctor?.feeInr ?? 0,
                  )}
                </AppText>
              </View>
              <SheetButton
                label={
                  !online
                    ? 'Queue booking'
                    : f.confirmation === 'error'
                    ? 'Try confirmation again'
                    : 'Confirm booking'
                }
                disabled={!canConfirm}
                onPress={() => {
                  void controller.confirm();
                }}
              />
              <AppText variant="caption" tone="muted" style={s.center}>
                You’ll see confirmation once the clinic accepts your time.
              </AppText>
            </>
          )}
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
}
const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    sheet: { backgroundColor: t.colours.surface, borderRadius: t.radius.sheet },
    handle: {
      backgroundColor: t.colours.border,
      width: t.metrics.sheetHandleWidth,
      height: t.metrics.sheetHandleHeight,
    },
    content: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.xs,
      gap: t.spacing.md,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
    flex: { flex: 1 },
    center: { textAlign: 'center' },
    close: {
      width: t.metrics.touch,
      height: t.metrics.touch,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colours.surfaceAlt,
      borderRadius: t.radius.pill,
    },
    provider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      padding: t.spacing.sm,
      backgroundColor: t.colours.surfaceAlt,
      borderRadius: t.radius.card,
    },
    photo: {
      width: t.metrics.avatar,
      height: t.metrics.avatar,
      borderRadius: t.radius.media,
    },
    providerSkeleton: { height: t.type.title, width: '80%' },
    dates: { gap: t.spacing.xs },
    date: {
      minWidth: t.metrics.dateWidth,
      minHeight: t.metrics.touch,
      alignItems: 'center',
      padding: t.spacing.sm,
      gap: t.spacing.xxs,
      borderWidth: t.metrics.border,
      borderColor: t.colours.border,
      borderRadius: t.radius.button,
    },
    selected: {
      borderColor: t.colours.primary,
      backgroundColor: t.colours.secondary,
    },
    slots: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs },
    slot: {
      minWidth: t.metrics.slotWidth,
      minHeight: t.metrics.touch,
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: t.spacing.sm,
      gap: t.spacing.xxs,
      borderWidth: t.metrics.border,
      borderColor: t.colours.border,
      borderRadius: t.radius.button,
    },
    slotLabel: { alignItems: 'center', gap: t.spacing.xxs },
    slotSkeleton: {
      width: t.metrics.slotWidth,
      height: t.metrics.touch,
      flexGrow: 1,
    },
    button: {
      minHeight: t.metrics.touch,
      backgroundColor: t.colours.primary,
      padding: t.spacing.md,
      borderRadius: t.radius.button,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryButton: { backgroundColor: t.colours.secondary },
    state: {
      padding: t.spacing.lg,
      gap: t.spacing.sm,
      backgroundColor: t.colours.surfaceAlt,
      borderRadius: t.radius.card,
    },
    summary: {
      padding: t.spacing.md,
      gap: t.spacing.sm,
      backgroundColor: t.colours.surfaceAlt,
      borderRadius: t.radius.card,
    },
    warning: {
      padding: t.spacing.md,
      gap: t.spacing.xs,
      backgroundColor: t.colours.warmSurface,
      borderRadius: t.radius.button,
    },
    success: {
      alignItems: 'center',
      gap: t.spacing.sm,
      paddingVertical: t.spacing.lg,
    },
    successMark: {
      width: t.metrics.successMark,
      height: t.metrics.successMark,
      borderRadius: t.radius.pill,
      backgroundColor: t.colours.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
