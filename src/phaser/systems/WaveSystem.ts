import { WAVE_CONFIG, type EnemyType } from "@/phaser/config/GameConfig";
import { isBossWave } from "@/features/game/campaign";

/**
 * WaveSystem — pure wave bookkeeping.
 * Wave N spawns BASE_COUNT + (N-1) * COUNT_PER_WAVE enemies drawn from the
 * map's enemy family; tougher members of the family unlock as waves climb.
 * Wave 10 is the boss wave: one boss plus a small escort.
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

  /** Enemy types this map uses, easiest first. */
  constructor(private family: EnemyType[]) {}

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

  /**
   * Picks the enemy type for the next spawn. Early waves stick to the first
   * member of the family; later waves mix in the tougher ones.
   */
  pickType(): EnemyType {
    if (this.isBoss && !this.bossSpawned) {
      this.bossSpawned = true;
      return "boss";
    }
    const unlocked = Math.min(this.family.length, 1 + Math.floor(this.wave / 3));
    const index = Math.floor(Math.random() * unlocked);
    return this.family[index] ?? "grunt";
  }

  clearBonus(): number {
    return this.wave * WAVE_CONFIG.CLEAR_BONUS * (this.isBoss ? 4 : 1);
  }
}
