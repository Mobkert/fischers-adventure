import Phaser from "phaser";

/**
 * High-detail 64×64 hat overlays (gem stays simple; yellowfin uses loaded PNG).
 */
export function generateHatTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  const S = 64;

  // ── Top hat ──────────────────────────────────────────────
  g.clear();
  // soft contact shadow
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(32, 58, 46, 8);
  // brim underside
  g.fillStyle(0x0a0a0c);
  g.fillEllipse(32, 46, 52, 14);
  // brim top
  g.fillStyle(0x1c1c22);
  g.fillEllipse(32, 44, 50, 12);
  g.fillStyle(0x2e2e38);
  g.fillEllipse(32, 43, 40, 8);
  // crown body
  g.fillStyle(0x101014);
  g.fillRoundedRect(18, 8, 28, 36, 2);
  // left shade / right light
  g.fillStyle(0x08080c);
  g.fillRect(18, 8, 7, 36);
  g.fillStyle(0x2a2a34);
  g.fillRect(40, 10, 4, 32);
  // crown top rim
  g.fillStyle(0x060608);
  g.fillRoundedRect(17, 5, 30, 6, 2);
  g.fillStyle(0x3a3a44);
  g.fillRect(20, 6, 8, 2);
  // satin band
  g.fillStyle(0xa88840);
  g.fillRect(18, 34, 28, 6);
  g.fillStyle(0xe8d090);
  g.fillRect(18, 34, 28, 2);
  g.fillStyle(0x6a5020);
  g.fillRect(18, 38, 28, 2);
  // band buckle
  g.fillStyle(0xf0e0a8);
  g.fillRoundedRect(28, 33, 8, 8, 1);
  g.fillStyle(0x1a1a14);
  g.fillRect(30, 35, 4, 4);
  // fabric stitches
  g.lineStyle(1, 0x3a3a48, 0.55);
  g.lineBetween(22, 12, 22, 32);
  g.lineBetween(42, 12, 42, 32);
  g.lineStyle(1, 0x505060, 0.35);
  for (let y = 14; y < 32; y += 4) {
    g.lineBetween(24, y, 38, y);
  }
  g.generateTexture("hat_tophat", S, S);

  // ── Banana peel ──────────────────────────────────────────
  g.clear();
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(32, 58, 36, 7);
  // stem
  g.fillStyle(0x5a4020);
  g.fillRoundedRect(28, 6, 8, 10, 2);
  g.fillStyle(0x3a2810);
  g.fillRect(29, 6, 3, 10);
  g.fillStyle(0x8a6830);
  g.fillCircle(32, 8, 3);
  // three peel flaps
  const peels: [number, number, number, number, number, number][] = [
    [32, 14, 8, 48, 18, 52],
    [32, 14, 24, 54, 40, 50],
    [32, 14, 46, 48, 56, 42],
  ];
  for (const [ax, ay, bx, by, cx, cy] of peels) {
    g.fillStyle(0xe8b820);
    g.fillTriangle(ax, ay, bx, by, cx, cy);
    g.fillStyle(0xffe066);
    g.fillTriangle(ax, ay + 2, (ax + bx) / 2, (ay + by) / 2, (ax + cx) / 2, (ay + cy) / 2);
    g.fillStyle(0xc49018);
    g.fillTriangle(
      (bx + cx) / 2,
      (by + cy) / 2,
      bx,
      by,
      cx,
      cy
    );
  }
  // speckles
  g.fillStyle(0xa87820, 0.7);
  g.fillCircle(18, 36, 1.5);
  g.fillCircle(38, 42, 1.2);
  g.fillCircle(48, 34, 1.4);
  g.fillCircle(22, 44, 1);
  g.generateTexture("hat_banana", S, S);

  // ── Straw hat (very high detail) ───────────────────────
  g.clear();
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(32, 58, 50, 8);

  // Wide brim — layered weave rings
  g.fillStyle(0x6a4820);
  g.fillEllipse(32, 44, 58, 18);
  g.fillStyle(0xc4a050);
  g.fillEllipse(32, 42, 56, 16);
  g.fillStyle(0xd8b868);
  g.fillEllipse(32, 41, 52, 13);
  g.fillStyle(0xe8d090);
  g.fillEllipse(32, 40, 46, 10);

  // Concentric weave lines on brim
  g.lineStyle(1, 0xa88840, 0.55);
  for (let r = 14; r <= 26; r += 3) {
    g.beginPath();
    g.arc(32, 42, r, 0.15, Math.PI - 0.15, false);
    g.strokePath();
  }
  g.lineStyle(1, 0xf0e0b0, 0.35);
  for (let r = 15; r <= 25; r += 3) {
    g.beginPath();
    g.arc(32, 41, r, 0.2, Math.PI - 0.2, false);
    g.strokePath();
  }
  // Radial spokes on brim
  g.lineStyle(1, 0x8a6830, 0.4);
  for (let a = 0.3; a < Math.PI - 0.2; a += 0.28) {
    const x0 = 32 + Math.cos(a) * 12;
    const y0 = 42 + Math.sin(a) * 5;
    const x1 = 32 + Math.cos(a) * 27;
    const y1 = 42 + Math.sin(a) * 8;
    g.lineBetween(x0, y0, x1, y1);
  }

  // Crown / dome
  g.fillStyle(0xb89040);
  g.fillEllipse(32, 28, 28, 24);
  g.fillStyle(0xd4b060);
  g.fillEllipse(32, 26, 24, 20);
  g.fillStyle(0xe8d080);
  g.fillEllipse(30, 22, 16, 14);
  g.fillStyle(0xa87830);
  g.fillEllipse(38, 28, 10, 14);

  // Vertical straw ribs on crown
  g.lineStyle(1.2, 0x8a6028, 0.65);
  for (let x = 22; x <= 42; x += 4) {
    g.lineBetween(x, 16, x + (x < 32 ? -1 : 1), 38);
  }
  g.lineStyle(1, 0xf5e8b8, 0.4);
  for (let x = 24; x <= 40; x += 4) {
    g.lineBetween(x, 18, x, 36);
  }

  // Horizontal weave bands on crown
  g.lineStyle(1, 0x9a7030, 0.5);
  g.beginPath();
  g.arc(32, 28, 11, 0.4, Math.PI - 0.4, false);
  g.strokePath();
  g.beginPath();
  g.arc(32, 24, 9, 0.5, Math.PI - 0.5, false);
  g.strokePath();
  g.beginPath();
  g.arc(32, 32, 12, 0.3, Math.PI - 0.3, false);
  g.strokePath();

  // Cloth band around crown
  g.fillStyle(0x2a6a4a);
  g.fillRect(18, 34, 28, 6);
  g.fillStyle(0x3a8a5a);
  g.fillRect(18, 34, 28, 2);
  g.fillStyle(0x1a4a30);
  g.fillRect(18, 38, 28, 2);
  // band knot / bow on side
  g.fillStyle(0x2a6a4a);
  g.fillTriangle(44, 34, 52, 30, 50, 38);
  g.fillTriangle(44, 40, 52, 36, 50, 44);
  g.fillStyle(0x4aaa70);
  g.fillCircle(45, 37, 2.5);

  // Peak highlight
  g.fillStyle(0xffffff, 0.28);
  g.fillEllipse(26, 18, 8, 4);
  // Underside brim shadow near crown
  g.fillStyle(0x6a4820, 0.35);
  g.fillEllipse(32, 38, 30, 6);

  g.generateTexture("hat_cap", S, S);

  // ── Shell hat (nautilus) ─────────────────────────────────
  g.clear();
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(32, 56, 36, 8);
  // outer shell
  g.fillStyle(0xd4a070);
  g.fillCircle(34, 32, 22);
  g.fillStyle(0xe8c090);
  g.fillCircle(32, 30, 20);
  g.fillStyle(0xc48858);
  g.fillCircle(38, 34, 14);
  // spiral chambers
  g.lineStyle(2.5, 0x8a5030, 1);
  for (let i = 0; i < 5; i++) {
    const r = 18 - i * 3;
    g.beginPath();
    g.arc(36, 32, r, -0.4 + i * 0.15, Math.PI * 1.35 + i * 0.1, false);
    g.strokePath();
  }
  g.lineStyle(1.5, 0xa86840, 0.85);
  for (let i = 0; i < 4; i++) {
    const r = 16 - i * 3;
    g.beginPath();
    g.arc(36, 32, r, 0.1 + i * 0.2, Math.PI * 1.1, false);
    g.strokePath();
  }
  // aperture / opening
  g.fillStyle(0xf5e0c0);
  g.fillCircle(22, 28, 7);
  g.fillStyle(0xfff5e0);
  g.fillCircle(20, 26, 3.5);
  // ridges highlight
  g.fillStyle(0xffe8c8, 0.45);
  g.fillEllipse(28, 18, 10, 4);
  g.fillStyle(0x6a3820, 0.5);
  g.fillCircle(40, 38, 2);
  g.generateTexture("hat_shell", S, S);

  // Gem stays compact / intentional
  g.clear();
  g.fillStyle(0x44ffaa, 0.22);
  g.fillCircle(32, 32, 22);
  g.fillStyle(0x1a8860, 0.5);
  g.fillCircle(32, 34, 16);
  g.fillStyle(0x22cc88);
  g.fillTriangle(32, 10, 14, 34, 50, 34);
  g.fillTriangle(32, 54, 14, 34, 50, 34);
  g.fillStyle(0x44e8a8);
  g.fillTriangle(32, 16, 20, 34, 36, 34);
  g.fillStyle(0xb8ffe0);
  g.fillTriangle(32, 18, 24, 32, 34, 32);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(28, 24, 2.5);
  g.generateTexture("hat_gem", S, S);

  g.destroy();
}
