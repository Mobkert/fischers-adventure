import Phaser from "phaser";

/** Inventory icon — same diagonal as other rods, matched to cast-pose proportions. */
export const RECOIL_ROD_ICON_HAND = { x: 26, y: 37 };
export const RECOIL_ROD_ICON_TIP = { x: 54, y: 14 };

function fillRotRect(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w: number,
  h: number,
  ang: number,
  color: number
): void {
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const hw = w / 2;
  const hh = h / 2;
  const pts = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ].map((p) => ({
    x: cx + p.x * cos - p.y * sin,
    y: cy + p.x * sin + p.y * cos,
  }));
  g.fillStyle(color);
  g.fillPoints(pts, true);
}

/** Sawed-off shotgun held like a rod — stock at hand, muzzles at tip. */
export function drawRecoilShotgun(
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
  const ang = Math.atan2(tipY - handY, tipX - handX);
  const perpX = Math.cos(ang + Math.PI / 2);
  const perpY = Math.sin(ang + Math.PI / 2);

  const stock = lerp(0.04);
  const grip = lerp(0.14);
  const receiver = lerp(0.26);
  const pump = lerp(0.42);
  const barrelMid = lerp(0.64);
  const muzzle = lerp(0.97);
  const bOff = 3.4;

  // Walnut stock
  fillRotRect(g, stock.x, stock.y, 11, 10, ang, 0x5a3218);
  fillRotRect(g, stock.x, stock.y, 9, 3, ang, 0x7a4a28);
  fillRotRect(g, stock.x, stock.y + 2, 9, 2, ang, 0x6b4428);

  // Pistol grip
  fillRotRect(g, grip.x, grip.y, 8, 11, ang, 0x6b4020);
  fillRotRect(g, grip.x, grip.y, 5, 2, ang, 0x8a5530);

  // Steel receiver
  fillRotRect(g, receiver.x, receiver.y, 13, 11, ang, 0x3a3a42);
  fillRotRect(g, receiver.x, receiver.y - 1, 11, 3, ang, 0x6a7078);
  fillRotRect(g, receiver.x, receiver.y - 1, 7, 1, ang, 0x9098a0);

  // Brass shell
  fillRotRect(g, receiver.x + perpX, receiver.y + perpY + 2, 4, 6, ang, 0xc8a030);
  g.fillStyle(0xffe066);
  g.fillCircle(receiver.x + perpX * 0.6, receiver.y + perpY * 0.6 + 2, 1.2);

  // Trigger guard
  g.lineStyle(1.5, 0x505860);
  g.strokeCircle(receiver.x - perpX * 1.5, receiver.y - perpY * 1.5 + 3, 3.2);
  g.fillStyle(0x303840);
  g.fillCircle(receiver.x - perpX * 1.2, receiver.y - perpY * 1.2 + 3, 1);

  // Pump fore-end
  fillRotRect(g, pump.x, pump.y, 11, 9, ang, 0x454550);
  g.lineStyle(1, 0x686878);
  for (const side of [-1, 1]) {
    g.lineBetween(
      pump.x + perpX * side * 2.5,
      pump.y + perpY * side * 2.5,
      pump.x + perpX * side * 5,
      pump.y + perpY * side * 5
    );
  }

  // Twin barrels
  g.lineStyle(5, 0x282830, 1);
  g.lineBetween(
    pump.x + perpX * bOff,
    pump.y + perpY * bOff,
    muzzle.x + perpX * bOff,
    muzzle.y + perpY * bOff
  );
  g.lineBetween(
    pump.x - perpX * bOff,
    pump.y - perpY * bOff,
    muzzle.x - perpX * bOff,
    muzzle.y - perpY * bOff
  );
  g.lineStyle(2, 0x585868, 0.9);
  g.lineBetween(
    barrelMid.x + perpX * bOff,
    barrelMid.y + perpY * bOff,
    muzzle.x + perpX * bOff,
    muzzle.y + perpY * bOff
  );
  g.lineBetween(
    barrelMid.x - perpX * bOff,
    barrelMid.y - perpY * bOff,
    muzzle.x - perpX * bOff,
    muzzle.y - perpY * bOff
  );
  g.lineStyle(1, 0x787888, 0.75);
  for (let i = 0; i < 3; i++) {
    const t = 0.55 + i * 0.12;
    const vx = Phaser.Math.Linear(pump.x, muzzle.x, t);
    const vy = Phaser.Math.Linear(pump.y, muzzle.y, t);
    g.lineBetween(vx + perpX * bOff, vy + perpY * bOff, vx - perpX * bOff, vy - perpY * bOff);
  }

  // Muzzle crowns + bead sights
  g.fillStyle(0x909098);
  g.fillCircle(muzzle.x + perpX * bOff, muzzle.y + perpY * bOff, 3);
  g.fillCircle(muzzle.x - perpX * bOff, muzzle.y - perpY * bOff, 3);
  g.fillStyle(0x1a1a22);
  g.fillCircle(muzzle.x + perpX * bOff, muzzle.y + perpY * bOff, 1.3);
  g.fillCircle(muzzle.x - perpX * bOff, muzzle.y - perpY * bOff, 1.3);
  g.fillStyle(0xffcc44);
  g.fillCircle(
    muzzle.x + perpX * (bOff + 1.4),
    muzzle.y + perpY * (bOff + 1.4),
    1.3
  );
  g.fillCircle(
    muzzle.x - perpX * (bOff + 1.4),
    muzzle.y - perpY * (bOff + 1.4),
    1.3
  );

  // Fishing line to tip
  g.lineStyle(1.5, 0xd8d8e0);
  g.lineBetween(muzzle.x, muzzle.y, tipX, tipY);
  g.lineStyle(1, 0xffffff, 0.65);
  g.lineBetween(muzzle.x, muzzle.y, tipX, tipY);
}
