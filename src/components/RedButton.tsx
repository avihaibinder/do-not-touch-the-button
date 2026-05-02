import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Circle,
  Ellipse,
  G,
  Path,
} from 'react-native-svg';
import { colors } from '../theme/colors';
import type { Expression } from '../types';

export interface RedButtonProps {
  size?: number;
  expression?: Expression;
  colorOverride?: string;
  accentOverride?: string;
  /** Skip the punch-in shake & hurt-face flash on tap */
  suppressHurt?: boolean;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  /** When true, render as a decoy with X-eyes (no hurt animation) */
  fake?: boolean;
}

/**
 * Visual button. Renders the cartoon red button face at a given size & expression.
 * Supports tap and long-press from the parent.
 */
export default function RedButton({
  size = 180,
  expression = 'grin',
  colorOverride,
  accentOverride,
  suppressHurt = false,
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  delayLongPress = 800,
  fake = false,
}: RedButtonProps) {
  const press = useSharedValue(0);
  const hit = useSharedValue(0);
  const [hurt, setHurt] = useState(false);
  const hurtTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Eye openness drives idle blinks and the slow wake-up.
  // 1 = fully open, 0 = fully closed.
  const [eyeOpenness, setEyeOpenness] = useState(expression === 'sleeping' ? 0 : 1);
  const prevExpressionRef = useRef<Expression>(expression);
  const wakeAnimRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Slow eye-opening when transitioning out of 'sleeping'.
  useEffect(() => {
    const prev = prevExpressionRef.current;
    prevExpressionRef.current = expression;

    if (wakeAnimRef.current) {
      clearTimeout(wakeAnimRef.current);
      wakeAnimRef.current = null;
    }

    if (prev === 'sleeping' && expression !== 'sleeping') {
      const seq = [0, 0.25, 0.5, 0.75, 1];
      const stepMs = 130;
      let i = 0;
      const tick = () => {
        setEyeOpenness(seq[i]);
        i += 1;
        if (i < seq.length) {
          wakeAnimRef.current = setTimeout(tick, stepMs);
        }
      };
      tick();
    } else if (expression === 'sleeping') {
      setEyeOpenness(0);
    } else {
      setEyeOpenness(1);
    }

    return () => {
      if (wakeAnimRef.current) {
        clearTimeout(wakeAnimRef.current);
        wakeAnimRef.current = null;
      }
    };
  }, [expression]);

  // Occasional natural blink while idle and awake.
  useEffect(() => {
    if (expression !== 'grin' && expression !== 'happy') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const blink = () => {
      const frames = [0.4, 0, 0.4, 1];
      let i = 0;
      const tick = () => {
        if (cancelled) return;
        setEyeOpenness(frames[i]);
        i += 1;
        if (i < frames.length) {
          timer = setTimeout(tick, 60);
        } else {
          schedule();
        }
      };
      tick();
    };

    const schedule = () => {
      if (cancelled) return;
      const delay = 2500 + Math.random() * 4000;
      timer = setTimeout(blink, delay);
    };

    schedule();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [expression]);

  const style = useAnimatedStyle(() => ({
    transform: [
      // press: gentle squish while finger is down
      // hit: brief, bigger "ouch" punch right after release
      { scale: 1 - 0.06 * press.value - 0.18 * hit.value },
    ],
  }));

  const handleIn = () => {
    press.value = withSpring(1, { damping: 10, stiffness: 280 });
    onPressIn?.();
  };
  const handleOut = () => {
    press.value = withSpring(0, { damping: 10, stiffness: 220 });
    onPressOut?.();
  };
  const handlePress = () => {
    if (!suppressHurt) {
      // Punch-in: scale dips fast, then springs back. Show a "hurt" face for a beat.
      hit.value = withSequence(
        withTiming(1, { duration: 80 }),
        withSpring(0, { damping: 6, stiffness: 220 }),
      );
      setHurt(true);
      if (hurtTimer.current) clearTimeout(hurtTimer.current);
      hurtTimer.current = setTimeout(() => setHurt(false), 220);
    }
    onPress?.();
  };

  const shownExpression: Expression = hurt && !fake ? 'hurt' : expression;

  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handleIn}
        onPressOut={handleOut}
        onLongPress={onLongPress}
        delayLongPress={delayLongPress}
        style={[styles.fill, { borderRadius: size / 2 }]}
        android_ripple={null}
      >
        <ButtonSvg
          size={size}
          expression={shownExpression}
          colorOverride={colorOverride}
          accentOverride={accentOverride}
          fake={fake}
          eyeOpenness={eyeOpenness}
        />
      </Pressable>
    </Animated.View>
  );
}

