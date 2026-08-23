/** Birthday Rod — pink & red curved blank with party ribbon wraps. */

function drawCurvedBlank(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number,
  bulge = 14
): void {
  const midX = (handX + tipX) / 2 + bulge;
  const midY = (handY + tipY) / 2 - bulge * 0.35;
  const steps = 14;
  let px = handX;
  let py = handY;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * handX + 2 * u * t * midX + t * t * tipX;
    const y = u * u * handY + 2 * u * t * midY + t * t * tipY;
    g.lineStyle(7, 0x8a1838, 1);
    g.lineBetween(px, py, x, y);
    px = x;
    py = y;
  }
  px = handX;
  py = handY;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * handX + 2 * u * t * midX + t * t * tipX;
    const y = u * u * handY + 2 * u * t * midY + t * t * tipY;
    g.lineStyle(4.5, 0xff5588, 1);
    g.lineBetween(px, py, x, y);
    px = x;
    py = y;
  }
  px = handX;
  py = handY;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * handX + 2 * u * t * midX + t * t * tipX;
    const y = u * u * handY + 2 * u * t * midY + t * t * tipY;
    g.lineStyle(1.5, 0xffaac8, 0.85);
    g.lineBetween(px, py - 1, x, y - 1);
    px = x;
    py = y;
  }
}

function drawRibbonWraps(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  const lerp = (t: number) => ({
    x: Phaser.Math.Linear(handX, tipX, t),
    y: Phaser.Math.Linear(handY, tipY, t),
  });
  for (const t of [0.22, 0.48, 0.72]) {
    const p = lerp(t);
    g.lineStyle(0, 0, 0);
    g.fillStyle(0xff3344, 1);
    g.fillRect(p.x - 5, p.y - 2.5, 10, 5);
    g.fillStyle(0xffee44, 1);
    g.fillRect(p.x - 5, p.y - 0.8, 10, 1.6);
    g.fillRect(p.x - 0.8, p.y - 2.5, 1.6, 5);
  }
}

export function drawBirthdayRod(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  tipX: number,
  tipY: number
): void {
  drawCurvedBlank(g, handX, handY, tipX, tipY, 12);
  drawRibbonWraps(g, handX, handY, tipX, tipY);

  g.fillStyle(0xff88aa, 1);
  g.fillRoundedRect(handX - 4, handY - 2, 10, 10, 2);
  g.fillStyle(0xff4466, 1);
  g.fillRect(handX - 4, handY + 6, 10, 3);
  g.fillStyle(0xffeedd, 1);
  g.fillCircle(handX + 1, handY + 7, 3.2);
  g.fillStyle(0xff6688, 1);
  g.fillCircle(handX + 1, handY + 7, 1.6);

  g.lineStyle(2, 0xffeedd, 1);
  g.strokeCircle(tipX, tipY, 3);
  g.fillStyle(0xff3344, 1);
  g.fillCircle(tipX + 2, tipY - 2, 1.8);
  g.fillStyle(0xffee44, 1);
  g.fillCircle(tipX - 1, tipY + 1, 1.2);
}

/** Equipment-bag icon — curved pink/red rod. */
export function drawBirthdayRodIcon(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(26, 58, 28, 8);

  const handX = 12;
  const handY = 54;
  const tipX = 54;
  const tipY = 10;
  drawCurvedBlank(g, handX, handY, tipX, tipY, 16);
  drawRibbonWraps(g, handX, handY, tipX, tipY);

  g.fillStyle(0xff88aa, 1);
  g.fillRoundedRect(8, 46, 14, 12, 3);
  g.fillStyle(0xff4466, 1);
  g.fillRect(8, 56, 14, 3);
  g.fillStyle(0xffeedd, 1);
  g.fillCircle(14, 52, 3.5);

  g.lineStyle(2, 0xffeedd, 1);
  g.strokeCircle(tipX, tipY, 3.5);
  g.fillStyle(0xff3344, 1);
  g.fillCircle(tipX + 2, tipY - 2, 1.6);
}
