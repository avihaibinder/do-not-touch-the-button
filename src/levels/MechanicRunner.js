import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

import RedButton from '../components/RedButton';
import { colors } from '../theme/colors';
import useHaptics from '../hooks/useHaptics';
import useSounds from '../hooks/useSounds';

/**
 * Plays out a mechanic inside a fixed-size play area.
 *
 * Props:
 *   mechanic        string
 *   params          mechanic-specific
 *   playArea        { width, height }  – pixel size of the play surface
 *   buttonSize      number             – default red button diameter
 *   colorOverride   string             – e.g., boss color for boss fights
 *   accentOverride  string
 *   running         bool
 *   bossMode        bool (suppresses progress dots, hint pills, and mechanic
 *                   auto-completion — useful when an HP bar is the win cond)
 *   onTapHit        () => void         – fired each time the real button is hit
 *   onComplete      () => void         – fired when the mechanic objective is met
 *   onFail          (reason) => void   – fired when the player loses (decoy / trap / etc.)
 *
 * Mechanics interpret params per the levelConfigs.js docblock.
 */
export default function MechanicRunner(props) {
  const { mechanic } = props;
  switch (mechanic) {
    case 'static':     return <StaticMech     {...props} />;
    case 'teleport':   return <TeleportMech   {...props} />;
    case 'shrink':     return <ShrinkMech     {...props} />;
    case 'orbit':      return <OrbitMech      {...props} />;
    case 'decoys':     return <DecoysMech     {...props} />;
    case 'proximity':  return <ProximityMech  {...props} />;
    case 'flash':      return <FlashMech      {...props} />;
    case 'longpress':  return <LongPressMech  {...props} />;
    case 'rhythm':     return <RhythmMech     {...props} />;
    case 'mirror':     return <MirrorMech     {...props} />;
    case 'trap':       return <TrapMech       {...props} />;
    case 'multi':      return <MultiMech      {...props} />;
    case 'combo':      return <ComboMech      {...props} />;
    default:           return <StaticMech     {...props} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function clampPos(x, y, w, h, padding) {
  return {
    x: Math.max(padding, Math.min(w - padding, x)),
    y: Math.max(padding, Math.min(h - padding, y)),
  };
}

function randomPos(w, h, padding) {
  const x = padding + Math.random() * (w - padding * 2);
  const y = padding + Math.random() * (h - padding * 2);
  return { x, y };
}

function distance(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

// generate N positions in distinct quadrants/grid cells
function gridPositions(n, w, h, padding) {
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (out.length >= n) break;
      const cellW = (w - padding * 2) / cols;
      const cellH = (h - padding * 2) / rows;
      const cx = padding + cellW * c + cellW / 2 + (Math.random() - 0.5) * cellW * 0.25;
      const cy = padding + cellH * r + cellH / 2 + (Math.random() - 0.5) * cellH * 0.25;
      out.push({ x: cx, y: cy });
    }
  }
  // shuffle
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic 1: STATIC
// ─────────────────────────────────────────────────────────────────────────────

function StaticMech({ params, playArea, buttonSize, colorOverride, accentOverride, running, onTapHit, onComplete }) {
  const target = params.taps ?? 1;
  const [taps, setTaps] = useState(0);
  const haptics = useHaptics();
  const sounds = useSounds();

  const handle = () => {
    if (!running) return;
    haptics.medium();
    sounds.play('tap');
    onTapHit?.();
    setTaps((t) => {
      const nt = t + 1;
      if (nt >= target) onComplete?.();
      return nt;
    });
  };

  const cx = playArea.width / 2;
  const cy = playArea.height / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <ButtonAt cx={cx} cy={cy} size={buttonSize}>
        <RedButton
          size={buttonSize}
          expression="grin"
          colorOverride={colorOverride}
          accentOverride={accentOverride}
          onPress={handle}
        />
      </ButtonAt>
      <ProgressDots count={target} done={taps} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic 2: TELEPORT
// ─────────────────────────────────────────────────────────────────────────────

function TeleportMech({ params, playArea, buttonSize, colorOverride, accentOverride, running, onTapHit, onComplete }) {
  const target = params.taps ?? params.positions ?? 2;
  const haptics = useHaptics();
  const sounds = useSounds();

  const positions = useMemo(
    () => gridPositions(target + 1, playArea.width, playArea.height, buttonSize / 2 + 14),
    [target, playArea.width, playArea.height, buttonSize]
  );

  const [idx, setIdx] = useState(0);
  const [taps, setTaps] = useState(0);

  const current = positions[idx % positions.length];
  const nextPos = positions[(idx + 1) % positions.length];

  const cx = useSharedValue(current.x);
  const cy = useSharedValue(current.y);

  useEffect(() => {
    cx.value = withSpring(current.x, { damping: 14, stiffness: 200 });
    cy.value = withSpring(current.y, { damping: 14, stiffness: 200 });
  }, [idx]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cx.value - buttonSize / 2 },
      { translateY: cy.value - buttonSize / 2 },
    ],
  }));

  const handle = () => {
    if (!running) return;
    haptics.medium();
    sounds.play('tap');
    onTapHit?.();
    setTaps((t) => {
      const nt = t + 1;
      if (nt >= target) {
        onComplete?.();
      } else {
        setIdx((i) => i + 1);
      }
      return nt;
    });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* hint of next position */}
      <HintCircle x={nextPos.x} y={nextPos.y} size={buttonSize * 0.55} />

      <Animated.View style={[styles.absButton, { width: buttonSize, height: buttonSize }, buttonStyle]}>
        <RedButton
          size={buttonSize}
          expression="wink"
          colorOverride={colorOverride}
          accentOverride={accentOverride}
          onPress={handle}
        />
      </Animated.View>

      <ProgressDots count={target} done={taps} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic 3: SHRINK
