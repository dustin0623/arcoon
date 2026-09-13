import Phaser from "phaser";
import { GAME_CONFIG, PLAYER_CONFIG, WAVE_CONFIG } from "@/phaser/config/GameConfig";
import { AnimationSystem } from "@/phaser/systems/AnimationSystem";
import { InputSystem } from "@/phaser/systems/InputSystem";
import { ProjectileSystem } from "@/phaser/systems/ProjectileSystem";
import { EnemySystem } from "@/phaser/systems/EnemySystem";
import { WaveSystem } from "@/phaser/systems/WaveSystem";
import { createPlayer, type Player } from "@/phaser/entities/Player";
import { playDirectional } from "@/phaser/systems/DirectionalAnimation";

export interface ArenaHudState {
  hp: number;
  maxHp: number;
  wave: number;
  score: number;
  kills: number;
  enemiesLeft: number;
  intermission: boolean;
  gameOver: boolean;
}

/**
 * ArenaScene — single test map, wave-based survival.
 * Movement + bow-only combat; enemies swarm the player and waves escalate.
 */
export class ArenaScene extends Phaser.Scene {
  private player!: Player;
  private input!: InputSystem;
  private projectiles!: ProjectileSystem;
  private enemies!: EnemySystem;
  private waves!: WaveSystem;
  private collisionLayer?: Phaser.Tilemaps.TilemapLayer;

  private score = 0;
  private kills = 0;
  private gameOver = false;

  constructor() {
    super("ArenaScene");
  }

  create() {
    const map = this.make.tilemap({ key: "map1" });
    const tileset = map.addTilesetImage("spr_tileset_sunnysideworld_16px", "tiles");

    if (tileset) {
      for (const layerData of map.layers) {
        const layer = map.createLayer(layerData.name, tileset, 0, 0);
        if (!layer) continue;
        if (layerData.name === "boundary") {
          layer.setCollisionByExclusion([-1, 0]);
          layer.setVisible(false);
          this.collisionLayer = layer;
        } else if (layerData.name === "trees") {
          layer.setDepth(GAME_CONFIG.HEIGHT + 10);
        }
      }
    }

    const worldW = map.widthInPixels || GAME_CONFIG.WIDTH;
    const worldH = map.heightInPixels || GAME_CONFIG.HEIGHT;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(GAME_CONFIG.ZOOM);
    this.cameras.main.roundPixels = true;

    new AnimationSystem(this).createAll();

    this.player = createPlayer(this, worldW / 2, worldH / 2);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);

    this.input$ = null;
    this.input = new InputSystem(this);
    this.projectiles = new ProjectileSystem(this);
    this.enemies = new EnemySystem(this);
    this.waves = new WaveSystem();
    this.waves.beginIntermission(this.time.now);

    if (this.collisionLayer) {
      this.physics.add.collider(this.player.sprite, this.collisionLayer);
      this.physics.add.collider(this.enemies.group, this.collisionLayer);
      this.physics.add.collider(this.projectiles.group, this.collisionLayer, (arrowObj) => {
        const arrow = this.projectiles.findBySprite(arrowObj);
        if (arrow) this.projectiles.kill(arrow);
      });
    }

    this.physics.add.overlap(this.projectiles.group, this.enemies.group, (arrowObj, enemyObj) => {
      const arrow = this.projectiles.findBySprite(arrowObj);
      const enemy = this.enemies.findBySprite(enemyObj);
      if (!arrow || !enemy || enemy.dying) return;
      this.projectiles.kill(arrow);
      const killed = this.enemies.damage(enemy, arrow.damage);
      if (killed) {
        this.kills += 1;
        this.score += killed.config.points * this.waves.wave;
        this.waves.pending = Math.max(0, this.waves.pending - 1);
      }
    });

    this.emitHud();
  }

  /** Placeholder assignment guard so TS does not flag the Phaser input shadow. */
  private input$: unknown;

  update(time: number) {
    if (!this.player) return;

    if (!this.gameOver) {
      this.input.updateMovement(this.player);
      this.handleShooting(time);
      this.runWaves(time);

      const damage = this.enemies.update(this.player, time);
      if (damage > 0 && this.player.takeDamage(damage, time)) {
        this.cameras.main.shake(120, 0.006);
        if (this.player.dead) {
          this.gameOver = true;
          this.enemies.enemies.forEach((e) =>
            (e.sprite.body as Phaser.Physics.Arcade.Body | null)?.setVelocity(0, 0),
          );
        }
      }
    }

    this.projectiles.update();
    this.player.sprite.setDepth(this.player.sprite.y);
    this.player.sprite.setAlpha(
      !this.gameOver && time < this.player.invulnUntil && Math.floor(time / 90) % 2 === 0 ? 0.4 : 1,
    );
    this.emitHud();
  }

  private handleShooting(time: number) {
    if (this.player.dead || !this.input.firing) return;
    if (time - this.player.lastShotAt < PLAYER_CONFIG.FIRE_COOLDOWN_MS) return;
    this.player.lastShotAt = time;

    const aim = this.input.getAim(this.player);
    playDirectional(this.player.sprite, "player_bow", this.player.facing, false);
    this.projectiles.fire(
      this.player.bodyX + aim.x * 8,
      this.player.bodyY + aim.y * 8 - 6,
      aim.x,
      aim.y,
    );
  }

  private runWaves(time: number) {
    const w = this.waves;

    if (w.intermission) {
      if (time >= w.nextEventAt) w.startNextWave(time);
      return;
    }

    if (w.toSpawn > 0 && time >= w.nextEventAt && this.enemies.aliveCount < WAVE_CONFIG.MAX_ALIVE) {
      this.spawnEnemy();
      w.toSpawn -= 1;
      w.nextEventAt = time + WAVE_CONFIG.SPAWN_INTERVAL_MS;
    }

    if (w.toSpawn === 0 && this.enemies.aliveCount === 0) {
      this.score += w.clearBonus();
      w.pending = 0;
      w.beginIntermission(time);
    }
  }

  /** Spawns just outside the camera view so enemies walk in. */
  private spawnEnemy() {
    const cam = this.cameras.main;
    const radius = Math.max(cam.width, cam.height) / (2 * cam.zoom) + 40;
    const angle = Math.random() * Math.PI * 2;
    const x = Phaser.Math.Clamp(
      this.player.sprite.x + Math.cos(angle) * radius,
      32,
      this.physics.world.bounds.width - 32,
    );
    const y = Phaser.Math.Clamp(
      this.player.sprite.y + Math.sin(angle) * radius,
      32,
      this.physics.world.bounds.height - 32,
    );
    this.enemies.spawn(this.waves.pickType(), x, y);
  }

  private emitHud() {
    const detail: ArenaHudState = {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      wave: this.waves.wave,
      score: this.score,
      kills: this.kills,
      enemiesLeft: this.waves.toSpawn + this.enemies.aliveCount,
      intermission: this.waves.intermission,
      gameOver: this.gameOver,
    };
    window.dispatchEvent(new CustomEvent("arena-hud", { detail }));
  }
}
