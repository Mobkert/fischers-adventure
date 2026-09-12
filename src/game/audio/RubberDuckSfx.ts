import Phaser from "phaser";

function getAudioContext(scene: Phaser.Scene): AudioContext | null {
  try {
    if (scene.sound.locked) scene.sound.unlock();
    const mgr = scene.sound as Phaser.Sound.WebAudioSoundManager;
    const ctx = (mgr as unknown as { context?: AudioContext }).context;
    if (!ctx) return null;
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Cartoony rubber-duck quack — two-syllable “kwaaa-ack” with a nasal
 * bandpass and a big pitch dive (classic toy-duck cartoon feel).
 */
export function playRubberDuckQuackSfx(
  scene: Phaser.Scene,
  hitIndex = 0
): void {
  const ctx = getAudioContext(scene);
  if (!ctx) return;
  const now = ctx.currentTime;
  const step = Math.max(0, hitIndex);
  // Slight variety so rapid hits don’t sound identical
  const detune = 1 + ((step % 5) - 2) * 0.03;

  const playSyllable = (
    start: number,
    highHz: number,
    lowHz: number,
    dur: number,
    peak: number
  ) => {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc2.type = "square";

    osc.frequency.setValueAtTime(highHz * detune, start);
    osc.frequency.exponentialRampToValueAtTime(lowHz * detune, start + dur * 0.85);
    osc2.frequency.setValueAtTime(highHz * 0.5 * detune, start);
    osc2.frequency.exponentialRampToValueAtTime(
      lowHz * 0.55 * detune,
      start + dur * 0.85
    );

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1100, start);
    filter.frequency.exponentialRampToValueAtTime(720, start + dur);
    filter.Q.value = 7.5;

    const o2g = ctx.createGain();
    o2g.gain.value = 0.38;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    gain.gain.setValueAtTime(peak * 0.85, start + dur * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(filter);
    osc2.connect(o2g);
    o2g.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc2.start(start);
    osc.stop(start + dur + 0.02);
    osc2.stop(start + dur + 0.02);
  };

  // “Kwaaa” — big dive
  playSyllable(now, 780, 240, 0.16, 0.55);
  // “Ack” — shorter follow-up
  playSyllable(now + 0.09, 520, 190, 0.11, 0.35);

  // Soft plosive click at the start (beak open)
  {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
    }
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = buf;
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 2;
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }
}
