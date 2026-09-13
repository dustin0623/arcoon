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
 * WASD / arrows move, the mouse aims, and click / Space requests one attack.
 */
export class InputSystem {
  private scene: Phaser.Scene;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  attackRequested = false;
  /** World-space point the mouse is aiming at, updated on move/click. */
  aim: { x: number; y: number } | null = null;
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
    scene.input.keyboard?.on("keydown-SPACE", this.onAttackKey);
    scene.input.on("pointermove", this.onPointerMove);
    scene.input.on("pointerdown", this.onPointerDown);
    window.addEventListener("arena-move", this.onTouchMove);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** Joystick vector from the React overlay. */
  private onTouchMove = (e: Event) => {
    const d = (e as CustomEvent<{ x: number; y: number }>).detail;
    this.touchVector.x = d.x;
    this.touchVector.y = d.y;
  };

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

    if (moving) {
      player.facing = facingFromVector(dx, dy);
    }

    const current = player.sprite.anims.currentAnim?.key ?? "";
    const busy = player.sprite.anims.isPlaying && /player_(bow|damage|death)/.test(current);
    if (!busy) {
      playDirectional(player.sprite, moving ? "player_walk" : "player_idle", player.facing);
    }
  }

  private onAttackKey = () => {
    this.attackRequested = true;
  };

  private onPointerMove = (pointer: Phaser.Input.Pointer) => {
    this.aim = { x: pointer.worldX, y: pointer.worldY };
  };

  private onPointerDown = (pointer: Phaser.Input.Pointer) => {
    if (!pointer.leftButtonDown()) return;
    this.aim = { x: pointer.worldX, y: pointer.worldY };
    this.attackRequested = true;
  };

  consumeAttack(): boolean {
    if (!this.attackRequested && !this.touchFiring) return false;
    this.attackRequested = false;
    this.touchFiring = false;
    return true;
  }

  destroy() {
    window.removeEventListener("arena-move", this.onTouchMove);
    this.scene.input.keyboard?.off("keydown-SPACE", this.onAttackKey);
    this.scene.input.off("pointermove", this.onPointerMove);
    this.scene.input.off("pointerdown", this.onPointerDown);
  }
}
