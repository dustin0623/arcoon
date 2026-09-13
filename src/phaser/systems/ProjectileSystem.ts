import Phaser from "phaser";
import { GAME_CONFIG } from "@/phaser/config/GameConfig";
import type { BowStats } from "@/features/game/bow";

/** The arrow art points up, so rotate by +90° relative to travel angle. */
const ARROW_ART_OFFSET = Math.PI / 2;
const ARROW_SPEED = 320;

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
    this.group = scene.physics.add.group({ defaultKey: "vfx_arrow", allowGravity: false });
  }

  fire(
    x: number,
    y: number,
    facing: "up" | "down" | "left" | "right",
    stats: BowStats,
    angleRad?: number,
  ) {
    const sprite = this.group.get(x, y, "vfx_arrow") as Phaser.Physics.Arcade.Sprite | null;
    if (!sprite) return;

    const dir = angleRad === undefined
      ? {
          up: { x: 0, y: -1 },
          down: { x: 0, y: 1 },
          left: { x: -1, y: 0 },
          right: { x: 1, y: 0 },
        }[facing]
      : { x: Math.cos(angleRad), y: Math.sin(angleRad) };

    sprite.setActive(true).setVisible(true).setOrigin(0.5, 0.5);
    sprite.setDepth(y + 2);
    sprite.setFrame(0);
    sprite.setRotation(Math.atan2(dir.y, dir.x) + ARROW_ART_OFFSET);
    sprite.setVelocity(dir.x * ARROW_SPEED, dir.y * ARROW_SPEED);
    const body = sprite.body as Phaser.Physics.Arcade.Body | null;
    body?.setAllowGravity(false);
    body?.setSize(10, 10).setOffset(19, 19);

    this.arrows.push({
      sprite,
      startX: x,
      startY: y,
      maxDist: stats.rangeTiles * GAME_CONFIG.TILE_SIZE,
      damage: stats.damage,
    });
  }

  findBySprite(sprite: unknown): Arrow | undefined {
    return this.arrows.find((a) => a.sprite === sprite);
  }

  kill(arrow: Arrow) {
    arrow.sprite.setActive(false).setVisible(false);
    arrow.sprite.setVelocity(0, 0);
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
    }
  }

  destroy() {
    this.arrows = [];
    this.group?.clear(true, true);
  }
}