interface ButtonSvgProps {
  size: number;
  expression: Expression;
  colorOverride?: string;
  accentOverride?: string;
  fake: boolean;
  eyeOpenness?: number;
}

function ButtonSvg({ size, expression, colorOverride, accentOverride, fake, eyeOpenness = 1 }: ButtonSvgProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.42;
  const rim = s * 0.05;

  const baseColor = colorOverride || colors.red;
  const lightColor = lighten(baseColor, 0.30);
  const darkColor = darken(baseColor, 0.45);

  return (
    <Svg width={s} height={s}>
      <Defs>
        <RadialGradient id={`body-${baseColor}`} cx="50%" cy="38%" r="60%">
          <Stop offset="0%" stopColor={lightColor} />
          <Stop offset="55%" stopColor={baseColor} />
          <Stop offset="100%" stopColor={darken(baseColor, 0.20)} />
        </RadialGradient>
        <LinearGradient id={`rim-${baseColor}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={darkColor} />
          <Stop offset="100%" stopColor={darken(baseColor, 0.65)} />
        </LinearGradient>
        <RadialGradient id="shine" cx="35%" cy="28%" r="35%">
          <Stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </RadialGradient>
      </Defs>

      <Ellipse cx={cx} cy={cy + r + rim * 1.5} rx={r * 0.95} ry={r * 0.16} fill="rgba(26,26,46,0.18)" />

      <Circle cx={cx} cy={cy + rim * 1.0} r={r + rim} fill={`url(#rim-${baseColor})`} />
      <Circle cx={cx} cy={cy + rim * 0.4} r={r + rim * 0.6} fill={darken(baseColor, 0.55)} />

      <Circle cx={cx} cy={cy} r={r} fill={`url(#body-${baseColor})`} />

      <Ellipse
        cx={cx - r * 0.28}
        cy={cy - r * 0.34}
        rx={r * 0.45}
        ry={r * 0.22}
        fill="url(#shine)"
      />

      {!fake && <Face cx={cx} cy={cy} r={r} expression={expression} eyeOpenness={eyeOpenness} />}
      {fake && <FakeFace cx={cx} cy={cy} r={r} />}

      {accentOverride && (
        <Circle
          cx={cx + r * 0.55} cy={cy - r * 0.55}
          r={r * 0.10} fill={accentOverride}
          stroke={colors.ink} strokeWidth={s * 0.012}
        />
      )}
    </Svg>
  );
}

function FakeFace({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  // Decoy variant — slightly different look so observant players can spot it.
  // We give it X-eyes so it looks subtly off.
  const eyeXOff = r * 0.32;
  const eyeY = cy - r * 0.10;
  const eyeR = r * 0.10;
  return (
    <G>
      <Path
        d={`M ${cx - eyeXOff - eyeR} ${eyeY - eyeR} L ${cx - eyeXOff + eyeR} ${eyeY + eyeR}
            M ${cx - eyeXOff + eyeR} ${eyeY - eyeR} L ${cx - eyeXOff - eyeR} ${eyeY + eyeR}`}
        stroke="#1A1A2E" strokeWidth={r * 0.06} strokeLinecap="round"
      />
      <Path
        d={`M ${cx + eyeXOff - eyeR} ${eyeY - eyeR} L ${cx + eyeXOff + eyeR} ${eyeY + eyeR}
            M ${cx + eyeXOff + eyeR} ${eyeY - eyeR} L ${cx + eyeXOff - eyeR} ${eyeY + eyeR}`}
        stroke="#1A1A2E" strokeWidth={r * 0.06} strokeLinecap="round"
      />
      <Path
        d={`M ${cx - r * 0.25} ${cy + r * 0.30} Q ${cx} ${cy + r * 0.18} ${cx + r * 0.25} ${cy + r * 0.30}`}
        stroke="#1A1A2E" strokeWidth={r * 0.05} strokeLinecap="round" fill="none"
      />
    </G>
  );
}

interface FaceProps {
  cx: number;
  cy: number;
  r: number;
  expression: Expression;
  eyeOpenness?: number;
}

function Face({ cx, cy, r, expression, eyeOpenness = 1 }: FaceProps) {
  const eyeY = cy - r * 0.10;
  const eyeXOff = r * 0.32;
  const eyeR = r * 0.10;

  // Eye that follows the openness value (1 = open, 0 = closed).
  // Used for grin/happy so the button can blink and slowly open after waking.
  const renderOpenEye = (eyeCx: number) => {
    if (eyeOpenness >= 0.85) {
      return (
        <G>
          <Circle cx={eyeCx} cy={eyeY} r={eyeR} fill="#1A1A2E" />
          <Circle cx={eyeCx + eyeR * 0.35} cy={eyeY - eyeR * 0.3} r={eyeR * 0.35} fill="#FFFFFF" />
        </G>
      );
    }
    if (eyeOpenness > 0.15) {
      return (
        <Ellipse
          cx={eyeCx}
          cy={eyeY}
          rx={eyeR}
          ry={Math.max(eyeR * eyeOpenness, eyeR * 0.05)}
          fill="#1A1A2E"
        />
      );
    }
    return (
      <Path
        d={`M ${eyeCx - eyeR} ${eyeY + eyeR * 0.05} Q ${eyeCx} ${eyeY + eyeR * 0.55} ${eyeCx + eyeR} ${eyeY + eyeR * 0.05}`}
        stroke="#1A1A2E" strokeWidth={r * 0.07} strokeLinecap="round" fill="none"
      />
    );
  };

  const leftEye = (
    <G>
      <Circle cx={cx - eyeXOff} cy={eyeY} r={eyeR} fill="#1A1A2E" />
      <Circle cx={cx - eyeXOff + eyeR * 0.35} cy={eyeY - eyeR * 0.3} r={eyeR * 0.35} fill="#FFFFFF" />
    </G>
  );
  const rightEye = (
    <G>
      <Circle cx={cx + eyeXOff} cy={eyeY} r={eyeR} fill="#1A1A2E" />
      <Circle cx={cx + eyeXOff + eyeR * 0.35} cy={eyeY - eyeR * 0.3} r={eyeR * 0.35} fill="#FFFFFF" />
    </G>
  );
  const wink = (
    <Path
      d={`M ${cx + eyeXOff - eyeR} ${eyeY} Q ${cx + eyeXOff} ${eyeY - eyeR * 0.6} ${cx + eyeXOff + eyeR} ${eyeY}`}
      stroke="#1A1A2E" strokeWidth={r * 0.05} strokeLinecap="round" fill="none"
    />
  );
  const browL = (
    <Path d={`M ${cx - eyeXOff - eyeR} ${eyeY - eyeR * 1.3} Q ${cx - eyeXOff} ${eyeY - eyeR * 2.0} ${cx - eyeXOff + eyeR} ${eyeY - eyeR * 1.0}`}
      stroke="#1A1A2E" strokeWidth={r * 0.06} strokeLinecap="round" fill="none" />
  );
  const browR = (
    <Path d={`M ${cx + eyeXOff - eyeR} ${eyeY - eyeR * 1.0} Q ${cx + eyeXOff} ${eyeY - eyeR * 2.0} ${cx + eyeXOff + eyeR} ${eyeY - eyeR * 1.3}`}
      stroke="#1A1A2E" strokeWidth={r * 0.06} strokeLinecap="round" fill="none" />
  );
  const evilL = (
    <Path d={`M ${cx - eyeXOff - eyeR} ${eyeY - eyeR * 1.6} L ${cx - eyeXOff + eyeR} ${eyeY - eyeR * 0.8}`}
      stroke="#1A1A2E" strokeWidth={r * 0.07} strokeLinecap="round" />
  );
  const evilR = (
    <Path d={`M ${cx + eyeXOff - eyeR} ${eyeY - eyeR * 0.8} L ${cx + eyeXOff + eyeR} ${eyeY - eyeR * 1.6}`}
      stroke="#1A1A2E" strokeWidth={r * 0.07} strokeLinecap="round" />
  );

  // "hurt" — squeezed-shut eyes (^^), angry V brows, downturned grimace, sweat drop.
  const hurtBrowL = (
    <Path d={`M ${cx - eyeXOff - eyeR * 1.1} ${eyeY - eyeR * 0.6} L ${cx - eyeXOff + eyeR * 1.1} ${eyeY - eyeR * 1.6}`}
      stroke="#1A1A2E" strokeWidth={r * 0.08} strokeLinecap="round" />
  );
  const hurtBrowR = (
    <Path d={`M ${cx + eyeXOff - eyeR * 1.1} ${eyeY - eyeR * 1.6} L ${cx + eyeXOff + eyeR * 1.1} ${eyeY - eyeR * 0.6}`}
      stroke="#1A1A2E" strokeWidth={r * 0.08} strokeLinecap="round" />
  );
  const hurtEyeL = (
    <Path
      d={`M ${cx - eyeXOff - eyeR} ${eyeY + eyeR * 0.2} Q ${cx - eyeXOff} ${eyeY - eyeR * 0.7} ${cx - eyeXOff + eyeR} ${eyeY + eyeR * 0.2}`}
      stroke="#1A1A2E" strokeWidth={r * 0.07} strokeLinecap="round" fill="none"
    />
  );
  const hurtEyeR = (
    <Path
      d={`M ${cx + eyeXOff - eyeR} ${eyeY + eyeR * 0.2} Q ${cx + eyeXOff} ${eyeY - eyeR * 0.7} ${cx + eyeXOff + eyeR} ${eyeY + eyeR * 0.2}`}
      stroke="#1A1A2E" strokeWidth={r * 0.07} strokeLinecap="round" fill="none"
    />
  );
  const hurtMouth = (
    <Path
      d={`M ${cx - r * 0.28} ${cy + r * 0.36}
          Q ${cx} ${cy + r * 0.18} ${cx + r * 0.28} ${cy + r * 0.36}`}
      stroke="#1A1A2E" strokeWidth={r * 0.07} strokeLinecap="round" fill="none"
    />
  );
  const sweatDrop = (
    <Path
      d={`M ${cx + r * 0.62} ${cy - r * 0.40}
          q ${-r * 0.06} ${r * 0.10} 0 ${r * 0.18}
          q ${r * 0.06} ${-r * 0.08} 0 ${-r * 0.18} Z`}
      fill="#4ECDC4" stroke="#1A1A2E" strokeWidth={r * 0.025}
    />
  );

  // "sleeping" — peaceful closed eyelids drawn as gentle ‿ arcs, soft mouth.
  const sleepEyeL = (
    <Path
      d={`M ${cx - eyeXOff - eyeR} ${eyeY + eyeR * 0.05} Q ${cx - eyeXOff} ${eyeY + eyeR * 0.55} ${cx - eyeXOff + eyeR} ${eyeY + eyeR * 0.05}`}
      stroke="#1A1A2E" strokeWidth={r * 0.07} strokeLinecap="round" fill="none"
    />
  );
  const sleepEyeR = (
    <Path
      d={`M ${cx + eyeXOff - eyeR} ${eyeY + eyeR * 0.05} Q ${cx + eyeXOff} ${eyeY + eyeR * 0.55} ${cx + eyeXOff + eyeR} ${eyeY + eyeR * 0.05}`}
      stroke="#1A1A2E" strokeWidth={r * 0.07} strokeLinecap="round" fill="none"
    />
  );
  const sleepMouth = (
    <Path
      d={`M ${cx - r * 0.16} ${cy + r * 0.32} Q ${cx} ${cy + r * 0.40} ${cx + r * 0.16} ${cy + r * 0.32}`}
      stroke="#1A1A2E" strokeWidth={r * 0.05} strokeLinecap="round" fill="none"
    />
  );

  const mouthGrin = (
    <Path
      d={`M ${cx - r * 0.32} ${cy + r * 0.20}
          Q ${cx} ${cy + r * 0.55} ${cx + r * 0.32} ${cy + r * 0.20}
          Q ${cx} ${cy + r * 0.42} ${cx - r * 0.32} ${cy + r * 0.20} Z`}
      fill="#1A1A2E"
    />
  );
  const mouthShock = <Ellipse cx={cx} cy={cy + r * 0.30} rx={r * 0.14} ry={r * 0.18} fill="#1A1A2E" />;
  const mouthEvil = (
    <Path d={`M ${cx - r * 0.34} ${cy + r * 0.32} Q ${cx} ${cy + r * 0.10} ${cx + r * 0.34} ${cy + r * 0.32}`}
      stroke="#1A1A2E" strokeWidth={r * 0.06} strokeLinecap="round" fill="none" />
  );
  const mouthHappy = (
    <Path d={`M ${cx - r * 0.30} ${cy + r * 0.22} Q ${cx} ${cy + r * 0.50} ${cx + r * 0.30} ${cy + r * 0.22}`}
      stroke="#1A1A2E" strokeWidth={r * 0.06} strokeLinecap="round" fill="none" />
  );

  let brows: React.ReactNode = (<>{browL}{browR}</>);
  let mouth: React.ReactNode = mouthGrin;
  let leftE: React.ReactNode = leftEye;
  let rightE: React.ReactNode = rightEye;
  let extras: React.ReactNode = null;

  if (expression === 'wink')  { rightE = wink; }
  if (expression === 'shock') { mouth = mouthShock; }
  if (expression === 'evil')  { brows = (<>{evilL}{evilR}</>); mouth = mouthEvil; }
  if (expression === 'happy') { mouth = mouthHappy; }
  if (expression === 'hurt')  {
    brows = (<>{hurtBrowL}{hurtBrowR}</>);
    leftE = hurtEyeL;
    rightE = hurtEyeR;
    mouth = hurtMouth;
    extras = sweatDrop;
  }
  if (expression === 'sleeping') {
    brows = null;
    leftE = sleepEyeL;
    rightE = sleepEyeR;
    mouth = sleepMouth;
  }
  if (expression === 'grin' || expression === 'happy') {
    leftE = renderOpenEye(cx - eyeXOff);
    rightE = renderOpenEye(cx + eyeXOff);
  }

  return (
    <G>
      {brows}
      {leftE}
      {rightE}
      <Ellipse cx={cx - r * 0.50} cy={cy + r * 0.10} rx={r * 0.10} ry={r * 0.06} fill="rgba(255,255,255,0.30)" />
      <Ellipse cx={cx + r * 0.50} cy={cy + r * 0.10} rx={r * 0.10} ry={r * 0.06} fill="rgba(255,255,255,0.30)" />
      {mouth}
      {extras}
    </G>
  );
}

// Simple color helpers (hex -> blend with white/black)
interface RGB { r: number; g: number; b: number; }

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const v = parseInt(
    h.length === 3 ? h.split('').map((c) => c + c).join('') : h,
    16
  );
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function rgbToHex({ r, g, b }: RGB): string {
  const t = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${t(r)}${t(g)}${t(b)}`;
}

function lighten(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r + (255 - r) * amt, g: g + (255 - g) * amt, b: b + (255 - b) * amt });
}

function darken(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r * (1 - amt), g: g * (1 - amt), b: b * (1 - amt) });
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
});
