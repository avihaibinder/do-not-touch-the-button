import { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HamburgerButton } from '../components/HamburgerMenu';
import TimerBar from '../components/TimerBar';
import AdBanner from '../components/AdBanner';
import MechanicRunner from '../levels/MechanicRunner';
import BossFight from '../bosses/BossFight';
import SuccessModal from '../components/SuccessModal';
import FailureModal from '../components/FailureModal';
import InfoModal, { InfoButton } from '../components/InfoModal';
import BackgroundParticles from '../components/BackgroundParticles';

import useResponsive from '../hooks/useResponsive';
import useHaptics from '../hooks/useHaptics';
import useSounds from '../hooks/useSounds';
import { useGame } from '../context/GameContext';
import { getBoss } from '../bosses/bossConfigs';
import { TOTAL_LEVELS } from '../levels/levelConfigs';
import { colors, gradients } from '../theme/colors';
import type { FailReason } from '../types';

export interface LevelScreenProps {
  onOpenMenu?: () => void;
}

/**
 * Single screen that plays one level (regular or boss). The hamburger menu is
 * mounted by GameContainer.
 *
 * Level 1 is rendered as the "Main Page": no timer, no level pill, big
 * splash-style title, and on tap it auto-advances to level 2 without a
 * SuccessModal interruption.
 */
export default function LevelScreen({ onOpenMenu }: LevelScreenProps) {
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
  } = useGame();

  const [running, setRunning] = useState(true);
  const [remaining, setRemaining] = useState(level?.timer || 30);
  const [success, setSuccess] = useState(false);
  const [failure, setFailure] = useState<FailReason | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);

  const startTime = useRef(Date.now());
  const elapsedRef = useRef(0);

  const noTimer = !!level?.noTimer;
  const autoAdvance = !!level?.autoAdvance;
  const isMainPage = level?.id === 1;

  // Opening the info modal pauses gameplay and the countdown.
  const playing = running && !infoOpen;

  // Reset whenever the active level changes.
  useEffect(() => {
    setRunning(true);
    setRemaining(level?.timer || 30);
    setSuccess(false);
    setFailure(null);
    startTime.current = Date.now();
    elapsedRef.current = 0;
  }, [level?.id, restartKey]);

  // Timer countdown — skipped for noTimer levels and paused while the info
  // modal is open. elapsedRef carries play time across pauses so the
  // countdown resumes where it left off instead of restarting.
  useEffect(() => {
    if (!playing || noTimer) return;
    const total = level?.timer || 30;
    const wallStart = Date.now();
    const baseElapsed = elapsedRef.current;
    const id = setInterval(() => {
      const elapsed = baseElapsed + (Date.now() - wallStart) / 1000;
      elapsedRef.current = elapsed;
      const left = Math.max(0, total - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        setRunning(false);
        haptics.error();
        // FailureModal plays the fail/whoosh stinger when it becomes visible.
        setFailure('timeout');
        failLevel();
      }
    }, 100);
    return () => {
      elapsedRef.current = baseElapsed + (Date.now() - wallStart) / 1000;
      clearInterval(id);
    };
  }, [level?.id, restartKey, playing, noTimer]);

  // Compute play area
  const headerH = isMainPage ? ms(40) : ms(70);
  const adH     = ms(64);
  // Level 1's splash title sits above the play area; reserve room for it so
  // the AdBanner stays on-screen.
  const titleH  = isMainPage ? ms(150) : 0;
  const playArea = useMemo(
    () => ({
      width,
      height: Math.max(200, height - headerH - adH - titleH - insets.top - insets.bottom),
    }),
    [width, height, headerH, adH, titleH, insets.top, insets.bottom]
  );

  const buttonSize = Math.min(buttonBase, Math.min(playArea.width, playArea.height) * 0.45);

  if (!level) return null;

  const onComplete = async () => {
    if (!running || success || failure) return;
    setRunning(false);
    const elapsed = (Date.now() - startTime.current) / 1000;
    haptics.success();
    await completeLevel(level.id, elapsed);
    if (autoAdvance && level.id < TOTAL_LEVELS) {
      // Skip the success modal — go straight into the next level.
      // Play a short pop here so the auto-advance still has audio feedback,
      // since the SuccessModal (which now owns the win stinger) is skipped.
      sounds.play('pop');
      goToNextLevel();
      return;
    }
    // SuccessModal plays the success/bossWin stinger when it becomes visible.
    setSuccess(true);
  };

  const onFail = (reason: FailReason) => {
    if (!running || success || failure) return;
    setRunning(false);
    haptics.error();
    // FailureModal plays the fail/whoosh stinger when it becomes visible.
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
        {/* Header: hamburger + level pill + info button */}
        <View style={[styles.header, { height: headerH, paddingHorizontal: ms(12) }]}>
          <HamburgerButton onPress={onOpenMenu} />
          {!isMainPage && (
            <View style={[styles.levelPill, { paddingHorizontal: ms(14), paddingVertical: ms(5), borderRadius: ms(20) }]}>
              <Text style={[styles.levelText, { fontSize: fs(13) }]}>
                {level.isBoss ? `★ BOSS · ${currentLevel}/${TOTAL_LEVELS}` : `LEVEL ${currentLevel}/${TOTAL_LEVELS}`}
              </Text>
              <Text style={[styles.levelName, { fontSize: fs(15) }]}>{level.name}</Text>
            </View>
          )}
          {!isMainPage ? (
            <InfoButton onPress={() => setInfoOpen(true)} />
          ) : (
            <View style={{ width: ms(46), height: ms(46) }} />
          )}
        </View>

        {!noTimer && (
          <TimerBar total={level.timer || 30} remaining={remaining} running={playing} />
        )}

        {isMainPage && (
          <MainPageTitle ms={ms} fs={fs} tagline={level.tagline} />
        )}

        {/* Play area */}
        <View
          style={[styles.playArea, { width: playArea.width, height: playArea.height }]}
          pointerEvents="box-none"
        >
          {level.mechanic === 'boss' ? (
            (() => {
              const boss = getBoss(level.params.bossId);
              return boss ? (
                <BossFight
                  key={`boss-${level.id}-${restartKey}`}
                  boss={boss}
                  playArea={playArea}
                  buttonSize={buttonSize}
                  running={playing}
                  onTapHit={onTapHit}
                  onComplete={onComplete}
                  onFail={onFail}
                  onPhaseChange={() => {
                    haptics.warning();
                    sounds.play('whoosh');
                  }}
                />
              ) : null;
            })()
          ) : (
            <MechanicRunner
              key={`mech-${level.id}-${restartKey}`}
              mechanic={level.mechanic}
              params={level.params}
              playArea={playArea}
              buttonSize={buttonSize}
              running={playing}
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

      <InfoModal
        visible={infoOpen}
        level={level}
        onClose={() => setInfoOpen(false)}
      />
    </View>
  );
}

interface MainPageTitleProps {
  ms: (n: number) => number;
  fs: (n: number) => number;
  tagline?: string;
}

/**
 * Splash-style heading for level 1 (the "Main Page"). Mirrors the look of
 * the boot LoadingScreen so the transition feels seamless.
 */
function MainPageTitle({ ms, fs, tagline }: MainPageTitleProps) {
  const t = useSharedValue(0);
  const dotsT = useSharedValue(0);

  useEffect(() => {
    t.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    dotsT.value = withDelay(
      300,
      withRepeat(withTiming(1, { duration: 1200, easing: Easing.linear }), -1, false)
    );
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: 14 - 14 * t.value }],
  }));

  return (
    <View style={styles.mainTitleWrap} pointerEvents="none">
      <Animated.View style={[styles.titleStack, titleStyle]}>
        <Text style={[styles.mainTitleTop, { fontSize: fs(28) }]}>DO NOT</Text>
        <Text style={[styles.mainTitleAccent, { fontSize: fs(42) }]}>CLICK</Text>
        <Text style={[styles.mainTitleSub, { fontSize: fs(18) }]}>THE BUTTON</Text>
      </Animated.View>
      <Dots t={dotsT} ms={ms} />
      {!!tagline && (
        <Text style={[styles.mainTagline, { fontSize: fs(12), marginTop: ms(10) }]}>
          {tagline.toLowerCase() === 'tap to start' ? '(tap to start)' : tagline}
        </Text>
      )}
    </View>
  );
}

