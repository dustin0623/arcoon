import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import type { ArenaHudState } from "@/phaser/scenes/ArenaScene";

const EMPTY_HUD: ArenaHudState = {
  hp: 0,
  maxHp: 0,
  wave: 0,
  score: 0,
  kills: 0,
  enemiesLeft: 0,
  intermission: true,
  gameOver: false,
};

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
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div ref={hostRef} className="h-full w-full" />

      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background">
          <p className="text-sm tracking-widest text-muted-foreground uppercase">Loading arena</p>
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {ready && (
        <div className="pointer-events-none absolute inset-0 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="rounded-lg border border-border/60 bg-card/80 px-3 py-2 backdrop-blur">
              <div className="flex gap-1">
                {Array.from({ length: hearts }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 rounded-sm ${i < hud.hp ? "bg-destructive" : "bg-muted"}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                HP {hud.hp}/{hud.maxHp}
              </p>
            </div>

            <div className="rounded-lg border border-border/60 bg-card/80 px-3 py-2 text-right backdrop-blur">
              <p className="text-lg leading-none font-semibold text-foreground tabular-nums">
                {hud.score}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Wave {hud.wave} · {hud.kills} kills · {hud.enemiesLeft} left
              </p>
            </div>
          </div>

          {hud.intermission && !hud.gameOver && (
            <div className="absolute inset-x-0 top-1/3 text-center">
              <p className="text-2xl font-semibold tracking-wide text-foreground drop-shadow">
                Wave {hud.wave + 1} incoming
              </p>
            </div>
          )}

          {hud.gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80">
              <p className="text-3xl font-bold text-foreground">Game Over</p>
              <p className="text-sm text-muted-foreground">
                Reached wave {hud.wave} · {hud.kills} kills · {hud.score} points
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="pointer-events-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Play again
              </button>
            </div>
          )}

          <p className="absolute inset-x-0 bottom-4 text-center text-[11px] text-muted-foreground">
            WASD to move · aim with the mouse · hold click to fire
          </p>
        </div>
      )}
    </div>
  );
}
