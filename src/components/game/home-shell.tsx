/**
 * HomeShell — the React home screen for ARCOON ("The Forest Saga").
 * Four tabs: World (Archero-style stage chain), Armory (buy bows, spend gold
 * on stars), Book (bestiary, armory and milestones) and Character.
 * Picking a stage navigates to the Phaser run at /game.
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import {
  ArrowLeftRight,
  Backpack,
  BookOpen,
  Check,
  Coins,
  Crown,
  Gem,
  Globe,
  Lock,
  Skull,
  Sparkles,
  Star,
  Swords,
  User,
  Wallet as WalletIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InnerPanel, Label, OuterPanel, PixelButton } from "@/components/ui/pixel-panel";

import { FrogAvatar, ICONS, Stat, StarRow } from "@/components/game/game-modals";
import { BOWS, BOW_RARITIES, MAX_STARS, bowStats, starUpgradeCost, type BowRarity } from "@/features/game/bow";
import { buyBow, equipBow, ownsBow, starsOf, upgradeStar } from "@/features/game/armory";
import { getBestiary, getMilestones } from "@/features/game/book";
import { getLevelProgress } from "@/features/game/experience";
import { SKILL_TREE } from "@/features/game/skill-tree";
import {
  EMPTY_PROGRESS,
  MAPS,
  WAVES_PER_STAGE,
  isMapUnlocked,
  isStageCleared,
  isStageUnlocked,
  loadProgress,
  type MapDef,
  type Progress,
} from "@/features/game/campaign";

type GameTab = "world" | "armory" | "book" | "character";

const TABS: { id: GameTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "world", label: "World", icon: Globe },
  { id: "armory", label: "Armory", icon: Backpack },
  { id: "book", label: "Book", icon: BookOpen },
  { id: "character", label: "Character", icon: User },
];

export default function HomeShell() {
  const [tab, setTab] = useState<GameTab>("world");
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  return (
    <div className="fantasy-shell relative flex h-full w-full flex-col overflow-hidden bg-ink-900 font-body text-shell-text">
      <div className="forest-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="ember-glow pointer-events-none absolute inset-0" aria-hidden />
      <HomeHeader progress={progress} />

      <main className="relative flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg px-3 pt-3 pb-24">
          {tab === "world" && <WorldTab progress={progress} />}
          {tab === "armory" && <ArmoryTab progress={progress} onChange={setProgress} />}
          {tab === "book" && <BookTab progress={progress} />}
          {tab === "character" && <CharacterTab progress={progress} />}
        </div>
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

/**
 * Header modelled on the Idle Raiders shell: a fixed top bar with the player
 * identity (avatar, name, level, XP meter) on the left and the wallet on the
 * right, both inside the same centred container as the content.
 */
