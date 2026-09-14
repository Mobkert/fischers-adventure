import Phaser from "phaser";
import {
  LimitedEditionInfo,
  formatLimitedEditionTooltip,
} from "../data/items";

const BADGE_FILL = 0x2a5088;
const BADGE_STROKE = 0x6ab0f0;
const BADGE_TEXT = "#b8dcff";

/** Blue "Limited" pill; calls host tooltip on hover (host should sit outside list masks). */
export function createLimitedEditionBadge(
  scene: Phaser.Scene,
  info: LimitedEditionInfo,
  x: number,
  y: number,
  tooltip: LimitedTooltipHost
): Phaser.GameObjects.Container {
  const label = info.badge ?? "Limited";
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: "Arial",
      fontSize: "11px",
      color: BADGE_TEXT,
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  const w = Math.max(52, text.width + 14);
  const h = Math.max(18, text.height + 6);
  const bg = scene.add
    .rectangle(0, 0, w, h, BADGE_FILL, 0.95)
    .setStrokeStyle(1, BADGE_STROKE)
    .setInteractive({ useHandCursor: true });
  const tip = formatLimitedEditionTooltip(info);
  bg.on("pointerover", (p: Phaser.Input.Pointer) => {
    tooltip.show(tip, p.x, p.y);
  });
  bg.on("pointermove", (p: Phaser.Input.Pointer) => {
    tooltip.show(tip, p.x, p.y);
  });
  bg.on("pointerout", () => tooltip.hide());
  return scene.add.container(x, y, [bg, text]);
}

export type LimitedTooltipHost = {
  show: (text: string, screenX: number, screenY: number) => void;
  hide: () => void;
};

/** Tooltip layer parented to a panel root (avoids scroll masks). */
export function createLimitedTooltipHost(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  panelCx: number,
  panelCy: number
): LimitedTooltipHost {
  const tip = scene.add
    .text(0, 0, "", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#e8f0ff",
      backgroundColor: "#152038ee",
      padding: { x: 8, y: 6 },
      align: "left",
      lineSpacing: 3,
    })
    .setOrigin(0, 1)
    .setVisible(false)
    .setDepth(80);
  parent.add(tip);
  return {
    show(text, screenX, screenY) {
      tip.setText(text);
      tip.setPosition(screenX - panelCx + 12, screenY - panelCy - 8);
      tip.setVisible(true);
      // Skin / mastery overlays are added after this tip — keep it on top.
      parent.bringToTop(tip);
    },
    hide() {
      tip.setVisible(false);
    },
  };
}
