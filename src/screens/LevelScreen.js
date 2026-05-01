import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HamburgerButton } from '../components/HamburgerMenu';
import TimerBar from '../components/TimerBar';
import AdBanner from '../components/AdBanner';
import MechanicRunner from '../levels/MechanicRunner';
import BossFight from '../bosses/BossFight';
import SuccessModal from '../components/SuccessModal';
import FailureModal from '../components/FailureModal';
import BackgroundParticles from '../components/BackgroundParticles';

import useResponsive from '../hooks/useResponsive';
import useHaptics from '../hooks/useHaptics';
import useSounds from '../hooks/useSounds';
import { useGame } from '../context/GameContext';
import { getBoss } from '../bosses/bossConfigs';
import { TOTAL_LEVELS } from '../levels/levelConfigs';
import { colors, gradients } from '../theme/colors';

/**
 * Single screen that plays one level (regular or boss). The hamburger menu is
 * mounted by GameContainer.
 */
export default function LevelScreen({ onOpenMenu }) {
  const { ms, fs, width, height, isTablet, buttonBase } = useResponsive();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const sounds = useSounds();

  const {
    level,
    currentLevel,
    completeLevel,
    failLevel,
    goToNextLevel,
    goToLevel,
  } = useGame();

  const [running, setRunning] = useState(true);
  const [remaining, setRemaining] = useState(level?.timer || 30);
  const [success, setSuccess] = useState(false);
  const [failure, setFailure] = useState(null); // null | 'timeout' | 'trap' | 'decoy'
  const [restartKey, setRestartKey] = useState(0);

  const startTime = useRef(Date.now());

  // Reset whenever the active level changes.
  useEffect(() => {
    setRunning(true);
    setRemaining(level?.timer || 30);
    setSuccess(false);
    setFailure(null);
    startTime.current = Date.now();
  }, [level?.id, restartKey]);

  // Timer countdown.
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const initialRemaining = level?.timer || 30;
    setRemaining(initialRemaining);
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, initialRemaining - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        setRunning(false);
        haptics.error();
        sounds.play('fail');
        setFailure('timeout');
        failLevel();
      }
    }, 100);
    return () => clearInterval(id);
  }, [level?.id, restartKey, running]);

  // Compute play area
  const headerH = ms(70);
  const adH     = ms(64);
  const playArea = useMemo(
    () => ({
      width,
      height: Math.max(220, height - headerH - adH - insets.top - insets.bottom),
    }),
    [width, height, headerH, adH, insets.top, insets.bottom]
  );

  const buttonSize = Math.min(buttonBase, Math.min(playArea.width, playArea.height) * 0.45);

  if (!level) return null;

  const onComplete = async () => {
    if (!running || success || failure) return;
    setRunning(false);
    const elapsed = (Date.now() - startTime.current) / 1000;
    haptics.success();
    sounds.play('success');
    await completeLevel(level.id, elapsed);
    setSuccess(true);
  };

  const onFail = (reason) => {
    if (!running || success || failure) return;
    setRunning(false);
    haptics.error();
    sounds.play('fail');
    setFailure(reason || 'default');
    failLevel();
  };

  const onTapHit = () => {
    // any extra effects fire from inside mechanics
  };

  const handleRetry = () => {
    setRestartKey((k) => k + 1);
  };
  const handleNext = () => {
    setSuccess(false);
    if (level.id < TOTAL_LEVELS) {
      goToNextLevel();
    }
  };
  const handleMenu = () => {
    setSuccess(false);
    setFailure(null);
    onOpenMenu?.();
  };

  const elapsed = (Date.now() - startTime.current) / 1000;
  const isLast = level.id === TOTAL_LEVELS;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradients.bg}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
      <BackgroundParticles count={isTablet ? 18 : 12} hue="mixed" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header: hamburger + level pill + timer */}
        <View style={[styles.header, { height: headerH, paddingHorizontal: ms(12) }]}>
          <HamburgerButton onPress={onOpenMenu} />
          <View style={[styles.levelPill, { paddingHorizontal: ms(14), paddingVertical: ms(5), borderRadius: ms(20) }]}>
            <Text style={[styles.levelText, { fontSize: fs(13) }]}>
              {level.isBoss ? `★ BOSS · ${currentLevel}/${TOTAL_LEVELS}` : `LEVEL ${currentLevel}/${TOTAL_LEVELS}`}
            </Text>
            <Text style={[styles.levelName, { fontSize: fs(15) }]}>{level.name}</Text>
          </View>
          <View style={{ width: ms(46), height: ms(46) }} />
        </View>

        <TimerBar total={level.timer || 30} remaining={remaining} running={running} />

        {/* Play area */}
        <View
          style={[styles.playArea, { width: playArea.width, height: playArea.height }]}
          pointerEvents="box-none"
        >
          {level.mechanic === 'boss' ? (
            <BossFight
              key={`boss-${level.id}-${restartKey}`}
              boss={getBoss(level.params.bossId)}
              playArea={playArea}
              buttonSize={buttonSize}
              running={running}
              onTapHit={onTapHit}
              onComplete={onComplete}
              onFail={onFail}
              onPhaseChange={(idx) => {
                haptics.warning();
                sounds.play('whoosh');
              }}
            />
          ) : (
            <MechanicRunner
              key={`mech-${level.id}-${restartKey}`}
              mechanic={level.mechanic}
              params={level.params}
              playArea={playArea}
              buttonSize={buttonSize}
              running={running}
              onTapHit={onTapHit}
              onComplete={onComplete}
              onFail={onFail}
            />
          )}
        </View>

        <AdBanner position="bottom" />
      </SafeAreaView>

      <SuccessModal
        visible={success}
        levelNumber={level.id}
        levelName={level.name}
        timeSeconds={(level.timer || 30) - remaining}
        isBoss={!!level.isBoss}
        isFinalLevel={isLast}
        onNext={handleNext}
        onReplay={handleRetry}
        onMenu={handleMenu}
      />

      <FailureModal
        visible={!!failure}
        reason={failure}
        levelNumber={level.id}
        levelName={level.name}
        timeSeconds={(level.timer || 30) - remaining}
        onRetry={handleRetry}
        onMenu={handleMenu}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelPill: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: '70%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  levelText: {
    color: colors.inkSoft,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  levelName: {
    color: colors.ink,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  playArea: {
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    marginVertical: 6,
  },
});
