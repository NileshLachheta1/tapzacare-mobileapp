import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { CareIcon } from '../components/ui/CareIcon';
import { AppText } from '../components/ui/AppText';
type Rect = { x: number; y: number; width: number; height: number };
type Flight = { id: string; name: string; from: Rect; to: Rect | null };
const Context = createContext({
  flight: null as Flight | null,
  begin: (
    _id: string,
    _name: string,
    _view: React.ElementRef<typeof View> | null,
    next: () => void,
  ) => next(),
  arrive: (_id: string, _view: React.ElementRef<typeof View> | null) => {},
});
export function SharedPrescriptionProvider({
  children,
}: React.PropsWithChildren) {
  const [flight, setFlight] = useState<Flight | null>(null);
  const progress = useSharedValue(0);
  const reduced = useReducedMotion();
  const t = useTheme();
  const clear = () => setFlight(null);
  useEffect(() => {
    if (!flight) return;
    const timer = setTimeout(clear, 1200);
    return () => clearTimeout(timer);
  }, [flight]);
  const begin = (
    id: string,
    name: string,
    view: React.ElementRef<typeof View> | null,
    next: () => void,
  ) => {
    if (reduced || !view) {
      next();
      return;
    }
    let called = false;
    const proceed = () => {
      if (!called) {
        called = true;
        next();
      }
    };
    const fallback = setTimeout(proceed, 100);
    view.measureInWindow((x, y, width, height) => {
      clearTimeout(fallback);
      if (called) return;
      if (width > 0 && height > 0) {
        progress.value = 0;
        setFlight({ id, name, from: { x, y, width, height }, to: null });
      }
      proceed();
    });
  };
  const arrive = (id: string, view: React.ElementRef<typeof View> | null) => {
    if (!view) return;
    view.measureInWindow((x, y, width, height) =>
      setFlight(current =>
        current?.id === id && !current.to && width > 0
          ? { ...current, to: { x, y, width, height } }
          : current,
      ),
    );
  };
  useEffect(() => {
    if (flight?.to)
      progress.value = withTiming(1, { duration: 350 }, finished => {
        if (finished) runOnJS(clear)();
      });
  }, [flight, progress]);
  const animated = useAnimatedStyle(() => {
    if (!flight) return {};
    const to = flight.to ?? flight.from;
    return {
      left: interpolate(progress.value, [0, 1], [flight.from.x, to.x]),
      top: interpolate(progress.value, [0, 1], [flight.from.y, to.y]),
      width: interpolate(progress.value, [0, 1], [flight.from.width, to.width]),
      height: interpolate(
        progress.value,
        [0, 1],
        [flight.from.height, to.height],
      ),
    };
  });
  return (
    <Context.Provider value={{ flight, begin, arrive }}>
      {children}
      {flight ? (
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.overlay,
            {
              backgroundColor: t.colours.surface,
              borderRadius: t.radius.small,
              padding: t.spacing.xs,
            },
            animated,
          ]}
        >
          <Header name={flight.name} />
        </Animated.View>
      ) : null}
    </Context.Provider>
  );
}
function Header({ name }: { name: string }) {
  const t = useTheme();
  return (
    <View style={[styles.row, { gap: t.spacing.sm }]}>
      <CareIcon name="notebook-tabs" />
      <AppText variant="title" weight="semibold" style={styles.flex}>
        {name}
      </AppText>
    </View>
  );
}
export function SharedPrescriptionHeader({
  id,
  name,
  destination = false,
}: {
  id: string;
  name: string;
  destination?: boolean;
}) {
  const ref = useRef<React.ElementRef<typeof View>>(null);
  const { flight, arrive } = useContext(Context);
  useEffect(() => {
    if (destination && flight?.id === id && !flight.to)
      requestAnimationFrame(() => arrive(id, ref.current));
  }, [destination, flight, id, arrive]);
  return (
    <View
      ref={ref}
      collapsable={false}
      testID={`shared-${destination ? 'detail' : 'list'}-${id}`}
      onLayout={() => {
        if (destination && flight?.id === id && !flight.to)
          arrive(id, ref.current);
      }}
      style={flight?.id === id ? styles.hidden : undefined}
    >
      <Header name={name} />
    </View>
  );
}
export const useSharedPrescription = () => useContext(Context);
const styles = StyleSheet.create({
  overlay: { position: 'absolute', zIndex: 1000, justifyContent: 'center' },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  hidden: { opacity: 0 },
});
