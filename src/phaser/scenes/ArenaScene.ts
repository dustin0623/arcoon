import Phaser from "phaser";
import { GAME_CONFIG, PLAYER_CONFIG, WAVE_CONFIG } from "@/phaser/config/GameConfig";
import { AnimationSystem } from "@/phaser/systems/AnimationSystem";
import { InputSystem } from "@/phaser/systems/InputSystem";
import { ProjectileSystem } from "@/phaser/systems/ProjectileSystem";
import { EnemySystem } from "@/phaser/systems/EnemySystem";
import { WaveSystem } from "@/phaser/systems/WaveSystem";
import { createPlayer, type Player } from "@/phaser/entities/Player";
import type { Enemy } from "@/phaser/entities/Enemy";
import { playDirectional } from "@/phaser/systems/DirectionalAnimation";
import { facingFromVector } from "@/phaser/systems/DirectionalAnimation";
import { getBowStats, BOW_TIER, getNextBowTier, type BowTier } from "@/features/game/bow";
import { CoinSystem } from "@/phaser/systems/CoinSystem";
import { getLevel, xpForKill } from "@/features/game/experience";
import {
  EMPTY_RANKS,
  SKILL_TREE,
  canLearn,
  getSkillModifiers,
  type SkillId,
  type SkillRanks,
} from "@/features/game/skill-tree";

export interface ArenaHudState {
  hp: number;
  maxHp: number;
  wave: number;
  score: number;
  kills: number;
  enemiesLeft: number;
  intermission: boolean;
  gameOver: boolean;
  gold: number;
  goldEarned: number;
  bowTier: BowTier;
  xp: number;
  level: number;
  skillPoints: number;
  ranks: SkillRanks;
}

/**
 * ArenaScene — single test map, wave-based survival.
 * Movement + bow-only combat; enemies swarm the player and waves escalate.
 */
export class ArenaScene extends Phaser.Scene {
  private player!: Player;
  private controls!: InputSystem;
  private projectiles!: ProjectileSystem;
  private enemies!: EnemySystem;
  private waves!: WaveSystem;
  private collisionLayer?: Phaser.Tilemaps.TilemapLayer;

  private score = 0;
  private kills = 0;
  private gameOver = false;
  private gold = 0;
  private goldEarned = 0;
  private bowTier: BowTier = "Wood";
  private coins!: CoinSystem;
  private xp = 0;
  private level = 1;
  private skillPoints = 0;
  private ranks: SkillRanks = { ...EMPTY_RANKS };
  private hpBar!: Phaser.GameObjects.Graphics;
  private onShopAction = (e: Event) => this.handleShopAction(e);
  private onSkillAction = (e: Event) => this.handleSkillAction(e);

  constructor() {
    super("ArenaScene");
  }

