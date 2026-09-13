import Phaser from "phaser";
import {
  MapAssetLoader,
  PlayerAssetLoader,
  EnemyAssetLoader,
  ProjectileAssetLoader,
} from "@/phaser/loaders";

/** LoaderScene — preloads every asset then starts ArenaScene. */
export class LoaderScene extends Phaser.Scene {
  constructor() {
    super("LoaderScene");
  }

  preload() {
    MapAssetLoader.load(this);
    PlayerAssetLoader.load(this);
    EnemyAssetLoader.load(this);
    ProjectileAssetLoader.load(this);

    this.load.on("progress", (value: number) => {
      window.dispatchEvent(new CustomEvent("arena-load-progress", { detail: { value } }));
    });
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn(`[LoaderScene] Missing asset: ${file.key} (${file.url})`);
    });
  }

  create() {
    window.dispatchEvent(new CustomEvent("arena-load-progress", { detail: { value: 1 } }));
    this.time.delayedCall(120, () => this.scene.start("ArenaScene"));
  }
}
