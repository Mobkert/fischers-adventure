import Phaser from "phaser";
import {
  SAVE_SLOT_COUNT,
  clearSaveSlot,
  findEmptySlotIndex,
  getActiveSlotIndex,
  getSlotSave,
  listSaveSlots,
  saveActiveToSlot,
  switchToSlot,
  writeSaveToSlot,
  type SaveSlotSummary,
} from "../save/SaveBank";
import {
  clearRememberedSlotPassword,
  cloudLoadSlot,
  cloudSaveSlot,
  getRememberedSlotPassword,
  normalizePassword,
  rememberSlotPassword,
  validatePassword,
} from "../save/CloudSave";

const INPUT_STYLE =
  "width: 140px; height: 28px; font-size: 14px; font-family: Arial; padding: 2px 6px; border: 2px solid #6a8a6a; border-radius: 4px; background: #142018; color: #f0e6d2;";

export class SavesScene extends Phaser.Scene {
  private messageText!: Phaser.GameObjects.Text;
  private slotRows: Phaser.GameObjects.Container[] = [];
  private slotPasswordInputs: Phaser.GameObjects.DOMElement[] = [];
  private cloudLoadInput?: Phaser.GameObjects.DOMElement;

  constructor() {
    super("SavesScene");
  }

  create(): void {
    // Game keys (E, A, D, W…) stay registered on the shared keyboard plugin
    // after play and block typing in DOM password fields — release them here.
    this.releaseKeyboardForDom();

    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a2a22, 0x1a2a22, 0x0e1814, 0x142018, 1);
    bg.fillRect(0, 0, width, height);

    this.add
      .text(width / 2, 40, "Saves", {
        fontFamily: "Georgia, serif",
        fontSize: "40px",
        color: "#f0e6d2",
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        78,
        "Load a slot to play it. Cloud Save uses a password — Save Here also updates cloud if one is set.",
        {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#9bb4a8",
        }
      )
      .setOrigin(0.5);

    this.messageText = this.add
      .text(width / 2, 104, "", {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#ffe066",
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.createBackButton();
    this.createCloudLoadBar();
    this.refreshSlots();
  }

  private createCloudLoadBar(): void {
    const { width, height } = this.scale;
    const y = height - 100;

    this.add
      .rectangle(width / 2, y, 980, 64, 0x152820, 1)
      .setStrokeStyle(2, 0x4a7a5a);

    this.add
      .text(width / 2 - 460, y - 14, "Load cloud password into an empty slot", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#9bb4a8",
      })
      .setOrigin(0, 0.5);

    this.cloudLoadInput = this.add
      .dom(width / 2 - 60, y + 12, "input", INPUT_STYLE, "")
      .setOrigin(0.5);
    const node = this.cloudLoadInput.node as HTMLInputElement | null;
    if (node) {
      node.type = "password";
      node.placeholder = "Cloud password";
      node.autocomplete = "off";
      this.wirePasswordInput(node);
    }

    this.makeSmallButton(width / 2 + 140, y + 12, "Load Cloud", 0x2a6aad, () => {
      this.onCloudLoad().catch((err) =>
        this.setMessage(err?.message || "Cloud load failed.")
      );
    });
  }

  private refreshSlots(): void {
    (this.slotPasswordInputs || []).forEach((el, i) => {
      const typed = normalizePassword(
        (el?.node as HTMLInputElement | null)?.value || ""
      );
      if (typed && !validatePassword(typed)) {
        rememberSlotPassword(i, typed);
      }
    });

    this.slotRows.forEach((row) => row.destroy(true));
    this.slotRows = [];
    this.slotPasswordInputs.forEach((el) => {
      try {
        el.destroy();
      } catch {
        /* ignore */
      }
    });
    this.slotPasswordInputs = [];

    const slots = listSaveSlots();
    const startY = 150;
    const rowH = 78;

    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
      const y = startY + i * rowH;
      this.slotRows.push(this.createSlotRow(slots[i], y));
    }
  }

