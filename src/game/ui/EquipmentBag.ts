import Phaser from "phaser";
import {
  ITEMS,
  ItemId,
  formatRodStats,
  formatBobberStats,
  formatRodMutationLines,
  RARITY_COLOR,
  RARITY_NAME,
  ADMIN_RARITY_WAVE_COLORS,
} from "../data/items";
import { InventorySystem } from "../systems/InventorySystem";
import {
  createLimitedEditionBadge,
  createLimitedTooltipHost,
  LimitedTooltipHost,
} from "./LimitedEditionBadge";
import {
  createGradientWaveText,
  startGradientColorWave,
} from "./GradientWaveText";
import { RodXpHud } from "./RodXpHud";
import {
  ROD_MASTERY_ABILITY_LEVEL,
  ROD_MASTERY_GOLD_LEVEL,
  ROD_MASTERY_MAX_LEVEL,
  ROD_MASTERY_RAINBOW_LEVEL,
  rodLevelControlMult,
  rodLevelStatMult,
  rodMasteryAccent,
  rodMasteryFill,
  xpRequiredForLevel,
} from "../systems/RodMastery";

const PANEL_W = 460;
const PANEL_H = 520;
const LIST_TOP = -150;
const LIST_VIEW_H = 360;
const ROW_H = 136;
const BOBBER_ROW_H = 118;
const ROW_GAP = 12;

const AMULET_ROW_H = 112;
const HAT_ROW_H = 96;

type BagTab = "rods" | "bobbers" | "amulets" | "bait" | "hats";

/** Vertical rod / bobber / amulet / hat list opened from hotbar slot 2. */
export class EquipmentBag {
  private root: Phaser.GameObjects.Container;
  private listRoot: Phaser.GameObjects.Container;
  private listContent: Phaser.GameObjects.Container;
  private maskShape: Phaser.GameObjects.Graphics;
  private scrollTrack: Phaser.GameObjects.Rectangle;
  private scrollThumb: Phaser.GameObjects.Rectangle;
  private subtitle!: Phaser.GameObjects.Text;
  private tabRodsBg!: Phaser.GameObjects.Rectangle;
  private tabBobbersBg!: Phaser.GameObjects.Rectangle;
  private tabAmuletsBg!: Phaser.GameObjects.Rectangle;
  private tabBaitBg!: Phaser.GameObjects.Rectangle;
  private tabHatsBg!: Phaser.GameObjects.Rectangle;
  private tabRodsLabel!: Phaser.GameObjects.Text;
  private tabBobbersLabel!: Phaser.GameObjects.Text;
  private tabAmuletsLabel!: Phaser.GameObjects.Text;
  private tabBaitLabel!: Phaser.GameObjects.Text;
  private tabHatsLabel!: Phaser.GameObjects.Text;
  private inventory: InventorySystem;
  private scene: Phaser.Scene;
  private panelCx: number;
  private panelCy: number;
  visible = false;
  private tab: BagTab = "rods";
  private onChanged?: (message: string) => void;
  private onBeforeEquipRod?: (rodId: ItemId) => boolean;
  private onAmuletUsed?: (amuletId: ItemId) => void;
  private onBaitUsed?: (baitId: ItemId) => void;
  private onHatChanged?: () => void;
  private scrollY = 0;
  private contentH = 0;
  private masteryPanel: Phaser.GameObjects.Container | null = null;
  private skinPanel: Phaser.GameObjects.Container | null = null;
  private limitedTooltip!: LimitedTooltipHost;
  private stopAdminRarityWave: (() => void) | null = null;
  private wheelHandler: (
    pointer: Phaser.Input.Pointer,
    _gos: unknown,
    _dx: number,
    dy: number
  ) => void;

  constructor(scene: Phaser.Scene, inventory: InventorySystem) {
    this.scene = scene;
    this.inventory = inventory;

    this.panelCx = scene.scale.width / 2;
    this.panelCy = scene.scale.height / 2 - 10;

    this.root = scene.add
      .container(this.panelCx, this.panelCy)
      .setDepth(145)
      .setVisible(false);
    this.root.setScrollFactor(0);

    const bg = scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, 0x1a1c22, 0.96)
      .setStrokeStyle(2, 0xc4a86a);