  create() {
    const map = this.make.tilemap({ key: "map1" });
    const tileset = map.addTilesetImage("spr_tileset_sunnysideworld_16px", "tiles");

    if (tileset) {
      for (const layerData of map.layers) {
        const layer = map.createLayer(layerData.name, tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer | null;
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

    // Floating health bar above the player.
    this.hpBar = this.add.graphics().setDepth(2500);

    this.controls = new InputSystem(this);
    this.projectiles = new ProjectileSystem(this);
    this.enemies = new EnemySystem(this);
    this.waves = new WaveSystem();
    this.waves.beginIntermission(this.time.now);
    this.coins = new CoinSystem(this);
    window.addEventListener("arena-shop", this.onShopAction);
    window.addEventListener("arena-skill", this.onSkillAction);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("arena-shop", this.onShopAction);
      window.removeEventListener("arena-skill", this.onSkillAction);
      this.coins?.destroy();
    });

    if (this.collisionLayer) {
      this.physics.add.collider(this.player.sprite, this.collisionLayer);
      this.physics.add.collider(this.enemies.group, this.collisionLayer);
      this.physics.add.collider(this.projectiles.group, this.collisionLayer, (arrowObj) => {
        const arrow = this.projectiles.findBySprite(arrowObj);
        if (arrow) this.projectiles.kill(arrow);
      });
    }

    this.emitHud();
  }

  override update(time: number) {
    if (!this.player) return;

    if (!this.gameOver) {
      this.controls.updateMovement(this.player);
      this.handleShooting(time);
      this.resolveArrowHits();
      this.runWaves(time);
      const collectedXp = this.coins.update(this.player.bodyX, this.player.bodyY, !this.gameOver);
      if (collectedXp > 0) this.addXp(collectedXp);

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
    this.updateHpBar();
    this.emitHud();
  }

  /** Auto-attack: locks onto the closest living enemy in bow range and fires on cooldown. */
  private handleShooting(time: number) {
    if (this.player.dead) return;
    const mods = getSkillModifiers(this.ranks);
    const base = getBowStats(this.bowTier);
    const stats = {
      ...base,
      damage: Math.round(base.damage * mods.damageMult),
      fireRateMs: base.fireRateMs * mods.fireRateMult,
      rangeTiles: base.rangeTiles + mods.rangeBonusTiles,
    };
    if (time - this.player.lastShotAt < stats.fireRateMs) return;

    const bx = this.player.sprite.x;
    const by = this.player.sprite.y;
    const range = stats.rangeTiles * GAME_CONFIG.TILE_SIZE;

    let target: { x: number; y: number } | null = null;
    let best = Infinity;
    for (const enemy of this.enemies.enemies) {
      if (enemy.dying || enemy.isDead()) continue;
      const d = Phaser.Math.Distance.Between(bx, by, enemy.bodyX, enemy.bodyY);
      if (d <= range && d < best) {
        best = d;
        target = { x: enemy.bodyX, y: enemy.bodyY };
      }
    }
    if (!target) return;

    this.player.lastShotAt = time;
    const angle = Phaser.Math.Angle.Between(bx, by, target.x, target.y);
    const facing = facingFromVector(target.x - bx, target.y - by);
    this.player.facing = facing;
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };

    this.projectiles.fire(bx + dir.x * 10, by + dir.y * 10, facing, stats, angle);
    playDirectional(this.player.sprite, "player_bow", facing, false);
  }

  private resolveArrowHits() {
    const hitRadius = 18;
    for (const arrow of [...this.projectiles.arrows]) {
      if (!arrow.sprite.active) continue;
      for (const enemy of this.enemies.enemies) {
        if (enemy.dying || enemy.isDead()) continue;
        const distance = Phaser.Math.Distance.Between(
          arrow.sprite.x,
          arrow.sprite.y,
          enemy.bodyX,
          enemy.bodyY,
        );
        if (distance > hitRadius) continue;

        enemy.provokedUntil = Date.now() + 8000;
        this.projectiles.kill(arrow);
        const killed = this.enemies.damage(enemy, arrow.damage);
        if (killed) {
          this.kills += 1;
          this.score += killed.config.points * this.waves.wave;
          this.waves.pending = Math.max(0, this.waves.pending - 1);
          this.gainGold(killed);
          this.dropXp(killed);
        }
        break;
      }
    }
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

  /** Gold is credited instantly on kill (scaled by wave and the Fortune skill). */
  private gainGold(enemy: Enemy) {
    const base =
      enemy.config.type === "brute"
        ? Phaser.Math.Between(5, 8)
        : Phaser.Math.Between(2, 4);
    let total = base * this.waves.wave;
    if (enemy.config.type === "runner" && Math.random() < 0.08) total += 10;
    total = Math.round(total * getSkillModifiers(this.ranks).goldMult);
    this.gold += total;
    this.goldEarned += total;

    const text = this.add
      .text(enemy.bodyX, enemy.bodyY - 14, `+${total}g`, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffd166",
        stroke: "#1b1526",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(3000);
    this.tweens.add({
      targets: text,
      y: text.y - 16,
      alpha: 0,
      duration: 650,
      onComplete: () => text.destroy(),
    });
  }

  /** XP orbs burst out of a fallen enemy for the player to collect. */
  private dropXp(enemy: Enemy) {
    const total = Math.max(
      1,
      Math.round(xpForKill(enemy.config.type, this.waves.wave) * getSkillModifiers(this.ranks).xpMult),
    );
    this.coins.spawnBurst(enemy.bodyX, enemy.bodyY, total);
  }

  /** Shop actions from the React HUD: upgrade the bow or start the next wave. */
  private handleShopAction(e: Event) {
    const action = (e as CustomEvent<{ action: "upgrade" | "start" }>).detail?.action;
    if (this.gameOver) return;

    if (action === "upgrade" && this.waves.intermission) {
      const next = getNextBowTier(this.bowTier);
      if (next && this.gold >= BOW_TIER[next].goldCost) {
        this.gold -= BOW_TIER[next].goldCost;
        this.bowTier = next;
        this.emitHud();
      }
    } else if (action === "start" && this.waves.intermission) {
      this.waves.startNextWave(this.time.now);
      this.emitHud();
    }
  }

  /** Grants collected experience (Scholar scaling applied at drop) and awards skill points on level-up. */
  private addXp(amount: number) {
    this.xp += amount;
    const level = getLevel(this.xp);
    if (level > this.level) {
      this.skillPoints += level - this.level;
      this.level = level;
    }
  }

  /** Learns one rank of a skill from the React skill tree and re-applies its effects. */
  private handleSkillAction(e: Event) {
    const id = (e as CustomEvent<{ id: SkillId }>).detail?.id;
    const skill = SKILL_TREE.find((s) => s.id === id);
    if (!skill || this.gameOver) return;
    if (!canLearn(skill, this.ranks, this.skillPoints)) return;

    this.ranks[skill.id] = (this.ranks[skill.id] ?? 0) + 1;
    this.skillPoints -= 1;
    this.applySkills();
    this.emitHud();
  }

  /** Draws the health bar centered above the player. */
  private updateHpBar() {
    const { hp, maxHp } = this.player;
    const width = 28;
    const height = 4;
    const x = Math.round(this.player.bodyX - width / 2);
    const y = Math.round(this.player.bodyY - 15);
    const ratio = maxHp > 0 ? Phaser.Math.Clamp(hp / maxHp, 0, 1) : 0;

    const g = this.hpBar;
    g.clear();
    g.fillStyle(0x1b1526, 1);
    g.fillRect(x - 1, y - 1, width + 2, height + 2);
    g.fillStyle(0x4a2f28, 1);
    g.fillRect(x, y, width, height);
    g.fillStyle(0xe03131, 1);
    g.fillRect(x, y, Math.round(width * ratio), height);
  }

  /** Pushes passive skill effects onto the player and pickup systems. */
  private applySkills() {
    const mods = getSkillModifiers(this.ranks);
    const maxHp = PLAYER_CONFIG.MAX_HP + mods.bonusHp;
    if (maxHp > this.player.maxHp) {
      this.player.hp += maxHp - this.player.maxHp;
    }
    this.player.maxHp = maxHp;
    this.player.hp = Math.min(this.player.hp, maxHp);
    this.player.speed = GAME_CONFIG.PLAYER_SPEED * mods.speedMult;
    this.player.iframeMs = PLAYER_CONFIG.IFRAME_MS * mods.iframeMult;
    this.coins.magnetMult = mods.magnetMult;
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
      gold: this.gold,
      goldEarned: this.goldEarned,
      bowTier: this.bowTier,
      xp: this.xp,
      level: this.level,
      skillPoints: this.skillPoints,
      ranks: { ...this.ranks },
    };
    window.dispatchEvent(new CustomEvent("arena-hud", { detail }));
  }
}
