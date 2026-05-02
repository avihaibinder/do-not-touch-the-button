import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import Logo from '../components/Logo';
import BackgroundParticles from '../components/BackgroundParticles';
import useResponsive from '../hooks/useResponsive';
import { colors, gradients } from '../theme/colors';

export default function LoadingScreen() {
  const { ms, fs, isTablet, width, height } = useResponsive();

  // Logo intro animations
  const drop = useSharedValue(0);
  const wobble = useSharedValue(0);
  const dotsT = useSharedValue(0);
  const titleT = useSharedValue(0);

  useEffect(() => {
    drop.value = withSpring(1, { damping: 9, stiffness: 130 });
    wobble.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming( 1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(-1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false
      )
    );
    dotsT.value = withDelay(
      300,
      withRepeat(withTiming(1, { duration: 1200, easing: Easing.linear }), -1, false)
    );
    titleT.value = withDelay(150, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -120 + 120 * drop.value },
      { rotate: `${wobble.value * 4}deg` },
      { scale: 0.6 + 0.4 * drop.value },
    ],
    opacity: drop.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleT.value,
    transform: [{ translateY: 14 - 14 * titleT.value }],
  }));

  const logoSize = Math.min(width, height) * (isTablet ? 0.42 : 0.55);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradients.bg}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
      <BackgroundParticles count={isTablet ? 22 : 16} hue="mixed" />

      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <Logo size={logoSize} expression="wink" showText={false} />
        </Animated.View>

        <Animated.View style={[styles.titleWrap, { marginTop: ms(18) }, titleStyle]}>
          <Text style={[styles.title, { fontSize: fs(32) }]}>DO NOT</Text>
          <Text style={[styles.titleAccent, { fontSize: fs(48) }]}>CLICK</Text>
          <Text style={[styles.titleSub, { fontSize: fs(20), marginTop: ms(2) }]}>
            THE BUTTON
          </Text>
        </Animated.View>

        <Dots t={dotsT} ms={ms} />

        <Text style={[styles.tip, { fontSize: fs(12), marginTop: ms(28) }]}>
          (you’re going to want to click it)
        </Text>
      </View>
    </View>
  );
}

interface DotsProps {
  t: SharedValue<number>;
  ms: (n: number) => number;
}

function Dots({ t, ms }: DotsProps) {
  const a = useAnimatedStyle(() => ({ opacity: 0.2 + 0.8 * Math.max(0, Math.sin((t.value + 0.0)  * Math.PI * 2)) }));
  const b = useAnimatedStyle(() => ({ opacity: 0.2 + 0.8 * Math.max(0, Math.sin((t.value + 0.33) * Math.PI * 2)) }));
  const c = useAnimatedStyle(() => ({ opacity: 0.2 + 0.8 * Math.max(0, Math.sin((t.value + 0.66) * Math.PI * 2)) }));
  return (
    <View style={[styles.dots, { marginTop: ms(20), gap: ms(10) }]}>
      <Animated.View style={[styles.dot, { width: ms(14), height: ms(14), borderRadius: ms(14) }, a]} />
      <Animated.View style={[styles.dot, { width: ms(14), height: ms(14), borderRadius: ms(14) }, b]} />
      <Animated.View style={[styles.dot, { width: ms(14), height: ms(14), borderRadius: ms(14) }, c]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  titleWrap: { alignItems: 'center' },
  title: {
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 4,
  },
  titleAccent: {
    fontWeight: '900',
    color: colors.red,
    letterSpacing: 5,
    marginTop: -8,
    textShadowColor: 'rgba(26,26,46,0.20)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },
  titleSub: {
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 6,
  },
  dots: { flexDirection: 'row' },
  dot: { backgroundColor: colors.red, borderWidth: 2, borderColor: colors.ink },
  tip: {
    color: colors.inkSoft,
    fontStyle: 'italic',
    fontWeight: '700',
  },
});
