import React, { forwardRef } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Circle, Ellipse, G, Path } from 'react-native-svg';
import { colors } from '../theme/colors';

/**
 * Visual button. Renders the cartoon red button face at a given size & expression.
 * Supports tap and long-press from the parent.
 *
 * Props:
 *   size           number (diameter)
 *   expression     'grin' | 'wink' | 'happy' | 'shock' | 'evil'
 *   colorOverride  string (e.g. boss colors)
 *   accentOverride string
 *   onPress
 *   onPressIn
 *   onPressOut
 *   onLongPress
 *   delayLongPress ms
 *   pointerEvents  'auto'|'none'
 */
const RedButton = forwardRef(function RedButton(
  {
    size = 180,
    expression = 'grin',
    colorOverride,
    accentOverride,
    onPress,
    onPressIn,
    onPressOut,
    onLongPress,
    delayLongPress = 800,
    pointerEvents = 'auto',
    fake = false,        // when used as a decoy
  },
  ref
) {
  const press = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - 0.06 * press.value },
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

  return (
    <Animated.View ref={ref} pointerEvents={pointerEvents} style={[{ width: size, height: size }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handleIn}
        onPressOut={handleOut}
        onLongPress={onLongPress}
        delayLongPress={delayLongPress}
        style={[styles.fill, { borderRadius: size / 2 }]}
        android_ripple={null}
      >
        <ButtonSvg
          size={size}
          expression={expression}
          colorOverride={colorOverride}
          accentOverride={accentOverride}
          fake={fake}
        />
      </Pressable>
    </Animated.View>
  );
});

export default RedButton;

function ButtonSvg({ size, expression, colorOverride, accentOverride, fake }) {
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

      {!fake && <Face cx={cx} cy={cy} r={r} expression={expression} />}
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

function FakeFace({ cx, cy, r }) {
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

function Face({ cx, cy, r, expression }) {
  const eyeY = cy - r * 0.10;
  const eyeXOff = r * 0.32;
  const eyeR = r * 0.10;

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
  const evilL = (<Path d={`M ${cx - eyeXOff - eyeR} ${eyeY - eyeR * 1.6} L ${cx - eyeXOff + eyeR} ${eyeY - eyeR * 0.8}`}
    stroke="#1A1A2E" strokeWidth={r * 0.07} strokeLinecap="round" />);
  const evilR = (<Path d={`M ${cx + eyeXOff - eyeR} ${eyeY - eyeR * 0.8} L ${cx + eyeXOff + eyeR} ${eyeY - eyeR * 1.6}`}
    stroke="#1A1A2E" strokeWidth={r * 0.07} strokeLinecap="round" />);

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

  let brows = (<>{browL}{browR}</>);
  let mouth = mouthGrin;
  let rightE = rightEye;

  if (expression === 'wink')  { rightE = wink; }
  if (expression === 'shock') { mouth = mouthShock; }
  if (expression === 'evil')  { brows = (<>{evilL}{evilR}</>); mouth = mouthEvil; }
  if (expression === 'happy') { mouth = mouthHappy; }

  return (
    <G>
      {brows}
      {leftEye}
      {rightE}
      <Ellipse cx={cx - r * 0.50} cy={cy + r * 0.10} rx={r * 0.10} ry={r * 0.06} fill="rgba(255,255,255,0.30)" />
      <Ellipse cx={cx + r * 0.50} cy={cy + r * 0.10} rx={r * 0.10} ry={r * 0.06} fill="rgba(255,255,255,0.30)" />
      {mouth}
    </G>
  );
}

// Simple color helpers (hex -> blend with white/black)
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v = parseInt(h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}
function rgbToHex({ r, g, b }) {
  const t = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${t(r)}${t(g)}${t(b)}`;
}
function lighten(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r + (255 - r) * amt, g: g + (255 - g) * amt, b: b + (255 - b) * amt });
}
function darken(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r * (1 - amt), g: g * (1 - amt), b: b * (1 - amt) });
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
});
