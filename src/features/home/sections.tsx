import React, { memo, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  type SharedValue,
} from 'react-native-reanimated';
import type { HomeSection, SectionOf } from '../../config/schema';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/tokens';
import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';
import { CareIcon } from '../../components/ui/CareIcon';
import {
  ConfiguredImage,
  HeroArtwork,
} from '../../components/ui/ConfiguredImage';
import { SectionSurface } from '../../components/ui/SectionSurface';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import type { DoctorDirectory, HomeIntent } from './types';
import { availabilityLabel } from './availability';

export const formatInr = (amount: number) =>
  `₹${amount.toLocaleString('en-IN')}`;
type ActionProps = { onAction(intent: HomeIntent): void };
function SectionTitle({ title }: { title?: string }) {
  const s = useStyles(makeStyles);
  return title ? (
    <AppText
      variant="title"
      weight="semibold"
      accessibilityRole="header"
      style={s.sectionTitle}
    >
      {title}
    </AppText>
  ) : null;
}

function HeroBanner({
  section,
  onAction,
  scrollY,
}: {
  section: SectionOf<'hero_banner'>;
  scrollY: SharedValue<number>;
} & ActionProps) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const { fontScale } = useWindowDimensions();
  const reduced = useReducedMotion();
  const parallax = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: reduced
          ? 0
          : Math.min(scrollY.value * t.motion.parallax, t.spacing.xxxl),
      },
    ],
  }));
  const hero = section.items[0];
  if (!hero) {
    return null;
  }
  return (
    <SectionSurface background={section.background} style={s.section}>
      <View style={s.location}>
        <CareIcon
          name="map-pin"
          size={t.metrics.smallIcon}
          colour={t.colours.textSecondary}
        />
        <AppText variant="caption" tone="muted" style={s.flex}>
          {hero.location}
        </AppText>
      </View>
      <View style={s.greeting}>
        <CareIcon
          name={t.colours.festival ? 'sparkles' : 'sun'}
          size={t.metrics.smallIcon}
        />
        <AppText variant="small" tone="primary" style={s.flex}>
          {hero.greeting}
        </AppText>
      </View>
      <View style={s.heroRow}>
        <View style={s.flex}>
          <AppText
            variant="hero"
            weight="bold"
            accessibilityRole="header"
            style={s.headline}
          >
            {hero.headline}
          </AppText>
          <AppText variant="small" tone="muted" style={s.description}>
            {hero.description}
          </AppText>
          <Button
            label={hero.buttonLabel}
            icon="arrow-up-right"
            onPress={() => onAction(hero.action)}
            style={s.heroButton}
          />
        </View>
        {fontScale <= 1.2 && (
          <Animated.View style={[s.heroArt, parallax]}>
            {hero.imageUrl.startsWith('asset://') ? (
              <HeroArtwork festival={hero.imageUrl === 'asset://hero-diwali'} />
            ) : (
              <ConfiguredImage url={hero.imageUrl} label="" style={s.fill} />
            )}
          </Animated.View>
        )}
      </View>
    </SectionSurface>
  );
}

function CategoryChips({
  section,
  onAction,
}: { section: SectionOf<'category_chips'> } & ActionProps) {
  const s = useStyles(makeStyles);
  const t = useTheme();
  if (!section.items.length) {
    return null;
  }
  return (
    <SectionSurface background={section.background} style={s.chipSection}>
      <FlatList
        horizontal
        data={section.items}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.horizontalInset}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onAction(item.action)}
            accessibilityRole="button"
            style={({ pressed }) => [
              s.chip,
              pressed && { opacity: t.opacity.pressed },
            ]}
          >
            <CareIcon name={item.icon} size={t.metrics.smallIcon} />
            <AppText variant="small" weight="medium">
              {item.label}
            </AppText>
          </Pressable>
        )}
      />
    </SectionSurface>
  );
}

