import type Phaser from "phaser";
import {
  ENEMY_ANIMS,
  PLAYER_ANIMS,
  type AnimationDefinition,
} from "@/phaser/config/AnimationConfig";
import {
  DIRECTION_ROW,
  DEFAULT_FACING,
  FACINGS,
  directionalKey,
} from "@/phaser/systems/DirectionalAnimation";

/**
 * AnimationSystem — registers Phaser animations once during scene create().
 * Sheets with `rows: 4` are sliced per direction into `<key>_<facing>`
 * animations plus a `<key>` alias bound to the front-facing row.
 */
export class AnimationSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createAll() {
    [...PLAYER_ANIMS, ...ENEMY_ANIMS].forEach((conf) => this.registerSafe(conf));
  }

  private registerSafe(conf: AnimationDefinition) {
    try {
      this.register(conf);
    } catch (e: unknown) {
      console.warn(`[AnimationSystem] Could not register "${conf.key}":`, e);
    }
  }

  private register(conf: AnimationDefinition) {
    if (!this.scene.textures.exists(conf.texture)) {
      console.warn(`[AnimationSystem] Skipping "${conf.key}" — texture missing`);
      return;
    }
    const totalFrames = this.scene.textures.get(conf.texture).frameTotal - 1;
    const rows = conf.rows === 4 && totalFrames >= conf.frames * 4 ? 4 : 1;

    if (rows === 4) {
      for (const facing of FACINGS) {
        this.create(directionalKey(conf.key, facing), conf, DIRECTION_ROW[facing] * conf.frames);
      }
      this.create(conf.key, conf, DIRECTION_ROW[DEFAULT_FACING] * conf.frames);
      return;
    }
    this.create(conf.key, conf, 0);
  }

  private create(key: string, conf: AnimationDefinition, start: number) {
    if (this.scene.anims.exists(key)) return;
    this.scene.anims.create({
      key,
      frames: this.scene.anims.generateFrameNumbers(conf.texture, {
        start,
        end: start + conf.frames - 1,
      }),
      frameRate: conf.frameRate,
      repeat: conf.repeat,
    });
  }
}
