import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import useResponsive from '../hooks/useResponsive';
import useSounds from '../hooks/useSounds';
import { colors, gradients } from '../theme/colors';
import type { FailReason } from '../types';

interface ReasonCopy {
  title: string;
  sub: string;
}

const REASON_COPY: Record<FailReason, ReasonCopy> = {
  timeout:   { title: 'TIME’S UP!', sub: 'The button got away. Again.' },
  trap:      { title: 'OUCH!',      sub: 'You tapped a trap.' },
  decoy:     { title: 'GOTCHA!',    sub: 'That was a decoy.' },
  rhythm:    { title: 'OFF BEAT',   sub: 'Your rhythm slipped. Try again.' },
  proximity: { title: 'TOO CLOSE',  sub: 'It dodges. You react.' },
  default:   { title: 'NICE TRY',   sub: 'But the button wins this round.' },
};

export interface FailureModalProps {
  visible: boolean;
  reason?: FailReason | null;
  levelNumber: number;
  levelName?: string;
  timeSeconds?: number | null;
  onRetry?: () => void;
  onMenu?: () => void;
}

export default function FailureModal({
  visible,
  reason = 'default',
  levelNumber,
  levelName,
  timeSeconds,
  onRetry,
  onMenu,
}: FailureModalProps) {
  const { ms, fs } = useResponsive();
  const sounds = useSounds();
  const scale = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Sad-trombone moment: a fail stinger followed by a deflated whoosh.
      sounds.play('fail');
      const t = setTimeout(() => sounds.play('whoosh'), 220);
      scale.value = withSpring(1, { damping: 12, stiffness: 130 });
      shake.value = withSequence(
        withTiming(1,  { duration: 60 }),
        withTiming(-1, { duration: 60 }),
        withTiming(1,  { duration: 60 }),
        withTiming(0,  { duration: 60 }),
      );
      return () => clearTimeout(t);
    } else {
      scale.value = 0;
      shake.value = 0;
    }
  }, [visible]);

  const playClick = () => sounds.play('pop');

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: shake.value * 8 },
      { rotate: `${(1 - scale.value) * 6}deg` },
    ],
    opacity: scale.value,
  }));

  const r = REASON_COPY[reason ?? 'default'] ?? REASON_COPY.default;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            cardStyle,
            { padding: ms(20), width: Math.min(440, ms(360)), borderRadius: ms(28) },
          ]}
        >
          <LinearGradient
            colors={gradients.fail}
            style={[StyleSheet.absoluteFill, { borderRadius: ms(28) }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />

          <Text style={[styles.title, { fontSize: fs(34) }]}>{r.title}</Text>
          <Text style={[styles.sub, { fontSize: fs(15), marginTop: ms(4) }]}>{r.sub}</Text>

          {!!levelName && (
            <View style={[styles.namePill, { paddingHorizontal: ms(12), paddingVertical: ms(6), marginTop: ms(14), borderRadius: ms(20) }]}>
              <Text style={[styles.nameText, { fontSize: fs(13) }]}>
                Level {levelNumber} · {levelName}
              </Text>
            </View>
          )}

          {timeSeconds !== undefined && timeSeconds !== null && (
            <View style={[styles.timeRow, { marginTop: ms(16) }]}>
              <Text style={[styles.timeLabel, { fontSize: fs(12) }]}>HUNG ON FOR</Text>
              <Text style={[styles.timeValue, { fontSize: fs(34) }]}>
                {timeSeconds.toFixed(2)}s
              </Text>
            </View>
          )}

          <View style={[styles.btnCol, { marginTop: ms(20), gap: ms(10) }]}>
            <BigBtn label="TRY AGAIN ↻" onPress={() => { playClick(); onRetry?.(); }} fs={fs} ms={ms} bg={colors.yellow} color={colors.ink} />
            <BigBtn label="MENU"        onPress={() => { playClick(); onMenu?.();  }} fs={fs} ms={ms} bg={colors.white} color={colors.ink} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

interface BigBtnProps {
  label: string;
  onPress: () => void;
  fs: (n: number) => number;
  ms: (n: number) => number;
  bg: string;
  color: string;
}

function BigBtn({ label, onPress, fs, ms, bg, color }: BigBtnProps) {
  const press = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.04 * press.value }],
  }));
  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { press.value = withTiming(1, { duration: 80 }); }}
        onPressOut={() => { press.value = withTiming(0, { duration: 120 }); }}
        style={[
          styles.bigBtn,
          { paddingVertical: ms(14), borderRadius: ms(16), backgroundColor: bg },
        ]}
      >
        <Text style={[styles.bigBtnText, { fontSize: fs(16), color }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 3, borderColor: colors.ink,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5, shadowRadius: 14,
    elevation: 20,
  },
  title: {
    color: colors.white, fontWeight: '900', letterSpacing: 1.6,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.30)',
    textShadowOffset: { width: 0, height: 3 },
  },
  sub: { color: 'rgba(255,255,255,0.92)', fontWeight: '700', textAlign: 'center' },
  namePill: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 2, borderColor: colors.ink,
  },
  nameText: { color: colors.ink, fontWeight: '900', letterSpacing: 1 },
  timeRow: { alignItems: 'center' },
  timeLabel: { color: 'rgba(255,255,255,0.85)', fontWeight: '900', letterSpacing: 1.4 },
  timeValue: {
    color: colors.white, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.30)',
    textShadowOffset: { width: 0, height: 3 },
  },
  btnCol: { width: '100%' },
  bigBtn: {
    width: '100%', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.ink,
  },
  bigBtnText: { fontWeight: '900', letterSpacing: 1.2 },
});