// ─────────────────────────────────────────────────────────────────────────────

function ShrinkMech({ params, playArea, buttonSize, colorOverride, accentOverride, running, onTapHit, onComplete }) {
  const target = params.taps ?? 5;
  const endScale = params.endScale ?? 0.4;
  const haptics = useHaptics();
  const sounds = useSounds();

  const [taps, setTaps] = useState(0);

  // Pick a fresh position each shrink so the player has to chase a little.
  const [pos, setPos] = useState(() =>
    randomPos(playArea.width, playArea.height, buttonSize)
  );
  const cx = useSharedValue(pos.x);
  const cy = useSharedValue(pos.y);

  useEffect(() => {
    cx.value = withSpring(pos.x, { damping: 12, stiffness: 180 });
    cy.value = withSpring(pos.y, { damping: 12, stiffness: 180 });
  }, [pos]);

  const scale = useSharedValue(1);

  const handle = () => {
    if (!running) return;
    haptics.medium();
    sounds.play('pop');
    onTapHit?.();
    setTaps((t) => {
      const nt = t + 1;
      const ratio = nt / target;
      const targetScale = 1 - (1 - endScale) * ratio;
      scale.value = withSpring(targetScale, { damping: 10, stiffness: 220 });
      if (nt >= target) {
        onComplete?.();
      } else {
        setPos(randomPos(playArea.width, playArea.height, buttonSize));
      }
      return nt;
    });
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cx.value - buttonSize / 2 },
      { translateY: cy.value - buttonSize / 2 },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.absButton, { width: buttonSize, height: buttonSize }, animStyle]}>
        <RedButton
          size={buttonSize}
          expression="grin"
          colorOverride={colorOverride}
          accentOverride={accentOverride}
          onPress={handle}
        />
      </Animated.View>
      <ProgressDots count={target} done={taps} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic 4: ORBIT
// ─────────────────────────────────────────────────────────────────────────────

