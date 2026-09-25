import Phaser from "phaser";

/** Centered per-letter text for multi-color gradient waves. */
export function createGradientWaveText(
  scene: Phaser.Scene,
  str: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
  originY = 0
): {
  root: Phaser.GameObjects.Container;
  letters: Phaser.GameObjects.Text[];
  height: number;
  width: number;
} {
  const root = scene.add.container(0, 0);
  const letters: Phaser.GameObjects.Text[] = [];
  let x = 0;
  for (const ch of str) {
    const glyph = ch === " " ? "\u00A0" : ch;
    const letter = scene.add.text(x, 0, glyph, style).setOrigin(0, originY);
    letters.push(letter);
    root.add(letter);
    x += letter.width;
  }
  const totalW = x;
  for (const letter of letters) {
    letter.x -= totalW / 2;
  }
  return {
    root,
    letters,
    height: letters[0]?.height ?? 16,
    width: totalW,
  };
}

/**
 * Swipe a multi-stop color wave across letter groups so several colors
 * show on the same word at once. Optionally wave rectangle stroke colors
 * (e.g. bestiary mystical card outlines). Returns a stop function.
 */
export function startGradientColorWave(
  scene: Phaser.Scene,
  letterGroups: Phaser.GameObjects.Text[][],
  colorHexes: number[],
  speed = 0.0016,
  strokeTargets?: Phaser.GameObjects.Rectangle[]
): () => void {
  const colors = colorHexes.map((c) => Phaser.Display.Color.ValueToColor(c));
  if (colors.length === 0) return () => undefined;
  let phase = 0;

  const sampleColor = (offset: number): { hex: string; num: number } => {
    const n = colors.length;
    const cycle = ((phase - offset) / (Math.PI * 2)) % 1;
    const u = cycle < 0 ? cycle + 1 : cycle;
    const scaled = u * n;
    const i0 = Math.floor(scaled) % n;
    const i1 = (i0 + 1) % n;
    const f = scaled - Math.floor(scaled);
    const a = colors[i0]!;
    const b = colors[i1]!;
    const r = Math.round(Phaser.Math.Linear(a.red, b.red, f));
    const g = Math.round(Phaser.Math.Linear(a.green, b.green, f));
    const bl = Math.round(Phaser.Math.Linear(a.blue, b.blue, f));
    return {
      hex: Phaser.Display.Color.RGBToString(r, g, bl, 0, "#"),
      num: (r << 16) | (g << 8) | bl,
    };
  };

  const onUpdate = (_time: number, delta: number) => {
    phase += delta * speed;
    for (const letters of letterGroups) {
      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i]!;
        if (!letter.active) continue;
        letter.setColor(sampleColor(i * 0.55).hex);
      }
    }
    if (strokeTargets) {
      for (let i = 0; i < strokeTargets.length; i++) {
        const card = strokeTargets[i]!;
        if (!card.active) continue;
        card.setStrokeStyle(2, sampleColor(i * 0.8).num);
      }
    }
  };
  scene.events.on("update", onUpdate);
  return () => scene.events.off("update", onUpdate);
}
