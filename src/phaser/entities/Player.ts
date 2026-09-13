import type Phaser from "phaser";
import { GAME_CONFIG, PLAYER_CONFIG } from "@/phaser/config/GameConfig";
import {
  DEFAULT_FACING,
  playDirectional,
  type Facing,
} from "@/phaser/systems/DirectionalAnimation";

/**
 * Player — data container plus small sprite helpers.
 * Input lives in InputSystem, shooting in ProjectileSystem.
 */
export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  speed: number;
  facing: Facing = DEFAULT_FACING;
  hp: number = PLAYER_CONFIG.MAX_HP;
  maxHp: number = PLAYER_CONFIG.MAX_HP;
  invulnUntil = 0;
  /** Invulnerability window after a hit; extended by the Second Wind skill. */
  iframeMs: number = PLAYER_CONFIG.IFRAME_MS;
  lastShotAt = 0;
  dead = false;

  constructor(sprite: Phaser.Physics.Arcade.Sprite) {
    this.sprite = sprite;
    this.speed = GAME_CONFIG.PLAYER_SPEED;
  }

  /** Feet position — the physics body centre. */
  get bodyX(): number {
    return (
      this.sprite.x +
      PLAYER_CONFIG.BODY_OFFSET.x +
      PLAYER_CONFIG.BODY_SIZE.width / 2 -
      GAME_CONFIG.SPRITE_WIDTH / 2
    );
  }

  get bodyY(): number {
    return (
      this.sprite.y +
      PLAYER_CONFIG.BODY_OFFSET.y +
      PLAYER_CONFIG.BODY_SIZE.height / 2 -
      GAME_CONFIG.SPRITE_HEIGHT / 2
    );
  }

  takeDamage(amount: number, now: number): boolean {
    if (this.dead || now < this.invulnUntil) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnUntil = now + this.iframeMs;
    if (this.hp <= 0) {
      this.dead = true;
      playDirectional(this.sprite, "player_death", this.facing, false);
      (this.sprite.body as Phaser.Physics.Arcade.Body | null)?.setVelocity(0, 0);
    } else {
      playDirectional(this.sprite, "player_damage", this.facing, false);
    }
    return true;
  }

  destroy() {
    this.sprite?.destroy();
  }
}

export function createPlayer(scene: Phaser.Scene, x: number, y: number): Player {
  const sprite = scene.physics.add.sprite(x, y, "player_idle");
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body
    .setSize(PLAYER_CONFIG.BODY_SIZE.width, PLAYER_CONFIG.BODY_SIZE.height)
    .setOffset(PLAYER_CONFIG.BODY_OFFSET.x, PLAYER_CONFIG.BODY_OFFSET.y);
  body.setCollideWorldBounds(true);
  playDirectional(sprite, "player_idle", DEFAULT_FACING);
  return new Player(sprite);
}
