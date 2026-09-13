import Phaser from "phaser";
import { PLAYER_CONFIG } from "@/phaser/config/GameConfig";

/** The arrow art points up, so rotate by +90° relative to travel angle. */
const ARROW_ART_OFFSET = Math.PI / 2;

export interface Arrow {
  sprite: Phaser.Physics.Arcade.Sprite;
  startX: number;
  startY: number;
  maxDist: number;
  damage: number;
}

/** ProjectileSystem — straight-line arrows fired along the aim vector. */
export class ProjectileSystem {
  group: Phaser.Physics.Arcade.Group;
  arrows: Arrow[] = [];
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group();
  }

  fire(x: number, y: number, dirX: number, dirY: number) {
    const angle = Math.atan2(dirY, dirX);
    const sprite = this.scene.physics.add.sprite(x, y, "vfx_arrow", 0);
    sprite.setDepth(y + 40);
    sprite.setRotation(angle + ARROW_ART_OFFSET);
    sprite.setVelocity(
      Math.cos(angle) * PLAYER_CONFIG.ARROW_SPEED,
      Math.sin(angle) * PLAYER_CONFIG.ARROW_SPEED,
    );
    const body = sprite.body as Phaser.Physics.Arcade.Body | null;
    body?.setSize(6, 6).setOffset(5, 5);
    this.group.add(sprite);

    this.arrows.push({
      sprite,
      startX: x,
      startY: y,
      maxDist: PLAYER_CONFIG.ARROW_RANGE,
      damage: PLAYER_CONFIG.ARROW_DAMAGE,
    });
  }

  findBySprite(sprite: unknown): Arrow | undefined {
    return this.arrows.find((a) => a.sprite === sprite);
  }

  kill(arrow: Arrow) {
    arrow.sprite.destroy();
    this.arrows = this.arrows.filter((a) => a !== arrow);
  }

  update() {
    for (const arrow of [...this.arrows]) {
      const traveled = Phaser.Math.Distance.Between(
        arrow.startX,
        arrow.startY,
        arrow.sprite.x,
        arrow.sprite.y,
      );
      if (!arrow.sprite.active || traveled >= arrow.maxDist) this.kill(arrow);
      else arrow.sprite.setDepth(arrow.sprite.y + 40);
    }
  }

  destroy() {
    this.arrows = [];
    this.group?.clear(true, true);
  }
}