function OrbitMech({ params, playArea, buttonSize, colorOverride, accentOverride, running, onTapHit, onComplete }) {
  const target = params.taps ?? 4;
  const periodMs = params.periodMs ?? 4000;
  const radius = (params.radius ?? 0.30) * Math.min(playArea.width, playArea.height);
  const haptics = useHaptics();
  const sounds = useSounds();

  const [taps, setTaps] = useState(0);

  const t = useSharedValue(0);
  useEffect(() => {
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: periodMs, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [periodMs]);

  const cx = playArea.width / 2;
  const cy = playArea.height / 2;

  const animStyle = useAnimatedStyle(() => {
    const angle = t.value * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius - buttonSize / 2;
    const y = cy + Math.sin(angle) * radius - buttonSize / 2;
    return {
      transform: [{ translateX: x }, { translateY: y }],
    };
  });

  const handle = () => {
    if (!running) return;
    haptics.medium();
    sounds.play('tap');
    onTapHit?.();
    setTaps((c) => {
      const nc = c + 1;
      if (nc >= target) onComplete?.();
      return nc;
    });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <OrbitTrail cx={cx} cy={cy} radius={radius} />
      <Animated.View style={[styles.absButton, { width: buttonSize, height: buttonSize }, animStyle]}>
        <RedButton
          size={buttonSize}
          expression="happy"
          colorOverride={colorOverride}
          accentOverride={accentOverride}
          onPress={handle}
        />
      </Animated.View>
      <ProgressDots count={target} done={taps} />
    </View>
  );
}

function OrbitTrail({ cx, cy, radius }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: cx - radius,
        top: cy - radius,
        width: radius * 2,
        height: radius * 2,
        borderRadius: radius,
        borderWidth: 2,
        borderColor: 'rgba(26,26,46,0.18)',
        borderStyle: 'dashed',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic 5: DECOYS
// ─────────────────────────────────────────────────────────────────────────────

function DecoysMech({ params, playArea, buttonSize, colorOverride, accentOverride, running, onTapHit, onComplete, onFail }) {
  const target = params.taps ?? 1;
  const decoyCount = params.decoys ?? 2;
  const haptics = useHaptics();
  const sounds = useSounds();

  const [taps, setTaps] = useState(0);
  const [round, setRound] = useState(0);

  // Each round we re-randomize positions and which one is real.
  const layout = useMemo(() => {
    const total = decoyCount + 1;
    const positions = gridPositions(total, playArea.width, playArea.height, buttonSize / 2 + 12);
    const realIndex = Math.floor(Math.random() * positions.length);
    return { positions, realIndex };
  }, [round, decoyCount, playArea.width, playArea.height, buttonSize]);

  const handleHit = () => {
    if (!running) return;
    haptics.medium();
    sounds.play('tap');
    onTapHit?.();
    setTaps((c) => {
      const nc = c + 1;
      if (nc >= target) onComplete?.();
      else setRound((r) => r + 1);
      return nc;
    });
  };

  const handleDecoy = () => {
    if (!running) return;
    haptics.error();
    sounds.play('fail');
    onFail?.('decoy');
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {layout.positions.map((p, i) => (
        <ButtonAt key={i} cx={p.x} cy={p.y} size={buttonSize}>
          <RedButton
            size={buttonSize}
            expression={i === layout.realIndex ? 'grin' : 'evil'}
            colorOverride={colorOverride}
            accentOverride={accentOverride}
            fake={i !== layout.realIndex}
            onPress={i === layout.realIndex ? handleHit : handleDecoy}
          />
        </ButtonAt>
      ))}
      <ProgressDots count={target} done={taps} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic 6: PROXIMITY  (button dodges the finger)
// ─────────────────────────────────────────────────────────────────────────────

function ProximityMech({ params, playArea, buttonSize, colorOverride, accentOverride, running, onTapHit, onComplete }) {
  const target = params.taps ?? 3;
  const threshold = params.threshold ?? 130;
  const dodge = params.dodge ?? 90;
  const haptics = useHaptics();
  const sounds = useSounds();

  const [taps, setTaps] = useState(0);

  const cx = useSharedValue(playArea.width / 2);
  const cy = useSharedValue(playArea.height / 2);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cx.value - buttonSize / 2 },
      { translateY: cy.value - buttonSize / 2 },
    ],
  }));

  // The "field" tracks finger position and pushes the button away if finger is near.
  // We use onTouch* (not the responder system) so taps still pass through to the
  // inner Pressable and the button's onPress fires correctly.
  const fieldRef = useRef({ x: 0, y: 0 });
  const handleTouch = (e) => {
    if (!running) return;
    const ne = e.nativeEvent;
    const layout = fieldRef.current;
    const fx = ne.locationX !== undefined ? ne.locationX : (ne.pageX - layout.x);
    const fy = ne.locationY !== undefined ? ne.locationY : (ne.pageY - layout.y);
    const dx = cx.value - fx;
    const dy = cy.value - fy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < threshold) {
      const angle = Math.atan2(dy, dx);
      const newX = cx.value + Math.cos(angle) * dodge;
      const newY = cy.value + Math.sin(angle) * dodge;
      const padding = buttonSize / 2 + 6;
      const tx = Math.max(padding, Math.min(playArea.width - padding, newX));
      const ty = Math.max(padding, Math.min(playArea.height - padding, newY));
      cx.value = withSpring(tx, { damping: 10, stiffness: 220 });
      cy.value = withSpring(ty, { damping: 10, stiffness: 220 });
    }
  };

  const handleHit = () => {
    if (!running) return;
    haptics.medium();
    sounds.play('tap');
    onTapHit?.();
    setTaps((c) => {
      const nc = c + 1;
      if (nc >= target) onComplete?.();
      return nc;
    });
  };

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      onLayout={(e) => { fieldRef.current = e.nativeEvent.layout; }}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
    >
      <Animated.View style={[styles.absButton, { width: buttonSize, height: buttonSize }, animStyle]}>
        <RedButton
          size={buttonSize}
          expression="shock"
          colorOverride={colorOverride}
          accentOverride={accentOverride}
          onPress={handleHit}
        />
      </Animated.View>
      <ProgressDots count={target} done={taps} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic 7: FLASH
