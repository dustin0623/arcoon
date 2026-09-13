import Phaser from "phaser";
import { Enemy } from "@/phaser/entities/Enemy";
import type { Player } from "@/phaser/entities/Player";
import type { EnemyType } from "@/phaser/config/GameConfig";
import { facingFromVector, playDirectional } from "@/phaser/systems/DirectionalAnimation";

/**
 * EnemySystem — spawning, chase AI and melee contact damage.
 * Enemies always beeline for the player (Soul Knight style swarm).
 */
export class EnemySystem {
  enemies: Enemy[] = [];
  group: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;
  private nextId = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group();
  }

  spawn(type: EnemyType, x: number, y: number, hp: number, damage: number): Enemy {
    const enemy = new Enemy(this.scene, `e${this.nextId++}`, type, x, y, hp, damage);
    this.group.add(enemy.sprite);
    enemy.sprite.setData("enemyId", enemy.id);
    this.enemies.push(enemy);
    return enemy;
  }

  findBySprite(sprite: unknown): Enemy | undefined {
    return this.enemies.find((e) => e.sprite === sprite);
  }

  get aliveCount(): number {
    return this.enemies.filter((e) => !e.dying).length;
  }

  /** Applies damage; returns the enemy if it died from this hit. */
  damage(enemy: Enemy, amount: number): Enemy | null {
    if (enemy.dying) return null;
    enemy.takeDamage(amount);
    enemy.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (!enemy.dying) enemy.sprite.setTint(enemy.config.tint);
    });
    if (enemy.isDead()) {
      this.kill(enemy);
      return enemy;
    }
    return null;
  }

  kill(enemy: Enemy) {
    enemy.dying = true;
    enemy.hpBar.clear();
    (enemy.sprite.body as Phaser.Physics.Arcade.Body | null)?.setVelocity(0, 0);
    enemy.sprite.disableBody(true, false);
    this.scene.tweens.add({
      targets: enemy.sprite,
      alpha: 0,
      duration: 220,
      onComplete: () => {
        enemy.destroy();
        this.enemies = this.enemies.filter((e) => e !== enemy);
      },
    });
  }

  /** Chase + contact attacks. Returns total damage dealt to the player. */
  update(player: Player, now: number): number {
    let damageToPlayer = 0;

    for (const enemy of this.enemies) {
      if (enemy.dying) continue;
      const body = enemy.sprite.body as Phaser.Physics.Arcade.Body | null;
      if (!body) continue;

      const dx = player.bodyX - enemy.bodyX;
      const dy = player.bodyY - enemy.bodyY;
      const dist = Math.hypot(dx, dy) || 1;

      if (player.dead) {
        body.setVelocity(0, 0);
        playDirectional(enemy.sprite, "enemy_idle", enemy.facing);
        continue;
      }

      if (dist > enemy.config.attackRange) {
        body.setVelocity((dx / dist) * enemy.config.speed, (dy / dist) * enemy.config.speed);
        enemy.facing = facingFromVector(dx, dy);
        playDirectional(enemy.sprite, "enemy_walk", enemy.facing);
      } else {
        body.setVelocity(0, 0);
        enemy.facing = facingFromVector(dx, dy);
        playDirectional(enemy.sprite, "enemy_idle", enemy.facing);
        if (now - enemy.lastAttackAt >= enemy.config.attackCooldown) {
          enemy.lastAttackAt = now;
          damageToPlayer += enemy.config.damage;
        }
      }

      enemy.sprite.setDepth(enemy.sprite.y);
      enemy.drawHpBar();
    }

    return damageToPlayer;
  }

  destroy() {
    this.enemies.forEach((e) => e.destroy());
    this.enemies = [];
    this.group?.clear(true, true);
  }
}