    const title = scene.add
      .text(0, -230, "Equipment Bag", {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    this.subtitle = scene.add
      .text(0, -172, "Your rods · Equip swaps hotbar slot 1", {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    // Tabs — five across
    const tabW = 84;
    this.tabRodsBg = scene.add
      .rectangle(-168, -200, tabW, 28, 0x3a3428, 0.95)
      .setStrokeStyle(2, 0xc4a86a)
      .setInteractive({ useHandCursor: true });
    this.tabRodsLabel = scene.add
      .text(-168, -200, "Rods", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);
    this.tabBobbersBg = scene.add
      .rectangle(-84, -200, tabW, 28, 0x2a2f3a, 0.95)
      .setStrokeStyle(2, 0x666666)
      .setInteractive({ useHandCursor: true });
    this.tabBobbersLabel = scene.add
      .text(-84, -200, "Bobbers", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);
    this.tabAmuletsBg = scene.add
      .rectangle(0, -200, tabW, 28, 0x2a2f3a, 0.95)
      .setStrokeStyle(2, 0x666666)
      .setInteractive({ useHandCursor: true });
    this.tabAmuletsLabel = scene.add
      .text(0, -200, "Amulets", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);
    this.tabBaitBg = scene.add
      .rectangle(84, -200, tabW, 28, 0x2a2f3a, 0.95)
      .setStrokeStyle(2, 0x666666)
      .setInteractive({ useHandCursor: true });
    this.tabBaitLabel = scene.add
      .text(84, -200, "Bait", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);
    this.tabHatsBg = scene.add
      .rectangle(168, -200, tabW, 28, 0x2a2f3a, 0.95)
      .setStrokeStyle(2, 0x666666)
      .setInteractive({ useHandCursor: true });
    this.tabHatsLabel = scene.add
      .text(168, -200, "Hats", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.tabRodsBg.on("pointerdown", () => this.setTab("rods"));
    this.tabBobbersBg.on("pointerdown", () => this.setTab("bobbers"));
    this.tabAmuletsBg.on("pointerdown", () => this.setTab("amulets"));
    this.tabBaitBg.on("pointerdown", () => this.setTab("bait"));
    this.tabHatsBg.on("pointerdown", () => this.setTab("hats"));

    this.listRoot = scene.add.container(0, LIST_TOP);
    this.listContent = scene.add.container(0, 0);
    this.listRoot.add(this.listContent);

    this.maskShape = scene.make.graphics({ x: 0, y: 0 });
    this.redrawMask();
    this.maskShape.setVisible(false);
    this.listRoot.setMask(this.maskShape.createGeometryMask());

    this.scrollTrack = scene.add
      .rectangle(210, LIST_TOP + LIST_VIEW_H / 2, 6, LIST_VIEW_H, 0x2a2f3a, 0.9)
      .setOrigin(0.5)
      .setVisible(false);
    this.scrollThumb = scene.add
      .rectangle(210, LIST_TOP, 6, 40, 0xc4a86a, 0.85)
      .setOrigin(0.5, 0)
      .setVisible(false);

    const hint = scene.add
      .text(0, 232, "2 / Esc to close · Mouse wheel to scroll", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#777777",
      })
      .setOrigin(0.5);

    this.root.add([
      bg,
      title,
      this.tabRodsBg,
      this.tabRodsLabel,
      this.tabBobbersBg,
      this.tabBobbersLabel,
      this.tabAmuletsBg,
      this.tabAmuletsLabel,
      this.tabBaitBg,
      this.tabBaitLabel,
      this.tabHatsBg,
      this.tabHatsLabel,
      this.subtitle,
      this.listRoot,
      this.scrollTrack,
      this.scrollThumb,
      hint,
    ]);

    this.limitedTooltip = createLimitedTooltipHost(
      scene,
      this.root,
      this.panelCx,
      this.panelCy
    );

    this.wheelHandler = (pointer, _gos, _dx, dy) => {
      if (!this.visible) return;
      const localX = pointer.x - this.panelCx;
      const localY = pointer.y - this.panelCy;
      if (
        Math.abs(localX) > PANEL_W / 2 ||
        Math.abs(localY) > PANEL_H / 2
      ) {
        return;
      }
      this.setScroll(this.scrollY + dy * 0.5);
    };
    scene.input.on("wheel", this.wheelHandler);
  }

  private setTab(tab: BagTab): void {
    if (this.tab === tab) return;
    this.tab = tab;
    this.scrollY = 0;
    this.refresh();
  }

  private redrawMask(): void {
    this.maskShape.clear();
    this.maskShape.fillStyle(0xffffff);
    this.maskShape.fillRect(
      this.panelCx - PANEL_W / 2 + 20,
      this.panelCy + LIST_TOP,
      PANEL_W - 56,
      LIST_VIEW_H
    );
  }

  setOnChanged(cb: (message: string) => void): void {
    this.onChanged = cb;
  }

  setOnBeforeEquipRod(cb: (rodId: ItemId) => boolean): void {
    this.onBeforeEquipRod = cb;
  }

  setOnAmuletUsed(cb: (amuletId: ItemId) => void): void {
    this.onAmuletUsed = cb;
  }

  setOnBaitUsed(cb: (baitId: ItemId) => void): void {
    this.onBaitUsed = cb;
  }

  setOnHatChanged(cb: () => void): void {
    this.onHatChanged = cb;
  }

  toggle(): void {
    this.setOpen(!this.visible);
  }

  setOpen(open: boolean): void {
    this.visible = open;
    this.root.setVisible(open);
    if (!open) {
      this.limitedTooltip.hide();
      this.stopAdminRarityWave?.();
      this.stopAdminRarityWave = null;
      this.closeMasteryPanel();
      this.closeSkinPanel();
      return;
    }
    this.scrollY = 0;
    this.redrawMask();
    this.refresh();
  }

  refresh(): void {
    this.limitedTooltip.hide();
    this.stopAdminRarityWave?.();
    this.stopAdminRarityWave = null;
    for (const child of [...this.listContent.list]) {
      child.destroy(true);
    }

    const styleTab = (
      bg: Phaser.GameObjects.Rectangle,
      label: Phaser.GameObjects.Text,
      active: boolean
    ) => {
      bg.setStrokeStyle(2, active ? 0xc4a86a : 0x666666);
      bg.setFillStyle(active ? 0x3a3428 : 0x2a2f3a, 0.95);
      label.setColor(active ? "#f0e6d2" : "#aaaaaa");
    };
    styleTab(this.tabRodsBg, this.tabRodsLabel, this.tab === "rods");
    styleTab(this.tabBobbersBg, this.tabBobbersLabel, this.tab === "bobbers");
    styleTab(this.tabAmuletsBg, this.tabAmuletsLabel, this.tab === "amulets");
    styleTab(this.tabBaitBg, this.tabBaitLabel, this.tab === "bait");
    styleTab(this.tabHatsBg, this.tabHatsLabel, this.tab === "hats");

    this.subtitle.setText(
      this.tab === "rods"
        ? "Your rods · Equip swaps hotbar slot 1"
        : this.tab === "bobbers"
          ? "Your bobbers · Equip for the next cast"
          : this.tab === "amulets"
            ? "Amulets · Use to change weather or time"
            : this.tab === "bait"
              ? "Bait · Ocean chum · 2 min cooldown after use"
              : "Hats · Wear cosmetics on your head"
    );

    let y = 0;
    if (this.tab === "rods") {
      const rods = this.inventory.getOwnedRods();
      if (rods.length === 0) {
        this.listContent.add(
          this.scene.add
            .text(0, 80, "No rods yet.", {
              fontFamily: "Arial",
              fontSize: "16px",
              color: "#888888",
            })
            .setOrigin(0.5)
        );
        this.contentH = LIST_VIEW_H;
        this.applyScroll();
        return;
      }
      for (const rodId of rods) {
        this.listContent.add(this.makeRodRow(rodId, y, ROW_H));
        y += ROW_H + ROW_GAP;
      }
    } else if (this.tab === "bobbers") {
      const bobbers = this.inventory.getOwnedBobbers();
      if (bobbers.length === 0) {
        this.listContent.add(
          this.scene.add
            .text(0, 80, "No bobbers yet.", {
              fontFamily: "Arial",
              fontSize: "16px",
              color: "#888888",
            })
            .setOrigin(0.5)
        );
        this.contentH = LIST_VIEW_H;
        this.applyScroll();
        return;
      }
      for (const bobberId of bobbers) {
        this.listContent.add(this.makeBobberRow(bobberId, y, BOBBER_ROW_H));
        y += BOBBER_ROW_H + ROW_GAP;
      }
    } else if (this.tab === "amulets") {
      const amulets = this.inventory.getOwnedAmulets();
      if (amulets.length === 0) {
        this.listContent.add(
          this.scene.add
            .text(0, 80, "No amulets yet.\nClimb the rope past the swamp pond.", {
              fontFamily: "Arial",
              fontSize: "15px",
              color: "#888888",
              align: "center",
            })
            .setOrigin(0.5)
        );
        this.contentH = LIST_VIEW_H;
        this.applyScroll();
        return;
      }
      const adminWaves: Phaser.GameObjects.Text[][] = [];
      for (const { id, count } of amulets) {
        const { row, adminLetters } = this.makeAmuletRow(
          id,
          count,
          y,
          AMULET_ROW_H
        );
        this.listContent.add(row);
        if (adminLetters) adminWaves.push(adminLetters);
        y += AMULET_ROW_H + ROW_GAP;
      }
      if (adminWaves.length > 0) {
        this.stopAdminRarityWave = startGradientColorWave(
          this.scene,
          adminWaves,
          [...ADMIN_RARITY_WAVE_COLORS],
          0.0018
        );
      }
    } else if (this.tab === "bait") {
      const bait = this.inventory.getOwnedBait();
      if (bait.length === 0) {
        this.listContent.add(
          this.scene.add
            .text(0, 80, "No bait yet.\nBuy crates on other islands — not Starter Isle.", {
              fontFamily: "Arial",
              fontSize: "14px",
              color: "#888888",
              align: "center",
            })
            .setOrigin(0.5)
        );
        this.contentH = LIST_VIEW_H;
        this.applyScroll();
        return;
      }
      for (const { id, count } of bait) {
        this.listContent.add(this.makeBaitRow(id, count, y, AMULET_ROW_H));
        y += AMULET_ROW_H + ROW_GAP;
      }
    } else {
      const hats = this.inventory.getOwnedHats();
      // Unequip row
      this.listContent.add(this.makeHatNoneRow(y, HAT_ROW_H));
      y += HAT_ROW_H + ROW_GAP;
      for (const hatId of hats) {
        this.listContent.add(this.makeHatRow(hatId, y, HAT_ROW_H));
        y += HAT_ROW_H + ROW_GAP;
      }
    }

    this.contentH = Math.max(0, y - ROW_GAP);
    this.applyScroll();
  }

  private maxScroll(): number {
    return Math.max(0, this.contentH - LIST_VIEW_H);
  }

  private setScroll(y: number): void {
    this.scrollY = Phaser.Math.Clamp(y, 0, this.maxScroll());
    this.applyScroll();
  }

  private applyScroll(): void {
    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll());
    this.listContent.setY(-this.scrollY);

    const max = this.maxScroll();
    const showBar = max > 0;
    this.scrollTrack.setVisible(showBar);
    this.scrollThumb.setVisible(showBar);
    if (!showBar) return;

    const thumbH = Math.max(28, (LIST_VIEW_H / this.contentH) * LIST_VIEW_H);
    const trackTravel = LIST_VIEW_H - thumbH;
    const thumbY =
      LIST_TOP + (max > 0 ? (this.scrollY / max) * trackTravel : 0);
    this.scrollThumb.setY(thumbY);
    this.scrollThumb.setSize(6, thumbH);
  }

  private fitIcon(key: string, maxSide: number): [number, number] {
    const tex = this.scene.textures.get(key);
    const frame = tex?.get();
    const nw = Math.max(1, frame?.width ?? maxSide);
    const nh = Math.max(1, frame?.height ?? maxSide);
    const scale = Math.min(maxSide / nw, maxSide / nh);
    return [Math.round(nw * scale), Math.round(nh * scale)];
  }

  private makeRodRow(
    rodId: ItemId,
    y: number,
    rowH: number
  ): Phaser.GameObjects.Container {
    const def = ITEMS[rodId];
    const stats = this.inventory.getRodDisplayStats(rodId);
    const equipped = this.inventory.equippedRodId === rodId;

    const card = this.scene.add
      .rectangle(0, y, 400, rowH, equipped ? 0x3a3420 : 0x2a2f3a, 0.95)
      .setStrokeStyle(2, equipped ? 0xffe066 : 0x6a7355)
      .setOrigin(0.5, 0);

    const rawIconKey = this.inventory.getRodTextureKey(rodId);
    const iconKey = this.scene.textures.exists(rawIconKey) ? rawIconKey : "rod";
    const [iw, ih] = this.fitIcon(iconKey, 56);
    const icon = this.scene.add
      .image(-150, y + rowH / 2, iconKey)
      .setDisplaySize(iw, ih);

    const name = this.scene.add
      .text(-112, y + 12, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: equipped ? "#ffe066" : "#ffffff",
      })
      .setOrigin(0, 0);

    const row = this.scene.add.container(0, 0);
    row.add([card, icon, name]);

    if (def.limitedEdition) {
      const badge = createLimitedEditionBadge(
        this.scene,
        def.limitedEdition,
        -112 + name.width + 36,
        y + 22,
        this.limitedTooltip
      );
      row.add(badge);
    }

    const statsLines = formatRodStats(stats);
    const mutBlock = formatRodMutationLines(def);
    const mutLine = mutBlock ? `\n${mutBlock}` : "";
    const worldMutLine = def.grantsWorldMutations
      ? def.worldMutationChanceMult && def.worldMutationChanceMult > 1
        ? `\nWorld mutations ×${def.worldMutationChanceMult} on catch (stacks with Mutation Bobber → ×${def.worldMutationChanceMult * 2})`
        : "\nWorld mutations on catch (normal rates)"
      : "";
    const augmentLine =
      rodId === "augment_rod"
        ? "\n7.5% chance to upgrade a stat on catch"
        : "";
    const burstLine =
      def.rodMinigamePower === "crystal_burst"
        ? "\n15% crystal burst every 0.5s (+5% progress)"
        : "";
    const tranquilLine =
      def.rodMinigamePower === "tranquil_bubble"
        ? "\n40% +1m cast depth · 15% +2m · bubble every 2 catches (fail resets) · bubble catch 75% Tranquil · 30% Tranquil on catch"
        : "";
    const zeusLine =
      def.rodMinigamePower === "zeus_strike"
        ? "\nLightning 25%/s then halves each strike — fish hit = instant; bar hit = electrify (+15 progress speed · slow · 60% Thunder / 40% Electric on unmutated fish only)"
        : "";
    const recoilLine =
      def.rodMinigamePower === "recoil_kick"
        ? "\nAfter 4 fish moves: warning → blast (+22.5% progress) · Ash 30% (black) · Blasted 50% (orange/red) · 4 blasts → always 25% Ash / 75% Blasted (any fish)" +
          (InventorySystem.RECOIL_MASTERY_ENABLED
            ? this.inventory.isRecoilBurstMasteryUnlocked()
              ? "\nLv15 Ability: 3rd blast → rapid burst (+10% each)"
              : `\nAbility at Lv${ROD_MASTERY_ABILITY_LEVEL} — rapid burst on 3rd recoil`
            : "")
        : "";
    const portalLine =
      def.rodMinigamePower === "portal_pull"
        ? "\n400px portal — rarest fish warps to your bobber" +
          (InventorySystem.PORTAL_MASTERY_ENABLED
            ? this.inventory.isPortalMasteryUnlocked()
              ? "\nLv15 Ability: 30% Gate dupe (3.5×) · +25 Luck/Resilience/Progress · 4m depth"
              : `\nAbility at Lv${ROD_MASTERY_ABILITY_LEVEL} — Gate duplicates & +25 stats`
            : "")
        : "";
    const forgeLine =
      def.rodMinigamePower === "forge_strike"
        ? "\nAfter 3 fish moves: 8–12 swords (+5% progress speed) & axes (+10% progress) volley — 9-move cooldown · orange sword (2.5%) = Ashencast (5×)"
        : "";
    const starweaverLine =
      def.rodMinigamePower === "starweaver_weave"
        ? "\nAfter 5 fish moves: sacrifice 5–15% progress to stun the fish (5%→1s, 15%→3s) · +153% progress speed while stunned · Starlight 15%"
        : "";
    const starRainLine =
      def.rodMinigamePower === "star_rain"
        ? this.inventory.isStellarSurferDefined() && rodId === "test_rod"
          ? "\nDEFINED — half stats (Control full) · stars 0.5→0.3 only · no black hole · no Event Horizon · no boat · mastery locked"
          : "\nStars attack only in-bar (leave = explode + −11% progress speed until catch; black hole slowly shrinks / loses dupe chance; re-enter restarts cadence) · 0.5s→0.01 · +1% each · each hit grows the black hole (+3% dupe chance, max 55%) · dupes always Starstruck 0.9× · Event Horizon 35% (7×) · Q at port to ride (faster than Jet Ski)" +
            (InventorySystem.SURFER_MASTERY_ENABLED
              ? this.inventory.isStellarSurferMasteryUnlocked()
                ? "\nLv15 Ability: follower black hole · every 30s area fish (80% Starstruck / 20% Event Horizon) · Rubber Duck skin"
                : this.inventory.isStellarSurferAscended()
                  ? `\nAbility at Lv${ROD_MASTERY_ABILITY_LEVEL} — follower black hole & Rubber Duck skin`
                  : ""
              : "")
        : "";
    const starLineLine =
      def.rodMinigamePower === "star_line"
        ? "\nNight UI · 7 stars orbit an oval — 20% pink zone at bottom (next pass guaranteed if miss) · ride oval to top then dive · once per catch · stars gone after · hit: +1.5% progress, +3% progress speed & +3% bar size (smooth) per star · miss: −5% progress per star · all 7 hits: Lunar (4×)"
        : "";
    const birthdayLine =
      def.rodMinigamePower === "birthday_party"
        ? "\n15% instant catch (Confetti 3×) · balloons (minigame bar → top of screen; right-click: blue +10% progress, red +10% speed, green +10% bar) · +1% progress speed in white zone (0.5s → 0.4s → …, resets off bar)"
        : "";
    const voidHarvestLine =
      def.rodMinigamePower === "void_harvest"
        ? "\nWhile fish in bar: zone shrinks to 0% (no progress until first leave) · leave → 25% control, 15% resilience + shrink progress · then normal progress while catching · legendaries/mythicals move like Bluefin"
        : "";
    const statsText = this.scene.add
      .text(
        -112,
        y + 42,
        statsLines +
          mutLine +
          worldMutLine +
          augmentLine +
          burstLine +
          tranquilLine +
          zeusLine +
          recoilLine +
          portalLine +
          forgeLine +
          starweaverLine +
          starRainLine +
          starLineLine +
          birthdayLine +
          voidHarvestLine,
        {
          fontFamily: "Arial",
          fontSize: "13px",
          color: "#c8c8c8",
          lineSpacing: 3,
        }
      )
      .setOrigin(0, 0);

    row.add(statsText);

    const mastery = this.inventory.getRodMastery(rodId);

    const equipW = 100;
    const equipH = 36;
    const skinW = equipW / 2;
    const skinH = equipH / 2;
    const meterR = 16;
    // Equip on the right; Skin + circular level meter above, right-aligned
    const equipX = 140;
    const equipY = y + rowH / 2 + 8;
    const btnGap = 8;
    const meterSpan = meterR * 2 + 4;
    const pairW = skinW + btnGap + meterSpan;
    const pairRight = equipX + equipW / 2;
    const pairLeft = pairRight - pairW;
    const skinX = pairLeft + skinW / 2;
    const meterX = pairLeft + skinW + btnGap + meterSpan / 2;
    const skinY = equipY - equipH / 2 - skinH / 2 - 6;
    const meterY = skinY;

    {
      const fill = rodMasteryFill(mastery);
      // Container so hover scale is centered on the meter (Graphics scale from 0,0).
      const meterRoot = this.scene.add.container(meterX, meterY);
      const meterHit = this.scene.add
        .circle(0, 0, meterR + 4, 0x000000, 0.001)
        .setInteractive({ useHandCursor: true });
      const meterGfx = this.scene.add.graphics();
      RodXpHud.drawMeter(meterGfx, 0, 0, meterR, fill, mastery.level, 4);
      const meterLevel = this.scene.add
        .text(0, 0, String(mastery.level), {
          fontFamily: "Georgia, serif",
          fontSize: "14px",
          color: rodMasteryAccent(mastery.level).label,
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(0.5);
      meterHit.on("pointerover", () => meterRoot.setScale(1.08));
      meterHit.on("pointerout", () => meterRoot.setScale(1));
      meterHit.on("pointerdown", () => this.openRodMasteryPanel(rodId));
      meterRoot.add([meterHit, meterGfx, meterLevel]);
      row.add(meterRoot);
    }

    {
      const activeSkinId = this.inventory.getActiveRodSkinId(rodId);
      const hasAltSkin = this.inventory
        .getRodSkinOptions(rodId)
        .some((s) => s.id !== "default" && s.owned);
      const skinBtn = this.scene.add
        .rectangle(
          skinX,
          skinY,
          skinW,
          skinH,
          activeSkinId !== "default" ? 0x4a3a68 : 0x3a4a6b
        )
        .setStrokeStyle(1, hasAltSkin ? 0xb8a0e0 : 0x7aa0d0)
        .setInteractive({ useHandCursor: true });
      const skinLabel = this.scene.add
        .text(skinX, skinY, "Skin", {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#ffffff",
        })
        .setOrigin(0.5);
      skinBtn.on("pointerover", () =>
        skinBtn.setFillStyle(
          activeSkinId !== "default" ? 0x5a4a78 : 0x4a5a7b
        )
      );
      skinBtn.on("pointerout", () =>
        skinBtn.setFillStyle(
          activeSkinId !== "default" ? 0x4a3a68 : 0x3a4a6b
        )
      );
      skinBtn.on("pointerdown", () => this.openRodSkinPanel(rodId));
      row.add([skinBtn, skinLabel]);
    }

    if (!equipped) {
      const btn = this.scene.add
        .rectangle(equipX, equipY, equipW, equipH, 0x3d6b4f)
        .setStrokeStyle(1, 0x7dce7a)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(equipX, equipY, "Equip", {
          fontFamily: "Arial",
          fontSize: "15px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      btn.on("pointerover", () => btn.setFillStyle(0x4a8a62));
      btn.on("pointerout", () => btn.setFillStyle(0x3d6b4f));
      btn.on("pointerdown", () => {
        if (this.onBeforeEquipRod && !this.onBeforeEquipRod(rodId)) return;
        if (this.inventory.equipRod(rodId)) {
          this.refresh();
          this.onChanged?.(`Equipped ${ITEMS[rodId].name}`);
        }
      });
      row.add([btn, label]);
    } else {
      const tag = this.scene.add
        .text(equipX, equipY, "Equipped", {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#ffe066",
        })
        .setOrigin(0.5);
      row.add(tag);
    }

    if (rodId === "test_rod" && this.inventory.isStellarSurferDefined()) {
      row.add(this.makeDefinedStamp(-150, y + rowH / 2));
    }

    return row;
  }

  /** Red rubber-stamp overlay on the DEFINED Stellar Surfer icon. */
  private makeDefinedStamp(
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const stamp = this.scene.add.container(x, y);
    stamp.setAngle(-28);

    const label = this.scene.add
      .text(0, 0, "DEFINED", {
        fontFamily: "Impact, Arial Black, sans-serif",
        fontSize: "14px",
        color: "#e02020",
        stroke: "#5a0000",
        strokeThickness: 3,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setAlpha(0.95);

    const padX = 5;
    const padY = 3;
    const bw = label.width + padX * 2;
    const bh = label.height + padY * 2;
    const border = this.scene.add.graphics();
    border.lineStyle(2.5, 0xe02020, 0.95);
    border.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 3);
    border.lineStyle(1, 0xff6666, 0.6);
    border.strokeRoundedRect(-bw / 2 + 2.5, -bh / 2 + 2.5, bw - 5, bh - 5, 2);

    stamp.add([border, label]);
    return stamp;
  }

  private closeSkinPanel(): void {
    this.limitedTooltip.hide();
    this.skinPanel?.destroy(true);
    this.skinPanel = null;
  }

  private openRodSkinPanel(rodId: ItemId): void {
    this.closeSkinPanel();
    this.closeMasteryPanel();

    const rodName = ITEMS[rodId]?.name ?? "Rod";
    const options = this.inventory.getRodSkinOptions(rodId);
    const activeId = this.inventory.getActiveRodSkinId(rodId);
    const ownedCount = options.filter((s) => s.owned).length;
    const boxW = PANEL_W;
    const boxH = PANEL_H;
    const rowH = 96;
    const rowW = boxW - 48;
    const iconSlot = 72;
    const textX = -rowW / 2 + iconSlot + 24;

    const panel = this.scene.add.container(0, 0).setDepth(20);
    const dim = this.scene.add
      .rectangle(0, 0, PANEL_W + 80, PANEL_H + 80, 0x000000, 0.55)
      .setInteractive();
    dim.on("pointerdown", () => this.closeSkinPanel());

    const box = this.scene.add
      .rectangle(0, 0, boxW, boxH, 0x1a1c22, 0.96)
      .setStrokeStyle(2, 0xc4a86a);

    const title = this.scene.add
      .text(0, -boxH / 2 + 36, `${rodName} Skins`, {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    const subtitle = this.scene.add
      .text(
        0,
        -boxH / 2 + 68,
        ownedCount <= 1
          ? "Default look — unlock more skins in the world"
          : "Choose a skin you own",
        {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#a8b0c0",
        }
      )
      .setOrigin(0.5);

    panel.add([dim, box, title, subtitle]);

    let y = -boxH / 2 + 120;
    for (const skin of options) {
      const active = skin.id === activeId;
      const rowBg = this.scene.add
        .rectangle(
          0,
          y,
          rowW,
          rowH - 12,
          active ? 0x3a3420 : skin.owned ? 0x2a2f3a : 0x22262e,
          0.95
        )
        .setStrokeStyle(
          2,
          active ? 0xffe066 : skin.owned ? 0x6a7355 : 0x444444
        );

      const tex = this.scene.textures.exists(skin.textureKey)
        ? skin.textureKey
        : "rod";
      // Keep icon inside a fixed slot so wide rod art can't cover labels
      const [iw, ih] = this.fitIcon(tex, iconSlot - 16);
      const icon = this.scene.add
        .image(-rowW / 2 + iconSlot / 2 + 8, y, tex)
        .setDisplaySize(iw, ih)
        .setAlpha(skin.owned ? 1 : 0.35);

      const label = this.scene.add
        .text(textX, y - 14, skin.label, {
          fontFamily: "Georgia, serif",
          fontSize: "20px",
          color: skin.owned ? (active ? "#ffe066" : "#ffffff") : "#777777",
        })
        .setOrigin(0, 0.5);

      const status = this.scene.add
        .text(
          textX,
          y + 16,
          !skin.owned ? "Locked" : active ? "Equipped" : "Owned",
          {
            fontFamily: "Arial",
            fontSize: "14px",
            color: !skin.owned ? "#666666" : active ? "#7dff9a" : "#a8b0c0",
          }
        )
        .setOrigin(0, 0.5);

      panel.add([rowBg, icon, label, status]);

      if (skin.limitedEdition) {
        const badge = createLimitedEditionBadge(
          this.scene,
          skin.limitedEdition,
          textX + label.width + 36,
          y - 14,
          this.limitedTooltip
        );
        panel.add(badge);
      }

      if (skin.owned && !active) {
        rowBg.setInteractive({ useHandCursor: true });
        rowBg.on("pointerover", () => rowBg.setFillStyle(0x3a4555, 0.95));
        rowBg.on("pointerout", () => rowBg.setFillStyle(0x2a2f3a, 0.95));
        rowBg.on("pointerdown", () => {
          const result = this.inventory.setRodSkin(rodId, skin.id);
          this.closeSkinPanel();
          this.refresh();
          this.onChanged?.(result.message);
        });
      }

      y += rowH;
    }

    const closeBtn = this.scene.add
      .rectangle(0, boxH / 2 - 40, 120, 36, 0x3d6b4f)
      .setStrokeStyle(1, 0x7dce7a)
      .setInteractive({ useHandCursor: true });
    const closeLabel = this.scene.add
      .text(0, boxH / 2 - 40, "Close", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    closeBtn.on("pointerover", () => closeBtn.setFillStyle(0x4a8a62));
    closeBtn.on("pointerout", () => closeBtn.setFillStyle(0x3d6b4f));
    closeBtn.on("pointerdown", () => this.closeSkinPanel());
    panel.add([closeBtn, closeLabel]);

    this.root.add(panel);
    this.skinPanel = panel;
  }

  private closeMasteryPanel(): void {
    this.masteryPanel?.destroy(true);
    this.masteryPanel = null;
  }

  private openRodMasteryPanel(rodId: ItemId): void {
    this.closeMasteryPanel();
    this.closeSkinPanel();

    const def = ITEMS[rodId];
    const progress = this.inventory.getRodMastery(rodId);
    const need = xpRequiredForLevel(progress.level);
    const fill = rodMasteryFill(progress);
    const accent = rodMasteryAccent(progress.level);
    const statPct = Math.round((rodLevelStatMult(progress.level) - 1) * 100);
    const controlPct = Math.round((rodLevelControlMult(progress.level) - 1) * 10000) / 100;
    const maxed = progress.level >= ROD_MASTERY_MAX_LEVEL;

    let abilityLine = "Catch fish with this rod to earn XP.";
    let abilityUnlocked = false;
    if (rodId === "recoil_rod" && InventorySystem.RECOIL_MASTERY_ENABLED) {
      abilityUnlocked = this.inventory.isRecoilBurstMasteryUnlocked();
      abilityLine = abilityUnlocked
        ? "Lv15 Ability unlocked — 3rd blast fires a rapid burst!"
        : `Reach Lv${ROD_MASTERY_ABILITY_LEVEL} to unlock rapid burst (3rd recoil).`;
    } else if (rodId === "portal_rod" && InventorySystem.PORTAL_MASTERY_ENABLED) {
      abilityUnlocked = this.inventory.isPortalMasteryUnlocked();
      abilityLine = abilityUnlocked
        ? "Lv15 Ability unlocked — Gate dupes + +25 stats (4m depth)!"
        : `Reach Lv${ROD_MASTERY_ABILITY_LEVEL} for Gate duplicates & +25 stats.`;
    } else if (rodId === "test_rod" && InventorySystem.SURFER_MASTERY_ENABLED) {
      if (this.inventory.isStellarSurferDefined()) {
        abilityLine = "DEFINED form — cannot earn mastery XP or abilities.";
      } else if (!this.inventory.isStellarSurferAscended()) {
        abilityLine = "Ascend the Stellar Surfer to unlock its Lv15 ability.";
      } else {
        abilityUnlocked = this.inventory.isStellarSurferMasteryUnlocked();
        abilityLine = abilityUnlocked
          ? "Lv15 Ability unlocked — follower black hole · Rubber Duck skin!"
          : `Reach Lv${ROD_MASTERY_ABILITY_LEVEL} for follower black hole & Rubber Duck skin.`;
      }
    } else {
      abilityLine = `Every level: +1% stats, +0.25% Control. Max Lv${ROD_MASTERY_MAX_LEVEL}.`;
    }
    const goldUnlocked = progress.level >= ROD_MASTERY_GOLD_LEVEL;
    const goldLine = goldUnlocked
      ? `Lv${ROD_MASTERY_GOLD_LEVEL} Golden look unlocked — default finish gleams with sparkles.`
      : `Reach Lv${ROD_MASTERY_GOLD_LEVEL} for a golden rod look + sparkles.`;
    const rainbowUnlocked = progress.level >= ROD_MASTERY_RAINBOW_LEVEL;
    const rainbowLine = rainbowUnlocked
      ? `Lv${ROD_MASTERY_RAINBOW_LEVEL} Rainbow look unlocked — prismatic shaft + tip trail.`
      : `Reach Lv${ROD_MASTERY_RAINBOW_LEVEL} for a rainbow rod look + tip trail.`;

    const panel = this.scene.add.container(0, 0).setDepth(20);
    const dim = this.scene.add
      .rectangle(0, 0, PANEL_W + 40, PANEL_H + 40, 0x000000, 0.55)
      .setInteractive();
    dim.on("pointerdown", () => this.closeMasteryPanel());

    const box = this.scene.add
      .rectangle(0, 0, 380, 410, 0x1c1e26, 0.98)
      .setStrokeStyle(2, accent.ring);

    const title = this.scene.add
      .text(0, -138, `${def?.name ?? "Rod"} Mastery`, {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: accent.label,
      })
      .setOrigin(0.5);

    const meterGfx = this.scene.add.graphics();
    RodXpHud.drawMeter(meterGfx, 0, -58, 42, fill, progress.level, 7);
    const levelNum = this.scene.add
      .text(0, -58, String(progress.level), {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: accent.label,
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    const xpLine = this.scene.add
      .text(
        0,
        8,
        maxed
          ? `MAX LEVEL ${ROD_MASTERY_MAX_LEVEL}`
          : `${progress.xp} / ${need} XP to Lv${progress.level + 1}`,
        {
          fontFamily: "Arial",
          fontSize: "15px",
          color: "#e8e0d0",
        }
      )
      .setOrigin(0.5);

    const statsLine = this.scene.add
      .text(
        0,
        40,
        `Stats +${statPct}% · Control +${controlPct}% · 600 XP +400/level`,
        {
          fontFamily: "Arial",
          fontSize: "13px",
          color: "#a8b0c0",
        }
      )
      .setOrigin(0.5);

    const ability = this.scene.add
      .text(0, 72, abilityLine, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: abilityUnlocked ? "#7dff9a" : "#c9a0ff",
        align: "center",
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5);

    const goldInfo = this.scene.add
      .text(0, 98, goldLine, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: goldUnlocked ? "#ffe066" : "#a8b0c0",
        align: "center",
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5);

    const rainbowInfo = this.scene.add
      .text(0, 122, rainbowLine, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: rainbowUnlocked ? "#ff88dd" : "#a8b0c0",
        align: "center",
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5);

    const tip = this.scene.add
      .text(
        0,
        152,
        "Fish XP: Driftwood 10 · Salmon 20 · Flounder 60\nYellowfin 120 · Bluefin 245 · Eel 360 · Sunfish 570\nDolphin 4,000 · Whale 7,000",
        {
          fontFamily: "Arial",
          fontSize: "11px",
          color: "#888890",
          align: "center",
          lineSpacing: 2,
        }
      )
      .setOrigin(0.5);

    const closeBtn = this.scene.add
      .rectangle(0, 188, 110, 34, 0x3d6b4f)
      .setStrokeStyle(1, 0x7dce7a)
      .setInteractive({ useHandCursor: true });
    const closeLabel = this.scene.add
      .text(0, 188, "Close", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    closeBtn.on("pointerover", () => closeBtn.setFillStyle(0x4a8a62));
    closeBtn.on("pointerout", () => closeBtn.setFillStyle(0x3d6b4f));
    closeBtn.on("pointerdown", () => this.closeMasteryPanel());

    panel.add([
      dim,
      box,
      title,
      meterGfx,
      levelNum,
      xpLine,
      statsLine,
      ability,
      goldInfo,
      rainbowInfo,
      tip,
      closeBtn,
      closeLabel,
    ]);
    this.root.add(panel);
    this.masteryPanel = panel;
  }

  private makeBobberRow(
    bobberId: ItemId,
    y: number,
    rowH: number
  ): Phaser.GameObjects.Container {
    const def = ITEMS[bobberId];
    const equipped = this.inventory.getEquippedBobberId() === bobberId;

    const card = this.scene.add
      .rectangle(0, y, 400, rowH, equipped ? 0x3a3420 : 0x2a2f3a, 0.95)
      .setStrokeStyle(2, equipped ? 0xffe066 : 0x6a7355)
      .setOrigin(0.5, 0);

    const [iw, ih] = this.fitIcon(def.textureKey, 52);
    const icon = this.scene.add
      .image(-150, y + rowH / 2, def.textureKey)
      .setDisplaySize(iw, ih);

    const name = this.scene.add
      .text(-112, y + 14, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: equipped ? "#ffe066" : "#ffffff",
      })
      .setOrigin(0, 0);

    const statsText = this.scene.add
      .text(-112, y + 42, formatBobberStats(def), {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#c8c8c8",
        lineSpacing: 3,
      })
      .setOrigin(0, 0);

    const row = this.scene.add.container(0, 0);
    row.add([card, icon, name, statsText]);

    if (!equipped) {
      const btn = this.scene.add
        .rectangle(140, y + rowH / 2, 100, 36, 0x3d6b4f)
        .setStrokeStyle(1, 0x7dce7a)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(140, y + rowH / 2, "Equip", {
          fontFamily: "Arial",
          fontSize: "15px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      btn.on("pointerover", () => btn.setFillStyle(0x4a8a62));
      btn.on("pointerout", () => btn.setFillStyle(0x3d6b4f));
      btn.on("pointerdown", () => {
        if (this.inventory.equipBobber(bobberId)) {
          this.refresh();
          this.onChanged?.(`Equipped ${ITEMS[bobberId].name}`);
        }
      });
      row.add([btn, label]);
    } else {
      const tag = this.scene.add
        .text(140, y + rowH / 2, "Equipped", {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#ffe066",
        })
        .setOrigin(0.5);
      row.add(tag);
    }

    return row;
  }

  private makeHatNoneRow(
    y: number,
    rowH: number
  ): Phaser.GameObjects.Container {
    const equipped = this.inventory.getEquippedHatId() === null;
    const card = this.scene.add
      .rectangle(0, y, 400, rowH, equipped ? 0x3a3420 : 0x2a2f3a, 0.95)
      .setStrokeStyle(2, equipped ? 0xffe066 : 0x6a7355)
      .setOrigin(0.5, 0);
    const name = this.scene.add
      .text(-150, y + rowH / 2, "No hat", {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: equipped ? "#ffe066" : "#ffffff",
      })
      .setOrigin(0, 0.5);
    const row = this.scene.add.container(0, 0);
    row.add([card, name]);
    if (!equipped) {
      const btn = this.scene.add
        .rectangle(140, y + rowH / 2, 100, 36, 0x3d6b4f)
        .setStrokeStyle(1, 0x7dce7a)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(140, y + rowH / 2, "Unequip", {
          fontFamily: "Arial",
          fontSize: "15px",
          color: "#ffffff",
        })
        .setOrigin(0.5);
      btn.on("pointerover", () => btn.setFillStyle(0x4a8a62));
      btn.on("pointerout", () => btn.setFillStyle(0x3d6b4f));
      btn.on("pointerdown", () => {
        if (this.inventory.equipHat(null)) {
          this.refresh();
          this.onHatChanged?.();
          this.onChanged?.("Hat removed");
        }
      });
      row.add([btn, label]);
    } else {
      row.add(
        this.scene.add
          .text(140, y + rowH / 2, "Equipped", {
            fontFamily: "Arial",
            fontSize: "14px",
            color: "#ffe066",
          })
          .setOrigin(0.5)
      );
    }
    return row;
  }

  private makeHatRow(
    hatId: ItemId,
    y: number,
    rowH: number
  ): Phaser.GameObjects.Container {
    const def = ITEMS[hatId];
    const equipped = this.inventory.getEquippedHatId() === hatId;
    const card = this.scene.add
      .rectangle(0, y, 400, rowH, equipped ? 0x3a3420 : 0x2a2f3a, 0.95)
      .setStrokeStyle(2, equipped ? 0xffe066 : 0x6a7355)
      .setOrigin(0.5, 0);
    const [iw, ih] = this.fitIcon(def.textureKey, 48);
    const icon = this.scene.add
      .image(-150, y + rowH / 2, def.textureKey)
      .setDisplaySize(iw, ih);
    const name = this.scene.add
      .text(-112, y + 18, def.name, {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: equipped ? "#ffe066" : "#ffffff",
      })
      .setOrigin(0, 0);
    const desc = this.scene.add
      .text(-112, y + 46, def.description, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#c8c8c8",
        wordWrap: { width: 220 },
      })
      .setOrigin(0, 0);
    const row = this.scene.add.container(0, 0);
    row.add([card, icon, name, desc]);
    if (!equipped) {
      const btn = this.scene.add
        .rectangle(140, y + rowH / 2, 100, 36, 0x3d6b4f)
        .setStrokeStyle(1, 0x7dce7a)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(140, y + rowH / 2, "Equip", {
          fontFamily: "Arial",
          fontSize: "15px",
          color: "#ffffff",
        })
        .setOrigin(0.5);
      btn.on("pointerover", () => btn.setFillStyle(0x4a8a62));
      btn.on("pointerout", () => btn.setFillStyle(0x3d6b4f));
      btn.on("pointerdown", () => {
        if (this.inventory.equipHat(hatId)) {
          this.refresh();
          this.onHatChanged?.();
          this.onChanged?.(`Equipped ${def.name}`);
        }
      });
      row.add([btn, label]);
    } else {
      row.add(
        this.scene.add
          .text(140, y + rowH / 2, "Equipped", {
            fontFamily: "Arial",
            fontSize: "14px",
            color: "#ffe066",
          })
          .setOrigin(0.5)
      );
    }
    return row;
  }

  private makeAmuletRow(
    amuletId: ItemId,
    count: number,
    y: number,
    rowH: number
  ): {
    row: Phaser.GameObjects.Container;
    adminLetters?: Phaser.GameObjects.Text[];
  } {
    const def = ITEMS[amuletId];
    const rarity = def.rarity;
    const isAdmin = rarity === "admin";
    const stroke = isAdmin
      ? 0xff8844
      : rarity
        ? Phaser.Display.Color.HexStringToColor(RARITY_COLOR[rarity]).color
        : 0x6a7355;

    const card = this.scene.add
      .rectangle(0, y, 400, rowH, 0x2a2f3a, 0.95)
      .setStrokeStyle(2, stroke)
      .setOrigin(0.5, 0);

    const [iw, ih] = this.fitIcon(def.textureKey, 52);
    const icon = this.scene.add
      .image(-150, y + rowH / 2, def.textureKey)
      .setDisplaySize(iw, ih);

    const name = this.scene.add
      .text(-112, y + 10, `${def.name}  ×${count}`, {
        fontFamily: "Georgia, serif",
        fontSize: "17px",
        color: "#ffffff",
      })
      .setOrigin(0, 0);

    let adminLetters: Phaser.GameObjects.Text[] | undefined;
    const kids: Phaser.GameObjects.GameObject[] = [card, icon, name];

    if (rarity) {
      if (isAdmin) {
        const wave = createGradientWaveText(
          this.scene,
          RARITY_NAME.admin,
          {
            fontFamily: "Arial",
            fontSize: "12px",
            color: RARITY_COLOR.admin,
            fontStyle: "bold",
          },
          0
        );
        // Left-align under the name (wave is centered on its root)
        wave.root.setPosition(-112 + wave.width / 2, y + 32);
        kids.push(wave.root);
        adminLetters = wave.letters;
      } else {
        kids.push(
          this.scene.add
            .text(-112, y + 32, RARITY_NAME[rarity], {
              fontFamily: "Arial",
              fontSize: "11px",
              color: RARITY_COLOR[rarity],
            })
            .setOrigin(0, 0)
        );
      }
    }

    const desc = this.scene.add
      .text(-112, y + (rarity ? 50 : 40), def.description, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#c8c8c8",
        wordWrap: { width: 210 },
      })
      .setOrigin(0, 0);
    kids.push(desc);

    const tipLines = [
      def.name,
      rarity ? RARITY_NAME[rarity] : "Amulet",
      "",
      def.description,
      "",
      "Click Use to activate.",
    ];
    const tip = tipLines.join("\n");
    const hit = this.scene.add
      .rectangle(0, y, 400, rowH, 0x000000, 0.001)
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });
    hit.on("pointerover", (p: Phaser.Input.Pointer) => {
      this.limitedTooltip.show(tip, p.x, p.y);
    });
    hit.on("pointermove", (p: Phaser.Input.Pointer) => {
      this.limitedTooltip.show(tip, p.x, p.y);
    });
    hit.on("pointerout", () => this.limitedTooltip.hide());
    kids.push(hit);

    const btn = this.scene.add
      .rectangle(140, y + rowH / 2, 100, 36, 0x4a3d6b)
      .setStrokeStyle(1, 0xb48cff)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add
      .text(140, y + rowH / 2, "Use", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    btn.on("pointerover", () => btn.setFillStyle(0x5c4a82));
    btn.on("pointerout", () => btn.setFillStyle(0x4a3d6b));
    btn.on("pointerdown", () => {
      this.onAmuletUsed?.(amuletId);
    });
    kids.push(btn, label);

    const row = this.scene.add.container(0, 0);
    row.add(kids);
    // Keep Use button above the full-row hit for clicks
    row.bringToTop(btn);
    row.bringToTop(label);
    return { row, adminLetters };
  }

  private makeBaitRow(
    baitId: ItemId,
    count: number,
    y: number,
    rowH: number
  ): Phaser.GameObjects.Container {
    const def = ITEMS[baitId];
    const rarity = def.baitRarity ?? "common";
    const rarityColor = RARITY_COLOR[rarity];

    const card = this.scene.add
      .rectangle(0, y, 400, rowH, 0x2a2f3a, 0.95)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(rarityColor).color)
      .setOrigin(0.5, 0);

    const [iw, ih] = this.fitIcon(def.textureKey, 52);
    const icon = this.scene.add
      .image(-150, y + rowH / 2, def.textureKey)
      .setDisplaySize(iw, ih);

    const name = this.scene.add
      .text(-112, y + 10, `${def.name}  ×${count}`, {
        fontFamily: "Georgia, serif",
        fontSize: "17px",
        color: "#ffffff",
      })
      .setOrigin(0, 0);

    const rarityLabel = this.scene.add
      .text(-112, y + 32, rarity, {
        fontFamily: "Arial",
        fontSize: "11px",
        color: rarityColor,
      })
      .setOrigin(0, 0);

    const desc = this.scene.add
      .text(-112, y + 50, def.description, {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#c8c8c8",
        wordWrap: { width: 210 },
      })
      .setOrigin(0, 0);

    const cd = this.inventory.getBaitCooldownMs();
    const onCooldown = cd > 0;
    const btn = this.scene.add
      .rectangle(140, y + rowH / 2, 100, 36, onCooldown ? 0x2a3440 : 0x284858)
      .setStrokeStyle(1, 0x7ec8ff)
      .setInteractive({ useHandCursor: true });
    const cdSec = Math.ceil(cd / 1000);
    const cdLabel = `${Math.floor(cdSec / 60)}:${(cdSec % 60)
      .toString()
      .padStart(2, "0")}`;
    const label = this.scene.add
      .text(140, y + rowH / 2, onCooldown ? cdLabel : "Use", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    if (onCooldown) btn.setAlpha(0.55);

    btn.on("pointerover", () => {
      if (!onCooldown) btn.setFillStyle(0x345868);
    });
    btn.on("pointerout", () =>
      btn.setFillStyle(onCooldown ? 0x2a3440 : 0x284858)
    );
    btn.on("pointerdown", () => {
      this.onBaitUsed?.(baitId);
    });

    const row = this.scene.add.container(0, 0);
    row.add([card, icon, name, rarityLabel, desc, btn, label]);
    return row;
  }
}
