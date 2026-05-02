import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import useResponsive from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import type { LevelConfig, Mechanic, MechanicParams } from '../types';

/**
 * Per-mechanic "how to pass this level" info card.
 *
 * Triggered by the (?) button in the level header. The copy is keyed by
 * the level's mechanic; combo levels list each stage's instructions in
 * order; boss levels show generic boss tips.
 */

interface TipDefinition {
  title: string;
  how: (params?: MechanicParams) => string[];
}

const TIPS: Partial<Record<Mechanic, TipDefinition>> = {
  static: {
    title: 'STATIC',
    how: (p) => [
      `Tap the button ${p?.taps ?? 1}× to clear the level.`,
      'It won\'t move, won\'t shrink, won\'t fight back.',
    ],
  },
  teleport: {
    title: 'TELEPORT',
    how: (p) => [
      `Each tap, the button jumps to a new spot. Land ${p?.taps ?? 2} hits.`,
      'The dashed purple ring shows where it\'s headed next — chase it.',
    ],
  },
  shrink: {
    title: 'SHRINK',
    how: (p) => [
      `Tap ${p?.taps ?? 5}× — every hit makes the button smaller and meaner.`,
      'Be precise on the final taps; missing wastes the timer.',
    ],
  },
  orbit: {
    title: 'ORBIT',
    how: (p) => [
      `The button circles the center. Tap it ${p?.taps ?? 4}× as it flies past.`,
      'Lead the target — tap where it\'s about to be, not where it is.',
    ],
  },
  decoys: {
    title: 'DECOYS',
    how: (p) => [
      `Spot the real button among ${(p?.decoys ?? 2) + 1} look-alikes. Tap ${p?.taps ?? 1}×.`,
      'The decoys have X-eyes — only the smiling one counts.',
      'Tapping a decoy = instant fail.',
    ],
  },
  proximity: {
    title: 'PROXIMITY',
    how: (p) => [
      `The button dodges your finger. Tap it ${p?.taps ?? 3}× anyway.`,
      'Approach diagonally or jab quickly — sweeping motions just push it around.',
    ],
  },
  flash: {
    title: 'FLASH',
    how: (p) => [
      `The button blinks in and out. Hit it ${p?.taps ?? 3}× while it\'s visible.`,
      'It also moves each blink — track its rhythm and tap as it appears.',
    ],
  },
  longpress: {
    title: 'LONG PRESS',
    how: (p) => [
      `Press and HOLD the button for ${((p?.holdMs ?? 1500) / 1000).toFixed(1)}s.`,
      'Lift your finger early and the timer resets — keep contact until the ring fills.',
    ],
  },
  rhythm: {
    title: 'RHYTHM',
    how: (p) => [
      `Tap ${p?.taps ?? 4}× with steady gaps under ${p?.windowMs ?? 600}ms.`,
      `Don\'t mash — gaps shorter than ${p?.minGapMs ?? 180}ms are ignored.`,
      'Too slow → counter resets to zero.',
    ],
  },
  mirror: {
    title: 'MIRROR',
    how: (p) => [
      `Controls are flipped horizontally. Tap the button ${p?.taps ?? 3}× anyway.`,
      'Trust the visual, not your muscle memory — your left is the button\'s right.',
    ],
  },
  trap: {
    title: 'LAVA / TRAPS',
    how: (p) => [
      `Tap the button ${p?.taps ?? 3}× without touching the red traps.`,
      'A single trap-tap fails the level, so plan your approach carefully.',
    ],
  },
  multi: {
    title: 'MULTI-TAP',
    how: (p) => [
      `Land ${p?.taps ?? 8} taps in ${((p?.windowMs ?? 2000) / 1000).toFixed(1)}s.`,
      'Use two thumbs if you have to — speed beats accuracy here.',
    ],
  },
  combo: {
    title: 'COMBO',
    how: () => [
      'This level chains multiple mechanics back-to-back.',
      'Each stage must be cleared before the next one appears. See below for each:',
    ],
  },
  boss: {
    title: 'BOSS FIGHT',
    how: () => [
      'Drain the boss\'s HP bar to win. Each tap on the real button = 1 hit.',
      'Bosses change tactics between phases — adapt fast when the banner flashes.',
      'Watch the timer: a boss is still a level, and time-out still loses.',
    ],
  },
};

const FALLBACK_TIP: TipDefinition = {
  title: 'TIPS',
  how: () => ['Tap the button. Survive. Don\'t time out.'],
};

function getTipsFor(mechanic: Mechanic): TipDefinition {
  return TIPS[mechanic] ?? FALLBACK_TIP;
}

interface Section {
  title: string;
  lines: string[];
}

