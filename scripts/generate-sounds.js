/* eslint-disable no-console */
/**
 * One-shot generator that synthesises the baseline SFX bundle for the game.
 *
 * Outputs short, royalty-free 16-bit/22.05kHz mono WAVs into /assets/sounds.
 * Re-run with `node scripts/generate-sounds.js` if you want to tweak the
 * waveforms; the output is fully deterministic.
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const BITS = 16;

function envelope(t, dur, attack = 0.005, release = 0.10) {
  // Simple ADSR-ish envelope returning [0..1].
  if (t < attack) return t / attack;
  const sus = dur - release;
  if (t < sus) return 1.0;
  const k = 1 - (t - sus) / release;
  return Math.max(0, k);
}

function sine(f, t) { return Math.sin(2 * Math.PI * f * t); }
function square(f, t) { return Math.sign(Math.sin(2 * Math.PI * f * t)); }
function triangle(f, t) {
  const x = (f * t) % 1;
  return 4 * Math.abs(x - 0.5) - 1;
}
function noise() { return Math.random() * 2 - 1; }

function render(durSec, fn) {
  const n = Math.round(durSec * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    out[i] = fn(t, i);
  }
  return out;
}

function toInt16PCM(samples) {
  const buf = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  return buf;
}

function wrapWav(pcm) {
  const dataLen = pcm.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLen, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);          // subchunk1 size
  header.writeUInt16LE(1, 20);           // PCM
  header.writeUInt16LE(1, 22);           // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32);           // block align
  header.writeUInt16LE(BITS, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLen, 40);
  return Buffer.concat([header, pcm]);
}

function writeWav(name, samples) {
  const pcm = toInt16PCM(samples);
  const wav = wrapWav(pcm);
  const out = path.join(__dirname, '..', 'assets', 'sounds', name);
  fs.writeFileSync(out, wav);
  console.log(`wrote ${name} (${(wav.length / 1024).toFixed(1)} KB, ${(samples.length / SAMPLE_RATE * 1000).toFixed(0)}ms)`);
}

// ── tap.wav: a quick clicky blip with a brief pitch sweep ────────────────────
function tap() {
  const dur = 0.07;
  return render(dur, (t) => {
    const f = 880 + (1200 - 880) * Math.exp(-t * 80);
    const env = envelope(t, dur, 0.002, 0.04) * Math.exp(-t * 35);
    return 0.55 * env * sine(f, t);
  });
}

// ── pop.wav: shorter higher pop for shrink hits ──────────────────────────────
function pop() {
  const dur = 0.08;
  return render(dur, (t) => {
    const f = 1100 + (1700 - 1100) * Math.exp(-t * 40);
    const env = envelope(t, dur, 0.001, 0.05) * Math.exp(-t * 30);
    return 0.55 * env * (0.7 * sine(f, t) + 0.3 * triangle(f * 2, t));
  });
}

// ── success.wav: rising arpeggio ─────────────────────────────────────────────
function success() {
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  const noteDur = 0.12;
  const total = notes.length * noteDur + 0.05;
  return render(total, (t) => {
    const i = Math.min(notes.length - 1, Math.floor(t / noteDur));
    const local = t - i * noteDur;
    const env = envelope(local, noteDur, 0.005, 0.07) * Math.exp(-local * 6);
    const f = notes[i];
    const tone = 0.55 * sine(f, t) + 0.18 * sine(f * 2, t);
    return 0.55 * env * tone;
  });
}

// ── fail.wav: descending wah ─────────────────────────────────────────────────
function fail() {
  const dur = 0.40;
  return render(dur, (t) => {
    const f = 480 - 320 * (t / dur);
    const env = envelope(t, dur, 0.005, 0.18);
    const tone = 0.6 * triangle(f, t) + 0.2 * sine(f * 0.5, t);
    return 0.55 * env * tone;
  });
}

// ── bossHit.wav: low thud ────────────────────────────────────────────────────
function bossHit() {
  const dur = 0.18;
  return render(dur, (t) => {
    const f = 110 + 60 * Math.exp(-t * 25);
    const env = envelope(t, dur, 0.002, 0.10) * Math.exp(-t * 18);
    return 0.7 * env * (0.7 * sine(f, t) + 0.3 * noise() * Math.exp(-t * 60));
  });
}

// ── bossWin.wav: triumphant arpeggio ─────────────────────────────────────────
function bossWin() {
  const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6
  const noteDur = 0.14;
  const total = notes.length * noteDur + 0.20;
  return render(total, (t) => {
    const i = Math.min(notes.length - 1, Math.floor(t / noteDur));
    const local = t - i * noteDur;
    const env = envelope(local, noteDur, 0.005, 0.10) * Math.exp(-local * 4);
    const f = notes[i];
    const tone = 0.6 * sine(f, t) + 0.25 * sine(f * 2, t) + 0.10 * triangle(f * 4, t);
    // Add a subtle tail on the last note so it doesn't cut.
    const tail = i === notes.length - 1
      ? 0.4 * sine(notes[i], t) * Math.exp(-(t - i * noteDur - noteDur) * 6)
      : 0;
    return 0.55 * (env * tone + Math.max(0, tail));
  });
}

// ── whoosh.wav: filtered noise sweep for boss-phase change ───────────────────
function whoosh() {
  const dur = 0.32;
  // Use a leaky one-pole low-pass over noise, with cutoff sweeping down.
  const n = Math.round(dur * SAMPLE_RATE);
  const out = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    // sweep cutoff: 0.6 → 0.05 (relative)
    const cutoff = 0.6 - 0.55 * (t / dur);
    const x = noise();
    prev = prev + cutoff * (x - prev); // 1-pole LPF
    const env = envelope(t, dur, 0.01, 0.18);
    out[i] = 0.55 * env * prev;
  }
  return out;
}

writeWav('tap.wav',     tap());
writeWav('pop.wav',     pop());
writeWav('success.wav', success());
writeWav('fail.wav',    fail());
writeWav('bossHit.wav', bossHit());
writeWav('bossWin.wav', bossWin());
writeWav('whoosh.wav',  whoosh());

console.log('done.');
