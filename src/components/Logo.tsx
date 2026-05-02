import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Circle,
  Ellipse,
  Path,
  G,
  Rect,
} from 'react-native-svg';
import type { Expression } from '../types';

export interface LogoProps {
  size?: number;
  showText?: boolean;
  expression?: Expression;
}

/**
 * Cartoon Logo: a mischievous red button character.
 */
export default function Logo({ size = 220, showText = true, expression = 'grin' }: LogoProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.42;
  const rim = s * 0.04;

  return (
    <Svg width={s} height={s * 1.05} viewBox={`0 0 ${s} ${s * 1.05}`}>
      <Defs>
        <RadialGradient id="bodyGrad" cx="50%" cy="38%" r="60%">
          <Stop offset="0%" stopColor="#FF7B7B" />
          <Stop offset="55%" stopColor="#FF3B47" />
          <Stop offset="100%" stopColor="#A8141E" />
        </RadialGradient>
        <LinearGradient id="rimGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#5A0810" />
          <Stop offset="100%" stopColor="#350006" />
        </LinearGradient>
        <RadialGradient id="shineGrad" cx="35%" cy="28%" r="35%">
          <Stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </RadialGradient>
      </Defs>

      {/* Drop shadow blob */}
      <Ellipse cx={cx} cy={cy + r + rim * 1.6} rx={r * 0.95} ry={r * 0.18} fill="rgba(26,26,46,0.18)" />

      {/* Outer rim / base */}
      <Circle cx={cx} cy={cy + rim * 1.2} r={r + rim} fill="url(#rimGrad)" />
      <Circle cx={cx} cy={cy + rim * 0.4} r={r + rim * 0.6} fill="#2A0008" />

      {/* Button body */}
      <Circle cx={cx} cy={cy} r={r} fill="url(#bodyGrad)" />

      {/* Highlight */}
      <Ellipse
        cx={cx - r * 0.28}
        cy={cy - r * 0.34}
        rx={r * 0.45}
        ry={r * 0.22}
        fill="url(#shineGrad)"
      />

      {/* Face */}
      <Face cx={cx} cy={cy} r={r} expression={expression} />

      {/* Curved label – simulated by two rectangular badges to keep it simple */}
      {showText && (
        <G>
          <Rect
            x={cx - r * 0.85}
            y={cy + r * 0.55}
            width={r * 1.7}
            height={r * 0.30}
            rx={r * 0.16}
            fill="#1A1A2E"
            stroke="#FFD93D"
            strokeWidth={s * 0.012}
          />
          {/* Title text drawn as path to avoid font dependency */}
          <Path
            d={titlePath(cx, cy + r * 0.70, r * 0.10)}
            fill="#FFD93D"
          />
        </G>
      )}
    </Svg>
  );
}

interface FaceProps {
  cx: number;
  cy: number;
  r: number;
  expression: Expression;
}

