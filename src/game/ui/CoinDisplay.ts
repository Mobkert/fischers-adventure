import Phaser from "phaser";
import { InventorySystem } from "../systems/InventorySystem";

export class CoinDisplay {
  private label: Phaser.GameObjects.Text;
  private inventory: InventorySystem;

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.inventory = inventory;
    this.label = scene.add
      .text(scene.scale.width - 16, scene.scale.height - 20, "", {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#ffe066",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(110);

    this.refresh();
  }

  refresh(): void {
    this.label.setText(`$${this.inventory.coins}`);
  }
}
