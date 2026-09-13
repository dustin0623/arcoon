import { WAVE_CONFIG, type EnemyType } from "@/phaser/config/GameConfig";
import { isBossWave } from "@/features/game/campaign";

export interface WaveSnapshot {
  wave: number;
  remaining: number;
  intermission: boolean;
}

/**
 * WaveSystem — pure wave bookkeeping.
 * Wave N spawns BASE_COUNT + (N-1) * COUNT_PER_WAVE enemies; tougher types
 * unlock as waves climb. Every 10th wave is a boss wave: one boss plus a
 * small escort instead of the usual swarm.
 */
export class WaveSystem {
  wave = 0;
  /** Enemies left to spawn in the current wave. */
  toSpawn = 0;
  /** Enemies from the current wave that are still alive. */
  pending = 0;
  intermission = true;
  nextEventAt = 0;
  /** True once the boss for this wave has been spawned. */
  bossSpawned = false;

  startNextWave(now: number) {
    this.wave += 1;
    this.bossSpawned = false;
    this.toSpawn = this.isBoss
      ? 1 + WAVE_CONFIG.BOSS_ESCORTS
      : WAVE_CONFIG.BASE_COUNT + (this.wave - 1) * WAVE_CONFIG.COUNT_PER_WAVE;
    this.pending = this.toSpawn;
    this.intermission = false;
    this.nextEventAt = now;
  }

  beginIntermission(now: number) {
    this.intermission = true;
    this.nextEventAt = now + WAVE_CONFIG.BREAK_MS;
  }

  /** Is the current wave the stage's boss wave? */
  get isBoss(): boolean {
    return isBossWave(this.wave);
  }

  /** Weighted pick of the enemy type for the current wave. */
  pickType(): EnemyType {
    if (this.isBoss && !this.bossSpawned) {
      this.bossSpawned = true;
      return "boss";
    }
    const roll = Math.random();
    if (this.wave >= 5 && roll < 0.2) return "brute";
    if (this.wave >= 3 && roll < 0.45) return "runner";
    if (this.wave >= 2 && roll < 0.3) return "runner";
    return "grunt";
  }

  get cleared(): boolean {
    return !this.intermission && this.toSpawn === 0 && this.pending === 0;
  }

  clearBonus(): number {
    return this.wave * WAVE_CONFIG.CLEAR_BONUS * (this.isBoss ? 4 : 1);
  }
}
