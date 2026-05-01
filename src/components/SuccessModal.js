import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import useResponsive from '../hooks/useResponsive';
import { colors, gradients } from '../theme/colors';
import Confetti from './Confetti';

/**
 * Cartoon success modal – bouncy spring entrance, confetti burst, big buttons.
 */
export default function SuccessModal({
  visible,
  levelNumber,
  levelName,
  timeSeconds,
  isBoss,
  isFinalLevel,
  onNext,
  onReplay,
  onMenu,
}) {
  const { ms, fs } = useResponsive();
  const scale = useSharedValue(0);
  const titlePop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 11, stiffness: 130, mass: 0.8 });
      titlePop.value = withDelay(140,
        withSequence(
          withSpring(1.18, { damping: 8, stiffness: 200 }),
          withSpring(1.0,  { damping: 9, stiffness: 200 }),
        )
      );
    } else {
      scale.value = 0;
      titlePop.value = 0;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${(1 - scale.value) * -8}deg` }],
    opacity: scale.value,
  }));
  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titlePop.value || 1 }],
  }));

  const heading = isFinalLevel
    ? 'YOU WIN!'
    : isBoss
      ? 'BOSS DOWN!'
      : 'NICE TAP!';

  const sub = isFinalLevel
    ? 'You beat the Crimson Tyrant. Legend.'
    : isBoss
      ? 'Phase complete.'
      : `Level ${levelNumber} cleared.`;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Confetti active={visible} count={50} />

        <Animated.View
          style={[
            styles.card,
            cardStyle,
            { padding: ms(20), width: Math.min(440, ms(360)), borderRadius: ms(28) },
          ]}
        >
          <LinearGradient
            colors={gradients.success}
            style={[StyleSheet.absoluteFill, { borderRadius: ms(28) }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />

          <Animated.Text
            style={[
              styles.title,
              { fontSize: fs(isFinalLevel ? 38 : 32) },
              titleStyle,
            ]}
          >
            {heading}
          </Animated.Text>

          <Text style={[styles.sub, { fontSize: fs(15), marginTop: ms(4) }]}>{sub}</Text>

          {!!levelName && (
            <View style={[styles.namePill, { paddingHorizontal: ms(12), paddingVertical: ms(6), marginTop: ms(14), borderRadius: ms(20) }]}>
              <Text style={[styles.nameText, { fontSize: fs(13) }]}>{levelName}</Text>
            </View>
          )}

          {timeSeconds !== undefined && timeSeconds !== null && (
            <View style={[styles.timeRow, { marginTop: ms(16) }]}>
              <Text style={[styles.timeLabel, { fontSize: fs(12) }]}>YOUR TIME</Text>
              <Text style={[styles.timeValue, { fontSize: fs(34) }]}>
                {timeSeconds.toFixed(2)}s
              </Text>
            </View>
          )}

          <View style={[styles.btnCol, { marginTop: ms(20), gap: ms(10) }]}>
            {!isFinalLevel && (
              <BigBtn
                label="NEXT LEVEL ▶"
                onPress={onNext}
                fs={fs} ms={ms}
                bg={colors.yellow}
                color={colors.ink}
              />
            )}
            <BigBtn label="PLAY AGAIN" onPress={onReplay} fs={fs} ms={ms} bg={colors.white} color={colors.ink} />
            <BigBtn label="MENU" onPress={onMenu} fs={fs} ms={ms} bg={colors.purple} color={colors.white} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function BigBtn({ label, onPress, fs, ms, bg, color }) {
  const press = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.04 * press.value }],
  }));
  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (press.value = withTiming(1, { duration: 80 }))}
        onPressOut={() => (press.value = withTiming(0, { duration: 120 }))}
        style={[
          styles.bigBtn,
          {
            paddingVertical: ms(14),
            borderRadius: ms(16),
            backgroundColor: bg,
          },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.ink,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 20,
  },
  title: {
    color: colors.white,
    fontWeight: '900',
    letterSpacing: 1.6,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.30)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  sub: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '700',
    textAlign: 'center',
  },
  namePill: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  nameText: { color: colors.ink, fontWeight: '900', letterSpacing: 1 },

  timeRow: { alignItems: 'center' },
  timeLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  timeValue: {
    color: colors.white,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.30)',
    textShadowOffset: { width: 0, height: 3 },
  },

  btnCol: { width: '100%' },
  bigBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  bigBtnText: { fontWeight: '900', letterSpacing: 1.2 },
});
