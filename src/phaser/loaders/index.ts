import type Phaser from "phaser";

const SPR = "assets/phaser/sprites";
const MAP = "assets/phaser/map";
const FW = 80;
const FH = 80;

/** Tilemap JSON + tileset image for the single test arena. */
export const MapAssetLoader = {
  load(scene: Phaser.Scene) {
    scene.load.image("tiles", `${MAP}/tilesets/spr_tileset_sunnysideworld_16px.png`);
    scene.load.tilemapTiledJSON("map1", `${MAP}/maps/map1.json`);
  },
};

/** Player (raccoon) sheets — only the combat-relevant set. */
export const PlayerAssetLoader = {
  load(scene: Phaser.Scene) {
    const dir = `${SPR}/raccoon`;
    scene.load.spritesheet("player_idle", `${dir}/idle_strip6.png`, { frameWidth: FW, frameHeight: FH });
    scene.load.spritesheet("player_walk", `${dir}/walk_strip6.png`, { frameWidth: FW, frameHeight: FH });
    scene.load.spritesheet("player_bow", `${dir}/bow_strip6.png`, { frameWidth: FW, frameHeight: FH });
    scene.load.spritesheet("player_damage", `${dir}/damage_strip8.png`, { frameWidth: FW, frameHeight: FH });
    scene.load.spritesheet("player_death", `${dir}/death_strip14.png`, { frameWidth: FW, frameHeight: FH });
  },
};

export const EnemyAssetLoader = {
  load(scene: Phaser.Scene) {
    const dir = `${SPR}/enemies`;
    scene.load.spritesheet("enemy_idle", `${dir}/grunt_idle_strip6.png`, { frameWidth: FW, frameHeight: FH });
    scene.load.spritesheet("enemy_walk", `${dir}/grunt_walk_strip6.png`, { frameWidth: FW, frameHeight: FH });
  },
};

export const ProjectileAssetLoader = {
  load(scene: Phaser.Scene) {
    scene.load.spritesheet("vfx_arrow", `${SPR}/projectiles/arrow_strip4.png`, {
      frameWidth: 48,
      frameHeight: 48,
    });
  },
};