function HomeHeader({ progress }: { progress: Progress }) {
  const level = getLevelProgress(progress.xp);
  return (
    <header className="relative z-10 shrink-0 bg-ink-800/95 shadow-card backdrop-blur">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FrogAvatar className="h-9 w-9 shrink-0 rounded-full ring-1 ring-shell-accent/70" />
          <div className="min-w-0">
            <p className="truncate font-pixel text-[12px] leading-tight text-shell-accent">
              ARCOON <span className="font-pixel text-[9px] text-shell-muted">Lv.{level.level}</span>
            </p>
            <div className="mt-1 flex items-center gap-1">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-900 ring-1 ring-ink-line sm:w-28">
                <div
                  className="h-full rounded-full bg-shell-accent-strong"
                  style={{ width: `${Math.round(level.ratio * 100)}%` }}
                />
              </div>
              <span className="text-[11px] whitespace-nowrap tabular-nums text-shell-muted">
                {level.maxed ? "MAX" : `${level.into}/${level.needed}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <WalletPopover progress={progress} />
        </div>
      </div>
      <div className="fantasy-rule w-full" aria-hidden />
    </header>
  );
}

/** Wallet popover: a compact gold trigger opening a balance sheet. */
function WalletPopover({ progress }: { progress: Progress }) {
  const balances = [
    {
      label: "Gold",
      value: progress.gold,
      icon: <Coins className="h-4 w-4 text-currency" />,
      tone: "text-currency",
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
          className="flex cursor-pointer items-center gap-1 rounded-md bg-ink-700 px-1.5 py-1 ring-1 ring-currency/35 transition-colors hover:bg-ink-600"
        >
          <WalletIcon className="h-3.5 w-3.5 text-currency" />
          <span className="text-[13px] tabular-nums text-currency text-shadow">{progress.gold}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="fantasy-card w-56 border-0 p-0 font-body text-shell-text">
        <div className="flex items-center gap-2 px-3 py-2">
          <WalletIcon className="h-4 w-4 text-currency" />
          <div>
            <p className="text-[13px] text-shell-accent">Wallet</p>
            <p className="text-[11px] text-shell-muted">Your balances</p>
          </div>
        </div>
        <div className="fantasy-rule w-full" aria-hidden />
        <div className="space-y-2 px-3 py-2.5">
          {balances.map((b) => (
            <div key={b.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {b.icon}
                <span className="text-[12px] text-shell-muted">{b.label}</span>
              </div>
              <span className={clsx("text-[13px] tabular-nums", b.tone)}>
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
            className="w-full rounded-md bg-ink-700 py-1.5 text-[12px] text-shell-muted/60 ring-1 ring-ink-line"
          >
            <ArrowLeftRight className="mr-1 inline h-3 w-3" />
            Deposit / Withdraw soon
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Bottom tab bar pinned to the screen edge. */
function BottomNav({ active, onChange }: { active: GameTab; onChange: (tab: GameTab) => void }) {
  return (
    <nav
      aria-label="Game tabs"
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 bg-ink-800/95 shadow-card backdrop-blur"
    >
      <div className="fantasy-rule w-full" aria-hidden />
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-pressed={isActive}
              className="relative flex flex-1 cursor-pointer flex-col items-center gap-0.5 py-1.5"
            >
              {isActive && (
                <span className="absolute top-0 h-1 w-8 rounded-full bg-shell-accent-strong" aria-hidden />
              )}
              <Icon
                className={clsx(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-shell-accent" : "text-shell-muted/55",
                )}
              />
              <span
                className={clsx("text-[12px]", isActive ? "text-shell-accent" : "text-shell-muted/55")}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** World tab: every map with its stage chain. */
function WorldTab({ progress }: { progress: Progress }) {
  return (
    <div className="space-y-3">
      <h2 className="text-center font-pixel text-[12px] text-shell-accent">Choose your hunt</h2>
      {MAPS.map((map) => (
        <MapCard key={map.id} map={map} progress={progress} />
      ))}
    </div>
  );
}

function MapCard({ map, progress }: { map: MapDef; progress: Progress }) {
  const navigate = useNavigate();
  const unlocked = isMapUnlocked(progress, map.id);
  const clearedCount = Math.min(progress.cleared[map.id] ?? 0, map.stages);

  return (
    <OuterPanel className="px-2 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-pixel text-[12px] text-shell-text text-shadow">{map.name}</p>
          <p className="text-[12px] opacity-80">{map.blurb}</p>
          <p className="text-[11px] opacity-70">Boss: {map.boss}</p>
        </div>
        <Label className="shrink-0 text-[12px]">
          {clearedCount}/{map.stages}
        </Label>
      </div>

      <InnerPanel className="mt-1.5 p-2">
        {!unlocked ? (
          <div className="flex items-center gap-2 py-1">
            <Lock className="h-4 w-4 text-shell-muted" />
            <p className="text-[12px] opacity-80">Clear the previous map to unlock.</p>
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
                  onClick={() => navigate({ to: "/game", search: { map: map.id, stage } })}
                  className={clsx(
                    "flex h-9 flex-1 flex-col items-center justify-center rounded-md text-[13px] ring-1 transition-all",
                    done && "bg-ink-700 text-neon ring-neon/60",
                    !done && open && "fantasy-btn cursor-pointer ring-shell-accent/40 hover:-translate-y-0.5",
                    !open && "bg-ink-800 text-shell-muted/45 ring-ink-line",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : open ? stage : <Lock className="h-3 w-3" />}
                  <span className="text-[11px] opacity-80">{WAVES_PER_STAGE}w</span>
                </button>
              );
            })}
          </div>
        )}
      </InnerPanel>
    </OuterPanel>
  );
}

/** Armory tab: the Blacksmith — own, equip and star-up the five bow sets. */
function ArmoryTab({
  progress,
  onChange,
}: {
  progress: Progress;
  onChange: (next: Progress) => void;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-center font-pixel text-[12px] text-shell-accent">Armory</h2>
      <OuterPanel className="flex items-center justify-between p-2">
        <p className="text-[12px] opacity-80">Gold banked from your runs</p>
        <Stat icon={<Coins className="h-4 w-4 text-currency" />} value={`${progress.gold}`} />
      </OuterPanel>

      {BOW_RARITIES.map((rarity) => (
        <BowRow key={rarity} rarity={rarity} progress={progress} onChange={onChange} />
      ))}
    </div>
  );
}

function BowRow({
  rarity,
  progress,
  onChange,
}: {
  rarity: BowRarity;
  progress: Progress;
  onChange: (next: Progress) => void;
}) {
  const def = BOWS[rarity];
  const owned = ownsBow(progress, rarity);
  const stars = starsOf(progress, rarity);
  const stats = bowStats(rarity, Math.max(stars, 1));
  const upgradeCost = owned ? starUpgradeCost(rarity, stars) : null;
  const equipped = progress.equipped === rarity;

  return (
    <OuterPanel className="p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <img src={ICONS.bow} alt="" className="h-6 w-6 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="truncate text-[14px]">{def.name}</p>
            <p className="text-[11px] opacity-70">{rarity}</p>
          </div>
        </div>
        {owned ? <StarRow stars={stars} /> : <Lock className="h-4 w-4 text-shell-muted" />}
      </div>

      <InnerPanel className="mt-1 p-2">
        <p className="text-[12px] tabular-nums opacity-80">
          {stats.damage} dmg · {stats.rangeTiles} tiles · {(1000 / stats.fireRateMs).toFixed(1)}/s
        </p>
        <div className="mt-1.5 flex gap-1">
          {!owned ? (
            <PixelButton
              variant="green"
              className="flex-1"
              disabled={progress.gold < def.unlockCost}
              onClick={() => onChange(buyBow(progress, rarity))}
            >
              <span className="flex items-center gap-1 text-[12px]">
                <Coins className="h-3.5 w-3.5 text-currency" />
                {def.unlockCost}
              </span>
            </PixelButton>
          ) : (
            <>
              <PixelButton
                className="flex-1"
                disabled={equipped}
                onClick={() => onChange(equipBow(progress, rarity))}
              >
                <span className="text-[12px]">{equipped ? "Equipped" : "Equip"}</span>
              </PixelButton>
              <PixelButton
                variant="green"
                className="flex-1"
                disabled={upgradeCost === null || progress.gold < upgradeCost}
                onClick={() => onChange(upgradeStar(progress, rarity))}
              >
                <span className="flex items-center gap-1 text-[12px]">
                  {upgradeCost === null ? (
                    `${MAX_STARS}★ max`
                  ) : (
                    <>
                      <Star className="h-3.5 w-3.5 text-yellow-300" />
                      {upgradeCost}
                    </>
                  )}
                </span>
              </PixelButton>
            </>
          )}
        </div>
      </InnerPanel>
    </OuterPanel>
  );
}

/** Book tab: bestiary, armory index and milestones. */
function BookTab({ progress }: { progress: Progress }) {
  const bestiary = getBestiary(progress);
  const milestones = getMilestones(progress);
  const found = bestiary.filter((e) => e.discovered).length;

  return (
    <div className="space-y-2">
      <h2 className="text-center font-pixel text-[12px] text-shell-accent">The Book</h2>

      <OuterPanel className="p-2">
        <div className="flex items-center justify-between">
          <p className="text-[13px]">Bestiary</p>
          <Label className="text-[12px]">
            {found}/{bestiary.length}
          </Label>
        </div>
        <div className="mt-1 space-y-1">
          {bestiary.map((entry) => (
            <InnerPanel key={entry.key} className={clsx("p-2", !entry.discovered && "opacity-60")}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px]">{entry.discovered ? entry.name : "???"}</p>
                  <p className="truncate text-[12px] opacity-75">
                    {entry.discovered ? entry.lore : "Not yet encountered."}
                  </p>
                </div>
                {entry.discovered && (
                  <p className="shrink-0 text-[12px] tabular-nums opacity-80">
                    {entry.hp} hp · {entry.damage} dmg
                  </p>
                )}
              </div>
            </InnerPanel>
          ))}
        </div>
      </OuterPanel>

      <OuterPanel className="p-2">
        <p className="text-[13px]">Armory index</p>
        <div className="mt-1 space-y-1">
          {BOW_RARITIES.map((rarity) => {
            const stars = starsOf(progress, rarity);
            return (
              <InnerPanel key={rarity} className={clsx("p-2", stars === 0 && "opacity-60")}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px]">{BOWS[rarity].name}</p>
                    <p className="text-[11px] opacity-70">{rarity}</p>
                  </div>
                  {stars > 0 ? (
                    <StarRow stars={stars} />
                  ) : (
                    <span className="text-[12px] opacity-70">{BOWS[rarity].unlockCost}g</span>
                  )}
                </div>
              </InnerPanel>
            );
          })}
        </div>
      </OuterPanel>

      <OuterPanel className="p-2">
        <p className="text-[13px]">Milestones</p>
        <div className="mt-1 space-y-1">
          {milestones.map((m) => (
            <InnerPanel key={m.id} className={clsx("p-2", !m.done && "opacity-70")}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px]">{m.name}</p>
                  <p className="truncate text-[12px] opacity-75">{m.detail}</p>
                </div>
                {m.done ? (
                  <Check className="h-4 w-4 shrink-0 text-neon" />
                ) : (
                  <Lock className="h-4 w-4 shrink-0 text-shell-muted" />
                )}
              </div>
            </InnerPanel>
          ))}
        </div>
      </OuterPanel>
    </div>
  );
}

function CharacterTab({ progress }: { progress: Progress }) {
  const totalCleared = MAPS.reduce(
    (sum, m) => sum + Math.min(progress.cleared[m.id] ?? 0, m.stages),
    0,
  );
  const equipped = BOWS[progress.equipped];
  return (
    <div className="space-y-2">
      <h2 className="text-center font-pixel text-[12px] text-shell-accent">Character</h2>
      <OuterPanel className="p-2">
        <InnerPanel className="flex items-center gap-2 p-2">
          <FrogAvatar className="h-12 w-12" />
          <div className="min-w-0">
            <p className="text-[14px]">Frog</p>
            <p className="truncate text-[12px] opacity-80">
              {equipped.name} · {starsOf(progress, progress.equipped)}★
            </p>
          </div>
        </InnerPanel>
        <InnerPanel className="mt-1 grid grid-cols-4 gap-2 p-2">
          <CharStat label="Stages" icon={<Swords className="h-4 w-4 text-shell-muted" />} value={totalCleared} />
          <CharStat label="Kills" icon={<Skull className="h-4 w-4 text-shell-muted" />} value={progress.kills} />
          <CharStat label="Bosses" icon={<Crown className="h-4 w-4 text-currency" />} value={progress.bosses} />
          <CharStat
            label="Best score"
            icon={<Star className="h-4 w-4 text-shell-accent" />}
            value={progress.bestScore}
          />
        </InnerPanel>
        <InnerPanel className="mt-1 p-2">
          <p className="text-[13px] opacity-80">Skills</p>
          <p className="mt-1 text-[12px] opacity-70">
            {SKILL_TREE.length} skills unlock as you level up during a run.
          </p>
        </InnerPanel>
      </OuterPanel>
    </div>
  );
}

function CharStat({
  label,
  icon,
  value,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
}) {
  return (
    <div className="min-w-0 text-center">
      <p className="mb-1 text-[11px] text-shell-muted">{label}</p>
      <div className="flex justify-center">
        <Stat icon={icon} value={`${value}`} />
      </div>
    </div>
  );
}