export interface InfoModalProps {
  visible: boolean;
  level: LevelConfig | null | undefined;
  onClose?: () => void;
}

export default function InfoModal({ visible, level, onClose }: InfoModalProps) {
  const { ms, fs } = useResponsive();
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 13, stiffness: 160 });
    } else {
      scale.value = withTiming(0, { duration: 140 });
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const sections = useMemo<Section[]>(() => {
    if (!level) return [];

    if (level.mechanic === 'combo') {
      const stages = level.params?.stages ?? [];
      const intro = getTipsFor('combo');
      return [
        { title: intro.title, lines: intro.how() },
        ...stages.map((s, i) => {
          const t = getTipsFor(s.mechanic);
          return {
            title: `STAGE ${i + 1} · ${t.title}`,
            lines: t.how(s.params || {}),
          };
        }),
      ];
    }

    if (level.mechanic === 'boss') {
      const t = getTipsFor('boss');
      return [{ title: t.title, lines: t.how(level.params) }];
    }

    const t = getTipsFor(level.mechanic);
    return [{ title: t.title, lines: t.how(level.params) }];
  }, [level]);

  if (!level) return null;

  const timerLine = level.noTimer
    ? 'No timer on this level.'
    : `Clear it before the timer hits 0 (${level.timer}s).`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.card,
            cardStyle,
            { padding: ms(20), width: Math.min(420, ms(340)), borderRadius: ms(24) },
          ]}
        >
          <LinearGradient
            colors={['#FFE66D', '#FFCAD4']}
            style={[StyleSheet.absoluteFill, { borderRadius: ms(24) }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />

          <View style={styles.headerRow}>
            <Text style={[styles.kicker, { fontSize: fs(11) }]}>
              {level.isBoss ? `BOSS · LEVEL ${level.id}` : `LEVEL ${level.id}`}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={14}
              style={[styles.closeBtn, { width: ms(34), height: ms(34), borderRadius: ms(17) }]}
            >
              <Text style={[styles.closeX, { fontSize: fs(18) }]}>×</Text>
            </Pressable>
          </View>

          <Text style={[styles.title, { fontSize: fs(24), marginTop: ms(2) }]}>
            {level.name}
          </Text>
          <Text style={[styles.kicker2, { fontSize: fs(11), marginTop: ms(2) }]}>
            HOW TO PASS
          </Text>

          <ScrollView
            style={{ marginTop: ms(10), maxHeight: 360 }}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((s, i) => (
              <View key={i} style={[styles.section, { marginBottom: ms(12) }]}>
                <Text style={[styles.sectionTitle, { fontSize: fs(13) }]}>{s.title}</Text>
                {s.lines.map((line, j) => (
                  <View key={j} style={[styles.bulletRow, { marginTop: ms(4) }]}>
                    <Text style={[styles.bulletDot, { fontSize: fs(14) }]}>•</Text>
                    <Text style={[styles.bulletText, { fontSize: fs(13) }]}>{line}</Text>
                  </View>
                ))}
              </View>
            ))}

            <View style={[styles.timerLine, { marginTop: ms(2) }]}>
              <Text style={[styles.timerText, { fontSize: fs(12) }]}>⏱ {timerLine}</Text>
            </View>
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.gotIt,
              {
                paddingVertical: ms(12),
                marginTop: ms(14),
                borderRadius: ms(14),
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={[styles.gotItText, { fontSize: fs(15) }]}>GOT IT</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

export interface InfoButtonProps {
  onPress?: () => void;
}

/**
 * Round (?) info button. Drop into the LevelScreen header.
 */
export function InfoButton({ onPress }: InfoButtonProps) {
  const { ms, fs } = useResponsive();
  const sz = ms(46);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => [
        styles.infoBtn,
        {
          width: sz, height: sz, borderRadius: sz / 2,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
      ]}
    >
      <Text style={[styles.infoQ, { fontSize: fs(20) }]}>?</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.ink,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    color: colors.inkSoft,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  kicker2: {
    color: colors.inkSoft,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  closeBtn: {
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.ink,
  },
  closeX: { color: colors.ink, fontWeight: '900', lineHeight: 18 },
  title: {
    color: colors.ink,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  section: {},
  sectionTitle: {
    color: colors.ink,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 4,
  },
  bulletDot: {
    color: colors.red,
    fontWeight: '900',
    width: 14,
    lineHeight: 18,
  },
  bulletText: {
    color: colors.ink,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  timerLine: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,26,46,0.20)',
  },
  timerText: {
    color: colors.inkSoft,
    fontWeight: '700',
  },
  gotIt: {
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  gotItText: {
    color: colors.white,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  infoBtn: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  infoQ: {
    color: colors.ink,
    fontWeight: '900',
    lineHeight: 22,
  },
});
