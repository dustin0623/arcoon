/**
 * GameConfig — pure data constants for the arena engine.
 * No Phaser API calls here.
 */

export const GAME_CONFIG = {
  /** Tilemap world size in pixels (40 tiles × 16 px). */
  WIDTH: 640,
  HEIGHT: 640,

  BG_COLOR: "#1b1526",
  PIXEL_ART: true,

  /** Camera zoom — 16 px tiles render at 48 px. */
  ZOOM: 3,

  TILE_SIZE: 16,

  /** Character sheet frame dimensions (80×80 pack). */
  SPRITE_WIDTH: 80,
  SPRITE_HEIGHT: 80,

  PLAYER_SPEED: 110,
} as const;

export const PLAYER_CONFIG = {
  /** Tight hitbox centred on the feet. */
  BODY_SIZE: { width: 12, height: 12 },
  BODY_OFFSET: { x: 34, y: 44 },
  MAX_HP: 100,
  /** Invulnerability window after taking a hit, ms. */
  IFRAME_MS: 400,
} as const;

export type EnemyType = "grunt" | "brute" | "runner" | "boss";

export interface EnemyConfig {
  type: EnemyType;
  hp: number;
  speed: number;
  damage: number;
  /** ms between melee hits */
  attackCooldown: number;
  attackRange: number;
  tint: number;
  points: number;
  /** Sprite scale — bosses render larger than regular enemies. */
  scale?: number;
  /** Health bar width in px. */
  barWidth?: number;
}

export const ENEMY_CONFIG: Record<EnemyType, EnemyConfig> = {
  grunt: {
    type: "grunt",
    hp: 6,
    speed: 52,
    damage: 10,
    attackCooldown: 900,
    attackRange: 16,
    tint: 0x9fd6ff,
    points: 10,
  },
  runner: {
    type: "runner",
    hp: 4,
    speed: 86,
    damage: 10,
    attackCooldown: 700,
    attackRange: 16,
    tint: 0xffd166,
    points: 15,
  },
  brute: {
    type: "brute",
    hp: 16,
    speed: 38,
    damage: 20,
    attackCooldown: 1200,
    attackRange: 20,
    tint: 0xff7b7b,
    points: 30,
  },
  boss: {
    type: "boss",
    hp: 220,
    speed: 42,
    damage: 25,
    attackCooldown: 1100,
    attackRange: 26,
    tint: 0xb072ff,
    points: 300,
    scale: 1.8,
    barWidth: 34,
  },
};

export const WAVE_CONFIG = {
  /** Pause between waves, ms. Shop is open during this window. */
  BREAK_MS: 5000,
  /** Base enemy count for wave 1. */
  BASE_COUNT: 4,
  /** Extra enemies added per wave. */
  COUNT_PER_WAVE: 2,
  /** Enemies alive at once. */
  MAX_ALIVE: 14,
  SPAWN_INTERVAL_MS: 700,
  /** Bonus points for clearing a wave: wave × this. */
  CLEAR_BONUS: 25,
  /** Boss wave: one boss plus this many escort enemies. */
  BOSS_ESCORTS: 4,
  /** Boss HP gains this fraction per stage beyond the first. */
  BOSS_HP_PER_STAGE: 0.35,
} as const;