// ─────────────────────────────────────────────────────────────────────────────

function FlashMech({ params, playArea, buttonSize, colorOverride, accentOverride, running, onTapHit, onComplete, onFail }) {
  const target = params.taps ?? 3;
  const visibleMs = params.visibleMs ?? 600;
  const hiddenMs = params.hiddenMs ?? 600;
  const haptics = useHaptics();
  const sounds = useSounds();

  const [taps, setTaps] = useState(0);
  const [visible, setVisible] = useState(true);
  const [pos, setPos] = useState(() =>
    randomPos(playArea.width, playArea.height, buttonSize)
  );

  useEffect(() => {
    if (!running) return;
    let t;
    const tick = (showing) => {
      setVisible(showing);
      if (showing) setPos(randomPos(playArea.width, playArea.height, buttonSize));
      t = setTimeout(() => tick(!showing), showing ? visibleMs : hiddenMs);
    };
    tick(true);
    return () => clearTimeout(t);
  }, [running, visibleMs, hiddenMs, playArea.width, playArea.height, buttonSize]);

  const handle = () => {
    if (!running) return;
    haptics.medium();
    sounds.play('tap');
    onTapHit?.();
    setTaps((c) => {
      const nc = c + 1;
      if (nc >= target) onComplete?.();
      return nc;
    });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {visible && (
        <ButtonAt cx={pos.x} cy={pos.y} size={buttonSize}>
          <RedButton
            size={buttonSize}
            expression="wink"
            colorOverride={colorOverride}
            accentOverride={accentOverride}
            onPress={handle}
          />
        </ButtonAt>
      )}
      <ProgressDots count={target} done={taps} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic 8: LONG PRESS
// ─────────────────────────────────────────────────────────────────────────────

function LongPressMech({ params, playArea, buttonSize, colorOverride, accentOverride, running, onTapHit, onComplete }) {
  const holdMs = params.holdMs ?? 1500;
  const haptics = useHaptics();
  const sounds = useSounds();

  const [held, setHeld] = useState(false);
  const progress = useSharedValue(0);
  const holdStart = useRef(0);
  const tickHandle = useRef(null);

  const onIn = () => {
    if (!running) return;
    setHeld(true);
    holdStart.current = Date.now();
    progress.value = 0;
    progress.value = withTiming(1, { duration: holdMs, easing: Easing.linear });
    haptics.light();
    tickHandle.current = setTimeout(() => {
      // Final completion
      haptics.success();
      sounds.play('success');
      onTapHit?.();
      onComplete?.();
    }, holdMs);
  };
  const onOut = () => {
    setHeld(false);
    progress.value = withTiming(0, { duration: 180 });
    if (tickHandle.current) {
      clearTimeout(tickHandle.current);
      tickHandle.current = null;
    }
  };

  useEffect(() => () => tickHandle.current && clearTimeout(tickHandle.current), []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.18 * progress.value }],
    opacity: 0.25 + 0.55 * progress.value,
  }));

  const cx = playArea.width / 2;
  const cy = playArea.height / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <ButtonAt cx={cx} cy={cy} size={buttonSize}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: buttonSize * 1.18,
              height: buttonSize * 1.18,
              borderRadius: buttonSize * 1.18,
              top: -buttonSize * 0.09,
              left: -buttonSize * 0.09,
              backgroundColor: colors.yellow,
            },
            ringStyle,
          ]}
        />
        <RedButton
          size={buttonSize}
          expression={held ? 'shock' : 'grin'}
          colorOverride={colorOverride}
          accentOverride={accentOverride}
          onPressIn={onIn}
          onPressOut={onOut}
        />
      </ButtonAt>
      <Hint text={`HOLD ${(holdMs / 1000).toFixed(1)}s`} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic 9: RHYTHM
