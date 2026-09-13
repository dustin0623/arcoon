/** Pure animation frame-data. No scene.load.* calls here. */
export interface AnimationDefinition {
  key: string;
  texture: string;
  /** Frames per row (a 4-row sheet has this many frames per direction). */
  frames: number;
  frameRate: number;
  repeat: number;
  /** Direction rows in the sheet: 4 = up/down/left/right, 1 = single strip. */
  rows?: number;
}

export const PLAYER_ANIMS: AnimationDefinition[] = [
  { key: "player_idle", texture: "player_idle", frames: 6, frameRate: 6, repeat: -1, rows: 4 },
  { key: "player_walk", texture: "player_walk", frames: 6, frameRate: 10, repeat: -1, rows: 4 },
  { key: "player_bow", texture: "player_bow", frames: 6, frameRate: 12, repeat: 0, rows: 4 },
  { key: "player_damage", texture: "player_damage", frames: 8, frameRate: 8, repeat: 0, rows: 4 },
  { key: "player_death", texture: "player_death", frames: 14, frameRate: 14, repeat: 0, rows: 1 },
];

export const ENEMY_ANIMS: AnimationDefinition[] = [
  { key: "enemy_idle", texture: "enemy_idle", frames: 6, frameRate: 6, repeat: -1, rows: 4 },
  { key: "enemy_walk", texture: "enemy_walk", frames: 6, frameRate: 10, repeat: -1, rows: 4 },
];