function QuickActions({
  section,
  onAction,
}: { section: SectionOf<'quick_actions'> } & ActionProps) {
  const s = useStyles(makeStyles);
  const t = useTheme();
  const { fontScale, width } = useWindowDimensions();
  const columns = fontScale > 1.3 ? 2 : 4;
  const actionWidth =
    (width - t.spacing.lg * 2 - t.spacing.xs * (columns - 1)) / columns;
  return (
    <SectionSurface background={section.background} style={s.section}>
      <SectionTitle title={section.title} />
      <View style={s.quickRow}>
        {section.items.map(item => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => onAction(item.action)}
            style={({ pressed }) => [
              s.quickAction,
              { width: actionWidth },
              pressed && { opacity: t.opacity.pressed },
            ]}
          >
            <View style={s.actionIcon}>
              <CareIcon name={item.icon} />
            </View>
            <AppText variant="caption" weight="medium" style={s.center}>
              {item.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </SectionSurface>
  );
}

export function ServiceGrid({
  section,
  onAction,
}: { section: SectionOf<'service_grid'> } & ActionProps) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const window = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const columns = window.fontScale > 1.3 ? 1 : section.columns;
  const available = measuredWidth ?? window.width - t.spacing.lg * 2;
  const width = Math.floor(
    (available - t.spacing.sm * (columns - 1)) / columns,
  );
  return (
    <SectionSurface background={section.background} style={s.section}>
      <SectionTitle title={section.title} />
      {!section.items.length ? (
        <EmptyState
          title="More care is on its way"
          message="New clinic services will appear here soon."
          icon="heart-pulse"
        />
      ) : (
        <View
          style={s.serviceGrid}
          onLayout={event => setMeasuredWidth(event.nativeEvent.layout.width)}
        >
          {section.items.map((item, index) => (
            <Pressable
              key={item.id}
              testID={`service-${item.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${formatInr(item.priceInr)}${
                item.badge ? `, ${item.badge}` : ''
              }`}
              onPress={() => onAction({ kind: 'service', service: item })}
              style={({ pressed }) => [
                s.serviceCard,
                { width, opacity: pressed ? t.opacity.pressed : 1 },
              ]}
            >
              <ConfiguredImage
                url={item.imageUrl}
                label={item.name}
                style={[
                  s.serviceMedia,
                  index % 2 === 1 && { backgroundColor: t.colours.warmSurface },
                ]}
              />
              {item.badge && (
                <View style={s.badge}>
                  <AppText variant="caption" weight="semibold" tone="primary">
                    {item.badge}
                  </AppText>
                </View>
              )}
              <View style={s.serviceInfo}>
                <AppText variant="small" weight="semibold">
                  {item.name}
                </AppText>
                <AppText
                  variant="caption"
                  tone="muted"
                  style={s.serviceDescription}
                >
                  {item.description}
                </AppText>
                <View style={s.priceRow}>
                  <AppText weight="semibold" tone="primary">
                    {formatInr(item.priceInr)}
                  </AppText>
                  <CareIcon name="arrow-up-right" size={t.metrics.smallIcon} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </SectionSurface>
  );
}

function DoctorCarousel({
  section,
  directory,
  onAction,
}: {
  section: SectionOf<'doctor_carousel'>;
  directory: DoctorDirectory;
} & ActionProps) {
  const s = useStyles(makeStyles);
  const t = useTheme();
  const entries = useMemo(
    () =>
      section.items.flatMap(item => {
        const doctor = directory.doctors.find(
          value => value.id === item.doctorId,
        );
        return doctor
          ? [
              {
                ...item,
                doctor,
                nextAvailableLabel: availabilityLabel(
                  directory.availability?.[doctor.id],
                ),
              },
            ]
          : [];
      }),
    [directory.doctors, directory.availability, section.items],
  );
  return (
    <SectionSurface background={section.background} style={s.doctorSection}>
      <View style={s.horizontalInset}>
        <SectionTitle title={section.title} />
      </View>
      {directory.loading && !entries.length ? (
        <View style={[s.horizontalInset, s.loadingDoctors]}>
          {[0, 1].map(id => (
            <View key={id} style={s.doctorCard}>
              <View style={s.doctorHead}>
                <Skeleton style={s.avatar} />
                <View style={s.flex}>
                  <Skeleton style={s.loadingLine} />
                  <Skeleton style={[s.loadingLine, s.loadingShortLine]} />
                </View>
              </View>
              <Skeleton style={s.loadingSlot} />
              <Skeleton style={s.loadingLine} />
            </View>
          ))}
        </View>
      ) : directory.failed && !entries.length ? (
        <EmptyState
          title="Your doctors are a tap away"
          message="We couldn’t refresh the doctor list. Please try again."
          icon="stethoscope"
          actionLabel="Try again"
          onAction={directory.retry}
        />
      ) : !entries.length ? (
        <EmptyState
          title="No visits available right now"
          message="Please check back for your clinic’s next appointments."
          icon="calendar-days"
          actionLabel="Refresh doctors"
          onAction={directory.retry}
        />
      ) : (
        <>
          {directory.failed && (
            <View style={s.horizontalInset}>
              <AppText variant="caption" tone="muted">
                Showing the last doctor list.
              </AppText>
              <Button
                label="Refresh doctors"
                onPress={directory.retry}
                secondary
              />
            </View>
          )}
          <FlatList
            horizontal
            data={entries}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.horizontalInset}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  onAction({
                    kind: 'doctor',
                    doctor: item.doctor,
                    nextAvailableLabel: item.nextAvailableLabel,
                  })
                }
                accessibilityRole="button"
                testID={`doctor-${item.doctor.id}`}
                accessibilityLabel={`Book ${item.doctor.name}, ${
                  item.doctor.specialty
                }, ${formatInr(item.doctor.feeInr)}, ${
                  item.nextAvailableLabel
                }`}
                style={({ pressed }) => [
                  s.doctorCard,
                  { opacity: pressed ? t.opacity.pressed : 1 },
                ]}
              >
                <View style={s.doctorHead}>
                  <ConfiguredImage
                    url={item.doctor.photoUrl}
                    label={item.doctor.name}
                    initials={item.doctor.name
                      .replace('Dr. ', '')
                      .split(' ')
                      .map(part => part[0])
                      .join('')}
                    style={s.avatar}
                  />
                  <View style={s.flex}>
                    <AppText variant="small" weight="semibold">
                      {item.doctor.name}
                    </AppText>
                    <AppText
                      variant="caption"
                      tone="muted"
                      style={s.doctorMeta}
                    >
                      {item.doctor.specialty}
                    </AppText>
                    <AppText
                      variant="caption"
                      tone="muted"
                      style={s.doctorMeta}
                    >
                      {item.doctor.languages.slice(0, 2).join(' · ')}
                    </AppText>
                  </View>
                </View>
                <View style={s.nextSlot}>
                  <CareIcon name="clock-3" size={t.metrics.smallIcon} />
                  <AppText variant="caption" tone="primary" style={s.flex}>
                    {item.nextAvailableLabel}
                  </AppText>
                </View>
                <View style={s.doctorFooter}>
                  <AppText weight="semibold">
                    {formatInr(item.doctor.feeInr)}
                  </AppText>
                  <View style={s.bookLabel}>
                    <AppText variant="small" tone="primary" weight="semibold">
                      Book visit
                    </AppText>
                    <CareIcon
                      name="arrow-up-right"
                      size={t.metrics.smallIcon}
                    />
                  </View>
                </View>
              </Pressable>
            )}
          />
        </>
      )}
    </SectionSurface>
  );
}
function OfferStrip({ section }: { section: SectionOf<'offer_strip'> }) {
  const s = useStyles(makeStyles);
  const t = useTheme();
  return (
    <SectionSurface background={section.background}>
      {section.items.map(item => (
        <View key={item.id} style={s.offer}>
          <CareIcon name={item.icon} colour={t.colours.warmText} />
          <AppText
            variant="small"
            style={[s.flex, { color: t.colours.warmText }]}
          >
            {item.message}
          </AppText>
        </View>
      ))}
    </SectionSurface>
  );
}

export const SectionRenderer = memo(function RenderHomeSection({
  section,
  onAction,
  directory,
  scrollY,
}: {
  section: HomeSection;
  directory: DoctorDirectory;
  scrollY: SharedValue<number>;
} & ActionProps) {
  switch (section.type) {
    case 'hero_banner':
      return (
        <HeroBanner section={section} onAction={onAction} scrollY={scrollY} />
      );
    case 'category_chips':
      return <CategoryChips section={section} onAction={onAction} />;
    case 'quick_actions':
      return <QuickActions section={section} onAction={onAction} />;
    case 'service_grid':
      return <ServiceGrid section={section} onAction={onAction} />;
    case 'doctor_carousel':
      return (
        <DoctorCarousel
          section={section}
          directory={directory}
          onAction={onAction}
        />
      );
    case 'offer_strip':
      return <OfferStrip section={section} />;
    default:
      return null;
  }
});

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    fill: { flex: 1 },
    center: { textAlign: 'center' },
    section: { padding: t.spacing.lg },
    sectionTitle: { marginBottom: t.spacing.md },
    location: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.xxs,
      marginBottom: t.spacing.xl,
    },
    greeting: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.xs,
      marginBottom: t.spacing.sm,
    },
    heroRow: { flexDirection: 'row', alignItems: 'center' },
    headline: { letterSpacing: -t.spacing.xxs / 8 },
    description: { marginTop: t.spacing.sm },
    heroButton: { alignSelf: 'flex-start', marginTop: t.spacing.lg },
    heroArt: {
      width: t.metrics.heroArtWidth,
      height: t.metrics.heroArtHeight,
      marginRight: -t.spacing.lg,
      marginLeft: -t.spacing.sm,
    },
    chipSection: { paddingVertical: t.spacing.md },
    horizontalInset: { paddingHorizontal: t.spacing.lg, gap: t.spacing.sm },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.xs,
      minHeight: t.metrics.touch,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.pill,
      borderWidth: t.metrics.border,
      borderColor: t.colours.border,
      backgroundColor: t.colours.surface,
    },
    quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs },
    quickAction: {
      minWidth: t.metrics.actionIcon,
      alignItems: 'center',
      gap: t.spacing.xs,
      minHeight: t.metrics.touch + t.spacing.xxxl,
    },
    actionIcon: {
      width: t.metrics.actionIcon,
      height: t.metrics.actionIcon,
      borderRadius: t.radius.media,
      backgroundColor: t.colours.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
    serviceCard: {
      backgroundColor: t.colours.surface,
      borderWidth: t.metrics.border,
      borderColor: t.colours.border,
      borderRadius: t.radius.card,
      overflow: 'hidden',
    },
    serviceMedia: { height: t.metrics.mediaHeight, width: '100%' },
    serviceInfo: { padding: t.spacing.sm },
    serviceDescription: { marginTop: t.spacing.xxs },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.xxs,
      marginTop: t.spacing.sm,
    },
    badge: {
      position: 'absolute',
      top: t.spacing.xs,
      left: t.spacing.xs,
      paddingHorizontal: t.spacing.xs,
      paddingVertical: t.spacing.xxs,
      borderRadius: t.radius.small,
      backgroundColor: t.colours.surface,
    },
    doctorSection: { paddingVertical: t.spacing.lg },
    doctorCard: {
      width: t.metrics.doctorWidth,
      padding: t.spacing.md,
      borderWidth: t.metrics.border,
      borderColor: t.colours.border,
      borderRadius: t.radius.card,
      backgroundColor: t.colours.surface,
    },
    doctorHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
    },
    avatar: {
      width: t.metrics.avatar,
      height: t.metrics.avatar,
      borderRadius: t.radius.media,
    },
    doctorMeta: { marginTop: t.spacing.xxs },
    nextSlot: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.xxs,
      marginTop: t.spacing.md,
    },
    doctorFooter: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.xs,
      marginTop: t.spacing.sm,
      paddingTop: t.spacing.sm,
      borderTopWidth: t.metrics.border,
      borderTopColor: t.colours.border,
    },
    bookLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.xxs,
      minHeight: t.metrics.touch,
    },
    offer: {
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
    },
    loadingDoctors: { flexDirection: 'row', overflow: 'hidden' },
    loadingShortLine: { width: '70%' },
    loadingLine: {
      height: t.type.small,
      width: '100%',
      marginVertical: t.spacing.xxs,
    },
    loadingSlot: {
      height: t.type.caption,
      width: '80%',
      marginVertical: t.spacing.md,
    },
  });
