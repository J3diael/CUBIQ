// Generates the timer's short feedback sounds as small 16-bit mono WAV files, so the
// app ships its own sounds (no licensing questions) and they work offline.
// Run: node scripts/generate-sounds.mjs
import { Buffer } from 'node:buffer';
import { writeFileSync } from 'node:fs';

const RATE = 22050;

/** Sine tones with a quick fade in and out, so there are no clicks. */
function tones(parts) {
  const samples = [];
  for (const { freq, ms, gap = 0, volume = 0.5 } of parts) {
    const n = Math.round((RATE * ms) / 1000);
    const fade = Math.min(n / 4, RATE * 0.005);
    for (let i = 0; i < n; i++) {
      const env = Math.min(1, i / fade, (n - i) / fade);
      samples.push(Math.sin((2 * Math.PI * freq * i) / RATE) * volume * env);
    }
    for (let i = 0; i < Math.round((RATE * gap) / 1000); i++) samples.push(0);
  }
  return samples;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(s * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const sounds = {
  // Timer is ready: a short high tick.
  ready: tones([{ freq: 1320, ms: 45, volume: 0.35 }]),
  // Timer stopped: a soft low tick.
  stop: tones([{ freq: 660, ms: 60, volume: 0.35 }]),
  // Inspection warnings at 8 s and 12 s.
  warning: tones([{ freq: 880, ms: 140, volume: 0.5 }]),
  // New personal best: a rising two-note chime.
  record: tones([
    { freq: 784, ms: 110, gap: 20, volume: 0.45 },
    { freq: 1175, ms: 180, volume: 0.45 },
  ]),
};

for (const [name, samples] of Object.entries(sounds)) {
  writeFileSync(new URL(`../assets/sounds/${name}.wav`, import.meta.url), wav(samples));
  console.log(`assets/sounds/${name}.wav`, samples.length, 'samples');
}
