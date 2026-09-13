import Phaser from "phaser";
import { LoaderScene } from "@/phaser/scenes/LoaderScene";
import { ArenaScene } from "@/phaser/scenes/ArenaScene";
import { GAME_CONFIG } from "@/phaser/config/GameConfig";

/** Creates the Phaser game. Client-only — called from ArenaCanvas after mount. */
export default function startArenaGame(parent: string | HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: GAME_CONFIG.BG_COLOR,
    pixelArt: GAME_CONFIG.PIXEL_ART,
    render: { antialias: false, roundPixels: true },
    physics: {
      default: "arcade",
      arcade: { debug: false, gravity: { x: 0, y: 0 } },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
      width: "100%",
      height: "100%",
    },
    scene: [],
    callbacks: {
      postBoot(game: Phaser.Game) {
        game.scene.add("LoaderScene", LoaderScene, true);
        game.scene.add("ArenaScene", ArenaScene, false);
      },
    },
  });
}
