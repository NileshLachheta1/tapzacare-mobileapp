import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';

export function RevealSection({
  visible,
  children,
}: React.PropsWithChildren<{ visible: boolean }>) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const progress = useSharedValue(visible || reduced ? 1 : 0);
  useEffect(() => {
    if (visible || reduced) {
      progress.value = withTiming(1, {
        duration: reduced ? 0 : t.motion.reveal,
      });
    }
  }, [visible, reduced, progress, t.motion.reveal]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * t.motion.revealDistance }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
