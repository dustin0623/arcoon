import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import type { ArenaHudState } from "@/phaser/scenes/ArenaScene";
import { BOW_TIER, getNextBowTier } from "@/features/game/bow";
import { OuterPanel, InnerPanel, Label, PixelButton } from "@/components/ui/pixel-panel";

const HEART = "/assets/icons/heart.png";
const COIN = "/assets/icons/token.png";
const BOW = "/assets/icons/bow.png";
const SKULL = "/assets/icons/goblin_head.png";
const SWORD = "/assets/icons/sword.png";

const EMPTY_HUD: ArenaHudState = {
  hp: 0,
  maxHp: 0,
  wave: 0,
  score: 0,
  kills: 0,
  enemiesLeft: 0,
  intermission: true,
  gameOver: false,
  gold: 0,
  goldEarned: 0,
  bowTier: "Wood",
};

function sendShopAction(action: "upgrade" | "start") {
  window.dispatchEvent(new CustomEvent("arena-shop", { detail: { action } }));
}

/** One icon + value row inside a HUD panel. */
function Stat({ icon, alt, value }: { icon: string; alt: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <img src={icon} alt={alt} className="h-4 w-4 object-contain" />
      <span className="text-[10px] tabular-nums">{value}</span>
    </div>
  );
}

/** Between-waves shop: upgrade the bow with gold or jump into the next wave. */
function Shop({ hud }: { hud: ArenaHudState }) {
  const next = getNextBowTier(hud.bowTier);
  const cur = BOW_TIER[hud.bowTier];
  const nextStats = next ? BOW_TIER[next] : null;
  const affordable = nextStats ? hud.gold >= nextStats.goldCost : false;

  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center px-4">
      <OuterPanel className="w-full max-w-sm">
        <div className="relative flex justify-center">
          <Label className="-mt-4 mb-1 text-[10px]">Wave {hud.wave + 1} incoming</Label>
        </div>

        <InnerPanel className="p-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img src={BOW} alt="bow" className="h-6 w-6 object-contain" />
              <div>
                <p className="text-[10px]">{hud.bowTier} Bow</p>
                <p className="text-[8px] opacity-80 tabular-nums">
                  {cur.damage} dmg · {cur.rangeTiles} tiles · {(1000 / cur.fireRateMs).toFixed(1)}/s
                </p>
              </div>
            </div>
            <Stat icon={COIN} alt="gold" value={`${hud.gold}`} />
          </div>
        </InnerPanel>

        {nextStats && next ? (
          <>
            <InnerPanel className="mt-1 p-2">
              <p className="text-[10px]">{next} Bow</p>
              <p className="text-[8px] opacity-80 tabular-nums">
                +{nextStats.damage - cur.damage} dmg · +{nextStats.rangeTiles - cur.rangeTiles}{" "}
                tiles · {(1000 / nextStats.fireRateMs).toFixed(1)}/s
              </p>
              {!affordable && (
                <p className="mt-1 text-[8px] text-brown-100">
                  Not enough gold — keep farming waves.
                </p>
              )}
            </InnerPanel>

            <div className="mt-1 flex gap-1">
              <PixelButton disabled={!affordable} onClick={() => sendShopAction("upgrade")}>
                <span className="flex items-center gap-1 text-[9px]">
                  <img src={COIN} alt="" className="h-3.5 w-3.5" />
                  {nextStats.goldCost}
                </span>
              </PixelButton>
              <PixelButton onClick={() => sendShopAction("start")}>
                <span className="text-[9px]">Fight</span>
              </PixelButton>
            </div>
          </>
        ) : (
          <PixelButton className="mt-1" onClick={() => sendShopAction("start")}>
            <span className="text-[9px]">Start next wave</span>
          </PixelButton>
        )}
      </OuterPanel>
    </div>
  );
}

