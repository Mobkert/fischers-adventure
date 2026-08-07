import Phaser from "phaser";
import { BootScene } from "./game/scenes/BootScene";
import { MenuScene } from "./game/scenes/MenuScene";
import { SavesScene } from "./game/scenes/SavesScene";
import { GameScene } from "./game/scenes/GameScene";
import { UIScene } from "./game/scenes/UIScene";
import { ShopScene } from "./game/scenes/ShopScene";
import { BobberShopScene } from "./game/scenes/BobberShopScene";
import { BackpackShopScene } from "./game/scenes/BackpackShopScene";
import { CloudShopScene } from "./game/scenes/CloudShopScene";
import { AmuletCaveScene } from "./game/scenes/AmuletCaveScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 1280,
  height: 720,
  backgroundColor: "#87CEEB",
  audio: {
    disableWebAudio: false,
  },
  dom: {
    createContainer: true,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1200 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, SavesScene, GameScene, UIScene, ShopScene, BobberShopScene, BackpackShopScene, CloudShopScene, AmuletCaveScene],
};

new Phaser.Game(config);
