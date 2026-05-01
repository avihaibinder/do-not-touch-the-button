import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

/**
 * Lightweight confetti burst. ~40 pieces flying outward on mount.
 * Used by SuccessModal.
 */
export default function Confetti({ active = true, count = 40 }) {
  const { width, height } = Dimensions.get('window');
  const palette = [colors.red, colors.yellow, colors.turquoise, colors.purple, colors.green, colors.orange];

  const pieces = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => ({
      id: i,
      angle: Math.random() * Math.PI * 2,
      distance: 80 + Math.random() * Math.max(width, height) * 0.6,
      delay: Math.random() * 120,
      duration: 900 + Math.random() * 700,
      size: 7 + Math.random() * 9,
      color: palette[Math.floor(Math.random() * palette.length)],
      rotateEnd: -360 + Math.random() * 720,
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
    }));
  }, [count, width, height]);

  if (!active) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <Piece key={p.id} {...p} cx={width / 2} cy={height * 0.42} />
      ))}
    </View>
  );
}

function Piece({ angle, distance, delay, duration, size, color, rotateEnd, shape, cx, cy }) {
  const t = useSharedValue(0);
  const r = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
    r.value = withDelay(delay, withTiming(rotateEnd, { duration, easing: Easing.out(Easing.cubic) }));
  }, []);

  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance;
  const fall = distance * 0.85;

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: dx * t.value },
      { translateY: dy * t.value + fall * Math.pow(t.value, 2) * 0.6 },
      { rotate: `${r.value}deg` },
      { scale: 1 - 0.25 * t.value },
    ],
    opacity: 1 - 0.85 * t.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: cx - size / 2,
          top: cy - size / 2,
          width: size,
          height: shape === 'rect' ? size * 0.55 : size,
          backgroundColor: color,
          borderRadius: shape === 'rect' ? 2 : size,
        },
        style,
      ]}
    />
  );
}