  private createSlotRow(
    slot: SaveSlotSummary,
    y: number
  ): Phaser.GameObjects.Container {
    const { width } = this.scale;
    const container = this.add.container(width / 2, y);
    const isActive = slot.active;
    const bgColor = isActive ? 0x1a3a2c : 0x1a2430;
    const stroke = isActive ? 0x7dce7a : 0x3a4a50;

    const bg = this.add
      .rectangle(0, 0, 980, 70, bgColor, 1)
      .setStrokeStyle(2, stroke);

    const title = slot.empty
      ? `Slot ${slot.index + 1} — Empty`
      : `Slot ${slot.index + 1}`;
    const titleText = this.add
      .text(-450, -16, title, {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: isActive ? "#b8f0b0" : "#f0e6d2",
      })
      .setOrigin(0, 0.5);

    const detail = slot.empty
      ? "Fresh start — no progress yet"
      : `$${slot.coins.toLocaleString()} · ${slot.rods} rods · ${slot.fish} fish`;
    const detailText = this.add
      .text(-450, 12, detail, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#9bb4a8",
      })
      .setOrigin(0, 0.5);

    const kids: Phaser.GameObjects.GameObject[] = [bg, titleText, detailText];

    if (isActive) {
      kids.push(
        this.add
          .text(20, -16, "ACTIVE", {
            fontFamily: "Arial",
            fontSize: "12px",
            color: "#7dce7a",
            fontStyle: "bold",
          })
          .setOrigin(0, 0.5)
      );
    }

    kids.push(
      this.makeSmallButton(100, -10, "Load", 0x2a6aad, () =>
        this.onLoad(slot.index)
      , isActive),
      this.makeSmallButton(200, -10, "Save Here", 0x2a7a4a, () =>
        this.onSaveHere(slot.index)
      ),
      this.makeSmallButton(300, -10, "Clear", 0x7a2a2a, () =>
        this.onClear(slot.index)
      , slot.empty)
    );

    const input = this.add
      .dom(width / 2 + 40, y + 14, "input", INPUT_STYLE, "")
      .setOrigin(0.5);
    const node = input.node as HTMLInputElement | null;
    if (node) {
      node.type = "password";
      node.placeholder = "Password";
      node.autocomplete = "off";
      const remembered = getRememberedSlotPassword(slot.index);
      if (remembered) node.value = remembered;
      this.wirePasswordInput(node);
    }
    this.slotPasswordInputs.push(input);

    kids.push(
      this.makeSmallButton(400, 14, "Cloud Save", 0x6a4a2a, () => {
        const password = normalizePassword(node?.value || "");
        this.onCloudSave(slot.index, password).catch((err) =>
          this.setMessage(err?.message || "Cloud save failed.")
        );
      }, slot.empty)
    );

