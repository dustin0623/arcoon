import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type Phaser from "phaser";
import type { HudState } from "@/features/game/hud";
import { EMPTY_RANKS, type SkillId } from "@/features/game/skill-tree";
import {
  GameOverModal,
  LevelUpToast,
  LoadingOverlay,
  WaveBreakModal,
  VictoryModal,
  SkillTreeModal,
  TopBar,
  XpBar,
} from "@/components/game/game-modals";
import { WAVES_PER_STAGE, nextStage, recordRun } from "@/features/game/campaign";

const TouchJoystick = lazy(() => import("@/components/game/touch-joystick"));

const EMPTY_HUD: HudState = {
  hp: 0,
  maxHp: 0,
  wave: 0,
  boss: false,
  score: 0,
  kills: 0,
  enemiesLeft: 0,
  enemiesTotal: 1,
  intermission: true,
  gameOver: false,
  stage: 1,
  stageWaves: WAVES_PER_STAGE,
  mapId: "whisperwood",
  victory: false,
  goldEarned: 0,
  bowRarity: "Common",
  bowStars: 1,
  xp: 0,
  level: 1,
  skillPoints: 0,
  ranks: { ...EMPTY_RANKS },
  seen: [],
  bosses: 0,
};

function startNextWave() {
  window.dispatchEvent(new CustomEvent("arena-wave-start"));
}

function sendSkillAction(id: SkillId) {
  window.dispatchEvent(new CustomEvent("arena-skill", { detail: { id } }));
}

/** Mounts the Phaser game and renders the React HUD on top of the canvas. */
export default function ArenaCanvas({
  mapId = "whisperwood",
  stage = 1,
}: {
  mapId?: string;
  stage?: number;
}) {
  const navigate = useNavigate();
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [touch, setTouch] = useState(false);
  const lastLevel = useRef(1);

  useEffect(() => {
    setTouch(
      window.matchMedia("(pointer: coarse)").matches ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0,
    );
  }, []);

  useEffect(() => {
    let disposed = false;

    const onHud = (e: Event) => {
      setHud((e as CustomEvent<HudState>).detail);
      setReady(true);
    };
    const onProgress = (e: Event) => {
      setProgress((e as CustomEvent<{ value: number }>).detail.value);
    };
    window.addEventListener("arena-hud", onHud);
    window.addEventListener("arena-load-progress", onProgress);

    void import("@/phaser/index").then(({ default: startArenaGame }) => {
      if (disposed || !hostRef.current) return;
      gameRef.current = startArenaGame(hostRef.current, { mapId, stage });
    });

    return () => {
      disposed = true;
      window.removeEventListener("arena-hud", onHud);
      window.removeEventListener("arena-load-progress", onProgress);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [mapId, stage]);

  // Bank the run once, the first time the scene reports a win or a defeat.
  const saved = useRef(false);
  useEffect(() => {
    if (saved.current || (!hud.victory && !hud.gameOver)) return;
    saved.current = true;
    recordRun({
      mapId,
      stage,
      victory: hud.victory,
      gold: hud.goldEarned,
      kills: hud.kills,
      score: hud.score,
      xp: hud.xp,
      bosses: hud.bosses,
      seen: hud.seen,
    });
  }, [hud, mapId, stage]);

  const follow = nextStage(mapId, stage);
  const goHome = () => void navigate({ to: "/" });

  // Flash a banner whenever the player gains a level.
  useEffect(() => {
    if (hud.level <= lastLevel.current) return;
    lastLevel.current = hud.level;
    setLevelUp(hud.level);
    const t = window.setTimeout(() => setLevelUp(null), 2200);
    return () => window.clearTimeout(t);
  }, [hud.level]);

  return (
    <div data-game-route className="relative h-full w-full touch-none overflow-hidden bg-background font-body">
      <div ref={hostRef} className="h-full w-full" />

      {!ready && <LoadingOverlay progress={progress} />}

      {ready && (
        <div
          className="pointer-events-none absolute inset-0 p-3 pb-9"
          style={{
            paddingTop: "max(0.75rem, env(safe-area-inset-top))",
            paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
            paddingRight: "max(0.75rem, env(safe-area-inset-right))",
          }}
        >
          <TopBar hud={hud} onOpenSkills={() => setSkillsOpen((v) => !v)} />

          {levelUp !== null && (
            <div className="absolute inset-x-0 top-24 flex justify-center">
              <LevelUpToast level={levelUp} />
            </div>
          )}

          {hud.victory && (
            <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/70 px-4">
              <VictoryModal
                hud={hud}
                onNextStage={
                  follow
                    ? () => void navigate({ to: "/game", search: { map: mapId, stage: follow } })
                    : null
                }
                onHome={goHome}
              />
            </div>
          )}

          {hud.intermission && !hud.gameOver && !hud.victory && !skillsOpen && (
            <div className="pointer-events-auto absolute inset-0 flex items-center justify-center px-4">
              <WaveBreakModal hud={hud} onFight={startNextWave} />
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
              <GameOverModal hud={hud} onRestart={() => window.location.reload()} onHome={goHome} />
            </div>
          )}

          {touch && !hud.gameOver && !hud.victory && !hud.intermission && !skillsOpen && (
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
