import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type FlatListProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { useConfig } from '../../config/ConfigProvider';
import type { HomeSection, SectionType } from '../../config/schema';
import type { RootTabParams } from '../../navigation/types';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/tokens';
import { AppText } from '../../components/ui/AppText';
import { CareIcon } from '../../components/ui/CareIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { HomeSkeleton } from '../../components/ui/Skeleton';
import { RevealSection } from './RevealSection';
import { SectionRenderer } from './sections';
import { useBooking } from '../booking/BookingProvider';
import { useDoctorDirectory } from './useDoctorDirectory';
import type { HomeIntent } from './types';

type ViewabilityChange = Parameters<
  NonNullable<FlatListProps<HomeSection>['onViewableItemsChanged']>
>[0];
const listTuning = {
  initialNumToRender: 3,
  maxToRenderPerBatch: 3,
  windowSize: 5,
  viewability: { viewAreaCoveragePercentThreshold: 5, minimumViewTime: 80 },
};

export function HomeScreen() {
  const {
    config,
    loading,
    initialized,
    variant,
    source,
    cacheWriteFailed,
    reload,
    switchVariant,
  } = useConfig();
  const t = useTheme();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParams>>();
  const directory = useDoctorDirectory();
  const { controller: booking } = useBooking();
  const list = useRef<FlatList<HomeSection>>(null);
  const retryScroll = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollY = useSharedValue(0);
  const reduced = useReducedMotion();
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const revealedVariant = useRef(variant);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = Math.max(0, event.contentOffset.y);
  });
  const headerStyle = useAnimatedStyle(() => ({
    minHeight: reduced
      ? t.metrics.header
      : interpolate(
          scrollY.value,
          [0, t.metrics.collapseDistance],
          [t.metrics.header, t.metrics.compactHeader],
          Extrapolation.CLAMP,
        ),
  }));
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: ViewabilityChange) => {
      setSeen(previous => {
        const next = new Set(previous);
        viewableItems.forEach(item => {
          if (item.isViewable) {
            next.add(item.item.id);
          }
        });
        return next.size === previous.size ? previous : next;
      });
    },
  ).current;
  useEffect(() => {
    if (revealedVariant.current === variant) {
      return;
    }
    revealedVariant.current = variant;
    scrollY.value = 0;
    list.current?.scrollToOffset({ offset: 0, animated: false });
    setSeen(new Set());
  }, [variant, scrollY]);
  useEffect(
    () => () => {
      if (retryScroll.current) {
        clearTimeout(retryScroll.current);
      }
    },
    [config.sections],
  );
  const scrollTo = useCallback(
    (type: SectionType) => {
      const index = config.sections.findIndex(section => section.type === type);
      if (index >= 0) {
        list.current?.scrollToIndex({
          index,
          animated: !reduced,
          viewPosition: 0,
        });
      }
    },
    [config.sections, reduced],
  );
  const onAction = useCallback(
    (intent: HomeIntent) => {
      if (intent.kind === 'scroll') {
        scrollTo(intent.sectionType);
      } else if (intent.kind === 'tab') {
        if (config.tabs.some(tab => tab.screen === intent.screen)) {
          navigation.navigate(intent.screen);
        }
      } else if (intent.kind === 'doctor') {
        booking.openDoctor(intent.doctor);
      } else {
        booking.openService(
          intent.service,
          directory.doctors.find(
            doctor => doctor.id === intent.service.doctorId,
          ) ?? null,
        );
      }
    },
    [navigation, scrollTo, config.tabs, booking, directory.doctors],
  );
  const renderItem = useCallback(
    ({ item, index }: { item: HomeSection; index: number }) => (
      <RevealSection visible={index === 0 || seen.has(item.id)}>
        <SectionRenderer
          section={item}
          onAction={onAction}
          directory={directory}
          scrollY={scrollY}
        />
      </RevealSection>
    ),
    [seen, onAction, directory, scrollY],
  );
  return (
    <View style={s.root}>
      <View
        style={{ height: insets.top, backgroundColor: t.colours.surface }}
      />
      <Animated.View style={[s.header, headerStyle]}>
        <View style={s.brand} accessible accessibilityLabel="Tapza Care">
          <View style={s.brandMark}>
            <CareIcon
              name="plus"
              size={t.metrics.icon}
              colour={t.colours.onPrimary}
            />
          </View>
          <AppText variant="brand" weight="bold" tone="primary">
            tapza
            {fontScale <= 1.2 && (
              <AppText variant="brand" tone="primary">
                care
              </AppText>
            )}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${
            variant === 'everyday' ? 'Diwali' : 'everyday'
          } home`}
          accessibilityState={{ disabled: loading, busy: loading }}
          onPress={switchVariant}
          disabled={loading}
          style={({ pressed }) => [
            s.themeSwitch,
            {
              opacity: loading
                ? t.opacity.disabled
                : pressed
                ? t.opacity.pressed
                : 1,
            },
          ]}
        >
          <CareIcon name="sparkles" size={t.metrics.smallIcon} />
          <AppText variant="caption" tone="primary" weight="semibold">
            {loading && initialized
              ? 'Updating…'
              : variant === 'everyday'
              ? 'Everyday'
              : 'Diwali'}
          </AppText>
        </Pressable>
      </Animated.View>
      {!initialized ? (
        <ScrollView contentContainerStyle={s.flexGrow}>
          <HomeSkeleton />
        </ScrollView>
      ) : (
        <Animated.FlatList
          testID="home-section-list"
          ref={list}
          data={config.sections}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          initialNumToRender={listTuning.initialNumToRender}
          maxToRenderPerBatch={listTuning.maxToRenderPerBatch}
          windowSize={listTuning.windowSize}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={listTuning.viewability}
          extraData={seen}
          contentContainerStyle={s.flexGrow}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => {
                reload();
                directory.retry();
              }}
              tintColor={t.colours.primary}
              colors={[t.colours.primary]}
            />
          }
          ListHeaderComponent={
            source !== 'remote' || cacheWriteFailed ? (
              <View style={s.notice} accessibilityLiveRegion="polite">
                <CareIcon
                  name={source === 'remote' ? 'refresh-cw' : 'wifi-off'}
                  size={t.metrics.smallIcon}
                  colour={t.colours.warmText}
                />
                <AppText
                  variant="caption"
                  style={[s.flex, { color: t.colours.warmText }]}
                >
                  {source === 'cache'
                    ? 'Showing your saved home. We couldn’t refresh it.'
                    : source === 'bundled'
                    ? 'We couldn’t connect. Your care is still here.'
                    : 'Your home is ready. We couldn’t save it for next time.'}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  disabled={loading}
                  onPress={reload}
                  style={s.retry}
                >
                  <AppText
                    variant="caption"
                    weight="semibold"
                    style={{ color: t.colours.warmText }}
                  >
                    Retry
                  </AppText>
                </Pressable>
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              title="Your clinic is getting ready"
              message="New services and doctors will appear here. You can still use your medicines and profile below."
              icon="heart-handshake"
              actionLabel="Refresh home"
              onAction={reload}
            />
          }
          ListFooterComponent={
            config.sections.length ? (
              <AppText variant="caption" tone="muted" style={s.footer}>
                Thoughtful care. From your neighbourhood clinic.
              </AppText>
            ) : undefined
          }
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            list.current?.scrollToOffset({
              offset: averageItemLength * index,
              animated: false,
            });
            if (retryScroll.current) {
              clearTimeout(retryScroll.current);
            }
            retryScroll.current = setTimeout(
              () => list.current?.scrollToIndex({ index, animated: !reduced }),
              t.motion.reveal,
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
    flex: { flex: 1 },
    flexGrow: { flexGrow: 1 },
    header: {
      paddingHorizontal: t.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: t.spacing.xs,
      backgroundColor: t.colours.surface,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.xs,
      flexShrink: 1,
    },
    brandMark: {
      width: t.metrics.brandMark,
      height: t.metrics.brandMark,
      borderRadius: t.radius.small,
      backgroundColor: t.colours.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeSwitch: {
      minHeight: t.metrics.touch,
      backgroundColor: t.colours.secondary,
      borderRadius: t.radius.pill,
      paddingHorizontal: t.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.xxs,
    },
    notice: {
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.xs,
      backgroundColor: t.colours.warmSurface,
    },
    retry: {
      minHeight: t.metrics.touch,
      minWidth: t.metrics.touch,
      justifyContent: 'center',
      alignItems: 'center',
    },
    footer: { padding: t.spacing.xl, textAlign: 'center' },
  });
