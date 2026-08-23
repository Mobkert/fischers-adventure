/**
 * Generate free procedural ambient music loops (~32s) as 16-bit mono WAVs.
 * Island: chill piano + soft guitar plucks
 * Ocean: sparse piano only
 * Jungle: rainforest-ish percussion + melody
 * Reef: tropical lounge pads + muted plucks
 * Collectors: chill fingerstyle guitar harbor loop
 * Ashencast: volcanic tribal drum loop (~30s)
 * Frostpeak: secretive cold island ambient (~32s)
 * Frostpeak Cave: deeper hidden cavern ambient (~32s)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "audio");
const SR = 22050;
const DURATION = 32; // seconds — loops cleanly
const N = SR * DURATION;

function freq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function clamp(v) {
  return Math.max(-1, Math.min(1, v));
}

/** Soft piano-ish tone (additive + decay). */
function piano(t, f, vel = 0.35) {
  const d = Math.exp(-2.2 * t);
  const a = Math.min(1, t * 80);
  const s =
    Math.sin(2 * Math.PI * f * t) * 0.55 +
    Math.sin(2 * Math.PI * f * 2 * t) * 0.22 +
    Math.sin(2 * Math.PI * f * 3 * t) * 0.1 +
    Math.sin(2 * Math.PI * f * 4.01 * t) * 0.05;
  return s * d * a * vel;
}

/** Plucked guitar-ish (brighter, quicker decay). */
function guitar(t, f, vel = 0.28) {
  const d = Math.exp(-3.8 * t);
  const a = Math.min(1, t * 120);
  const s =
    Math.sin(2 * Math.PI * f * t) * 0.4 +
    Math.sin(2 * Math.PI * f * 2 * t) * 0.28 +
    Math.sin(2 * Math.PI * f * 3 * t) * 0.14 +
    Math.sin(2 * Math.PI * f * 5 * t) * 0.06;
  return s * d * a * vel;
}

function noise() {
  return Math.random() * 2 - 1;
}

