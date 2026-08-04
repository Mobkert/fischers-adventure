import Phaser from "phaser";
import { InventorySystem } from "../systems/InventorySystem";
import { WeatherSystem, WEATHER, WeatherId } from "../systems/WeatherSystem";

export class CoinDisplay {
  private label: Phaser.GameObjects.Text;
  private weatherIcon: Phaser.GameObjects.Text;
  private weatherName: Phaser.GameObjects.Text;
  private inventory: InventorySystem;
  private weather?: WeatherSystem;

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

    this.weatherIcon = scene.add
      .text(scene.scale.width - 16, scene.scale.height - 52, "☀", {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#ffe066",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(110);

    this.weatherName = scene.add
      .text(scene.scale.width - 42, scene.scale.height - 54, "Clear", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#cccccc",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(110);

    this.refresh();
  }

  setWeather(weather: WeatherSystem): void {
    this.weather = weather;
    this.refreshWeather();
  }

  setWeatherId(id: WeatherId): void {
    const def = WEATHER[id];
    this.weatherIcon.setText(def.icon).setColor(def.iconColor);
    this.weatherName.setText(def.name).setColor(def.iconColor);
  }

  refresh(): void {
    this.label.setText(`$${this.inventory.coins}`);
    this.refreshWeather();
  }

  private refreshWeather(): void {
    if (!this.weather) return;
    this.setWeatherId(this.weather.weather);
  }
}
