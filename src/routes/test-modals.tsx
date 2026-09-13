import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  GameOverModal,
  LevelUpToast,
  LoadingOverlay,
  ShopModal,
  SkillTreeModal,
  TopBar,
  XpBar,
  type HudModel,
} from "@/components/game/game-modals";
import {
  BottomNav,
  CharacterPanel,
  InventoryPanel,
  PacksPanel,
  type GameTab,
} from "@/components/game/shell-panels";
import { OuterPanel } from "@/components/ui/pixel-panel";
import { EMPTY_RANKS, canLearn, getSkill, type SkillId } from "@/features/game/skill-tree";

export const Route = createFileRoute("/test-modals")({
  head: () => ({
    meta: [
      { title: "ARCOON UI Gallery — Every Game Panel" },
      {
        name: "description",
        content:
          "Preview every ARCOON in-game panel in one place: HUD readouts, the wave shop, skill tree, experience bar, level-up banner and game over screen.",
      },
      { property: "og:title", content: "ARCOON UI Gallery — Every Game Panel" },
      {
        property: "og:description",
        content:
          "Preview every ARCOON in-game panel in one place: HUD readouts, the wave shop, skill tree, experience bar, level-up banner and game over screen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TestModalsPage,
});

const SAMPLE: HudModel = {
  hp: 7,
  maxHp: 10,
  wave: 6,
  score: 4820,
  kills: 73,
  enemiesLeft: 9,
  intermission: true,
  gameOver: false,
  gold: 1340,
  goldEarned: 2610,
  bowTier: "Silver",
  xp: 640,
  level: 5,
  skillPoints: 3,
  ranks: { ...EMPTY_RANKS, sharpshooter: 2, vitality: 1, greed: 1 },
};

/** One labelled slot in the gallery. */
function Slot({
  title,
  note,
  children,
  className,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-2 text-[10px] text-white/80">{title}</h2>
      {note && <p className="mb-2 text-[8px] text-white/50">{note}</p>}
      <div className="flex justify-center rounded-lg bg-[#1b1526] p-4">{children}</div>
    </section>
  );
}

function TestModalsPage() {
  // Live skill tree so the gallery behaves like the real thing.
  const [ranks, setRanks] = useState(SAMPLE.ranks);
  const [points, setPoints] = useState(SAMPLE.skillPoints);
  const [progress, setProgress] = useState(0.62);
  const [xp, setXp] = useState(SAMPLE.xp);

  const [tab, setTab] = useState<GameTab>("world");

  const learn = (id: SkillId) => {
    const skill = getSkill(id);
    if (!canLearn(skill, ranks, points)) return;
    setRanks({ ...ranks, [id]: (ranks[id] ?? 0) + 1 });
    setPoints(points - 1);
  };

  return (
    <main data-game-route className="min-h-screen bg-[#120e1b] p-6 font-pixel text-white">
      <header className="mb-6">
        <h1 className="text-sm">ARCOON UI gallery</h1>
        <p className="mt-2 text-[9px] text-white/60">
          Every panel the game uses, rendered with sample data. Buttons are interactive.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Slot title="HUD — top bar" className="lg:col-span-2">
          <TopBar
            hud={{ ...SAMPLE, ranks }}
            onOpenSkills={() => setPoints(points + 1)}
            onOpenSettings={() => undefined}
          />
        </Slot>

        <Slot title="Experience bar (bottom, full width)" className="lg:col-span-2">
          <div className="relative h-20 w-full overflow-hidden">
            <XpBar xp={xp} />
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
              className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-white/60 underline"
            >
              advance
            </button>
          </div>
        </Slot>

        <Slot title="Between-waves shop">
          <ShopModal hud={{ ...SAMPLE, ranks }} onAction={() => {}} />
        </Slot>

        <Slot title="Game over">
          <GameOverModal hud={{ ...SAMPLE, ranks }} onRestart={() => {}} />
        </Slot>

        <Slot title="Skill tree" className="lg:col-span-2">
          <SkillTreeModal ranks={ranks} points={points} onLearn={learn} onClose={() => {}} />
        </Slot>

        <Slot title="Shell — bottom tab bar" className="lg:col-span-2">
          <div className="relative h-16 w-full overflow-hidden rounded">
            <BottomNav active={tab} onChange={setTab} />
          </div>
        </Slot>

        <Slot title="Inventory tab overlay">
          <div className="relative h-72 w-full overflow-hidden rounded">
            <InventoryPanel hud={{ ...SAMPLE, ranks }} onClose={() => {}} />
          </div>
        </Slot>

        <Slot title="Packs tab overlay">
          <div className="relative h-72 w-full overflow-hidden rounded">
            <PacksPanel onClose={() => {}} />
          </div>
        </Slot>

        <Slot title="Character tab overlay" className="lg:col-span-2">
          <div className="relative h-80 w-full overflow-hidden rounded">
            <CharacterPanel hud={{ ...SAMPLE, ranks }} onOpenSkills={() => {}} onClose={() => {}} />
          </div>
        </Slot>

        <Slot title="Panel primitives" className="lg:col-span-2">
          <OuterPanel className="p-3">
            <p className="text-[9px]">
              Outer panel with the dark pixel frame — the base of every modal.
            </p>
          </OuterPanel>
        </Slot>
      </div>
    </main>
  );
}