function Face({ cx, cy, r, expression }: FaceProps) {
  const eyeY = cy - r * 0.10;
  const eyeXOff = r * 0.32;
  const eyeR = r * 0.10;

  const leftEye = (
    <G>
      <Circle cx={cx - eyeXOff} cy={eyeY} r={eyeR} fill="#1A1A2E" />
      <Circle cx={cx - eyeXOff + eyeR * 0.35} cy={eyeY - eyeR * 0.3} r={eyeR * 0.35} fill="#FFFFFF" />
    </G>
  );
  const rightEyeOpen = (
    <G>
      <Circle cx={cx + eyeXOff} cy={eyeY} r={eyeR} fill="#1A1A2E" />
      <Circle cx={cx + eyeXOff + eyeR * 0.35} cy={eyeY - eyeR * 0.3} r={eyeR * 0.35} fill="#FFFFFF" />
    </G>
  );
  const rightEyeWink = (
    <Path
      d={`M ${cx + eyeXOff - eyeR} ${eyeY} Q ${cx + eyeXOff} ${eyeY - eyeR * 0.6} ${cx + eyeXOff + eyeR} ${eyeY}`}
      stroke="#1A1A2E"
      strokeWidth={r * 0.05}
      strokeLinecap="round"
      fill="none"
    />
  );

  const browL = (
    <Path
      d={`M ${cx - eyeXOff - eyeR} ${eyeY - eyeR * 1.3} Q ${cx - eyeXOff} ${eyeY - eyeR * 2.0} ${cx - eyeXOff + eyeR} ${eyeY - eyeR * 1.0}`}
      stroke="#1A1A2E" strokeWidth={r * 0.06} strokeLinecap="round" fill="none"
    />
  );
  const browR = (
    <Path
      d={`M ${cx + eyeXOff - eyeR} ${eyeY - eyeR * 1.0} Q ${cx + eyeXOff} ${eyeY - eyeR * 2.0} ${cx + eyeXOff + eyeR} ${eyeY - eyeR * 1.3}`}
      stroke="#1A1A2E" strokeWidth={r * 0.06} strokeLinecap="round" fill="none"
    />
  );

  const evilBrowL = (
    <Path d={`M ${cx - eyeXOff - eyeR} ${eyeY - eyeR * 1.6} L ${cx - eyeXOff + eyeR} ${eyeY - eyeR * 0.8}`}
      stroke="#1A1A2E" strokeWidth={r * 0.07} strokeLinecap="round" />
  );
  const evilBrowR = (
    <Path d={`M ${cx + eyeXOff - eyeR} ${eyeY - eyeR * 0.8} L ${cx + eyeXOff + eyeR} ${eyeY - eyeR * 1.6}`}
      stroke="#1A1A2E" strokeWidth={r * 0.07} strokeLinecap="round" />
  );

  const mouthGrin = (
    <Path
      d={`M ${cx - r * 0.32} ${cy + r * 0.20}
          Q ${cx} ${cy + r * 0.55} ${cx + r * 0.32} ${cy + r * 0.20}
          Q ${cx} ${cy + r * 0.42} ${cx - r * 0.32} ${cy + r * 0.20} Z`}
      fill="#1A1A2E"
    />
  );
  const mouthShock = (
    <Ellipse cx={cx} cy={cy + r * 0.30} rx={r * 0.14} ry={r * 0.18} fill="#1A1A2E" />
  );
  const mouthEvil = (
    <Path
      d={`M ${cx - r * 0.34} ${cy + r * 0.32}
          Q ${cx} ${cy + r * 0.10} ${cx + r * 0.34} ${cy + r * 0.32}`}
      stroke="#1A1A2E" strokeWidth={r * 0.06} strokeLinecap="round" fill="none"
    />
  );
  const mouthHappy = (
    <Path
      d={`M ${cx - r * 0.30} ${cy + r * 0.22}
          Q ${cx} ${cy + r * 0.50} ${cx + r * 0.30} ${cy + r * 0.22}`}
      stroke="#1A1A2E" strokeWidth={r * 0.06} strokeLinecap="round" fill="none"
    />
  );

  let brows = (<>{browL}{browR}</>);
  let mouth = mouthGrin;
  let rightE = rightEyeOpen;

  if (expression === 'wink')   { rightE = rightEyeWink; mouth = mouthGrin; }
  if (expression === 'shock')  { mouth = mouthShock; }
  if (expression === 'evil')   { brows = (<>{evilBrowL}{evilBrowR}</>); mouth = mouthEvil; }
  if (expression === 'happy')  { mouth = mouthHappy; }

  const cheekL = (
    <Ellipse cx={cx - r * 0.50} cy={cy + r * 0.10} rx={r * 0.10} ry={r * 0.06}
      fill="rgba(255,255,255,0.30)" />
  );
  const cheekR = (
    <Ellipse cx={cx + r * 0.50} cy={cy + r * 0.10} rx={r * 0.10} ry={r * 0.06}
      fill="rgba(255,255,255,0.30)" />
  );

  return (
    <G>
      {brows}
      {leftEye}
      {rightE}
      {cheekL}
      {cheekR}
      {mouth}
    </G>
  );
}

// Tiny custom path that spells "DO NOT CLICK" using basic strokes —
// avoids needing a font asset for the logo.
function titlePath(cx: number, cy: number, h: number): string {
  const text = 'DO NOT CLICK';
  const letterW = h * 1.0;
  const gap = h * 0.45;
  const totalW = text.length * letterW + (text.length - 1) * gap;
  let x = cx - totalW / 2;
  let d = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === ' ') { x += letterW + gap; continue; }
    d += letterToPath(ch, x, cy - h, letterW, h * 2);
    x += letterW + gap;
  }
  return d;
}

// Minimal block-letter glyphs (good enough for a logo badge).
function letterToPath(ch: string, x: number, y: number, w: number, h: number): string {
  const t = h * 0.18; // stroke thickness
  const mid = y + h / 2 - t / 2;
  const right = x + w - t;
  const bottom = y + h - t;
  const seg = (sx: number, sy: number, sw: number, sh: number) =>
    `M ${sx} ${sy} h ${sw} v ${sh} h ${-sw} Z `;
  switch (ch) {
    case 'D': return seg(x, y, t, h) + seg(x, y, w * 0.85, t) + seg(x, bottom, w * 0.85, t) + seg(right, y + t, t, h - t * 2);
    case 'O': return seg(x, y, w, t) + seg(x, bottom, w, t) + seg(x, y, t, h) + seg(right, y, t, h);
    case 'N': return seg(x, y, t, h) + seg(right, y, t, h) + seg(x + t, y + t, w - t * 2, t * 1.2);
    case 'T': return seg(x, y, w, t) + seg(x + w / 2 - t / 2, y, t, h);
    case 'C': return seg(x, y, w, t) + seg(x, bottom, w, t) + seg(x, y, t, h);
    case 'L': return seg(x, y, t, h) + seg(x, bottom, w, t);
    case 'I': return seg(x + w / 2 - t / 2, y, t, h);
    case 'K': return seg(x, y, t, h) + seg(x + t, mid, w - t, t) + seg(right, y, t, h * 0.45) + seg(right, bottom - h * 0.45 + t, t, h * 0.45);
    default:  return '';
  }
}
