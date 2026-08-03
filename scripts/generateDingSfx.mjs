/**
 * Generate catch ding SFX as short 16-bit mono WAVs.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "audio");
const SR = 22050;

function clamp(v) {
  return Math.max(-1, Math.min(1, v));
}

function writeWav(filePath, samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE((clamp(samples[i]) * 32767) | 0, 44 + i * 2);
  }
  fs.writeFileSync(filePath, buf);
  console.log("wrote", path.basename(filePath));
}

/** Bright bell / ding tone. */
function dingAt(samples, startSec, freq, vel = 0.55) {
  const start = Math.floor(startSec * SR);
  const len = Math.floor(0.45 * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-6.5 * t) * Math.min(1, t * 200);
    const s =
      Math.sin(2 * Math.PI * freq * t) * 0.7 +
      Math.sin(2 * Math.PI * freq * 2.01 * t) * 0.22 +
      Math.sin(2 * Math.PI * freq * 3.02 * t) * 0.08;
    const idx = start + i;
    if (idx < samples.length) samples[idx] += s * env * vel;
  }
}

function makeSingle() {
  const samples = new Float32Array(Math.floor(SR * 0.55));
  dingAt(samples, 0, 988); // B5
  writeWav(path.join(OUT, "sfx_ding.wav"), samples);
}

function makeTriple() {
  const samples = new Float32Array(Math.floor(SR * 0.95));
  dingAt(samples, 0.0, 784, 0.5); // G5
  dingAt(samples, 0.14, 988, 0.55); // B5
  dingAt(samples, 0.28, 1319, 0.6); // E6
  writeWav(path.join(OUT, "sfx_ding_triple.wav"), samples);
}

fs.mkdirSync(OUT, { recursive: true });
makeSingle();
makeTriple();
