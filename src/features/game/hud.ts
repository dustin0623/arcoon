/**
 * Shape of the live run state the Phaser scene broadcasts to the React HUD.
 * Kept framework-free so both sides can import it.
 */
import type { BowRarity } from "@/features/game/bow";
import type { SkillRanks } from "@/features/game/skill-tree";

export interface HudState {
  hp: number;
  maxHp: number;
  wave: number;
  /** True while the current wave is the stage's boss wave. */
  boss: boolean;
  score: number;
  kills: number;
  enemiesLeft: number;
  enemiesTotal: number;
  intermission: boolean;
  gameOver: boolean;
  /** Campaign stage being run and how many waves clear it. */
  stage: number;
  stageWaves: number;
  mapId: string;
  victory: boolean;
  /** Gold earned this run (banked when the run ends). */
  goldEarned: number;
  bowRarity: BowRarity;
  bowStars: number;
  xp: number;
  level: number;
  skillPoints: number;
  ranks: SkillRanks;
  /** Bestiary keys met this run. */
  seen: string[];
  /** Bosses felled this run. */
  bosses: number;
}
