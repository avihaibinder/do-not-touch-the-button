# Do Not Click The Button

A bouncy, playful, "anti-tap" puzzle game built with **Expo + React Native**. Try to tap the cheeky red button while it teleports, shrinks, dodges, decoys, flashes, mirrors your controls, and — every 10 levels — turns into a multi-phase boss fight.

- 30 hand-tuned levels
- 3 boss fights at levels 10, 20, and 30
- Cartoon-style UI with bouncy springs, particles, confetti
- Responsive design for small phones, large phones, and tablets
- Haptics + SFX hooks (drop in your own royalty-free sounds)
- Background music toggle
- Local progress saving via AsyncStorage
- AdMob banner placeholder ready to be wired up

---

## Quick start

```bash
# 1. Install
npm install
# or: yarn

# 2. Start Metro
npx expo start
```

In Expo Go, the AdMob banner will render as a labelled placeholder (the native module isn’t available in Expo Go). To get real banners, AdMob needs a dev/production build:

```bash
# Generate native iOS/Android folders
npx expo prebuild

# Build a dev client
npx expo run:ios
# or
npx expo run:android
```

## Sounds

The audio map in `src/hooks/useSounds.js` is intentionally **empty** by default so the project bundles without any audio assets. Drop your own (CC0 / royalty-free) clips into `assets/sounds/` and uncomment the matching `require()` lines:

```
assets/sounds/
  tap.mp3        // every successful button hit
  pop.mp3        // shrink-mechanic taps
  success.mp3    // level cleared
  fail.mp3       // level failed
  boss_hit.mp3   // hit a boss
  boss_win.mp3   // boss defeated
  whoosh.mp3     // boss-phase transition
  bgm.mp3        // looping background music
```

Recommended sources for free SFX:

- https://freesound.org (filter to CC0)
- https://kenney.nl/assets (CC0; lots of polished UI/game sets)
- https://opengameart.org (CC0 / CC-BY)

If a key isn’t configured, that sound just stays silent — gameplay isn’t affected.

## AdMob

Test IDs from Google’s public sample are already in place so you can verify the integration without an account. Replace them in two spots before publishing:

1. **`app.json`** → `expo.ios.infoPlist.GADApplicationIdentifier` and `expo.plugins.react-native-google-mobile-ads.androidAppId / iosAppId`
2. **`src/components/AdBanner.js`** → the `unitId` passed to `BannerAd` (or pass your own via the `adUnitId` prop)

## Project layout

```
DoNotClickTheButton/
├── App.js                  ← root, init AdMob, splash → LoadingScreen → GameContainer
├── app.json                ← Expo + AdMob plugin config
├── babel.config.js
├── package.json
├── assets/
│   └── sounds/             ← drop CC0 SFX here (see above)
└── src/
    ├── theme/colors.js
    ├── context/GameContext.js
    ├── hooks/
    │   ├── useResponsive.js
    │   ├── useHaptics.js
    │   ├── useSounds.js
    │   └── useGameStorage.js
    ├── components/
    │   ├── Logo.js
    │   ├── RedButton.js
    │   ├── HamburgerMenu.js
    │   ├── SuccessModal.js
    │   ├── FailureModal.js
    │   ├── TimerBar.js
    │   ├── AdBanner.js
    │   ├── Confetti.js
    │   ├── BackgroundParticles.js
    │   └── BossCharacter.js
    ├── screens/
    │   ├── LoadingScreen.js
    │   ├── GameContainer.js
    │   └── LevelScreen.js
    ├── levels/
    │   ├── levelConfigs.js   ← all 30 levels declared here
    │   └── MechanicRunner.js ← every mechanic implementation
    └── bosses/
        ├── bossConfigs.js
        └── BossFight.js
```

## How a level is defined

Every level is a one-line config in `src/levels/levelConfigs.js`:

```js
L(7, 'Personal Space', 'proximity',
  { taps: 3, threshold: 110, dodge: 70 },
  { timer: 30, tagline: 'Medium' });
```

Mechanics: `static`, `teleport`, `shrink`, `orbit`, `decoys`, `proximity`, `flash`, `longpress`, `rhythm`, `mirror`, `trap`, `multi`, `combo`, `boss`. Each is implemented in `MechanicRunner.js`. To add a new mechanic, drop a new component in there and add a `case` to the dispatch switch.

## How a boss is defined

`src/bosses/bossConfigs.js`:

```js
{
  id: 1,
  name: 'Wobbly McButton',
  color: '#FF3B47',
  phases: [
    { hits: 3, mechanic: 'orbit',     params: { radius: 0.28, periodMs: 4200 } },
    { hits: 3, mechanic: 'teleport',  params: { positions: 4 } },
    { hits: 2, mechanic: 'proximity', params: { threshold: 140, dodge: 100 } },
  ],
}
```

Total HP = sum of phase `hits`. When the player runs out of hits in a phase, the next mechanic swaps in.

## Storage

All progress is saved locally via `@react-native-async-storage/async-storage` under three keys:

- `@dncb:progress` – highest unlocked level, completed list, best times
- `@dncb:settings` – haptics / sfx / music toggles
- `@dncb:stats`    – win/fail/attempt counts

Reset from the in-game hamburger menu → "RESET ALL PROGRESS".

## Responsive design

`src/hooks/useResponsive.js` exposes `ms()` (margin scale), `fs()` (font scale), and `buttonBase` derived from `useWindowDimensions()`. Layout breakpoints:

| Tier   | Min dim     |
|--------|-------------|
| small  | ≤ 360 px    |
| medium | 361–414 px  |
| large  | 415–767 px  |
| tablet | ≥ 768 px    |

Tablet sizing applies a 1.25× boost so the button and modals don’t look puny on iPad.

## Customising

- Palette: `src/theme/colors.js`
- Add a level: append a `L(...)` to `LEVELS` in `src/levels/levelConfigs.js`
- Edit a boss: tweak `phases` in `src/bosses/bossConfigs.js`
- Faces / expressions: `Face` in `src/components/RedButton.js`
- Loading screen wording: `src/screens/LoadingScreen.js`

Have fun. Don’t click the button. (Then click it.)