// ─────────────────────────────────────────────────────────────────────────────

function RhythmMech({ params, playArea, buttonSize, colorOverride, accentOverride, running, onTapHit, onComplete, onFail }) {
  const target = params.taps ?? 4;
  const windowMs = params.windowMs ?? 600;
  const minGapMs = params.minGapMs ?? 180;
  const haptics = useHaptics();
  const sounds = useSounds();

  const [taps, setTaps] = useState(0);
  const last = useRef(0);

  const handle = () => {
    if (!running) return;
    const now = Date.now();
    const gap = now - last.current;
    last.current = now;
    if (taps > 0 && gap > windowMs) {
      // too slow → reset
      haptics.warning();
      sounds.play('fail');
      setTaps(0);
      return;
    }
    if (taps > 0 && gap < minGapMs) {
      // too fast — small punishment but no full fail; just ignore
      haptics.warning();
      return;
    }
    haptics.medium();
    sounds.play('tap');
    onTapHit?.();
    setTaps((c) => {
      const nc = c + 1;
      if (nc >= target) onComplete?.();
      return nc;
    });
  };

  const cx = playArea.width / 2;
  const cy = playArea.height / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <ButtonAt cx={cx} cy={cy} size={buttonSize}>
        <RedButton
          size={buttonSize}
          expression="happy"
          colorOverride={colorOverride}
          accentOverride={accentOverride}
          onPress={handle}
        />
      </ButtonAt>
      <Hint text={`TAP ${target}× IN RHYTHM (≤ ${windowMs}ms gaps)`} />
      <ProgressDots count={target} done={taps} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic 10: MIRROR  (x flipped)
// ─────────────────────────────────────────────────────────────────────────────

function MirrorMech({ params, playArea, buttonSize, colorOverride, accentOverride, running, onTapHit, onComplete }) {
  const target = params.taps ?? 3;
  const haptics = useHaptics();
  const sounds = useSounds();

  const [taps, setTaps] = useState(0);
  const [pos, setPos] = useState(() =>
    randomPos(playArea.width, playArea.height, buttonSize)
  );

  const handle = () => {
    if (!running) return;
    haptics.medium();
    sounds.play('tap');
    onTapHit?.();
    setTaps((c) => {
      const nc = c + 1;
      if (nc >= target) onComplete?.();
      else setPos(randomPos(playArea.width, playArea.height, buttonSize));
      return nc;
    });
  };

  // Mirror the entire play area horizontally so taps are visually inverted.
  return (
    <View style={[StyleSheet.absoluteFill, { transform: [{ scaleX: -1 }] }]} pointerEvents="box-none">
      <ButtonAt cx={pos.x} cy={pos.y} size={buttonSize}>
        <View style={{ transform: [{ scaleX: -1 }] }}>
          <RedButton
            size={buttonSize}
            expression="wink"
            colorOverride={colorOverride}
            accentOverride={accentOverride}
            onPress={handle}
          />
        </View>
      </ButtonAt>
      <View style={{ transform: [{ scaleX: -1 }] }}>
        <Hint text="MIRRORED CONTROLS" />
      </View>
      <View style={{ transform: [{ scaleX: -1 }] }}>
        <ProgressDots count={target} done={taps} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic 11: TRAP
// ─────────────────────────────────────────────────────────────────────────────

function TrapMech({ params, playArea, buttonSize, colorOverride, accentOverride, running, onTapHit, onComplete, onFail }) {
  const target = params.taps ?? 3;
  const trapCount = params.traps ?? 3;
  const trapRadiusFactor = params.trapRadius ?? 0.12;
  const haptics = useHaptics();
  const sounds = useSounds();

  const [taps, setTaps] = useState(0);
  const [round, setRound] = useState(0);

  const layout = useMemo(() => {
    const padding = buttonSize / 2 + 16;
    const buttonPos = randomPos(playArea.width, playArea.height, padding);
    const trapR = trapRadiusFactor * Math.min(playArea.width, playArea.height);
    const traps = [];
    let safety = 0;
    while (traps.length < trapCount && safety < 80) {
      safety++;
      const tp = randomPos(playArea.width, playArea.height, trapR);
      // ensure it doesn't overlap the button
      if (distance(tp.x, tp.y, buttonPos.x, buttonPos.y) > buttonSize / 2 + trapR + 12) {
        // ensure it doesn't overlap other traps too closely
        const ok = traps.every(
          (other) => distance(tp.x, tp.y, other.x, other.y) > trapR * 2.0
        );
        if (ok) traps.push(tp);
      }
    }
    return { buttonPos, traps, trapR };
  }, [round, trapCount, trapRadiusFactor, playArea.width, playArea.height, buttonSize]);

  const handle = () => {
    if (!running) return;
    haptics.medium();
    sounds.play('tap');
    onTapHit?.();
    setTaps((c) => {
      const nc = c + 1;
      if (nc >= target) onComplete?.();
      else setRound((r) => r + 1);
      return nc;
    });
  };

  const handleTrap = () => {
    if (!running) return;
    haptics.error();
    sounds.play('fail');
    onFail?.('trap');
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {layout.traps.map((tp, i) => (
        <Pressable
          key={i}
          onPress={handleTrap}
          style={[
            styles.trap,
            {
              left: tp.x - layout.trapR,
              top: tp.y - layout.trapR,
              width: layout.trapR * 2,
              height: layout.trapR * 2,
              borderRadius: layout.trapR,
            },
          ]}
        >
          <View style={[styles.trapCore, { width: layout.trapR * 1.2, height: layout.trapR * 1.2, borderRadius: layout.trapR }]} />
          <Text style={styles.trapText}>!</Text>
        </Pressable>
      ))}

      <ButtonAt cx={layout.buttonPos.x} cy={layout.buttonPos.y} size={buttonSize}>
        <RedButton
          size={buttonSize}
          expression="shock"
          colorOverride={colorOverride}
          accentOverride={accentOverride}
          onPress={handle}
        />
      </ButtonAt>
      <ProgressDots count={target} done={taps} />
      <Hint text="AVOID THE LAVA" />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic 12: MULTI (rapid-fire taps, optional)
// ─────────────────────────────────────────────────────────────────────────────

function MultiMech({ params, playArea, buttonSize, colorOverride, accentOverride, running, onTapHit, onComplete, onFail }) {
  const target = params.taps ?? 8;
  const windowMs = params.windowMs ?? 2000;
  const haptics = useHaptics();
  const sounds = useSounds();

  const [taps, setTaps] = useState(0);
  const [start, setStart] = useState(null);

  useEffect(() => {
    if (taps === 1) setStart(Date.now());
    if (taps >= target) onComplete?.();
    if (start && Date.now() - start > windowMs) onFail?.('rhythm');
  }, [taps, start, target, windowMs]);

  const handle = () => {
    if (!running) return;
    haptics.light();
    sounds.play('pop');
    onTapHit?.();
    setTaps((c) => c + 1);
  };

  const cx = playArea.width / 2;
  const cy = playArea.height / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <ButtonAt cx={cx} cy={cy} size={buttonSize}>
        <RedButton
          size={buttonSize}
          expression="happy"
          colorOverride={colorOverride}
          accentOverride={accentOverride}
          onPress={handle}
        />
      </ButtonAt>
      <Hint text={`TAP ${target}× IN ${(windowMs / 1000).toFixed(1)}s`} />
      <ProgressDots count={target} done={taps} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic 13: COMBO
// ─────────────────────────────────────────────────────────────────────────────

function ComboMech({ params, ...rest }) {
  const stages = params.stages ?? [];
  const [stageIdx, setStageIdx] = useState(0);

  if (stages.length === 0) return null;

  const stage = stages[Math.min(stageIdx, stages.length - 1)];

  const onStageDone = () => {
    if (stageIdx + 1 >= stages.length) {
      rest.onComplete?.();
    } else {
      setStageIdx((i) => i + 1);
    }
  };

  return (
    <MechanicRunner
      key={stageIdx}
      mechanic={stage.mechanic}
      params={stage.params}
      playArea={rest.playArea}
      buttonSize={rest.buttonSize}
      colorOverride={rest.colorOverride}
      accentOverride={rest.accentOverride}
      running={rest.running}
      onTapHit={rest.onTapHit}
      onFail={rest.onFail}
      onComplete={onStageDone}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers / mini-components
// ─────────────────────────────────────────────────────────────────────────────

function ButtonAt({ cx, cy, size, children }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: cx - size / 2,
        top: cy - size / 2,
        width: size,
        height: size,
      }}
    >
      {children}
    </View>
  );
}

function HintCircle({ x, y, size }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.95 + 0.1 * t.value }],
    opacity: 0.30 + 0.30 * t.value,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size,
          borderWidth: 3,
          borderStyle: 'dashed',
          borderColor: colors.purple,
          backgroundColor: 'rgba(124,92,252,0.10)',
        },
        style,
      ]}
    />
  );
}

