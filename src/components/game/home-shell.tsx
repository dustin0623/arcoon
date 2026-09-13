/**
 * HomeShell — the React home screen for ARCOON.
 * Uses the four-tab shell (World / Inventory / Packs / Character). The World
 * tab is an Archero-style stage chain: clear every stage of a map to open the
 * next map. Picking a stage navigates to the Phaser run at /game.
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import {
  ArrowLeftRight,
  Check,
  Coins,
  Gem,
  Lock,
  Package,
  Skull,
  Sparkles,
  Star,
  Swords,
  Wallet as WalletIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InnerPanel, Label, OuterPanel, PixelButton } from "@/components/ui/pixel-panel";

import { FrogAvatar, ICONS, Stat } from "@/components/game/game-modals";
import { BottomNav, type GameTab } from "@/components/game/shell-panels";
import { BOW_TIER } from "@/features/game/bow";
import { getLevelProgress } from "@/features/game/experience";
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
    <div className="fantasy-shell relative flex h-full w-full flex-col overflow-hidden bg-ink-900 font-pixel text-brown-100">
      <div className="forest-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="ember-glow pointer-events-none absolute inset-0" aria-hidden />
      <HomeHeader progress={progress} />

      <main className="relative flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg px-3 pt-3 pb-24">
          {tab === "world" && <WorldTab progress={progress} />}
          {tab === "inventory" && <HomeInventoryTab progress={progress} />}
          {tab === "packs" && <HomePacksTab />}
          {tab === "character" && <HomeCharacterTab progress={progress} />}
        </div>
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}


/**
 * Header modelled on the Idle Raiders shell: a fixed top bar with the player
 * identity (avatar, name, level, XP meter) on the left and compact resource
 * chips on the right, both inside the same centred container as the content.
 */
function HomeHeader({ progress }: { progress: Progress }) {
  const level = getLevelProgress(progress.xp);
  return (
    <header className="relative z-10 shrink-0 bg-ink-800/95 shadow-card backdrop-blur">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-2 px-3 py-2">
        {/* Left: identity */}
        <div className="flex min-w-0 items-center gap-2">
          <FrogAvatar className="h-9 w-9 shrink-0 rounded-full ring-1 ring-leaf/60 glow-gold" />
          <div className="min-w-0">
            <p className="truncate text-[10px] leading-tight text-gradient-gold">
              ARCOON <span className="text-[8px] text-brown-100/70">Lv.{level.level}</span>
            </p>
            <div className="mt-1 flex items-center gap-1">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-900 ring-1 ring-ink-line sm:w-28">
                <div
                  className="h-full rounded-full bg-gradient-gold"
                  style={{ width: `${Math.round(level.ratio * 100)}%` }}
                />
              </div>
              <span className="text-[7px] whitespace-nowrap tabular-nums text-brown-100/60">
                {level.maxed ? "MAX" : `${level.into}/${level.needed}`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: energy-style stats + wallet, as in the reference header */}
        <div className="flex shrink-0 items-center gap-1">
          <Chip icon={<Skull className="h-3.5 w-3.5 text-brown-100" />} value={progress.kills} />
          <Chip icon={<Star className="h-3.5 w-3.5 text-fgold" />} value={progress.bestScore} />
          <WalletPopover progress={progress} />
        </div>
      </div>
      {/* Gold hairline under the header, as in the reference shell. */}
      <div className="fantasy-rule w-full" aria-hidden />
    </header>
  );
}

/** Compact resource pill used in the header, like the reference wallet chips. */
function Chip({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <span className="flex items-center gap-1 rounded-md bg-ink-700 px-1.5 py-1 ring-1 ring-ink-line">
      {icon}
      <span className="text-[9px] tabular-nums text-brown-100 text-shadow">{value}</span>
    </span>
  );
}

/**
 * Wallet popover ported from the Idle Raiders header
 * (ref/idleraiders-copy/components/popover/Wallet.tsx): a compact trigger that
 * shows the gold balance, opening a balance sheet of every currency.
 */
function WalletPopover({ progress }: { progress: Progress }) {
  const balances = [
    {
      label: "Gold",
      value: progress.gold,
      icon: <Coins className="h-4 w-4 text-fgold" />,
      tone: "text-fgold",
    },
    {
      label: "Soul Shards",
      value: 0,
      icon: <Gem className="h-4 w-4 text-purple-400" />,
      tone: "text-purple-300",
    },
    {
      label: "Arrow Tokens",
      value: 0,
      icon: <Sparkles className="h-4 w-4 text-frost" />,
      tone: "text-frost",
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Wallet"
          className="flex cursor-pointer items-center gap-1 rounded-md bg-ink-700 px-1.5 py-1 ring-1 ring-fgold/40 transition-colors hover:bg-ink-600"
        >
          <WalletIcon className="h-3.5 w-3.5 text-fgold" />
          <span className="text-[9px] tabular-nums text-fgold text-shadow">{progress.gold}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="fantasy-card w-56 border-0 p-0 font-pixel text-brown-100"
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <WalletIcon className="h-4 w-4 text-fgold" />
          <div>
            <p className="text-[9px] text-gradient-gold">Wallet</p>
            <p className="text-[7px] text-brown-100/60">Your balances</p>
          </div>
        </div>
        <div className="fantasy-rule w-full" aria-hidden />
        <div className="space-y-2 px-3 py-2.5">
          {balances.map((b) => (
            <div key={b.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {b.icon}
                <span className="text-[8px] text-brown-100/70">{b.label}</span>
              </div>
              <span className={clsx("text-[9px] tabular-nums", b.tone)}>
                {b.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div className="fantasy-rule w-full" aria-hidden />
        <div className="px-3 py-2">
          <button
            type="button"
            disabled
            className="w-full rounded-md bg-ink-700 py-1.5 text-[8px] text-brown-100/50 ring-1 ring-ink-line"
          >
            <ArrowLeftRight className="mr-1 inline h-3 w-3" />
            Deposit / Withdraw soon
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}



/** World tab: every map with its stage chain. */
function WorldTab({ progress }: { progress: Progress }) {
  return (
    <div className="space-y-3">
      <h2 className="text-center text-[10px] text-gradient-gold">Choose your hunt</h2>
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
                    "flex h-9 flex-1 flex-col items-center justify-center rounded-md text-[9px] ring-1 transition-all",
                    done && "bg-ink-700 text-neon ring-neon/60",
                    !done &&
                      open &&
                      "fantasy-btn cursor-pointer ring-fgold-glow/40 hover:-translate-y-0.5",
                    !open && "bg-ink-800 text-brown-100/40 ring-ink-line",
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
    <div className="space-y-2">
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
    <div className="space-y-2">
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
    <div className="space-y-2">
      <h2 className="text-center text-[10px] text-white text-shadow">Character</h2>
      <OuterPanel className="p-2">
        <InnerPanel className="flex items-center gap-2 p-2">
          <FrogAvatar className="h-12 w-12" />
          <div>
            <p className="text-[10px]">Frog</p>
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