interface DotsProps {
  t: SharedValue<number>;
  ms: (n: number) => number;
}

function Dots({ t, ms }: DotsProps) {
  const a = useAnimatedStyle(() => ({
    opacity: 0.2 + 0.8 * Math.max(0, Math.sin((t.value + 0.0)  * Math.PI * 2)),
  }));
  const b = useAnimatedStyle(() => ({
    opacity: 0.2 + 0.8 * Math.max(0, Math.sin((t.value + 0.33) * Math.PI * 2)),
  }));
  const c = useAnimatedStyle(() => ({
    opacity: 0.2 + 0.8 * Math.max(0, Math.sin((t.value + 0.66) * Math.PI * 2)),
  }));
  return (
    <View style={[styles.dotsRow, { marginTop: ms(10), gap: ms(8) }]}>
      <Animated.View style={[styles.dot, { width: ms(10), height: ms(10), borderRadius: ms(10) }, a]} />
      <Animated.View style={[styles.dot, { width: ms(10), height: ms(10), borderRadius: ms(10) }, b]} />
      <Animated.View style={[styles.dot, { width: ms(10), height: ms(10), borderRadius: ms(10) }, c]} />
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

  mainTitleWrap: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 4,
  },
  titleStack: { alignItems: 'center' },
  mainTitleTop: {
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 4,
  },
  mainTitleAccent: {
    fontWeight: '900',
    color: colors.red,
    letterSpacing: 5,
    marginTop: -6,
    textShadowColor: 'rgba(26,26,46,0.20)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },
  mainTitleSub: {
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 6,
  },
  mainTagline: {
    color: colors.inkSoft,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  dotsRow: { flexDirection: 'row' },
  dot: {
    backgroundColor: colors.red,
    borderWidth: 2,
    borderColor: colors.ink,
  },
});
