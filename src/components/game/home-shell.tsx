/**
 * HomeShell — the React home screen for ARCOON.
 * Uses the four-tab shell (World / Inventory / Packs / Character). The World
 * tab is an Archero-style stage chain: clear every stage of a map to open the
 * next map. Picking a stage navigates to the Phaser run at /game.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { Check, Coins, Lock, Package, Skull, Star, Swords } from "lucide-react";
import { InnerPanel, Label, OuterPanel, PixelButton } from "@/components/ui/pixel-panel";
import { ICONS, RaccoonAvatar, Stat } from "@/components/game/game-modals";
import { BottomNav, type GameTab } from "@/components/game/shell-panels";
import { BOW_TIER } from "@/features/game/bow";
import { SKILL_TREE } from "@/features/game/skill-tree";
import {
  EMPTY_PROGRESS,
  MAPS,
  isMapUnlocked,
  isStageCleared,
  isStageUnlocked,
  loadProgress,
  wavesForStage,
  type MapDef,
  type Progress,
} from "@/features/game/campaign";

export default function HomeShell() {
  const [tab, setTab] = useState<GameTab>("world");
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-brown-500 font-pixel">
      <HomeHeader progress={progress} />

      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-24">
        {tab === "world" && <WorldTab progress={progress} />}
        {tab === "inventory" && <HomeInventoryTab progress={progress} />}
        {tab === "packs" && <HomePacksTab />}
        {tab === "character" && <HomeCharacterTab progress={progress} />}
      </div>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

function HomeHeader({ progress }: { progress: Progress }) {
  return (
    <header className="px-3 pt-3">
      <OuterPanel className="flex items-center justify-between gap-2 px-2 py-1.5">
        <div className="flex items-center gap-2">
          <RaccoonAvatar className="h-9 w-9" />
          <div>
            <p className="text-[10px] text-white text-shadow">ARCOON</p>
            <p className="text-[8px] opacity-80">Raccoon archer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Stat icon={<Coins className="h-4 w-4 text-yellow-300" />} value={`${progress.gold}`} />
          <Stat icon={<Skull className="h-4 w-4 text-brown-100" />} value={`${progress.kills}`} />
          <Stat icon={<Star className="h-4 w-4 text-yellow-300" />} value={`${progress.bestScore}`} />
        </div>
      </OuterPanel>
    </header>
  );
}

/** World tab: every map with its stage chain. */
function WorldTab({ progress }: { progress: Progress }) {
  return (
    <div className="mx-auto max-w-md space-y-3">
      <h2 className="text-center text-[10px] text-white text-shadow">Choose your hunt</h2>
      {MAPS.map((map) => (
        <MapCard key={map.id} map={map} progress={progress} />
      ))}
    </div>
  );
}

function MapCard({ map, progress }: { map: MapDef; progress: Progress }) {
  const navigate = useNavigate();
  const unlocked = isMapUnlocked(progress, map.id) && map.playable;
  const clearedCount = Math.min(progress.cleared[map.id] ?? 0, map.stages);

  return (
    <OuterPanel className="px-2 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-white text-shadow">{map.name}</p>
          <p className="text-[8px] opacity-80">{map.blurb}</p>
        </div>
        <Label className="shrink-0 text-[8px]">
          {clearedCount}/{map.stages}
        </Label>
      </div>

      <InnerPanel className="mt-1.5 p-2">
        {!unlocked ? (
          <div className="flex items-center gap-2 py-1">
            <Lock className="h-4 w-4 text-brown-100/80" />
            <p className="text-[8px] opacity-80">
              {map.playable ? "Clear the previous map to unlock." : "Coming soon — test phase."}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: map.stages }, (_, i) => i + 1).map((stage) => {
              const open = isStageUnlocked(progress, map.id, stage);
              const done = isStageCleared(progress, map.id, stage);
              return (
                <button
                  key={stage}
                  type="button"
                  disabled={!open}
                  aria-label={`${map.name} stage ${stage}`}
                  onClick={() =>
                    navigate({ to: "/game", search: { map: map.id, stage } })
                  }
                  className={clsx(
                    "flex h-9 flex-1 flex-col items-center justify-center rounded-sm border-2 text-[9px]",
                    done && "border-neon/70 bg-brown-600 text-neon",
                    !done && open && "cursor-pointer border-brown-100 bg-brown-400 text-white",
                    !open && "border-brown-700 bg-brown-600/60 text-brown-100/50",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : open ? stage : <Lock className="h-3 w-3" />}
                  <span className="text-[7px] opacity-80">{wavesForStage(stage)}w</span>
                </button>
              );
            })}
          </div>
        )}
      </InnerPanel>
    </OuterPanel>
  );
}

