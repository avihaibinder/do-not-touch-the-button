import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import useResponsive from '../hooks/useResponsive';
import { colors } from '../theme/colors';

/**
 * Cartoon-style timer bar at the top of the screen.
 * Props:
 *   total (s)
 *   remaining (s)
 *   running (bool)
 */
export default function TimerBar({ total, remaining, running }) {
  const { ms, fs, width } = useResponsive();
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = Math.max(0, Math.min(1, remaining / total));
  }, [remaining, total]);

  const fill = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const colorStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 0.25, 0.5, 1],
      [colors.red, colors.orange, colors.yellow, colors.green]
    ),
  }));

  const seconds = Math.max(0, remaining).toFixed(1);

  return (
    <View style={[styles.wrapper, { paddingHorizontal: ms(16), marginTop: ms(6) }]}>
      <View style={[styles.track, { height: ms(18), borderRadius: ms(12) }]}>
        <Animated.View style={[StyleSheet.absoluteFill, fill, colorStyle, { borderRadius: ms(12) }]} />
        <View style={[styles.tickOverlay, { borderRadius: ms(12) }]} pointerEvents="none" />
      </View>
      <View style={[styles.labelRow, { marginTop: ms(4) }]}>
        <Text style={[styles.label, { fontSize: fs(13) }]}>
          {running ? 'TIME' : 'PAUSED'}
        </Text>
        <Text style={[styles.value, { fontSize: fs(15) }]}>
          {seconds}s
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  track: {
    width: '100%',
    backgroundColor: 'rgba(26,26,46,0.10)',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1A1A2E',
  },
  tickOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.inkSoft,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  value: {
    color: colors.ink,
    fontWeight: '900',
  },
});
