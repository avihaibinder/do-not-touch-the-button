import { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

export interface BackgroundParticlesProps {
  count?: number;
  hue?: 'red' | 'mixed';
}

interface BubbleSpec {
  id: number;
  x: number;
  yStart: number;
  yEnd: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
  drift: number;
  opacity: number;
}

/**
 * Drifty floating background bubbles for the menu and loading screens.
 * Cheap and decorative.
 */
export default function BackgroundParticles({ count = 14, hue = 'mixed' }: BackgroundParticlesProps) {
  const { width, height } = Dimensions.get('window');

  const items = useMemo<BubbleSpec[]>(() => {
    const palette = hue === 'red'
      ? [colors.red, colors.orange, colors.yellow]
      : [colors.red, colors.yellow, colors.turquoise, colors.purple, colors.orange, colors.green];
    return new Array(count).fill(0).map((_, i) => ({
      id: i,
      x: Math.random() * width,
      yStart: height + 40,
      yEnd: -40,
      size: 18 + Math.random() * 28,
      duration: 9000 + Math.random() * 8000,
      delay: Math.random() * 6000,
      color: palette[i % palette.length],
      drift: (Math.random() - 0.5) * 60,
      opacity: 0.18 + Math.random() * 0.18,
    }));
  }, [count, width, height, hue]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {items.map((p) => (<Bubble key={p.id} {...p} />))}
    </View>
  );
}

function Bubble({ x, yStart, yEnd, size, duration, delay, color, drift, opacity }: BubbleSpec) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x + drift * Math.sin(t.value * Math.PI * 2) },
      { translateY: yStart + (yEnd - yStart) * t.value },
      { scale: 1 + 0.06 * Math.sin(t.value * Math.PI * 4) },
    ],
    opacity,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