function Hint({ text }) {
  return (
    <View pointerEvents="none" style={styles.hintWrap}>
      <View style={styles.hintPill}>
        <Text style={styles.hintText}>{text}</Text>
      </View>
    </View>
  );
}

function ProgressDots({ count, done }) {
  // Don't render when count is missing, zero, or sentinel-large (e.g. boss mode `taps: 999`).
  if (!Number.isFinite(count) || count <= 0 || count > 30) return null;
  const dots = Array.from({ length: count }).map((_, i) => i < done);
  return (
    <View pointerEvents="none" style={styles.dotsWrap}>
      {dots.map((on, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: on ? colors.green : 'rgba(26,26,46,0.20)' },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  absButton: { position: 'absolute', left: 0, top: 0 },
  trap: {
    position: 'absolute',
    backgroundColor: 'rgba(255,59,71,0.18)',
    borderWidth: 2,
    borderColor: colors.red,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trapCore: {
    backgroundColor: colors.red,
    opacity: 0.55,
    position: 'absolute',
  },
  trapText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 22,
  },
  hintWrap: {
    position: 'absolute',
    top: 8,
    width: '100%',
    alignItems: 'center',
  },
  hintPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(26,26,46,0.85)',
    borderRadius: 16,
  },
  hintText: { color: 'white', fontWeight: '900', letterSpacing: 1.2, fontSize: 12 },

  dotsWrap: {
    position: 'absolute',
    bottom: 8,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 10, height: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.ink },
});