function HomeInventoryTab({ progress }: { progress: Progress }) {
  const wood = BOW_TIER.Wood;
  return (
    <div className="mx-auto max-w-md space-y-2">
      <h2 className="text-center text-[10px] text-white text-shadow">Inventory</h2>
      <OuterPanel className="p-2">
        <InnerPanel className="flex items-center justify-between gap-2 p-2">
          <div className="flex items-center gap-2">
            <img src={ICONS.bow} alt="bow" className="h-6 w-6 object-contain" />
            <div>
              <p className="text-[10px]">Wood Bow</p>
              <p className="text-[8px] tabular-nums opacity-80">
                {wood.damage} dmg · {wood.rangeTiles} tiles
              </p>
            </div>
          </div>
          <Stat icon={<Coins className="h-4 w-4 text-yellow-300" />} value={`${progress.gold}`} />
        </InnerPanel>
        <InnerPanel className="mt-1 p-2">
          <p className="text-[8px] opacity-80">
            Bows upgrade inside a run between waves. Gear slots arrive with the pack system.
          </p>
        </InnerPanel>
      </OuterPanel>
    </div>
  );
}

const PACKS = [
  { name: "Hunter Pack", desc: "Starter gear and a pouch of gold." },
  { name: "Ranger Pack", desc: "Rare bows and skill tomes." },
  { name: "Royal Pack", desc: "Legendary loot for deep runs." },
];

function HomePacksTab() {
  return (
    <div className="mx-auto max-w-md space-y-2">
      <h2 className="text-center text-[10px] text-white text-shadow">Packs</h2>
      {PACKS.map((pack) => (
        <OuterPanel key={pack.name} className="p-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 shrink-0 text-brown-100" />
              <div>
                <p className="text-[10px]">{pack.name}</p>
                <p className="text-[8px] opacity-80">{pack.desc}</p>
              </div>
            </div>
            <PixelButton disabled>
              <span className="text-[8px]">Soon</span>
            </PixelButton>
          </div>
        </OuterPanel>
      ))}
    </div>
  );
}

function HomeCharacterTab({ progress }: { progress: Progress }) {
  const totalCleared = MAPS.reduce(
    (sum, m) => sum + Math.min(progress.cleared[m.id] ?? 0, m.stages),
    0,
  );
  return (
    <div className="mx-auto max-w-md space-y-2">
      <h2 className="text-center text-[10px] text-white text-shadow">Character</h2>
      <OuterPanel className="p-2">
        <InnerPanel className="flex items-center gap-2 p-2">
          <RaccoonAvatar className="h-12 w-12" />
          <div>
            <p className="text-[10px]">Raccoon</p>
            <p className="text-[8px] opacity-80">Bow specialist</p>
          </div>
        </InnerPanel>
        <InnerPanel className="mt-1 flex items-center justify-between p-2">
          <Stat icon={<Swords className="h-4 w-4 text-brown-100" />} value={`${totalCleared} stages`} />
          <Stat icon={<Skull className="h-4 w-4 text-brown-100" />} value={`${progress.kills}`} />
          <Stat icon={<Star className="h-4 w-4 text-yellow-300" />} value={`${progress.bestScore}`} />
        </InnerPanel>
        <InnerPanel className="mt-1 p-2">
          <p className="text-[9px] opacity-80">Skills</p>
          <p className="mt-1 text-[8px] opacity-70">
            {SKILL_TREE.length} skills unlock as you level up during a run.
          </p>
        </InnerPanel>
      </OuterPanel>
    </div>
  );
}