function writeWav(filePath, samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = clamp(samples[i]);
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  fs.writeFileSync(filePath, buf);
  console.log("wrote", filePath, `(${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
}

/** Island — Cmaj7 chill loop, piano chords + guitar arpeggios */
function makeIsland() {
  const samples = new Float32Array(N);
  const bpm = 72;
  const beat = 60 / bpm;
  // Chord tones (MIDI): Cmaj7, Am7, Fmaj7, G6 — 8 bars each feel
  const progression = [
    [60, 64, 67, 71], // C E G B
    [57, 60, 64, 67], // A C E G
    [53, 57, 60, 64], // F A C E
    [55, 59, 62, 67], // G B D G
  ];
  const events = [];
  const bars = 8; // 8 bars * 4 beats * beat ≈ covers ~32s at 72bpm: 8*4*(60/72)=26.6, add more
  for (let bar = 0; bar < 10; bar++) {
    const chord = progression[bar % 4];
    const t0 = bar * 4 * beat;
    // Piano block chord on beat 1
    for (const m of chord) {
      events.push({ t: t0, type: "piano", midi: m, vel: 0.22 });
      events.push({ t: t0 + beat * 2, type: "piano", midi: m, vel: 0.14 });
    }
    // Soft bass
    events.push({ t: t0, type: "piano", midi: chord[0] - 12, vel: 0.18 });
    // Guitar arpeggio
    const arp = [chord[0], chord[1], chord[2], chord[3], chord[2], chord[1]];
    arp.forEach((m, i) => {
      events.push({
        t: t0 + beat * 0.5 + i * (beat / 3),
        type: "guitar",
        midi: m + 12,
        vel: 0.16,
      });
    });
  }

  for (let i = 0; i < N; i++) {
    const t = i / SR;
    let v = 0;
    for (const e of events) {
      const age = t - e.t;
      if (age < 0 || age > 3.5) continue;
      const f = freq(e.midi);
      v += e.type === "guitar" ? guitar(age, f, e.vel) : piano(age, f, e.vel);
    }
    // gentle bed pad
    const pad =
      Math.sin(2 * Math.PI * freq(60) * t) * 0.015 * Math.sin(Math.PI * t / DURATION) +
      Math.sin(2 * Math.PI * freq(67) * t) * 0.012;
    samples[i] = v + pad;
  }
  // Fade ends for seamless loop
  const fade = Math.floor(SR * 0.4);
  for (let i = 0; i < fade; i++) {
    const w = i / fade;
    samples[i] *= w;
    samples[N - 1 - i] *= w;
  }
  return samples;
}

/** Deterministic RNG so tracks stay the same each generate. */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/** Soft sustained pad tone. */
function padTone(tAbs, f, amp) {
  return (
    (Math.sin(2 * Math.PI * f * tAbs) * 0.55 +
      Math.sin(2 * Math.PI * f * 1.997 * tAbs) * 0.25 +
      Math.sin(2 * Math.PI * f * 0.5 * tAbs) * 0.2) *
    amp
  );
}

/** Ocean — airy pads + irregular piano phrases (no looping motif). */
function makeOcean() {
  const samples = new Float32Array(N);
  const rng = mulberry32(0x0cea142);
  const scale = [48, 50, 52, 55, 57, 59, 60, 62, 64, 67, 69, 71, 72];
  const events = [];

  // Evolving chord bed changes every ~8s (different each section)
  const sections = [
    [48, 55, 60, 67],
    [45, 52, 59, 64],
    [50, 57, 62, 69],
    [47, 54, 59, 66],
  ];

  // Irregular piano phrases — different shapes, long rests between
  let t = 0.8 + rng() * 1.5;
  let phrase = 0;
  while (t < DURATION - 3) {
    const len = 3 + Math.floor(rng() * 5); // 3–7 notes
    const startDeg = Math.floor(rng() * 5);
    const rising = rng() > 0.45;
    for (let i = 0; i < len; i++) {
      const idx = Math.max(
        0,
        Math.min(scale.length - 1, startDeg + (rising ? i : -i) + Math.floor(rng() * 2))
      );
      const midi = scale[idx] + (rng() > 0.7 ? 12 : 0);
      const vel = 0.1 + rng() * 0.12;
      events.push({ t, midi, vel });
      // sometimes a soft dyad
      if (rng() > 0.75) {
        events.push({ t: t + 0.04, midi: midi + (rng() > 0.5 ? 3 : 7), vel: vel * 0.55 });
      }
      t += 0.35 + rng() * 0.85; // uneven rhythm
    }
    // long breathing rest — grows slightly over the track
    t += 2.2 + rng() * 2.8 + phrase * 0.15;
    phrase++;
  }

  for (let i = 0; i < N; i++) {
    const time = i / SR;
    let v = 0;

    // Section pad (crossfade between chord sets)
    const secF = (time / DURATION) * sections.length;
    const s0 = Math.min(sections.length - 1, Math.floor(secF));
    const s1 = Math.min(sections.length - 1, s0 + 1);
    const blend = secF - s0;
    const ampEnv = 0.35 + 0.15 * Math.sin(time * 0.2);
    for (let k = 0; k < 4; k++) {
      const a0 = padTone(time, freq(sections[s0][k]), 0.012 * ampEnv * (1 - blend));
      const a1 = padTone(time, freq(sections[s1][k]), 0.012 * ampEnv * blend);
      v += a0 + a1;
    }

    for (const e of events) {
      const age = time - e.t;
      if (age < 0 || age > 5) continue;
      v += piano(age, freq(e.midi), e.vel);
    }

    // very soft sea wash (filtered noise swell, not rhythmic)
    const wash =
      (noise() * 0.015 + Math.sin(2 * Math.PI * 0.05 * time) * 0.01) *
      (0.4 + 0.3 * Math.sin(2 * Math.PI * 0.03 * time));
    // simple one-pole feel
    v += wash * 0.35;

    samples[i] = v;
  }
  const fade = Math.floor(SR * 0.8);
  for (let i = 0; i < fade; i++) {
    const w = i / fade;
    samples[i] *= w;
    samples[N - 1 - i] *= w;
  }
  return samples;
}

/** Jungle — humid drones, sparse wildlife, rare drums (not a grid loop). */
function makeJungle() {
  const samples = new Float32Array(N);
  const rng = mulberry32(0x5a117e7);
  const pent = [55, 57, 60, 62, 64, 67, 69, 72, 74, 76];
  const events = [];

  // Sparse, irregular percussion — clusters then silence
  let t = 1.5;
  while (t < DURATION - 2) {
    const cluster = 1 + Math.floor(rng() * 3);
    for (let c = 0; c < cluster; c++) {
      events.push({
        t: t + c * (0.15 + rng() * 0.25),
        type: "drum",
        vel: 0.08 + rng() * 0.1,
      });
      if (rng() > 0.5) {
        events.push({
          t: t + c * 0.2 + 0.08,
          type: "shaker",
          vel: 0.04 + rng() * 0.05,
        });
      }
    }
    t += 3.5 + rng() * 5.5; // long gaps
  }

  // Bird / flute chirps — unique each time, not on a beat
  t = 0.5 + rng();
  while (t < DURATION - 1) {
    const nNotes = 1 + Math.floor(rng() * 4);
    let tt = t;
    for (let i = 0; i < nNotes; i++) {
      events.push({
        t: tt,
        type: "flute",
        midi: pick(rng, pent) + (rng() > 0.6 ? 12 : 0),
        vel: 0.08 + rng() * 0.1,
      });
      tt += 0.12 + rng() * 0.35;
    }
    t += 2.0 + rng() * 4.5;
  }

  // Occasional soft marimba drops — different phrases
  t = 2 + rng() * 2;
  while (t < DURATION - 2) {
    const phrase = [
      pick(rng, pent),
      pick(rng, pent),
      pick(rng, pent.slice(2)),
    ];
    phrase.forEach((m, i) => {
      events.push({
        t: t + i * (0.4 + rng() * 0.3),
        type: "marimba",
        midi: m,
        vel: 0.09 + rng() * 0.08,
      });
    });
    t += 5 + rng() * 7;
  }

  let lp = 0;
  for (let i = 0; i < N; i++) {
    const time = i / SR;
    let v = 0;

    // Slow-moving humid drones (pitch drifts over the track)
    const drift = Math.sin(time * 0.07) * 3;
    v += Math.sin(2 * Math.PI * (52 + drift) * time) * 0.018;
    v += Math.sin(2 * Math.PI * (78 + drift * 0.5) * time) * 0.01;
    v += Math.sin(2 * Math.PI * (98 - drift) * time) * 0.007;
    // soft noise canopy (leaves), not rhythmic
    const canopy =
      noise() * 0.02 * (0.5 + 0.5 * Math.sin(time * 0.11 + 1.7));
    v += canopy;

    for (const e of events) {
      const age = time - e.t;
      if (age < 0 || age > 1.4) continue;
      if (e.type === "shaker") {
        const env = Math.exp(-14 * age) * e.vel;
        v += noise() * env * 0.4;
      } else if (e.type === "drum") {
        const env = Math.exp(-7 * age) * e.vel;
        v += Math.sin(2 * Math.PI * (65 + age * -30) * age) * env;
        v += noise() * Math.exp(-22 * age) * e.vel * 0.2;
      } else if (e.type === "flute") {
        const env = Math.min(1, age * 30) * Math.exp(-2.4 * age) * e.vel;
        const f = freq(e.midi);
        // slight vibrato — birdlike
        const vib = 1 + 0.004 * Math.sin(2 * Math.PI * 5.5 * time);
        v += Math.sin(2 * Math.PI * f * vib * time) * env * 0.85;
      } else if (e.type === "marimba") {
        const env = Math.exp(-4.2 * age) * e.vel;
        const f = freq(e.midi);
        v +=
          (Math.sin(2 * Math.PI * f * age) * 0.65 +
            Math.sin(2 * Math.PI * f * 2.01 * age) * 0.2) *
          env;
      }
    }

    lp = lp * 0.9 + v * 0.1;
    samples[i] = lp * 0.65 + v * 0.4;
  }
  const fade = Math.floor(SR * 0.7);
  for (let i = 0; i < fade; i++) {
    const w = i / fade;
    samples[i] *= w;
    samples[N - 1 - i] *= w;
  }
  return samples;
}

/**
 * Coral reef — chill tropical ambient (~32s).
 * Soft pads, muted plucks, low steel accents — mature lounge, not sparkly/festive.
 */
function makeReef() {
  const samples = new Float32Array(N);
  const bpm = 78;
  const beat = 60 / bpm;
  // Laid-back maj7 / add9 colors (warm, not jingle-bells major)
  const progression = [
    [48, 55, 59, 62], // Cmaj7-ish low
    [53, 57, 60, 64], // Fmaj7
    [45, 52, 55, 60], // Am9-ish
    [50, 57, 60, 64], // Gadd9-ish
  ];
  const events = [];

  for (let bar = 0; bar < 12; bar++) {
    const chord = progression[bar % 4];
    const t0 = bar * 4 * beat;
    if (t0 >= DURATION - 0.8) break;

    // Deep bass on 1 and soft on 3
    events.push({ t: t0, type: "bass", midi: chord[0], vel: 0.2 });
    events.push({
      t: t0 + beat * 2,
      type: "bass",
      midi: chord[0],
      vel: 0.1,
    });

    // Sparse muted plucks (not busy uke chops)
    const pluck = [chord[1], chord[2], chord[3], chord[2]];
    pluck.forEach((m, i) => {
      if ((bar + i) % 3 === 0) return; // leave holes
      events.push({
        t: t0 + beat * (0.5 + i * 0.75),
        type: "pluck",
        midi: m + 12,
        vel: 0.08 + (i === 0 ? 0.03 : 0),
      });
    });

    // Occasional soft mid-range accent (not high sparkly lead)
    if (bar % 4 === 1 || bar % 4 === 3) {
      events.push({
        t: t0 + beat * 2.5,
        type: "mallet",
        midi: chord[2] + 12,
        vel: 0.09,
      });
      events.push({
        t: t0 + beat * 3.25,
        type: "mallet",
        midi: chord[1] + 12,
        vel: 0.06,
      });
    }
  }

  let lp = 0;
  for (let i = 0; i < N; i++) {
    const time = i / SR;
    let v = 0;

    // Slow evolving pad — dark and warm
    const drift = Math.sin(time * 0.09) * 1.5;
    const padAmp = 0.016 * (0.75 + 0.25 * Math.sin(time * 0.18));
    v += Math.sin(2 * Math.PI * (110 + drift) * time) * padAmp;
    v += Math.sin(2 * Math.PI * (138 + drift * 0.4) * time) * padAmp * 0.55;
    v += Math.sin(2 * Math.PI * (164 - drift * 0.3) * time) * padAmp * 0.35;
    // Gentle fifth bed
    v += Math.sin(2 * Math.PI * freq(55) * time) * 0.01;
    v += Math.sin(2 * Math.PI * freq(62) * time) * 0.007;

    for (const e of events) {
      const age = time - e.t;
      if (age < 0 || age > 4) continue;
      const f = freq(e.midi);
      if (e.type === "bass") {
        const env = Math.min(1, age * 28) * Math.exp(-2.2 * age) * e.vel;
        v += Math.sin(2 * Math.PI * f * age) * env;
        v += Math.sin(2 * Math.PI * f * 2 * age) * env * 0.15;
      } else if (e.type === "pluck") {
        // Soft nylon-ish, quick decay — no metallic ring
        const env = Math.min(1, age * 70) * Math.exp(-4.8 * age) * e.vel;
        v +=
          (Math.sin(2 * Math.PI * f * age) * 0.55 +
            Math.sin(2 * Math.PI * f * 2 * age) * 0.18) *
          env;
      } else if (e.type === "mallet") {
        // Soft wooden mallet, mid register only
        const env = Math.min(1, age * 50) * Math.exp(-3.6 * age) * e.vel;
        v +=
          (Math.sin(2 * Math.PI * f * age) * 0.5 +
            Math.sin(2 * Math.PI * f * 2.01 * age) * 0.12) *
          env;
      }
    }

    // Distant water hush (not foamy sparkle)
    const wash =
      noise() *
      0.012 *
      (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.05 * time + 1.2));
    lp = lp * 0.94 + (v + wash) * 0.06;
    samples[i] = v * 0.7 + lp * 0.4;
  }

  const fade = Math.floor(SR * 0.6);
  for (let i = 0; i < fade; i++) {
    const w = i / fade;
    samples[i] *= w;
    samples[N - 1 - i] *= w;
  }
  return samples;
}

/**
 * Collector's Harbor — chill fingerstyle guitar (~32s).
 * Soft nylon arpeggios, sparse bass, warm pad — relaxed town vibe.
 */
function makeCollectors() {
  const samples = new Float32Array(N);
  const bpm = 68;
  const beat = 60 / bpm;
  // Warm maj7 / add9 — harbor evening feel
  const progression = [
    [52, 55, 59, 62], // E-ish soft
    [48, 52, 55, 59], // Cmaj7 low
    [50, 53, 57, 60], // Dm9-ish
    [47, 50, 54, 57], // Bsus-ish
  ];
  const events = [];

  for (let bar = 0; bar < 11; bar++) {
    const chord = progression[bar % 4];
    const t0 = bar * 4 * beat;
    if (t0 >= DURATION - 0.5) break;

    // Soft thumb bass
    events.push({ t: t0, type: "bass", midi: chord[0] - 12, vel: 0.18 });
    events.push({
      t: t0 + beat * 2,
      type: "bass",
      midi: chord[0] - 12,
      vel: 0.1,
    });

    // Fingerstyle arpeggio (travis-ish, not busy)
    const arp = [
      chord[0],
      chord[2],
      chord[1],
      chord[3],
      chord[2],
      chord[1],
      chord[3],
      chord[2],
    ];
    arp.forEach((m, i) => {
      // Leave holes every other bar on some notes
      if (bar % 2 === 1 && i === 3) return;
      if (bar % 3 === 2 && i === 6) return;
      events.push({
        t: t0 + beat * (i * 0.5),
        type: "guitar",
        midi: m + 12,
        vel: 0.14 + (i === 0 ? 0.04 : 0),
      });
    });

    // Occasional double-stop harmony
    if (bar % 4 === 0 || bar % 4 === 2) {
      events.push({
        t: t0 + beat * 3.5,
        type: "guitar",
        midi: chord[2] + 12,
        vel: 0.1,
      });
      events.push({
        t: t0 + beat * 3.55,
        type: "guitar",
        midi: chord[3] + 12,
        vel: 0.07,
      });
    }
  }

  let lp = 0;
  for (let i = 0; i < N; i++) {
    const time = i / SR;
    let v = 0;

    // Warm low pad
    const drift = Math.sin(time * 0.08) * 1.2;
    const padAmp = 0.012 * (0.8 + 0.2 * Math.sin(time * 0.15));
    v += Math.sin(2 * Math.PI * (98 + drift) * time) * padAmp;
    v += Math.sin(2 * Math.PI * (123 + drift * 0.5) * time) * padAmp * 0.45;
    v += Math.sin(2 * Math.PI * freq(52) * time) * 0.008;

    for (const e of events) {
      const age = time - e.t;
      if (age < 0 || age > 4.5) continue;
      const f = freq(e.midi);
      if (e.type === "bass") {
        const env = Math.min(1, age * 35) * Math.exp(-2.4 * age) * e.vel;
        v += Math.sin(2 * Math.PI * f * age) * env;
        v += Math.sin(2 * Math.PI * f * 2 * age) * env * 0.12;
      } else {
        v += guitar(age, f, e.vel);
      }
    }

    // Soft room hush
    const hush =
      noise() *
      0.008 *
      (0.45 + 0.55 * Math.sin(2 * Math.PI * 0.04 * time));
    lp = lp * 0.93 + (v + hush) * 0.07;
    samples[i] = v * 0.75 + lp * 0.35;
  }

  const fade = Math.floor(SR * 0.55);
  for (let i = 0; i < fade; i++) {
    const w = i / fade;
    samples[i] *= w;
    samples[N - 1 - i] *= w;
  }
  return samples;
}

/** Ashencast — volcanic tribal drums (~30s, 9 bars @ 72 BPM). */
function makeAshencast() {
  const duration = 30;
  const n = SR * duration;
  const samples = new Float32Array(n);
  const bpm = 72;
  const beat = 60 / bpm;
  const bars = 9;
  const events = [];

  for (let bar = 0; bar < bars; bar++) {
    const t0 = bar * 4 * beat;
    if (t0 >= duration - 0.05) break;
    const accent = bar % 4 === 3;

    // Deep taiko — downbeats
    events.push({ t: t0, type: "taiko", vel: 0.34 });
    events.push({ t: t0 + beat * 2, type: "taiko", vel: accent ? 0.38 : 0.26 });

    // Mid toms — offbeats & syncopation
    events.push({ t: t0 + beat * 1, type: "tom", midi: 48, vel: 0.14 });
    events.push({ t: t0 + beat * 3, type: "tom", midi: 45, vel: 0.12 });
    if (bar % 2 === 1) {
      events.push({ t: t0 + beat * 1.5, type: "tom", midi: 50, vel: 0.1 });
    }

    // Frame drum / rim chatter
    events.push({ t: t0 + beat * 0.5, type: "frame", vel: 0.09 });
    events.push({ t: t0 + beat * 2.5, type: "frame", vel: 0.08 });
    events.push({ t: t0 + beat * 3.5, type: "frame", vel: 0.07 });

    // Fill every 4th bar
    if (accent) {
      events.push({ t: t0 + beat * 3.25, type: "tom", midi: 52, vel: 0.16 });
      events.push({ t: t0 + beat * 3.5, type: "rim", vel: 0.11 });
      events.push({ t: t0 + beat * 3.75, type: "taiko", vel: 0.22 });
    }
  }

  let lp = 0;
  for (let i = 0; i < n; i++) {
    const time = i / SR;
    let v = 0;

    // Smoldering low rumble (volcano bed)
    const swell = 0.82 + 0.18 * Math.sin(2 * Math.PI * time / duration);
    v += Math.sin(2 * Math.PI * 38 * time) * 0.028 * swell;
    v += Math.sin(2 * Math.PI * 57 * time) * 0.018 * swell;
    v += Math.sin(2 * Math.PI * 76 * time) * 0.01 * swell;
    // Heat shimmer
    v +=
      noise() *
      0.014 *
      (0.35 + 0.65 * Math.sin(2 * Math.PI * 0.11 * time + 0.6));

    for (const e of events) {
      const age = time - e.t;
      if (age < 0 || age > 1.6) continue;
      if (e.type === "taiko") {
        const env = Math.exp(-5.2 * age) * e.vel;
        const pitch = 62 + age * -95;
        v += Math.sin(2 * Math.PI * pitch * age) * env;
        v += Math.sin(2 * Math.PI * (pitch * 0.5) * age) * env * 0.45;
        v += noise() * Math.exp(-20 * age) * e.vel * 0.32;
      } else if (e.type === "tom") {
        const f = freq(e.midi);
        const env = Math.exp(-7.5 * age) * e.vel;
        v += Math.sin(2 * Math.PI * f * age) * env;
        v += noise() * Math.exp(-28 * age) * e.vel * 0.18;
      } else if (e.type === "frame") {
        const env = Math.exp(-16 * age) * e.vel;
        v += noise() * env * 0.55;
        v += Math.sin(2 * Math.PI * 180 * age) * env * 0.25;
      } else if (e.type === "rim") {
        const env = Math.exp(-22 * age) * e.vel;
        v += Math.sin(2 * Math.PI * 420 * age) * env * 0.35;
        v += noise() * env * 0.2;
      }
    }

    lp = lp * 0.88 + v * 0.12;
    samples[i] = v * 0.72 + lp * 0.28;
  }

  const fade = Math.floor(SR * 0.45);
  for (let i = 0; i < fade; i++) {
    const w = i / fade;
    samples[i] *= w;
    samples[n - 1 - i] *= w;
  }
  return samples;
}

/** Frostpeak Isle — secretive cold ambient, sparse bells & wind. */
function makeFrostpeak() {
  const samples = new Float32Array(N);
  const rng = mulberry32(0xf057ea00);
  const scale = [60, 62, 63, 65, 67, 70, 72];
  const events = [];

  let t = 1.4 + rng() * 2.2;
  while (t < DURATION - 2.5) {
    events.push({
      t,
      type: "bell",
      midi: pick(rng, scale) + (rng() > 0.65 ? 12 : 0),
      vel: 0.06 + rng() * 0.09,
    });
    if (rng() > 0.5) {
      events.push({
        t: t + 0.1 + rng() * 0.2,
        type: "ghost",
        midi: pick(rng, scale) + (rng() > 0.5 ? 7 : -5),
        vel: 0.035 + rng() * 0.05,
      });
    }
    t += 2.6 + rng() * 4.4;
  }

  let lp = 0;
  for (let i = 0; i < N; i++) {
    const time = i / SR;
    let v = 0;
    const breathe = 0.75 + 0.25 * Math.sin(2 * Math.PI * time / DURATION);
    v += Math.sin(2 * Math.PI * freq(50) * time) * 0.012 * breathe;
    v += Math.sin(2 * Math.PI * freq(58) * time) * 0.009 * breathe;
    v += Math.sin(2 * Math.PI * freq(65) * time) * 0.006 * breathe;
    const wind =
      noise() *
      0.013 *
      (0.25 + 0.75 * Math.sin(2 * Math.PI * 0.038 * time + 0.9));

    for (const e of events) {
      const age = time - e.t;
      if (age < 0 || age > 6.5) continue;
      const f = freq(e.midi);
      if (e.type === "bell") {
        const env = Math.min(1, age * 18) * Math.exp(-1.7 * age) * e.vel;
        v += Math.sin(2 * Math.PI * f * age) * env * 0.75;
        v += Math.sin(2 * Math.PI * f * 2.01 * age) * env * 0.14;
        if (age > 0.25) {
          v +=
            Math.sin(2 * Math.PI * f * (age - 0.15)) *
            Math.exp(-3.8 * age) *
            e.vel *
            0.07;
        }
      } else {
        const env = Math.exp(-3.4 * age) * e.vel;
        v += Math.sin(2 * Math.PI * f * age) * env * 0.55;
      }
    }

    lp = lp * 0.92 + (v + wind) * 0.08;
    samples[i] = v * 0.7 + lp * 0.35;
  }

  const fade = Math.floor(SR * 0.65);
  for (let i = 0; i < fade; i++) {
    const w = i / fade;
    samples[i] *= w;
    samples[N - 1 - i] *= w;
  }
  return samples;
}

/** Frostpeak Cave — hushed cavern drones, drips, rare crystal pings. */
function makeFrostpeakCave() {
  const samples = new Float32Array(N);
  const rng = mulberry32(0xca0ef057);
  const events = [];

  let t = 0.6 + rng() * 1.2;
  while (t < DURATION - 0.5) {
    events.push({ t, type: "drip", vel: 0.035 + rng() * 0.055 });
    t += 1.6 + rng() * 3.8;
  }

  t = 2.2 + rng() * 2;
  while (t < DURATION - 1.5) {
    events.push({
      t,
      type: "crystal",
      midi: pick(rng, [72, 74, 76, 79, 84, 86]),
      vel: 0.045 + rng() * 0.07,
    });
    if (rng() > 0.6) {
      events.push({
        t: t + 0.12 + rng() * 0.18,
        type: "whisper",
        midi: pick(rng, [67, 70, 74]),
        vel: 0.03 + rng() * 0.04,
      });
    }
    t += 4.8 + rng() * 6.2;
  }

  let lp = 0;
  for (let i = 0; i < N; i++) {
    const time = i / SR;
    let v = 0;
    const pulse = 0.8 + 0.2 * Math.sin(2 * Math.PI * 0.06 * time);
    v += Math.sin(2 * Math.PI * 40 * time) * 0.014 * pulse;
    v += Math.sin(2 * Math.PI * 61 * time) * 0.009 * pulse;
    v += Math.sin(2 * Math.PI * 82 * time) * 0.005 * pulse;

    for (const e of events) {
      const age = time - e.t;
      if (age < 0) continue;
      if (e.type === "drip") {
        if (age > 0.35) continue;
        const env = Math.exp(-38 * age) * e.vel;
        v += Math.sin(2 * Math.PI * (720 + age * -1800) * age) * env;
        v += noise() * env * 0.35;
      } else if (e.type === "crystal") {
        if (age > 5.5) continue;
        const f = freq(e.midi);
        const env = Math.min(1, age * 35) * Math.exp(-2.1 * age) * e.vel;
        v += Math.sin(2 * Math.PI * f * age) * env;
        v += Math.sin(2 * Math.PI * f * 3.01 * age) * env * 0.1;
      } else if (e.type === "whisper") {
        if (age > 3.5) continue;
        const f = freq(e.midi);
        const env = Math.exp(-2.8 * age) * e.vel;
        v += Math.sin(2 * Math.PI * f * age) * env * 0.45;
      }
    }

    const hush =
      noise() *
      0.008 *
      (0.35 + 0.65 * Math.sin(2 * Math.PI * 0.025 * time + 2.1));
    lp = lp * 0.93 + (v + hush) * 0.07;
    samples[i] = v * 0.78 + lp * 0.32;
  }

  const fade = Math.floor(SR * 0.7);
  for (let i = 0; i < fade; i++) {
    const w = i / fade;
    samples[i] *= w;
    samples[N - 1 - i] *= w;
  }
  return samples;
}

fs.mkdirSync(OUT, { recursive: true });
writeWav(path.join(OUT, "music_island.wav"), makeIsland());
writeWav(path.join(OUT, "music_ocean.wav"), makeOcean());
writeWav(path.join(OUT, "music_jungle.wav"), makeJungle());
writeWav(path.join(OUT, "music_reef.wav"), makeReef());
writeWav(path.join(OUT, "music_collectors.wav"), makeCollectors());
writeWav(path.join(OUT, "music_ashencast.wav"), makeAshencast());
writeWav(path.join(OUT, "music_frostpeak.wav"), makeFrostpeak());
writeWav(path.join(OUT, "music_frostpeak_cave.wav"), makeFrostpeakCave());
console.log("done");
