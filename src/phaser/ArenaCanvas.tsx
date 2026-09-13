import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import type { ArenaHudState } from "@/phaser/scenes/ArenaScene";
import { EMPTY_RANKS, type SkillId } from "@/features/game/skill-tree";
import {
  GameOverModal,
  LevelUpToast,
  LoadingOverlay,
  ShopModal,
  SkillTreeModal,
  VitalsPanel,
  WavePanel,
  XpBar,
} from "@/components/game/game-modals";

const TouchJoystick = lazy(() => import("@/components/game/touch-joystick"));

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
  xp: 0,
  level: 1,
  skillPoints: 0,
  ranks: { ...EMPTY_RANKS },
};

function sendShopAction(action: "upgrade" | "start") {
  window.dispatchEvent(new CustomEvent("arena-shop", { detail: { action } }));
}

function sendSkillAction(id: SkillId) {
  window.dispatchEvent(new CustomEvent("arena-skill", { detail: { id } }));
}

/** Mounts the Phaser game and renders the React HUD on top of the canvas. */
export default function ArenaCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [hud, setHud] = useState<ArenaHudState>(EMPTY_HUD);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [touch, setTouch] = useState(false);
  const lastLevel = useRef(1);

  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);
  }, []);

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

  // Flash a banner whenever the player gains a level.
  useEffect(() => {
    if (hud.level <= lastLevel.current) return;
    lastLevel.current = hud.level;
    setLevelUp(hud.level);
    const t = window.setTimeout(() => setLevelUp(null), 2200);
    return () => window.clearTimeout(t);
  }, [hud.level]);

  return (
    <div data-game-route className="relative h-full w-full touch-none overflow-hidden bg-background font-pixel">
      <div ref={hostRef} className="h-full w-full" />

      {!ready && <LoadingOverlay progress={progress} />}

      {ready && (
        <div className="pointer-events-none absolute inset-0 p-3 pb-9">
          <div className="flex items-start justify-between gap-3">
            <VitalsPanel hud={hud} onOpenSkills={() => setSkillsOpen((v) => !v)} />
            <WavePanel hud={hud} />
          </div>

          {levelUp !== null && (
            <div className="absolute inset-x-0 top-24 flex justify-center">
              <LevelUpToast level={levelUp} />
            </div>
          )}

          {hud.intermission && !hud.gameOver && !skillsOpen && (
            <div className="pointer-events-auto absolute inset-0 flex items-center justify-center px-4">
              <ShopModal hud={hud} onAction={sendShopAction} />
            </div>
          )}

          {skillsOpen && !hud.gameOver && (
            <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/60 px-4">
              <SkillTreeModal
                ranks={hud.ranks}
                points={hud.skillPoints}
                onLearn={sendSkillAction}
                onClose={() => setSkillsOpen(false)}
              />
            </div>
          )}

          {hud.gameOver && (
            <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/70 px-4">
              <GameOverModal hud={hud} onRestart={() => window.location.reload()} />
            </div>
          )}

          {touch && !hud.gameOver && !hud.intermission && !skillsOpen && (
            <Suspense fallback={null}>
              <TouchJoystick />
            </Suspense>
          )}

          <XpBar xp={hud.xp} />
        </div>
      )}
    </div>
  );
}
