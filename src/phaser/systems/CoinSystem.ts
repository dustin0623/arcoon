import Phaser from "phaser";

const MAGNET_RADIUS = 56;
const COLLECT_RADIUS = 10;
const ORB_ART = "vfx_xp_orb";

interface Coin {
  sprite: Phaser.GameObjects.Image;
  value: number;
  vx: number;
  vy: number;
}

/**
 * CoinSystem — XP orbs burst out of fallen enemies, scatter, then
 * magnetize toward the player and are auto-collected on contact.
 * (Gold is credited instantly on kill; only experience is collected.)
 */
export class CoinSystem {
  coins: Coin[] = [];
  /** Multiplier on the pickup radius, raised by the Magnetism skill. */
  magnetMult = 1;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.ensureTexture();
  }

  /** Draws a tiny 8px pixel-art XP orb once and caches it as a texture. */
  private ensureTexture() {
    if (this.scene.textures.exists(ORB_ART)) return;
    const g = this.scene.add.graphics();
    g.fillStyle(0x1d6f43, 1);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0x4ade80, 1);
    g.fillCircle(4, 4, 3);
    g.fillStyle(0xdcfce7, 1);
    g.fillRect(2, 2, 1, 1);
    g.generateTexture(ORB_ART, 8, 8);
    g.destroy();
  }

  /** Scatters XP orbs around (x, y) whose values sum to totalValue. */
  spawnBurst(x: number, y: number, totalValue: number) {
    if (totalValue <= 0) return;
    const count = Phaser.Math.Clamp(Math.round(totalValue / 8), 1, 3);
    let remaining = totalValue;
    for (let i = 0; i < count; i++) {
      const value =
        i === count - 1
          ? remaining
          : Math.max(1, Math.round(remaining / (count - i)));
      remaining -= value;

      const sprite = this.scene.add
        .image(x + Phaser.Math.Between(-6, 6), y + Phaser.Math.Between(-4, 4), ORB_ART)
        .setDepth(1000 + y);
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(50, 110);
      this.coins.push({
        sprite,
        value,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
  }

  /** Applies scatter physics, magnetizes, and collects. Returns XP collected. */
  update(px: number, py: number, collectEnabled: boolean): number {
    let collected = 0;

    for (const coin of [...this.coins]) {
      const s = coin.sprite;
      coin.vx *= 0.88;
      coin.vy *= 0.88;

      if (collectEnabled) {
        const dx = px - s.x;
        const dy = py - s.y;
        const dist = Math.hypot(dx, dy) || 1;
        const magnet = MAGNET_RADIUS * this.magnetMult;
        if (dist < magnet) {
          const pull = Phaser.Math.Linear(360, 120, Math.min(1, dist / magnet));
          coin.vx += (dx / dist) * pull * 0.35;
          coin.vy += (dy / dist) * pull * 0.35;
        }
        if (dist < COLLECT_RADIUS) {
          collected += coin.value;
          this.collect(coin);
          continue;
        }
      }

      s.x += coin.vx * 0.016;
      s.y += coin.vy * 0.016;
      s.setDepth(1000 + s.y);
    }

    return collected;
  }

  private collect(coin: Coin) {
    const { x, y } = coin.sprite;
    coin.sprite.destroy();
    this.coins = this.coins.filter((c) => c !== coin);

    const text = this.scene.add
      .text(x, y - 10, `+${coin.value} XP`, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#4ade80",
        stroke: "#1b1526",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(3000);
    this.scene.tweens.add({
      targets: text,
      y: y - 26,
      alpha: 0,
      duration: 650,
      onComplete: () => text.destroy(),
    });
  }

  destroy() {
    this.coins.forEach((c) => c.sprite.destroy());
    this.coins = [];
  }
}
