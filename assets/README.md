# Assets

Standard Expo image slots referenced by `app.json`:

- `icon.png`           1024 × 1024 — app icon
- `splash.png`         1242 × 2436 — native splash; recommend a yellow bg with the cartoon button logo centered
- `adaptive-icon.png`  1024 × 1024 (centred) — Android adaptive icon foreground
- `favicon.png`        48 × 48     — web favicon

While you’re iterating you can use any of the placeholder images Expo ships
with — they live in `node_modules/expo/AppEntry.js` references that resolve
under the hood. To replace, simply drop your own PNGs at the paths above and
re-run the app.

The in-game **logo** is procedurally drawn via SVG in
`src/components/Logo.js` so no PNG asset is required for it.
