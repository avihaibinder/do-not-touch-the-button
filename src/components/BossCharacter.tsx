import { useEffect } from 'react';
import { View, Text, StyleSheet, type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import useResponsive from '../hooks/useResponsive';

export interface BossCharacterProps {
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  color?: string;
  accent?: string;
  /** Any value that changes when the boss takes a hit – triggers shake */
  shakeKey?: number;
}

/**
 * Boss HP bar + name plate. Shown above the boss in BossFight.
 */
export default function BossCharacter({ name, title, hp, maxHp, color, shakeKey }: BossCharacterProps) {
  const { ms, fs } = useResponsive();
  const shake = useSharedValue(0);
  const fillW = useSharedValue(1);
  const flash = useSharedValue(0);

  useEffect(() => {
    fillW.value = withSpring(Math.max(0, hp / maxHp), { damping: 14, stiffness: 150 });
    if (shakeKey !== undefined) {
      shake.value = withSequence(
        withTiming(1,  { duration: 50 }),
        withTiming(-1, { duration: 50 }),
        withTiming(1,  { duration: 50 }),
        withTiming(0,  { duration: 50 }),
      );
      flash.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 200 }),
      );
    }
  }, [hp, maxHp, shakeKey]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value * 6 }],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, fillW.value) * 100}%` as DimensionValue,
    backgroundColor: interpolateColor(
      fillW.value,
      [0, 0.4, 1],
      [colors.red, colors.orange, color || colors.green]
    ),
  }));
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  return (
    <Animated.View
      style={[
        styles.wrap,
        { paddingHorizontal: ms(16), paddingTop: ms(2) },
        wrapStyle,
      ]}
    >
      <View style={[styles.titleRow, { marginBottom: ms(4) }]}>
        <View style={[styles.titlePill, { paddingHorizontal: ms(10), paddingVertical: ms(3), borderRadius: ms(20), backgroundColor: color || colors.purple }]}>
          <Text style={[styles.titleText, { fontSize: fs(11) }]}>{title}</Text>
        </View>
        <Text style={[styles.nameText, { fontSize: fs(18) }]}>{name}</Text>
        <Text style={[styles.hpText, { fontSize: fs(13) }]}>
          {hp} / {maxHp}
        </Text>
      </View>

      <View style={[styles.track, { height: ms(20), borderRadius: ms(12) }]}>
        <Animated.View style={[StyleSheet.absoluteFill, fillStyle, { borderRadius: ms(12) }]} />
        <Animated.View style={[StyleSheet.absoluteFill, flashStyle, { backgroundColor: 'white', borderRadius: ms(12) }]} />
        <View style={[styles.tickWrap, { borderRadius: ms(12) }]} pointerEvents="none">
          {Array.from({ length: maxHp - 1 }).map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: `${((i + 1) / maxHp) * 100}%`,
                top: 0, bottom: 0,
                width: 2,
                backgroundColor: 'rgba(26,26,46,0.30)',
              }}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titlePill: { borderWidth: 2, borderColor: colors.ink },
  titleText: { color: colors.white, fontWeight: '900', letterSpacing: 1.2 },
  nameText: { color: colors.ink, fontWeight: '900', flex: 1 },
  hpText: { color: colors.inkSoft, fontWeight: '900' },
  track: {
    width: '100%',
    backgroundColor: 'rgba(26,26,46,0.10)',
    borderWidth: 2, borderColor: colors.ink,
    overflow: 'hidden',
  },
  tickWrap: { ...StyleSheet.absoluteFillObject },
});