/** Mounts the Phaser game and renders the React HUD on top of the canvas. */
export default function ArenaCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [hud, setHud] = useState<ArenaHudState>(EMPTY_HUD);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;

    const onHud = (e: Event) => {
      setHud((e as CustomEvent<ArenaHudState>).detail);
      setReady(true);
    };
    const onProgress = (e: Event) => {
      setProgress((e as CustomEvent<{ value: number }>).detail.value);
    };
    window.addEventListener("arena-hud", onHud);
    window.addEventListener("arena-load-progress", onProgress);

    void import("@/phaser/index").then(({ default: startArenaGame }) => {
      if (disposed || !hostRef.current) return;
      gameRef.current = startArenaGame(hostRef.current);
    });

    return () => {
      disposed = true;
      window.removeEventListener("arena-hud", onHud);
      window.removeEventListener("arena-load-progress", onProgress);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const hearts = Math.max(0, hud.maxHp);

  return (
    <div
      data-game-route
      className="relative h-full w-full overflow-hidden bg-background font-pixel"
    >
      <div ref={hostRef} className="h-full w-full" />

      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background">
          <p className="text-[11px] tracking-widest text-foreground">LOADING ARCOON</p>
          <OuterPanel className="w-56">
            <InnerPanel className="h-3 p-0">
              <div
                className="h-full bg-neon transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </InnerPanel>
          </OuterPanel>
        </div>
      )}

      {ready && (
        <div className="pointer-events-none absolute inset-0 p-3">
          <div className="flex items-start justify-between gap-3">
            {/* Vitals */}
            <OuterPanel className="px-2 py-1.5">
              <div className="flex gap-0.5">
                {Array.from({ length: hearts }).map((_, i) => (
                  <img
                    key={i}
                    src={HEART}
                    alt=""
                    className={`h-4 w-4 object-contain ${i < hud.hp ? "" : "opacity-25 grayscale"}`}
                  />
                ))}
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <Stat icon={COIN} alt="gold" value={`${hud.gold}`} />
                <div className="flex items-center gap-1.5">
                  <img src={BOW} alt="bow" className="h-4 w-4 object-contain" />
                  <span className="text-[10px]">{hud.bowTier}</span>
                </div>
              </div>
            </OuterPanel>

            {/* Wave + score */}
            <OuterPanel className="px-2 py-1.5">
              <div className="flex justify-end">
                <Label className="-mt-3.5 text-[9px]">Wave {hud.wave}</Label>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <Stat icon={SKULL} alt="enemies left" value={`${hud.enemiesLeft}`} />
                <Stat icon={SWORD} alt="kills" value={`${hud.kills}`} />
                <span className="text-[11px] tabular-nums">{hud.score}</span>
              </div>
            </OuterPanel>
          </div>

          {hud.intermission && !hud.gameOver && <Shop hud={hud} />}

          {hud.gameOver && (
            <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/70 px-4">
              <OuterPanel className="w-full max-w-sm text-center">
                <div className="flex justify-center">
                  <Label className="-mt-4 mb-1 text-[10px]">Game Over</Label>
                </div>
                <InnerPanel className="space-y-1 p-3">
                  <p className="text-[10px] tabular-nums">Reached wave {hud.wave}</p>
                  <div className="flex justify-center gap-3 pt-1">
                    <Stat icon={SWORD} alt="kills" value={`${hud.kills}`} />
                    <Stat icon={COIN} alt="gold earned" value={`${hud.goldEarned}`} />
                  </div>
                  <p className="pt-1 text-[10px] tabular-nums">{hud.score} points</p>
                </InnerPanel>
                <PixelButton className="mt-1" onClick={() => window.location.reload()}>
                  <span className="text-[9px]">Play again</span>
                </PixelButton>
              </OuterPanel>
            </div>
          )}

          <p className="absolute inset-x-0 bottom-3 text-center text-[8px] text-white text-outline">
            WASD to move · bow fires automatically · upgrade between waves
          </p>
        </div>
      )}
    </div>
  );
}
