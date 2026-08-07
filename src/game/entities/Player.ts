import Phaser from "phaser";
import {
  CAST_RELEASE_FRAME,
  FISH_FRAME_TIPS,
  HEAD_TOP_LOCAL,
  PLAYER_FRAME_H,
  PLAYER_FRAME_W,
  ROD_TIP_LOCAL,
  RodDrawStyle,
  rodStyleFromItemId,
} from "./PlayerArt";
import { ITEMS, ItemId } from "../data/items";

export type PlayerAnimMode =
  | "move"
  | "fishing-cast"
  | "fishing-wait"
  | "boat";

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  private cursors!: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    jump: Phaser.Input.Keyboard.Key;
  };
  private facing: "left" | "right" = "right";
  private locked = false;
  private animMode: PlayerAnimMode = "move";
  private onBoat = false;
  private exclamation?: Phaser.GameObjects.Text;
  private wasOnGround = true;
  private fishingRodStyle: RodDrawStyle = "starter";
  /** Rod shown over the shoulder while selected on the hotbar. */
  private carriedRodStyle: RodDrawStyle | null = null;
  /** Gallery Crystal Rod skin overlay (replaces baked rod while carrying). */
  private crystalSkinOn = false;
  private skinSprite?: Phaser.GameObjects.Image;
  private equippedHatId: ItemId | null = null;
  private hatSprite?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, "player_idle_0");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    this.sprite.setDragX(1400);
    this.sprite.setMaxVelocity(320, 900);
    this.sprite.setDepth(12);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    // Body sits on the left of the wider (rod) frame
    body.setSize(22, 52);
    body.setOffset(11, 10);
    this.sprite.setFlipX(false);

    if (scene.textures.exists("crystal_rod_skin")) {
      this.skinSprite = scene.add
        .image(x, y, "crystal_rod_skin")
        .setDepth(13)
        .setVisible(false)
        .setOrigin(0.35, 0.55);
    }

    this.hatSprite = scene.add
      .image(x, y, "hat_tophat")
      .setDepth(14)
      .setVisible(false)
      .setOrigin(0.5, 0.85);

    const keyboard = scene.input.keyboard!;
    this.cursors = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    this.sprite.play("player-idle");
  }

  /** Equip / unequip a cosmetic hat overlay. */
  syncHat(hatId: ItemId | null): void {
    this.equippedHatId = hatId && ITEMS[hatId]?.isHat ? hatId : null;
    this.updateHatSprite();
  }

  /**
   * Sync shoulder-carry rod with the hotbar selection.
   * Pass the selected item id (or null); only rods show in-hand.
   * `crystalSkin` overlays gallery skin art on the Crystal Rod animations.
   */
  syncCarriedRod(
    selectedItemId: ItemId | null,
    opts?: { crystalSkin?: boolean }
  ): void {
    const wantSkin =
      selectedItemId === "crystal_rod" && !!opts?.crystalSkin;
    const next =
      selectedItemId && ITEMS[selectedItemId]?.isRod
        ? rodStyleFromItemId(selectedItemId)
        : null;
    if (next === this.carriedRodStyle && wantSkin === this.crystalSkinOn) {
      this.updateSkinSprite();
      return;
    }
    this.carriedRodStyle = next;
    this.crystalSkinOn = wantSkin;
    this.skinSprite?.setVisible(wantSkin);

    if (this.animMode === "move" && !this.locked) {
      const key = this.sprite.anims.currentAnim?.key ?? "";
      if (key.includes("walk")) this.playMoveAnim("walk");
      else if (key.includes("jump")) this.playMoveAnim("jump");
      else this.playMoveAnim("idle");
    } else if (this.onBoat && this.animMode === "boat") {
      this.applyBoatTexture();
    }
    this.updateSkinSprite();
  }

  /** Map frame-local pixels to world (accounts for facing). */
  private localToWorld(local: { x: number; y: number }): { x: number; y: number } {
    const lx = local.x - PLAYER_FRAME_W / 2;
    const ly = local.y - PLAYER_FRAME_H / 2;
    return {
      x: this.sprite.x + (this.facing === "left" ? -lx : lx),
      y: this.sprite.y + ly,
    };
  }

  private currentRodHandLocal(): { x: number; y: number } {
    // Matches drawPlayerFrame hand (approx) for carry / cast
    const fishing =
      this.animMode === "fishing-cast" || this.animMode === "fishing-wait";
    if (fishing) {
      const tip = this.currentRodTipLocal();
      // Hand sits toward the torso from the tip
      return {
        x: Phaser.Math.Linear(28, tip.x, 0.15),
        y: Phaser.Math.Linear(40, tip.y, 0.15),
      };
    }
    // Shoulder-carry grip (idle / walk / boat sit)
    return { x: 30, y: 42 };
  }

  private updateSkinSprite(): void {
    if (!this.skinSprite || !this.crystalSkinOn) {
      this.skinSprite?.setVisible(false);
      return;
    }
    this.skinSprite.setVisible(true);

    const fishing =
      this.animMode === "fishing-cast" || this.animMode === "fishing-wait";
    const tipLocal = this.currentRodTipLocalForSkin();
    const handLocal = this.currentRodHandLocal();
    const hand = this.localToWorld(handLocal);
    const tip = this.localToWorld(tipLocal);

    // Sit along the baked rod, nudged down so the skin covers it
    const t = fishing ? 0.42 : 0.36;
    let x = hand.x + (tip.x - hand.x) * t;
    let y = hand.y + (tip.y - hand.y) * t + (fishing ? 14 : 18);
    let angle = Phaser.Math.RadToDeg(
      Math.atan2(tip.y - hand.y, tip.x - hand.x)
    );

    // Facing left while carrying: swing further behind so the bulk clears the face
    if (!fishing && this.facing === "left") {
      angle += 58;
      x += 8;
      y -= 14;
    }

    this.skinSprite.setFlipX(false);
    this.skinSprite.setOrigin(0.18, 0.55);
    this.skinSprite.setPosition(x, y);
    this.skinSprite.setAngle(angle);
    this.skinSprite.setDisplaySize(62, 38);
    this.skinSprite.setDepth(this.sprite.depth + 1);
  }

  /**
   * World point of the skin's fist / muzzle — where the fishing line attaches.
   */
  private getSkinFistWorld(): { x: number; y: number } {
    const s = this.skinSprite!;
    // Fist is the grey block near the right end of crystal_rod_skin.png
    const localX = s.displayWidth * (0.9 - s.originX);
    const localY = s.displayHeight * (0.5 - s.originY);
    const rad = Phaser.Math.DegToRad(s.angle);
    const c = Math.cos(rad);
    const sn = Math.sin(rad);
    return {
      x: s.x + localX * c - localY * sn,
      y: s.y + localX * sn + localY * c,
    };
  }

  private updateHatSprite(): void {
    if (!this.hatSprite) return;
    if (!this.equippedHatId) {
      this.hatSprite.setVisible(false);
      return;
    }
    const key = ITEMS[this.equippedHatId]?.textureKey ?? this.equippedHatId;
    if (
      this.hatSprite.texture.key !== key &&
      this.hatSprite.scene.textures.exists(key)
    ) {
      this.hatSprite.setTexture(key);
    }

    const head = this.localToWorld(this.currentHeadTopLocal());
    const id = this.equippedHatId;
    const gem = id === "hat_gem";
    const yellowfin = id === "hat_yellowfin";

    // Bottom of hat sits on hairline; gem floats above
    let originY = 0.92;
    let sizeW = 30;
    let sizeH = 30;
    let yOff = 1;
    if (gem) {
      originY = 0.5;
      sizeW = 20;
      sizeH = 20;
      yOff = -14;
    } else if (yellowfin) {
      originY = 0.72;
      // Keep the PNG's natural aspect — do not squash
      const src = this.hatSprite.texture.getSourceImage() as {
        width?: number;
        height?: number;
      };
      const tw = Math.max(1, src.width ?? 48);
      const th = Math.max(1, src.height ?? 28);
      sizeH = 26;
      sizeW = Math.round(sizeH * (tw / th));
      yOff = 1;
    } else if (id === "hat_tophat") {
      originY = 0.95;
      sizeW = 28;
      sizeH = 28;
      yOff = 2;
    } else if (id === "hat_banana") {
      originY = 0.88;
      sizeW = 30;
      sizeH = 30;
      yOff = 0;
    } else if (id === "hat_cap") {
      originY = 0.9;
      sizeW = 36;
      sizeH = 28;
      yOff = 2;
    } else if (id === "hat_shell") {
      originY = 0.88;
      sizeW = 30;
      sizeH = 30;
      yOff = 1;
    }

    this.hatSprite.setVisible(true);
    this.hatSprite.setFlipX(this.facing === "left");
    this.hatSprite.setOrigin(0.5, originY);
    this.hatSprite.setPosition(head.x, head.y + yOff);
    this.hatSprite.setDisplaySize(sizeW, sizeH);
    this.hatSprite.setDepth(this.sprite.depth + 2);
    this.hatSprite.setAngle(0);
  }

  /** Head hairline in frame pixels — tracks bob / lean from current pose. */
  private currentHeadTopLocal(): { x: number; y: number } {
    let bob = 0;
    let lean = 0;
    const key =
      this.sprite.anims.currentFrame?.textureKey ?? this.sprite.texture.key;

    const idleM = key.match(/player_idle(?:_rod_[a-z]+)?_(\d+)$/);
    if (idleM && Number(idleM[1]) === 2) bob = 1;

    const jumpM = key.match(/player_jump(?:_rod_[a-z]+)?_(\d+)$/);
    if (jumpM) {
      const i = Number(jumpM[1]);
      bob = i === 1 ? -2 : -1;
    }

    if (key.includes("player_sit") || key.includes("player_row")) {
      bob = 4;
    }

    const fishM = key.match(/player_fish_[a-z]+_(\d+)$/);
    if (fishM) {
      const leans = [0, -1, -1, -2, 0, 2, 0, 0];
      lean = leans[Number(fishM[1])] ?? 0;
    }

    const walkM = key.match(/player_walk(?:_rod_[a-z]+)?_(\d+)$/);
    if (walkM && Number(walkM[1]) === 3) lean = 1;

    return {
      x: HEAD_TOP_LOCAL.x + lean,
      y: HEAD_TOP_LOCAL.y + bob,
    };
  }

  /** Tip used for skin follow — carry uses shoulder tip, fishing uses cast tips. */
  private currentRodTipLocalForSkin(): { x: number; y: number } {
    const fishing =
      this.animMode === "fishing-cast" || this.animMode === "fishing-wait";
    if (fishing) return this.currentRodTipLocal();
    // Shoulder-carry tip (matches PlayerArt carry default tip)
    return { x: 18, y: 4 };
  }

  /** Anim style for baked frames — hide crystal rod art when gallery skin is on. */
  private animRodStyle(
    style: RodDrawStyle | null = this.carriedRodStyle
  ): RodDrawStyle | null {
    if (this.crystalSkinOn) return "hidden";
    return style;
  }

  private moveAnimKey(kind: "idle" | "walk" | "jump"): string {
    const style = this.animRodStyle();
    if (style) {
      return `player-${kind}-rod-${style}`;
    }
    return `player-${kind}`;
  }

  private playMoveAnim(kind: "idle" | "walk" | "jump"): void {
    const key = this.moveAnimKey(kind);
    if (this.sprite.anims.currentAnim?.key !== key) {
      this.sprite.play(key, true);
    }
  }

  private applyBoatTexture(): void {
    const style = this.animRodStyle();
    if (style) {
      this.sprite.setTexture(`player_sit_rod_${style}`);
    } else {
      this.sprite.setTexture("player_sit_0");
    }
    this.updateSkinSprite();
  }

  setLocked(locked: boolean): void {
    this.locked = locked;
    if (locked) {
      this.sprite.setVelocityX(0);
      return;
    }
    // Unlock: return to boat seat if still aboard, else free move
    if (this.onBoat) {
      this.animMode = "boat";
      this.sprite.anims.stop();
      this.applyBoatTexture();
    } else {
      this.animMode = "move";
      this.playMoveAnim("idle");
    }
  }

  /** True while cast / wait / bite fishing anims are playing. */
  isFishingAnim(): boolean {
    return (
      this.animMode === "fishing-cast" || this.animMode === "fishing-wait"
    );
  }

  playFishCast(
    rodItemId: ItemId = "starter_rod",
    onRelease?: () => void
  ): void {
    this.fishingRodStyle = rodStyleFromItemId(rodItemId);
    // Hidden frames keep tip timing; skin sprite is the visible rod
    const castStyle = this.animRodStyle(this.fishingRodStyle) ?? this.fishingRodStyle;
    const castKey = `player-fish-cast-${castStyle}`;
    this.animMode = "fishing-cast";
    this.updateSkinSprite();

    let released = false;
    const tryRelease = (frame: Phaser.Animations.AnimationFrame) => {
      if (released || !onRelease) return;
      // Release when the forward-cast frame shows (index 2 / tip whipped out).
      const key = frame.textureKey ?? "";
      const m = key.match(/_(\d+)$/);
      const idx = m ? Number(m[1]) : frame.index;
      if (idx >= CAST_RELEASE_FRAME) {
        released = true;
        onRelease();
      }
    };

    const onUpdate = (
      anim: Phaser.Animations.Animation,
      frame: Phaser.Animations.AnimationFrame
    ) => {
      if (this.animMode !== "fishing-cast") return;
      if (anim.key !== castKey) return;
      tryRelease(frame);
    };

    this.sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, onUpdate);

    this.sprite.play(castKey, true);

    this.sprite.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      (anim: Phaser.Animations.Animation) => {
        this.sprite.off(Phaser.Animations.Events.ANIMATION_UPDATE, onUpdate);
        if (!released && onRelease) {
          released = true;
          onRelease();
        }
        if (anim.key === castKey && this.animMode === "fishing-cast") {
          this.playFishWait();
        }
      }
    );
  }

  playFishWait(): void {
    const waitStyle =
      this.animRodStyle(this.fishingRodStyle) ?? this.fishingRodStyle;
    const waitKey = `player-fish-wait-${waitStyle}`;
    this.animMode = "fishing-wait";
    this.updateSkinSprite();
    if (this.sprite.anims.currentAnim?.key !== waitKey) {
      this.sprite.play(waitKey, true);
    }
  }

  enterBoat(): void {
    this.onBoat = true;
    this.animMode = "boat";
    this.locked = true;
    this.sprite.setVelocity(0, 0);
    this.sprite.anims.stop();
    this.applyBoatTexture();
    this.sprite.setDepth(11);
  }

  exitBoat(): void {
    this.onBoat = false;
    this.animMode = "move";
    this.locked = false;
    this.sprite.setDepth(12);
    this.playMoveAnim("idle");
  }

  isOnBoat(): boolean {
    return this.onBoat;
  }

  isKeyDown(key: "left" | "right" | "jump"): boolean {
    return this.cursors[key].isDown;
  }

  getFacing(): "left" | "right" {
    return this.facing;
  }

  setFacing(dir: "left" | "right"): void {
    this.facing = dir;
    this.sprite.setFlipX(dir === "left");
  }

  /** World position of the fishing-rod tip (matches current drawn eyelet / skin fist). */
  getRodTip(): { x: number; y: number } {
    if (this.crystalSkinOn && this.skinSprite) {
      this.updateSkinSprite();
      return this.getSkinFistWorld();
    }
    const tipLocal = this.currentRodTipLocal();
    const localX = tipLocal.x - PLAYER_FRAME_W / 2;
    const localY = tipLocal.y - PLAYER_FRAME_H / 2;
    return {
      x: this.sprite.x + (this.facing === "left" ? -localX : localX),
      y: this.sprite.y + localY,
    };
  }

  private currentRodTipLocal(): { x: number; y: number } {
    const frame = this.sprite.anims.currentFrame;
    const key = frame?.textureKey ?? this.sprite.texture.key;
    const m = key.match(/player_fish_[a-z]+_(\d+)$/);
    if (m) {
      const idx = Number(m[1]);
      return FISH_FRAME_TIPS[idx] ?? ROD_TIP_LOCAL;
    }
    return ROD_TIP_LOCAL;
  }

  showExclamation(color = "#ff2222"): void {
    if (this.exclamation) return;
    this.exclamation = this.sprite.scene.add
      .text(this.sprite.x, this.sprite.y - 56, "!", {
        fontFamily: "Arial Black, Arial",
        fontSize: "36px",
        color,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.sprite.scene.tweens.add({
      targets: this.exclamation,
      y: this.sprite.y - 68,
      duration: 200,
      yoyo: true,
      repeat: 2,
    });
  }

  hideExclamation(): void {
    this.exclamation?.destroy();
    this.exclamation = undefined;
  }

  update(): void {
    if (this.exclamation) {
      this.exclamation.setPosition(this.sprite.x, this.sprite.y - 58);
    }
    this.updateSkinSprite();
    this.updateHatSprite();

    if (this.locked || this.animMode !== "move") {
      // Keep fishing anims playing while locked
      return;
    }

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    const moving =
      this.cursors.left.isDown || this.cursors.right.isDown;

    if (this.cursors.left.isDown) {
      this.sprite.setVelocityX(-280);
      this.facing = "left";
      this.sprite.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.sprite.setVelocityX(280);
      this.facing = "right";
      this.sprite.setFlipX(false);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.jump) && onGround) {
      this.sprite.setVelocityY(-520);
      this.playMoveAnim("jump");
    }

    if (!onGround) {
      if (body.velocity.y < -40) {
        this.playMoveAnim("jump");
      } else {
        // Falling pose
        this.sprite.anims.stop();
        const fallStyle = this.animRodStyle();
        const fallKey = fallStyle
          ? `player_jump_rod_${fallStyle}_2`
          : "player_jump_2";
        this.sprite.setTexture(fallKey);
      }
    } else if (onGround && !this.wasOnGround) {
      this.playMoveAnim(moving ? "walk" : "idle");
    } else if (moving && Math.abs(body.velocity.x) > 20) {
      this.playMoveAnim("walk");
    } else if (onGround) {
      this.playMoveAnim("idle");
    }

    this.wasOnGround = onGround;
  }
}
