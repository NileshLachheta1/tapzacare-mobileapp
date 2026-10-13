import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/tokens';

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const opacity = useSharedValue(t.opacity.decoration);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!reduced) {
      opacity.value = withRepeat(
        withTiming(1, { duration: t.motion.shimmer }),
        -1,
        true,
      );
    }
    return () => cancelAnimation(opacity);
  }, [opacity, reduced, t.motion.shimmer]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { backgroundColor: t.colours.skeleton, borderRadius: t.radius.small },
        style,
        animated,
      ]}
      accessible={false}
    />
  );
}
export function HomeSkeleton() {
  const s = useStyles(makeStyles);
  return (
    <View
      accessibilityLabel="Loading your home"
      accessibilityRole="progressbar"
    >
      <View style={s.hero}>
        <Skeleton style={s.shortLine} />
        <Skeleton style={s.headline} />
        <Skeleton style={s.line} />
        <Skeleton style={s.button} />
      </View>
      <View style={s.section}>
        <View style={s.actions}>
          {[0, 1, 2, 3].map(id => (
            <Skeleton key={id} style={s.action} />
          ))}
        </View>
      </View>
      <View style={s.section}>
        <Skeleton style={s.title} />
        <View style={s.grid}>
          <Skeleton style={s.card} />
          <Skeleton style={s.card} />
        </View>
      </View>
    </View>
  );
}
const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    hero: {
      padding: t.spacing.lg,
      gap: t.spacing.md,
      minHeight: t.metrics.skeletonHero,
      backgroundColor: t.colours.secondary,
    },
    shortLine: { height: t.type.caption, width: '55%' },
    headline: { height: t.type.hero * 2, width: '75%' },
    line: { height: t.type.small, width: '65%' },
    button: { height: t.metrics.touch, width: '45%' },
    section: { padding: t.spacing.lg, gap: t.spacing.md },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: t.spacing.xs,
    },
    action: { flex: 1, height: t.metrics.actionIcon },
    title: { width: '60%', height: t.type.title },
    grid: { flexDirection: 'row', gap: t.spacing.sm },
    card: {
      flex: 1,
      height: t.metrics.mediaHeight + t.metrics.touch * 2,
      borderRadius: t.radius.card,
    },
  });
