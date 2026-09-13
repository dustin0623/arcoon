import { WAVE_CONFIG, type EnemyType } from "@/phaser/config/GameConfig";

export interface WaveSnapshot {
  wave: number;
  remaining: number;
  intermission: boolean;
}

/**
 * WaveSystem — pure wave bookkeeping.
 * Wave N spawns BASE_COUNT + (N-1) * COUNT_PER_WAVE enemies; tougher types
 * unlock as waves climb.
 */
export class WaveSystem {
  wave = 0;
  /** Enemies left to spawn in the current wave. */
  toSpawn = 0;
  /** Enemies from the current wave that are still alive. */
  pending = 0;
  intermission = true;
  nextEventAt = 0;

  startNextWave(now: number) {
    this.wave += 1;
    this.toSpawn = WAVE_CONFIG.BASE_COUNT + (this.wave - 1) * WAVE_CONFIG.COUNT_PER_WAVE;
    this.pending = this.toSpawn;
    this.intermission = false;
    this.nextEventAt = now;
  }

  beginIntermission(now: number) {
    this.intermission = true;
    this.nextEventAt = now + WAVE_CONFIG.BREAK_MS;
  }

  /** Weighted pick of the enemy type for the current wave. */
  pickType(): EnemyType {
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
    return this.wave * WAVE_CONFIG.CLEAR_BONUS;
  }
}
