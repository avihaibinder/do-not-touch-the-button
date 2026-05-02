import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import useResponsive from '../hooks/useResponsive';
import { useGame } from '../context/GameContext';
import { colors } from '../theme/colors';
import useHaptics from '../hooks/useHaptics';

const TOTAL_LEVELS = 30;

export interface HamburgerButtonProps {
  onPress?: () => void;
}

export function HamburgerButton({ onPress }: HamburgerButtonProps) {
  const { ms } = useResponsive();
  const sz = ms(46);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => [
        styles.hamWrap,
        {
          width: sz, height: sz, borderRadius: sz / 2,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
      ]}
    >
      <View style={[styles.hamBar, { width: sz * 0.45, height: 3, marginVertical: 2.5 }]} />
      <View style={[styles.hamBar, { width: sz * 0.45, height: 3, marginVertical: 2.5 }]} />
      <View style={[styles.hamBar, { width: sz * 0.45, height: 3, marginVertical: 2.5 }]} />
    </Pressable>
  );
}

export interface HamburgerMenuProps {
  visible: boolean;
  onClose?: () => void;
}

export default function HamburgerMenu({ visible, onClose }: HamburgerMenuProps) {
  const { ms, fs } = useResponsive();
  const haptics = useHaptics();
  const {
    progress,
    settings,
    stats,
    updateSettings,
    goToLevel,
    resetEverything,
  } = useGame();

  const slide = useSharedValue(0);

  useEffect(() => {
    slide.value = withTiming(visible ? 1 : 0, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -300 + 300 * slide.value }],
    opacity: slide.value,
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: 0.55 * slide.value }));

  const onResetPress = () => {
    haptics.warning();
    Alert.alert(
      'Reset progress?',
      'All level progress and stats will be wiped. Settings will return to defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetEverything();
            onClose?.();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.scrim, scrimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            paddingTop: ms(50),
            paddingHorizontal: ms(18),
            width: Math.min(360, ms(320)),
          },
          sheetStyle,
        ]}
      >
        <LinearGradient
          colors={[colors.bgTop, colors.bgMid]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />

        <View style={[styles.header, { marginBottom: ms(12) }]}>
          <Text style={[styles.title, { fontSize: fs(22) }]}>MENU</Text>
          <Pressable
            onPress={onClose}
            hitSlop={14}
            style={[styles.closeBtn, { width: ms(36), height: ms(36), borderRadius: ms(18) }]}
          >
            <Text style={[styles.closeX, { fontSize: fs(18) }]}>×</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Stats card */}
          <View style={[styles.card, { padding: ms(14), borderRadius: ms(16), marginBottom: ms(14) }]}>
            <Text style={[styles.cardTitle, { fontSize: fs(14) }]}>YOUR STATS</Text>
            <Stat label="Wins"        value={String(stats.totalWins || 0)}        fs={fs} ms={ms} />
            <Stat label="Fails"       value={String(stats.totalFails || 0)}       fs={fs} ms={ms} />
            <Stat label="Attempts"    value={String(stats.totalAttempts || 0)}    fs={fs} ms={ms} />
            <Stat label="Levels done" value={`${(progress.completedLevels || []).length} / ${TOTAL_LEVELS}`} fs={fs} ms={ms} />
          </View>

          {/* Settings */}
          <View style={[styles.card, { padding: ms(14), borderRadius: ms(16), marginBottom: ms(14) }]}>
            <Text style={[styles.cardTitle, { fontSize: fs(14) }]}>SETTINGS</Text>
            <Toggle
              label="Haptics"
              value={!!settings.haptics}
              onChange={(v) => updateSettings({ haptics: v })}
              fs={fs} ms={ms}
            />
            <Toggle
              label="Sound effects"
              value={!!settings.sfx}
              onChange={(v) => updateSettings({ sfx: v })}
              fs={fs} ms={ms}
            />
            <Toggle
              label="Background music"
              value={!!settings.music}
              onChange={(v) => updateSettings({ music: v })}
              fs={fs} ms={ms}
            />
          </View>

          {/* Level select */}
          <View style={[styles.card, { padding: ms(14), borderRadius: ms(16), marginBottom: ms(14) }]}>
            <Text style={[styles.cardTitle, { fontSize: fs(14) }]}>LEVEL SELECT</Text>
            <View style={styles.levelGrid}>
              {Array.from({ length: TOTAL_LEVELS }).map((_, i) => {
                const n = i + 1;
                const unlocked = n <= (progress.highestUnlockedLevel || 1);
                const done = (progress.completedLevels || []).includes(n);
                const isBoss = n % 10 === 0;
                return (
                  <Pressable
                    key={n}
                    disabled={!unlocked}
                    onPress={() => {
                      haptics.select();
                      goToLevel(n);
                      onClose?.();
                    }}
                    style={({ pressed }) => [
                      styles.levelDot,
                      {
                        width: ms(44), height: ms(44), borderRadius: ms(12),
                        backgroundColor: !unlocked
                          ? 'rgba(26,26,46,0.10)'
                          : isBoss ? colors.purple : (done ? colors.green : colors.white),
                        borderColor: isBoss ? colors.purple : colors.ink,
                        transform: [{ scale: pressed ? 0.94 : 1 }],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.levelText,
                        {
                          fontSize: fs(14),
                          color: !unlocked
                            ? colors.inkLight
                            : isBoss ? colors.white : colors.ink,
                        },
                      ]}
                    >
                      {isBoss ? '★' : n}
                    </Text>
                    {!unlocked && (
                      <Text style={[styles.lock, { fontSize: fs(10) }]}>🔒</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Danger */}
          <Pressable
            onPress={onResetPress}
            style={({ pressed }) => [
              styles.resetBtn,
              { padding: ms(14), borderRadius: ms(14), opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.resetText, { fontSize: fs(14) }]}>RESET ALL PROGRESS</Text>
          </Pressable>

          <Text style={[styles.footer, { fontSize: fs(10), marginTop: ms(14) }]}>
            v1.0 · Do Not Click The Button
          </Text>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

interface StatProps {
  label: string;
  value: string;
  fs: (n: number) => number;
  ms: (n: number) => number;
}

function Stat({ label, value, fs, ms }: StatProps) {
  return (
    <View style={[styles.statRow, { marginTop: ms(6) }]}>
      <Text style={[styles.statLabel, { fontSize: fs(13) }]}>{label}</Text>
      <Text style={[styles.statValue, { fontSize: fs(15) }]}>{value}</Text>
    </View>
  );
}

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  fs: (n: number) => number;
  ms: (n: number) => number;
}

function Toggle({ label, value, onChange, fs, ms }: ToggleProps) {
  return (
    <View style={[styles.toggleRow, { marginTop: ms(8) }]}>
      <Text style={[styles.toggleLabel, { fontSize: fs(14) }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={value ? colors.white : '#f0f0f0'}
        trackColor={{ false: '#ccc', true: colors.green }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hamWrap: {
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
  hamBar: { backgroundColor: colors.ink, borderRadius: 2 },

  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    overflow: 'hidden',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: colors.shadow,
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 14,
  },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontWeight: '900', color: colors.ink, letterSpacing: 1.4 },
  closeBtn: {
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.ink,
  },
  closeX: { color: colors.ink, fontWeight: '900', lineHeight: 18 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 2, borderColor: colors.ink,
  },
  cardTitle: { fontWeight: '900', color: colors.ink, letterSpacing: 1.2, marginBottom: 4 },

  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: colors.inkSoft, fontWeight: '700' },
  statValue: { color: colors.ink, fontWeight: '900' },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { color: colors.ink, fontWeight: '700' },

  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  levelDot: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  levelText: { fontWeight: '900' },
  lock: { position: 'absolute', bottom: 2, color: colors.inkLight },

  resetBtn: {
    backgroundColor: colors.red,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.ink,
  },
  resetText: { color: colors.white, fontWeight: '900', letterSpacing: 1.5 },

  footer: { textAlign: 'center', color: colors.inkLight, fontWeight: '700' },
});
