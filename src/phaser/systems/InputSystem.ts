import Phaser from "phaser";
import type { Player } from "@/phaser/entities/Player";
import { facingFromVector, playDirectional } from "@/phaser/systems/DirectionalAnimation";

export interface AimState {
  /** Normalised aim vector in world space. */
  x: number;
  y: number;
  firing: boolean;
}

/**
 * InputSystem — Soul Knight style controls.
 * WASD / arrows move, the mouse aims, and holding the left button fires.
 * Touch: a virtual joystick drives movement and firing is automatic.
 */
export class InputSystem {
  private scene: Phaser.Scene;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private pointerDown = false;
  /** Set from the React joystick overlay. */
  touchVector = { x: 0, y: 0 };
  touchFiring = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const kb = scene.input.keyboard;
    if (kb) {
      this.keys = kb.addKeys("W,A,S,D,UP,LEFT,DOWN,RIGHT,SPACE") as Record<
        string,
        Phaser.Input.Keyboard.Key
      >;
    }
    scene.input.on("pointerdown", () => (this.pointerDown = true));
    scene.input.on("pointerup", () => (this.pointerDown = false));
    scene.input.on("gameout", () => (this.pointerDown = false));
  }

  private down(...names: string[]): boolean {
    return names.some((n) => this.keys[n]?.isDown);
  }

  /** Applies movement + walk/idle animation to the player. */
  updateMovement(player: Player) {
    const body = player.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body || player.dead) return;

    let dx = 0;
    let dy = 0;
    if (this.down("A", "LEFT")) dx -= 1;
    if (this.down("D", "RIGHT")) dx += 1;
    if (this.down("W", "UP")) dy -= 1;
    if (this.down("S", "DOWN")) dy += 1;
    if (dx === 0 && dy === 0) {
      dx = this.touchVector.x;
      dy = this.touchVector.y;
    }

    const len = Math.hypot(dx, dy);
    const moving = len > 0.15;
    if (moving) {
      body.setVelocity((dx / len) * player.speed, (dy / len) * player.speed);
    } else {
      body.setVelocity(0, 0);
    }

    const aim = this.getAim(player);
    player.facing = facingFromVector(aim.x, aim.y);

    const current = player.sprite.anims.currentAnim?.key ?? "";
    const busy = player.sprite.anims.isPlaying && /player_(bow|damage|death)/.test(current);
    if (!busy) {
      playDirectional(player.sprite, moving ? "player_walk" : "player_idle", player.facing);
    }
  }

  /** Aim direction: mouse position on desktop, movement vector on touch. */
  getAim(player: Player): AimState {
    const pointer = this.scene.input.activePointer;
    if (pointer && (this.pointerDown || pointer.movementX !== 0 || !this.touchFiring)) {
      const world = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
      const dx = world.x - player.bodyX;
      const dy = world.y - player.bodyY;
      const len = Math.hypot(dx, dy) || 1;
      return { x: dx / len, y: dy / len, firing: this.pointerDown || this.touchFiring };
    }
    const len = Math.hypot(this.touchVector.x, this.touchVector.y) || 1;
    return {
      x: this.touchVector.x / len,
      y: this.touchVector.y / len,
      firing: this.touchFiring,
    };
  }

  get firing(): boolean {
    return this.pointerDown || this.touchFiring || this.down("SPACE");
  }

  destroy() {
    this.scene.input.removeAllListeners();
  }
}