    container.add(kids);
    return container;
  }

  private makeSmallButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
    disabled = false
  ): Phaser.GameObjects.Container {
    const fill = disabled ? 0x333333 : color;
    const hover = disabled
      ? 0x333333
      : Phaser.Display.Color.IntegerToColor(color).lighten(18).color;
    const container = this.add.container(x, y);
    const bg = this.add
      .rectangle(0, 0, label.length > 8 ? 96 : 88, 30, fill, 1)
      .setStrokeStyle(1, disabled ? 0x444444 : 0xffffff, 0.35);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: disabled ? "#666666" : "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    container.add([bg, text]);

    if (!disabled && onClick) {
      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerover", () => bg.setFillStyle(hover));
      bg.on("pointerout", () => bg.setFillStyle(fill));
      bg.on("pointerdown", () => onClick());
    }

    return container;
  }

  private onLoad(index: number): void {
    switchToSlot(index);
    const slots = listSaveSlots();
    const slot = slots[index];
    this.setMessage(
      slot.empty
        ? `Loaded Slot ${index + 1} — fresh start.`
        : `Loaded Slot ${index + 1} — $${slot.coins.toLocaleString()}, ${slot.rods} rods.`
    );
    this.refreshSlots();
  }

  private onSaveHere(index: number): void {
    const active = getActiveSlotIndex();
    const typed = normalizePassword(
      (this.slotPasswordInputs?.[index]?.node as HTMLInputElement | null)
        ?.value || ""
    );
    const password =
      (typed && !validatePassword(typed) ? typed : "") ||
      getRememberedSlotPassword(index) ||
      getRememberedSlotPassword(active);

    saveActiveToSlot(index);

    if (password && !validatePassword(password)) {
      rememberSlotPassword(index, password);
      const meta = getSlotSave(index);
      if (meta) {
        this.setMessage(`Slot ${index + 1} saved — updating cloud…`);
        cloudSaveSlot(meta, password)
          .then(() => {
            this.setMessage(`Slot ${index + 1} saved locally and to cloud.`);
          })
          .catch((err) => {
            this.setMessage(
              `Slot ${index + 1} saved locally. Cloud update failed: ${err?.message || "error"}`
            );
          });
        this.refreshSlots();
        return;
      }
    }

    this.setMessage(
      index === active
        ? `Slot ${index + 1} updated.`
        : `Current progress saved into Slot ${index + 1}.`
    );
    this.refreshSlots();
  }

  private onClear(index: number): void {
    clearSaveSlot(index);
    clearRememberedSlotPassword(index);
    this.setMessage(`Slot ${index + 1} cleared.`);
    this.refreshSlots();
  }

  private async onCloudSave(index: number, password: string): Promise<void> {
    const err = validatePassword(password);
    if (err) {
      this.setMessage(err);
      return;
    }
    const meta = getSlotSave(index);
    if (!meta) {
      this.setMessage("Slot is empty — save progress here first.");
      return;
    }
    this.setMessage("Uploading cloud save…");
    await cloudSaveSlot(meta, password);
    rememberSlotPassword(index, password);
    this.setMessage(
      `Slot ${index + 1} saved to cloud. Use that password on any browser.`
    );
    this.refreshSlots();
  }

  private async onCloudLoad(): Promise<void> {
    const password = normalizePassword(
      (this.cloudLoadInput?.node as HTMLInputElement | null)?.value || ""
    );
    const err = validatePassword(password);
    if (err) {
      this.setMessage(err);
      return;
    }
    const empty = findEmptySlotIndex();
    if (empty < 0) {
      this.setMessage("No empty slot available — clear one first.");
      return;
    }
    this.setMessage("Loading cloud save…");
    const meta = await cloudLoadSlot(password);
    writeSaveToSlot(empty, meta);
    rememberSlotPassword(empty, password);
    this.setMessage(`Cloud save loaded into Slot ${empty + 1}.`);
    const node = this.cloudLoadInput?.node as HTMLInputElement | null;
    if (node) node.value = "";
    this.refreshSlots();
  }

  private setMessage(text: string): void {
    this.messageText.setText(text);
    this.time.delayedCall(3200, () => {
      if (this.messageText.active && this.messageText.text === text) {
        this.messageText.setText("");
      }
    });
  }

  private createBackButton(): void {
    const { height } = this.scale;
    const bg = this.add
      .rectangle(90, height - 40, 140, 40, 0x2a5a28)
      .setStrokeStyle(2, 0x66aa66)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(90, height - 40, "Back", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    bg.on("pointerover", () => bg.setFillStyle(0x3a7a38));
    bg.on("pointerout", () => bg.setFillStyle(0x2a5a28));
    bg.on("pointerdown", () => this.scene.start("MenuScene"));
  }

  private releaseKeyboardForDom(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    // Clear captures only — do NOT disable the plugin (that can leave the
    // next Play session unable to move if shutdown is skipped).
    kb.clearCaptures();
  }

  /** Stop Phaser from eating keydown while a password field is focused. */
  private wirePasswordInput(node: HTMLInputElement): void {
    node.addEventListener("focus", () => this.releaseKeyboardForDom());
    node.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      this.releaseKeyboardForDom();
    });
    // Stop game canvas from stealing the key event before the input gets it
    node.addEventListener("keydown", (e) => e.stopPropagation());
    node.addEventListener("keyup", (e) => e.stopPropagation());
    node.addEventListener("keypress", (e) => e.stopPropagation());
  }

  shutdown(): void {
    const kb = this.input.keyboard;
    if (kb) {
      kb.enabled = true;
      kb.clearCaptures();
    }
    this.slotPasswordInputs.forEach((el) => {
      try {
        el.destroy();
      } catch {
        /* ignore */
      }
    });
    this.slotPasswordInputs = [];
    try {
      this.cloudLoadInput?.destroy();
    } catch {
      /* ignore */
    }
  }
}
