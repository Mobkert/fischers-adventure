import Phaser from "phaser";
import { InventorySystem } from "../systems/InventorySystem";
import {
  FROSTPEAK_EPIC_RODS,
  FROSTPEAK_MYTHICAL_MIN_VALUE,
  rodDisplayName,
} from "../systems/FrostpeakQuest";
import {
  VAULT_GEM_IDS,
  VAULT_GEM_NAMES,
  VAULT_GREEN_SELL_THRESHOLD,
} from "../systems/VaultGemQuest";
import {
  FISH_QUEST_HABITAT,
  FISH_QUEST_HABITAT_LABEL,
  FISH_QUEST_ISLAND_NAMES,
} from "../systems/FishQuest";
import { ITEMS } from "../data/items";

const GEM_HINTS: Record<(typeof VAULT_GEM_IDS)[number], string> = {
  gem_red: "Abyss Reach (water)",
  gem_green: `Sell $${VAULT_GREEN_SELL_THRESHOLD}+ in cave`,
  gem_blue: "Sanctum altar ($4k)",
  gem_yellow: "Entrance Hall",
  gem_purple: "Sanctum · full moon",
};

/**
 * Top-left quest HUD — Hermit, Vault, Fish Quest stacked.
 */
export class QuestTracker {
  private inventory: InventorySystem;
  private hermitRoot: Phaser.GameObjects.Container;
  private hermitBg: Phaser.GameObjects.Graphics;
  private hermitTitle: Phaser.GameObjects.Text;
  private hermitBody: Phaser.GameObjects.Text;
  private vaultRoot: Phaser.GameObjects.Container;
  private vaultBg: Phaser.GameObjects.Graphics;
  private vaultTitle: Phaser.GameObjects.Text;
  private vaultBody: Phaser.GameObjects.Text;
  private fishRoot: Phaser.GameObjects.Container;
  private fishBg: Phaser.GameObjects.Graphics;
  private fishTitle: Phaser.GameObjects.Text;
  private fishBody: Phaser.GameObjects.Text;
  private lastHermitKey = "";
  private lastVaultKey = "";
  private lastFishKey = "";

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.inventory = inventory;

    this.hermitRoot = scene.add.container(14, 14).setScrollFactor(0).setDepth(105);
    this.hermitBg = scene.add.graphics();
    this.hermitTitle = scene.add
      .text(10, 8, "", {
        fontFamily: "Georgia, serif",
        fontSize: "14px",
        color: "#c8e0f8",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0, 0);
    this.hermitBody = scene.add
      .text(10, 28, "", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#e8eef4",
        stroke: "#000000",
        strokeThickness: 2,
        lineSpacing: 4,
      })
      .setOrigin(0, 0);
    this.hermitRoot.add([this.hermitBg, this.hermitTitle, this.hermitBody]);
    this.hermitRoot.setVisible(false);

    this.vaultRoot = scene.add.container(14, 14).setScrollFactor(0).setDepth(105);
    this.vaultBg = scene.add.graphics();
    this.vaultTitle = scene.add
      .text(10, 8, "", {
        fontFamily: "Georgia, serif",
        fontSize: "14px",
        color: "#e8d5a3",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0, 0);
    this.vaultBody = scene.add
      .text(10, 28, "", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#e8eef4",
        stroke: "#000000",
        strokeThickness: 2,
        lineSpacing: 4,
      })
      .setOrigin(0, 0);
    this.vaultRoot.add([this.vaultBg, this.vaultTitle, this.vaultBody]);
    this.vaultRoot.setVisible(false);

    this.fishRoot = scene.add.container(14, 14).setScrollFactor(0).setDepth(105);
    this.fishBg = scene.add.graphics();
    this.fishTitle = scene.add
      .text(10, 8, "", {
        fontFamily: "Georgia, serif",
        fontSize: "14px",
        color: "#7ec8e8",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0, 0);
    this.fishBody = scene.add
      .text(10, 28, "", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#e8eef4",
        stroke: "#000000",
        strokeThickness: 2,
        lineSpacing: 4,
      })
      .setOrigin(0, 0);
    this.fishRoot.add([this.fishBg, this.fishTitle, this.fishBody]);
    this.fishRoot.setVisible(false);

