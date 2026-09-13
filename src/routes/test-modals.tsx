import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  GameOverModal,
  LevelUpToast,
  LoadingOverlay,
  SkillTreeModal,
  TopBar,
  VictoryModal,
  WaveBreakModal,
  XpBar,
} from "@/components/game/game-modals";
import { OuterPanel } from "@/components/ui/pixel-panel";
import type { HudState } from "@/features/game/hud";
import { WAVES_PER_STAGE } from "@/features/game/campaign";
import { EMPTY_RANKS, canLearn, getSkill, type SkillId } from "@/features/game/skill-tree";

export const Route = createFileRoute("/test-modals")({
  head: () => ({
    meta: [
      { title: "ARCOON UI Gallery — Every Game Panel" },
      {
        name: "description",
        content:
          "Preview every ARCOON in-game panel in one place: HUD readouts, the wave break, skill tree, experience bar, level-up banner, stage clear and defeat screens.",
      },
      { property: "og:title", content: "ARCOON UI Gallery — Every Game Panel" },
      {
        property: "og:description",
        content:
          "Preview every ARCOON in-game panel in one place: HUD readouts, the wave break, skill tree, experience bar, level-up banner, stage clear and defeat screens.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TestModalsPage,
});

const SAMPLE: HudState = {
  hp: 70,
  maxHp: 100,
  wave: 6,
  boss: false,
  score: 4820,
  kills: 73,
  enemiesLeft: 9,
  enemiesTotal: 16,
  intermission: true,
  gameOver: false,
  stage: 3,
  stageWaves: WAVES_PER_STAGE,
  mapId: "whisperwood",
  victory: false,
  goldEarned: 2610,
  bowRarity: "Rare",
  bowStars: 3,
  xp: 640,
  level: 5,
  skillPoints: 3,
  ranks: { ...EMPTY_RANKS, sharpshooter: 2, vitality: 1, greed: 1 },
  seen: ["grunt", "runner"],
  bosses: 1,
};

/** One labelled slot in the gallery. */
function Slot({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-2 text-[14px] text-white/80">{title}</h2>
      <div className="flex justify-center rounded-lg bg-[#1b1526] p-4">{children}</div>
    </section>
  );
}

function TestModalsPage() {
  // Live skill tree so the gallery behaves like the real thing.
  const [ranks, setRanks] = useState(SAMPLE.ranks);
  const [points, setPoints] = useState(SAMPLE.skillPoints);
  const [progress, setProgress] = useState(0.62);

  const learn = (id: SkillId) => {
    const skill = getSkill(id);
    if (!canLearn(skill, ranks, points)) return;
    setRanks({ ...ranks, [id]: (ranks[id] ?? 0) + 1 });
    setPoints(points - 1);
  };

  return (
    <main data-game-route className="min-h-screen bg-[#120e1b] p-6 font-body text-white">
      <header className="mb-6">
        <h1 className="text-sm">ARCOON UI gallery</h1>
        <p className="mt-2 text-[13px] text-white/60">
          Every panel the game uses, rendered with sample data. Buttons are interactive.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Slot title="HUD — top bar" className="lg:col-span-2">
          <TopBar hud={{ ...SAMPLE, ranks }} onOpenSkills={() => setPoints(points + 1)} />
        </Slot>

        <Slot title="Experience bar (bottom, full width)" className="lg:col-span-2">
          <div className="relative h-20 w-full overflow-hidden">
            <XpBar xp={SAMPLE.xp} />
          </div>
        </Slot>

        <Slot title="Level-up banner">
          <LevelUpToast level={6} />
        </Slot>

        <Slot title="Loading screen">
          <div className="relative h-48 w-full overflow-hidden rounded">
            <LoadingOverlay progress={progress} />
            <button
              type="button"
              onClick={() => setProgress((p) => (p >= 1 ? 0 : Math.min(1, p + 0.2)))}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[12px] text-white/60 underline"
            >
              advance
            </button>
          </div>
        </Slot>

        <Slot title="Between-waves break">
          <WaveBreakModal hud={{ ...SAMPLE, ranks }} onFight={() => {}} />
        </Slot>

        <Slot title="Defeat">
          <GameOverModal hud={{ ...SAMPLE, ranks }} onRestart={() => {}} onHome={() => {}} />
        </Slot>

        <Slot title="Stage clear">
          <VictoryModal
            hud={{ ...SAMPLE, ranks, victory: true }}
            onNextStage={() => {}}
            onHome={() => {}}
          />
        </Slot>

        <Slot title="Skill tree" className="lg:col-span-2">
          <SkillTreeModal ranks={ranks} points={points} onLearn={learn} onClose={() => {}} />
        </Slot>

        <Slot title="Panel primitives" className="lg:col-span-2">
          <OuterPanel className="p-3">
            <p className="text-[13px]">
              Outer panel with the dark pixel frame — the base of every modal.
            </p>
          </OuterPanel>
        </Slot>
      </div>
    </main>
  );
}
