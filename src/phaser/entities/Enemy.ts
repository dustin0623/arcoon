import type Phaser from "phaser";
import { GAME_CONFIG, PLAYER_CONFIG, ENEMY_CONFIG, type EnemyConfig, type EnemyType } from "@/phaser/config/GameConfig";
import { DEFAULT_FACING, playDirectional, type Facing } from "@/phaser/systems/DirectionalAnimation";

/** Enemy — reuses the character sheets with a tint. AI lives in EnemySystem. */
export class Enemy {
  id: string;
  type: EnemyType;
  /** Base config with this map's health and damage scaling already applied. */
  config: EnemyConfig;
  sprite: Phaser.Physics.Arcade.Sprite;
  hpBar: Phaser.GameObjects.Graphics;

  hp: number;
  maxHp: number;
  lastAttackAt = 0;
  /** Kept for parity with the reference combat model. */
  provokedUntil = 0;
  dying = false;
  facing: Facing = DEFAULT_FACING;

  constructor(
    scene: Phaser.Scene,
    id: string,
    type: EnemyType,
    x: number,
    y: number,
    hp: number,
    damage: number,
  ) {
    this.id = id;
    this.type = type;
    this.config = { ...ENEMY_CONFIG[type], hp, damage };
    this.hp = hp;
    this.maxHp = hp;


    this.sprite = scene.physics.add.sprite(x, y, "enemy_idle");
    this.sprite.setTint(this.config.tint);
    if (this.config.scale) this.sprite.setScale(this.config.scale);
    this.sprite.setDepth(y);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body | null;
    body
      ?.setSize(PLAYER_CONFIG.BODY_SIZE.width, PLAYER_CONFIG.BODY_SIZE.height)
      .setOffset(PLAYER_CONFIG.BODY_OFFSET.x, PLAYER_CONFIG.BODY_OFFSET.y);
    body?.setCollideWorldBounds(true);
    playDirectional(this.sprite, "enemy_idle", this.facing);

    this.hpBar = scene.add.graphics();
    this.drawHpBar();
  }

  /** Centre of the physics body — scale-aware, so bosses aim correctly. */
  get bodyX(): number {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (body) return body.center.x;
    return (
      this.sprite.x +
      PLAYER_CONFIG.BODY_OFFSET.x +
      PLAYER_CONFIG.BODY_SIZE.width / 2 -
      GAME_CONFIG.SPRITE_WIDTH / 2
    );
  }

  get bodyY(): number {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (body) return body.center.y;
    return (
      this.sprite.y +
      PLAYER_CONFIG.BODY_OFFSET.y +
      PLAYER_CONFIG.BODY_SIZE.height / 2 -
      GAME_CONFIG.SPRITE_HEIGHT / 2
    );
  }

  takeDamage(amount: number) {
    this.hp = Math.max(0, this.hp - amount);
    this.drawHpBar();
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  drawHpBar() {
    const w = this.config.barWidth ?? 18;
    const h = this.config.type === "boss" ? 4 : 3;
    const x = this.bodyX - w / 2;
    const y = this.bodyY - (this.config.type === "boss" ? 34 : 20);
    const pct = this.maxHp > 0 ? this.hp / this.maxHp : 0;

    this.hpBar.clear();
    if (this.dying || this.hp <= 0) return;
    this.hpBar.setDepth(this.sprite.y + 1);
    this.hpBar.fillStyle(0x201a1a, 0.85);
    this.hpBar.fillRect(x - 1, y - 1, w + 2, h + 2);
    this.hpBar.fillStyle(pct > 0.5 ? 0x6fd36f : pct > 0.25 ? 0xe8c05a : 0xe05a5a, 1);
    this.hpBar.fillRect(x, y, Math.max(0, w * pct), h);
  }

  destroy() {
    this.hpBar?.destroy();
    this.sprite?.destroy();
  }
}
