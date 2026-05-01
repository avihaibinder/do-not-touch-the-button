import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import MechanicRunner from '../levels/MechanicRunner';
import BossCharacter from '../components/BossCharacter';
import useResponsive from '../hooks/useResponsive';
import useHaptics from '../hooks/useHaptics';
import useSounds from '../hooks/useSounds';
import { colors } from '../theme/colors';

/**
 * Boss fight controller.
 *
 * Walks the player through each phase of `boss.phases`. Each tap on the real
 * button decrements HP by 1 and advances within the current phase. When a
 * phase's hits are exhausted, the next phase swaps in (re-keyed runner).
 */
export default function BossFight({
  boss,
  playArea,
  buttonSize,
  running,
  onTapHit,
  onComplete,
  onFail,
  onPhaseChange,
}) {
  const { ms, fs } = useResponsive();
  const haptics = useHaptics();
  const sounds = useSounds();

  const totalHp = useMemo(
    () => boss.phases.reduce((s, p) => s + (p.hits || 0), 0),
    [boss]
  );

  const [hp, setHp] = useState(totalHp);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseHits, setPhaseHits] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);

  const phase = boss.phases[Math.min(phaseIdx, boss.phases.length - 1)];

  // Guard so we never double-fire onComplete on the same boss instance.
  const finishedRef = useRef(false);

  const handleTapHit = () => {
    if (!running || finishedRef.current) return;
    haptics.heavy();
    sounds.play('bossHit');
    onTapHit?.();

    // Compute next-phase state pure-ly first, then commit + side-effect once.
    const need = phase.hits || 1;
    const isPhaseEnd = phaseHits + 1 >= need;
    const isBossEnd = isPhaseEnd && phaseIdx + 1 >= boss.phases.length;

    setHp((h) => Math.max(0, h - 1));
    setShakeKey((k) => k + 1);

    if (isBossEnd) {
      finishedRef.current = true;
      setPhaseHits((p) => p + 1);
      haptics.success();
      sounds.play('bossWin');
      onComplete?.();
      return;
    }

    if (isPhaseEnd) {
      setPhaseHits(0);
      setPhaseIdx((i) => i + 1);
      haptics.warning();
      sounds.play('whoosh');
      onPhaseChange?.(phaseIdx + 1);
      return;
    }

    setPhaseHits((p) => p + 1);
  };

  const handleMechFail = (reason) => {
    if (!running) return;
    onFail?.(reason || 'default');
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* HP bar at the very top */}
      <View style={[styles.hpWrap, { paddingTop: ms(2) }]}>
        <BossCharacter
          name={boss.name}
          title={`${boss.title} · Phase ${phaseIdx + 1}/${boss.phases.length}`}
          hp={hp}
          maxHp={totalHp}
          color={boss.color}
          accent={boss.accent}
          shakeKey={shakeKey}
        />
      </View>

      {/* Phase banner */}
      <PhaseBanner key={`pb-${phaseIdx}`} phase={phase} fs={fs} ms={ms} />

      {/* The mechanic itself */}
      <View style={[styles.field, { top: ms(60) }]} pointerEvents="box-none">
        <MechanicRunner
          key={`phase-${phaseIdx}`}
          mechanic={phase.mechanic}
          params={{ ...phase.params, taps: 999 /* sentinel: boss controls completion */ }}
          playArea={{ width: playArea.width, height: playArea.height - ms(60) }}
          buttonSize={buttonSize}
          colorOverride={boss.color}
          accentOverride={boss.accent}
          running={running}
          bossMode
          onTapHit={handleTapHit}
          onComplete={() => { /* ignored — boss tracks its own completion */ }}
          onFail={handleMechFail}
        />
      </View>
    </View>
  );
}

function PhaseBanner({ phase, fs, ms }) {
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withSequence(
      withSpring(1, { damping: 12, stiffness: 150 }),
      withTiming(1, { duration: 1200 }),
      withTiming(0, { duration: 250 })
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -10 + 10 * t.value }, { scale: 0.92 + 0.08 * t.value }],
    opacity: t.value,
  }));
  const label = phase.mechanic.toUpperCase();
  return (
    <Animated.View style={[styles.banner, { marginTop: ms(50) }, style]} pointerEvents="none">
      <LinearGradient
        colors={['#FFE66D', '#FFD93D']}
        style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
      <Text style={[styles.bannerText, { fontSize: fs(13) }]}>
        ★ PHASE: {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hpWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  field: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  banner: {
    alignSelf: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  bannerText: {
    color: colors.ink,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
