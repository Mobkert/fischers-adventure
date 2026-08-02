import Phaser from "phaser";
import {
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

    const keyboard = scene.input.keyboard!;
    this.cursors = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    this.sprite.play("player-idle");
  }

  /**
   * Sync shoulder-carry rod with the hotbar selection.
   * Pass the selected item id (or null); only rods show in-hand.
   */
  syncCarriedRod(selectedItemId: ItemId | null): void {
    const next =
      selectedItemId && ITEMS[selectedItemId]?.isRod
        ? rodStyleFromItemId(selectedItemId)
        : null;
    if (next === this.carriedRodStyle) return;
    this.carriedRodStyle = next;

    if (this.animMode === "move" && !this.locked) {
      const key = this.sprite.anims.currentAnim?.key ?? "";
      if (key.includes("walk")) this.playMoveAnim("walk");
      else if (key.includes("jump")) this.playMoveAnim("jump");
      else this.playMoveAnim("idle");
    } else if (this.onBoat && this.animMode === "boat") {
      this.applyBoatTexture();
    }
  }

  private moveAnimKey(kind: "idle" | "walk" | "jump"): string {
    if (this.carriedRodStyle) {
      return `player-${kind}-rod-${this.carriedRodStyle}`;
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
    if (this.carriedRodStyle) {
      this.sprite.setTexture(`player_sit_rod_${this.carriedRodStyle}`);
    } else {
      this.sprite.setTexture("player_sit_0");
    }
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

  playFishCast(rodItemId: ItemId = "starter_rod"): void {
    this.fishingRodStyle = rodStyleFromItemId(rodItemId);
    const castKey = `player-fish-cast-${this.fishingRodStyle}`;
    this.animMode = "fishing-cast";
    this.sprite.play(castKey, true);
    this.sprite.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      (anim: Phaser.Animations.Animation) => {
        if (anim.key === castKey && this.animMode === "fishing-cast") {
          this.playFishWait();
        }
      }
    );
  }

  playFishWait(): void {
    const waitKey = `player-fish-wait-${this.fishingRodStyle}`;
    this.animMode = "fishing-wait";
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

  /** World position of the fishing-rod tip (matches drawn eyelet). */
  getRodTip(): { x: number; y: number } {
    const localX = ROD_TIP_LOCAL.x - PLAYER_FRAME_W / 2;
    const localY = ROD_TIP_LOCAL.y - PLAYER_FRAME_H / 2;
    return {
      x: this.sprite.x + (this.facing === "left" ? -localX : localX),
      y: this.sprite.y + localY,
    };
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
        const fallKey = this.carriedRodStyle
          ? `player_jump_rod_${this.carriedRodStyle}_2`
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
