import Phaser from "phaser";
import { InventorySystem } from "../systems/InventorySystem";
import { WeatherSystem, WEATHER, WeatherId } from "../systems/WeatherSystem";
import { DayNightCycle } from "../systems/DayNightCycle";

export class CoinDisplay {
  private scene: Phaser.Scene;
  private label: Phaser.GameObjects.Text;
  private weatherIcon: Phaser.GameObjects.Text;
  private weatherIconImg: Phaser.GameObjects.Image;
  private timeIcon: Phaser.GameObjects.Text;
  private timeLabel: Phaser.GameObjects.Text;
  private weatherHit: Phaser.GameObjects.Zone;
  private tooltip: Phaser.GameObjects.Text;
  private inventory: InventorySystem;
  private weather?: WeatherSystem;
  private dayNight?: DayNightCycle;
  private currentWeatherId: WeatherId = "clear";

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.scene = scene;
    this.inventory = inventory;
    const right = scene.scale.width - 16;

    this.label = scene.add
      .text(right, scene.scale.height - 20, "", {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#ffe066",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(110);

    // Weather glyph (rightmost of the status row)
    this.weatherIcon = scene.add
      .text(right, scene.scale.height - 52, "◌", {
        fontFamily: "Arial",
        fontSize: "26px",
        color: "#c8d0d8",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(110);

    this.weatherIconImg = scene.add
      .image(right, scene.scale.height - 52, "full_moon_icon")
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(110)
      .setDisplaySize(28, 28)
      .setVisible(false);

    // Clock time text, then sun/moon icon to its left of weather
    this.timeLabel = scene.add
      .text(right - 40, scene.scale.height - 54, "1:00 PM", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#e8eef4",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(110);

    this.timeIcon = scene.add
      .text(right - 110, scene.scale.height - 52, "☀", {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#ffe066",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(110);

    // Hit target covering time + weather
    this.weatherHit = scene.add
      .zone(right - 70, scene.scale.height - 64, 150, 40)
      .setScrollFactor(0)
      .setDepth(111)
      .setInteractive({ useHandCursor: true });

    this.tooltip = scene.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#f0e6d2",
        backgroundColor: "#1a1a22ee",
        padding: { x: 8, y: 6 },
        align: "left",
        lineSpacing: 4,
      })
      .setOrigin(1, 1)
      .setDepth(200)
      .setScrollFactor(0)
      .setVisible(false);

    this.weatherHit.on("pointerover", (p: Phaser.Input.Pointer) => {
      this.showTooltip(p);
    });
    this.weatherHit.on("pointerout", () => {
      this.tooltip.setVisible(false);
    });
    scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.tooltip.visible) return;
      this.placeTooltip(p);
    });

    this.refresh();
  }

  setWeather(weather: WeatherSystem): void {
    this.weather = weather;
    this.refreshWeather();
  }

  setDayNight(cycle: DayNightCycle): void {
    this.dayNight = cycle;
    this.refreshClock();
  }

  setWeatherId(id: WeatherId): void {
    this.currentWeatherId = id;
    const def = WEATHER[id];
    const useImg =
      !!def.iconTexture && this.scene.textures.exists(def.iconTexture);
    if (useImg) {
      this.weatherIcon.setVisible(false);
      this.weatherIconImg
        .setTexture(def.iconTexture!)
        .setVisible(true)
        .setDisplaySize(28, 28);
    } else {
      this.weatherIconImg.setVisible(false);
      this.weatherIcon
        .setVisible(true)
        .setText(def.icon)
        .setColor(def.iconColor);
    }
    this.layoutStatusRow();
    if (this.tooltip.visible) {
      this.tooltip.setText(this.buildTooltip());
    }
  }

  refresh(): void {
    this.label.setText(`$${this.inventory.coins}`);
    this.refreshWeather();
    this.refreshClock();
  }

  refreshClock(): void {
    if (!this.dayNight) return;
    this.timeLabel.setText(this.dayNight.formatTime());
    this.timeIcon
      .setText(this.dayNight.getIcon())
      .setColor(this.dayNight.getIconColor());
    this.layoutStatusRow();
    if (this.tooltip.visible) {
      this.tooltip.setText(this.buildTooltip());
    }
  }

  private layoutStatusRow(): void {
    const right = this.scene.scale.width - 16;
    const weatherW = this.weatherIconImg.visible
      ? this.weatherIconImg.displayWidth
      : this.weatherIcon.width;
    this.timeLabel.setX(right - weatherW - 10);
    this.timeIcon.setX(this.timeLabel.x - this.timeLabel.width - 6);
  }

  private refreshWeather(): void {
    if (!this.weather) return;
    this.setWeatherId(this.weather.weather);
  }

  private buildTooltip(): string {
    const weatherLine = WEATHER[this.currentWeatherId].tooltip;
    if (!this.dayNight) return weatherLine;
    return `${this.dayNight.getTooltip()}\n\n${weatherLine}`;
  }

  private showTooltip(p: Phaser.Input.Pointer): void {
    this.tooltip.setText(this.buildTooltip());
    this.placeTooltip(p);
    this.tooltip.setVisible(true);
  }

  /** Enlarge coins / clock / weather for phone UI. */
  setMobileLayout(on: boolean): void {
    const s = on ? 1.45 : 1;
    const bottom = this.scene.scale.height - (on ? 36 : 20);
    const statusY = this.scene.scale.height - (on ? 78 : 52);
    this.label.setScale(s).setY(bottom);
    this.weatherIcon.setScale(s).setY(statusY);
    this.weatherIconImg.setScale(s).setY(statusY);
    this.timeLabel.setScale(s).setY(statusY - 2);
    this.timeIcon.setScale(s).setY(statusY);
    this.layoutStatusRow();
  }

  private placeTooltip(p: Phaser.Input.Pointer): void {
    const pad = 12;
    const tw = this.tooltip.width;
    const th = this.tooltip.height;
    const x = Math.min(p.x - 8, this.scene.scale.width - pad);
    const y = Math.min(p.y - 8, this.scene.scale.height - pad);
    this.tooltip.setPosition(Math.max(pad + tw, x), Math.max(pad + th, y));
  }
}
