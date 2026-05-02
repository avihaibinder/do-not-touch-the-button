// Playful / cartoon palette
export const colors = {
  // Backgrounds
  bgTop: '#FFE66D',       // sunny yellow
  bgMid: '#FFB4A2',       // soft coral
  bgBottom: '#FFCAD4',    // bubblegum pink
  card: '#FFFFFF',
  cardSoft: '#FFF8E7',

  // Primary
  red: '#FF3B47',         // the button red
  redDeep: '#C81E2B',
  redGlow: 'rgba(255, 59, 71, 0.45)',

  // Accents
  yellow: '#FFD93D',
  turquoise: '#4ECDC4',
  purple: '#7C5CFC',
  green: '#5BD68A',
  orange: '#FF8C42',

  // Text
  ink: '#1A1A2E',
  inkSoft: '#3D3D52',
  inkLight: '#7A7A8C',
  white: '#FFFFFF',

  // Overlays
  shadow: 'rgba(26, 26, 46, 0.18)',
  scrim: 'rgba(26, 26, 46, 0.55)',
  trap: 'rgba(255, 59, 71, 0.18)',
} as const;

type Tuple3 = readonly [string, string, string];
type Tuple2 = readonly [string, string];

export const gradients: {
  bg: Tuple3;
  buttonRed: Tuple3;
  buttonGlow: Tuple2;
  success: Tuple2;
  fail: Tuple2;
} = {
  bg: [colors.bgTop, colors.bgMid, colors.bgBottom],
  buttonRed: ['#FF6B6B', '#FF3B47', '#C81E2B'],
  buttonGlow: ['rgba(255,107,107,0.0)', 'rgba(255,59,71,0.35)'],
  success: ['#5BD68A', '#3DB874'],
  fail: ['#FF8C42', '#FF3B47'],
};

export default colors;