    this.refresh();
  }

  refresh(): void {
    this.refreshHermit();
    this.refreshVault();
    this.refreshFishQuest();
    this.layout();
  }

  private refreshHermit(): void {
    const stage = this.inventory.frostpeakQuestStage;
    if (stage < 1 || stage > 3) {
      this.hermitRoot.setVisible(false);
      this.lastHermitKey = "";
      return;
    }

    let title = "";
    let body = "";
    let key = `s${stage}`;

    if (stage === 1) {
      const have = this.inventory.hasFrostpeakAngelfish() ? 1 : 0;
      title = "Hermit — Quest 1";
      body =
        have === 1
          ? "Earthly/Sprout Angelfish ready\nReturn to the Hermit to turn in"
          : `Bring an Earthly or Sprout Angelfish\n${have}/1 complete`;
      key += `|${have}`;
    } else if (stage === 2) {
      const done = this.inventory.frostpeakEpicRods;
      const doneCount = done.length;
      const total = FROSTPEAK_EPIC_RODS.length;
      const legDone = this.inventory.frostpeakWildflowerLegendary;
      title = `Hermit — Quest 2  (${doneCount}/${total} + Leg)`;
      const lines = FROSTPEAK_EPIC_RODS.map((id) => {
        const ok = done.includes(id);
        return `${ok ? "☑" : "☐"}  Epic · ${rodDisplayName(id)}`;
      });
      lines.push(
        `${legDone ? "☑" : "☐"}  Legendary · Wildflower Rod`
      );
      const allDone = this.inventory.frostpeakQuest2Complete();
      body =
        allDone
          ? `All goals done!\nReturn to the Hermit for the next quest`
          : `Quest goals:\n${lines.join("\n")}`;
      key += `|${done.slice().sort().join(",")}|${legDone ? 1 : 0}`;
    } else {
      const have = this.inventory.hasFrostpeakMythicalOffer() ? 1 : 0;
      title = "Hermit — Quest 3";
      body =
        have === 1
          ? `Sellable Mythical > $${FROSTPEAK_MYTHICAL_MIN_VALUE} ready\nReturn to the Hermit to turn in`
          : `Bring a sellable Mythical worth > $${FROSTPEAK_MYTHICAL_MIN_VALUE}\n` +
            `(not favorited) · ${have}/1 complete`;
      key += `|${have}`;
    }

    if (key === this.lastHermitKey && this.hermitRoot.visible) return;
    this.lastHermitKey = key;

    this.hermitTitle.setText(title);
    this.hermitBody.setText(body);
    this.hermitRoot.setVisible(true);
    this.drawPanel(this.hermitBg, this.hermitTitle, this.hermitBody, 0x6a90b0);
  }

  private refreshVault(): void {
    if (!this.inventory.isVaultGemQuestActive()) {
      this.vaultRoot.setVisible(false);
      this.lastVaultKey = "";
      return;
    }

    const found = this.inventory.vaultGemsFoundCount();
    const placed = this.inventory.vaultGemsPlaced.length;
    const total = VAULT_GEM_IDS.length;
    const lines = VAULT_GEM_IDS.map((id) => {
      const ok = this.inventory.hasVaultGemProgress(id);
      const seated = this.inventory.vaultGemsPlaced.includes(id);
      const mark = seated ? "◆" : ok ? "☑" : "☐";
      const note = seated ? "seated" : GEM_HINTS[id];
      return `${mark}  ${VAULT_GEM_NAMES[id]} — ${note}`;
    });

    let body: string;
    if (placed >= total) {
      body = "All gems seated!\nTalk to the Vault Keeper";
    } else if (found >= total) {
      body = `All found — place them on pedestals\n${lines.join("\n")}`;
    } else {
      body = `Find & return the lost gems:\n${lines.join("\n")}`;
    }

    const title = `Vault Gems  (${found}/${total})`;
    const key = `${found}|${placed}|${this.inventory.vaultGemsPlaced.join(",")}|${VAULT_GEM_IDS.map((id) => (this.inventory.hasItem(id) ? 1 : 0)).join("")}`;

    if (key === this.lastVaultKey && this.vaultRoot.visible) return;
    this.lastVaultKey = key;

    this.vaultTitle.setText(title);
    this.vaultBody.setText(body);
    this.vaultRoot.setVisible(true);
    this.drawPanel(this.vaultBg, this.vaultTitle, this.vaultBody, 0xc4a86a);
  }

  private refreshFishQuest(): void {
    const q = this.inventory.activeFishQuest;
    if (!q) {
      this.fishRoot.setVisible(false);
      this.lastFishKey = "";
      return;
    }
    const name = ITEMS[q.targetSpecies]?.name ?? "Fish";
    const rarity = ITEMS[q.targetSpecies]?.rarity ?? "common";
    const island = FISH_QUEST_ISLAND_NAMES[q.islandId];
    const habitat =
      FISH_QUEST_HABITAT_LABEL[FISH_QUEST_HABITAT[q.islandId]];
    const have = this.inventory.hasItem(q.targetSpecies);
    const body = have
      ? `${name} ready — return to Fish Quest\non ${island}`
      : `Catch a ${name} (${rarity})\nfrom the ${habitat}`;
    const title = `Fish Quest — ${island}`;
    const key = `${q.islandId}|${q.targetSpecies}|${have ? 1 : 0}`;
    if (key === this.lastFishKey && this.fishRoot.visible) return;
    this.lastFishKey = key;
    this.fishTitle.setText(title);
    this.fishBody.setText(body);
    this.fishRoot.setVisible(true);
    this.drawPanel(this.fishBg, this.fishTitle, this.fishBody, 0x7ec8e8);
  }

  private drawPanel(
    bg: Phaser.GameObjects.Graphics,
    title: Phaser.GameObjects.Text,
    body: Phaser.GameObjects.Text,
    stroke: number
  ): void {
    const padX = 10;
    const padY = 8;
    const w = Math.max(title.width, body.width) + padX * 2;
    const h = body.y + body.height + padY;
    bg.clear();
    bg.fillStyle(0x0a1018, 0.72);
    bg.fillRoundedRect(0, 0, w, h, 8);
    bg.lineStyle(1.5, stroke, 0.55);
    bg.strokeRoundedRect(0, 0, w, h, 8);
  }

  private layout(): void {
    const gap = 10;
    let y = 14;
    const stack = [this.hermitRoot, this.vaultRoot, this.fishRoot] as const;
    const bodies = [this.hermitBody, this.vaultBody, this.fishBody];
    for (let i = 0; i < stack.length; i++) {
      const root = stack[i];
      if (!root.visible) continue;
      root.setY(y);
      y += bodies[i].y + bodies[i].height + 8 + gap;
    }
  }
}
