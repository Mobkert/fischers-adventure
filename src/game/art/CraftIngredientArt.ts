import Phaser from "phaser";

export const CRAFT_STARLIGHT_FISH_ICON = "craft_starlight_fish";

/** Black sockeye silhouette with a ? — any Starlight fish (uncommon+). */
export function generateCraftStarlightFishIcon(scene: Phaser.Scene): void {
  if (scene.textures.exists(CRAFT_STARLIGHT_FISH_ICON)) {
    scene.textures.remove(CRAFT_STARLIGHT_FISH_ICON);
  }

  const W = 56;
  const H = 20;
  const rt = scene.add.renderTexture(0, 0, W, H).setVisible(false);

  const fish = scene.add.image(0, 0, "fish");
  fish.setDisplaySize(50, 16);
  fish.setTintFill(0x101014);
  rt.draw(fish, W / 2, H / 2);
  fish.destroy();

  const q = scene.make.text({
    x: 0,
    y: 0,
    text: "?",
    style: {
      fontFamily: "Georgia, serif",
      fontSize: "16px",
      color: "#e9d5ff",
      stroke: "#ffffff",
      strokeThickness: 2,
      fontStyle: "bold",
    },
  });
  q.setOrigin(0.5);
  rt.draw(q, W / 2, H / 2);
  q.destroy();

  rt.saveTexture(CRAFT_STARLIGHT_FISH_ICON);
  rt.destroy();
}
