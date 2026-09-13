/**
 * Every in-game panel, modal and HUD widget lives here so both the live game
 * (ArenaCanvas) and the /test-modals gallery render exactly the same UI.
 */
import React from "react";
import clsx from "clsx";
import { Coins, Settings, Skull, Swords } from "lucide-react";
import { OuterPanel, InnerPanel, Label, PixelButton } from "@/components/ui/pixel-panel";
import { BOW_TIER, getNextBowTier, type BowTier } from "@/features/game/bow";
import { getLevelProgress } from "@/features/game/experience";
import {
  SKILL_BRANCHES,
  SKILL_TREE,
  canLearn,
  getSkillModifiers,
  type SkillDef,
  type SkillId,
  type SkillRanks,
} from "@/features/game/skill-tree";

export const ICONS = {
  bow: "/assets/icons/bow.png",
  star: "/assets/icons/quest.png",
};

export interface HudModel {
  hp: number;
  maxHp: number;
  wave: number;
  /** True while the current wave is the stage's boss wave. */
  boss?: boolean;
  score: number;
  kills: number;
  enemiesLeft: number;
  enemiesTotal?: number;
  intermission: boolean;
  gameOver: boolean;
  stage?: number;
  stageWaves?: number;
  mapId?: string;
  victory?: boolean;
  gold: number;
  goldEarned: number;
  bowTier: BowTier;
  xp: number;
  level: number;
  skillPoints: number;
  ranks: SkillRanks;
}

/** Icon + value readout used across the HUD panels. */
export function Stat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[14px] tabular-nums">{value}</span>
    </div>
  );
}

const GoldIcon = <Coins className="h-4 w-4 text-yellow-300" aria-label="gold" />;
const SkullIcon = <Skull className="h-4 w-4 text-brown-100" aria-label="enemies left" />;
const KillsIcon = <Swords className="h-4 w-4 text-brown-100" aria-label="kills" />;

/**
 * Circular raccoon portrait cropped from the idle sheet.
 * The sheet is 6 columns × 4 direction rows, so one frame needs
 * 600%/400% sizing; row 1 (facing the camera) sits at 33.3% down.
 * Uses a ring rather than a border — the game route clears border colors.
 */
export function RaccoonAvatar({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "shrink-0 overflow-hidden rounded-full bg-brown-300 ring-2 ring-brown-100",
        className,
      )}
    >
      <div
        role="img"
        aria-label="Raccoon avatar"
        className="h-full w-full bg-[url('/assets/phaser/sprites/raccoon/idle_strip6.png')] bg-no-repeat pixelated"
        style={{ backgroundSize: "1800% 1200%", backgroundPosition: "6.18% 36.8%" }}
      />
    </div>
  );
}

/** Circular frog portrait — the hero of ARCOON — used on the home shell. */
export function FrogAvatar({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "shrink-0 overflow-hidden rounded-full bg-leaf-dim ring-2 ring-leaf/70",
        className,
      )}
    >
      <img
        src="/assets/brand/frog.png"
        alt="Frog avatar"
        className="h-full w-full object-cover"
      />
    </div>
  );
}


/**
 * Single top bar spanning the screen: resources + level + skills on the left,
 * wave status in the middle, run stats and settings on the right.
 */
export function TopBar({
  hud,
  onOpenSkills,
  onOpenSettings,
}: {
  hud: HudModel;
  onOpenSkills?: () => void;
  onOpenSettings?: () => void;
}) {
  const progress = getLevelProgress(hud.xp);
  const total = Math.max(hud.enemiesTotal ?? hud.enemiesLeft, hud.enemiesLeft, 1);
  const cleared = Math.max(0, total - hud.enemiesLeft);
  const waveRatio = hud.intermission ? 1 : cleared / total;

  return (
    <div className="pointer-events-auto flex items-start justify-between gap-2">
      {/* Left: avatar, bow, level, skills */}
      <OuterPanel className="flex items-center gap-3 px-2 py-1.5">
        <RaccoonAvatar className="h-9 w-9" />

        <div className="flex items-center gap-1.5 border-l border-brown-100/40 pl-3">
          <img src={ICONS.bow} alt="bow" className="h-4 w-4 object-contain" />
          <span className="text-[13px]">{hud.bowTier}</span>
        </div>

        <div className="border-l border-brown-100/40 pl-3">
          <p className="text-[13px] tabular-nums">Lv {progress.level}</p>
          <div className="mt-0.5 h-1.5 w-16 overflow-hidden rounded-full bg-black/50">
            <div className="h-full bg-neon" style={{ width: `${Math.round(progress.ratio * 100)}%` }} />
          </div>
        </div>

        {onOpenSkills && (
          <PixelButton className="py-0.5" onClick={onOpenSkills}>
            <span className="flex items-center gap-1 text-[12px]">
              <img src={ICONS.star} alt="" className="h-3 w-3" />
              Skills{hud.skillPoints > 0 ? ` (${hud.skillPoints})` : ""}
            </span>
          </PixelButton>
        )}
      </OuterPanel>

      {/* Center: wave status */}
      <OuterPanel className="w-56 shrink-0 px-2 py-1.5 text-center">
        <div className="flex items-center justify-center gap-2">
          <Swords className="h-3.5 w-3.5 text-brown-100" />
          <span className="text-[14px]">
            Wave {hud.wave}/{hud.stageWaves ?? 10}
          </span>
          <Swords className="h-3.5 w-3.5 text-brown-100" />
        </div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full rounded-full bg-[#e03131] transition-[width] duration-300"
            style={{ width: `${Math.round(waveRatio * 100)}%` }}
          />
        </div>
        <p className="mt-1 text-[12px] opacity-80">
          {hud.boss && !hud.intermission
            ? `BOSS FIGHT — ${hud.enemiesLeft} left`
            : hud.intermission
              ? "Next wave in..."
              : `${hud.enemiesLeft} enemies left`}
        </p>
      </OuterPanel>

      {/* Right: run stats + settings */}
      <div className="flex items-start gap-1.5">
        <OuterPanel className="px-2 py-1.5">
          <div className="flex items-center gap-3">
            <Stat icon={SkullIcon} value={`${hud.enemiesLeft}`} />
            <Stat icon={KillsIcon} value={`${hud.kills}`} />
            <Stat icon={GoldIcon} value={`${hud.gold}`} />
            <span className="text-[14px] tabular-nums opacity-80">{hud.score}</span>
          </div>
        </OuterPanel>
        {onOpenSettings && (
          <PixelButton className="h-[38px] w-10" onClick={onOpenSettings}>
            <Settings className="h-4 w-4" />
          </PixelButton>
        )}
      </div>
    </div>
  );
}

/** Thin experience bar flush with the bottom edge, level info floating above it. */
export function XpBar({
  xp,
  className,
}: {
  xp: number;
  className?: string;
}) {
  const p = getLevelProgress(xp);

  return (
    <div className={clsx("pointer-events-auto absolute inset-x-0 bottom-0", className)}>
      {/* Small readout row sitting just above the bar */}
      <div className="flex items-end justify-center px-2 pb-1">
        <span className="text-[13px] text-white text-outline tabular-nums">
          {p.maxed ? "MAX LEVEL" : `${p.into} / ${p.needed} XP`}
        </span>
      </div>

      {/* The bar itself, flush with the screen edge */}
      <div className="relative h-2.5 w-full overflow-hidden bg-black/60">
        <div
          className="h-full bg-neon transition-[width] duration-300"
          style={{ width: `${Math.round(p.ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** Loading screen shown while the arena assets stream in. */
export function LoadingOverlay({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#1b1526] font-body">
      <p className="text-[15px] tracking-widest text-white text-outline">LOADING ARCOON</p>
      <OuterPanel className="w-56 px-2 py-1.5">
        <div className="h-3 overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full rounded-full bg-neon transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </OuterPanel>
    </div>
  );
}

/** Between-waves shop: upgrade the bow with gold or jump into the next wave. */
export function ShopModal({
  hud,
  onAction,
}: {
  hud: HudModel;
  onAction: (action: "upgrade" | "start") => void;
}) {
  const next = getNextBowTier(hud.bowTier);
  const cur = BOW_TIER[hud.bowTier];
  const nextStats = next ? BOW_TIER[next] : null;
  const affordable = nextStats ? hud.gold >= nextStats.goldCost : false;

  return (
    <OuterPanel className="w-full max-w-sm">
      <div className="flex justify-center">
        <Label className="-mt-4 mb-1 text-[11px]">Wave {hud.wave + 1} incoming</Label>
      </div>

      <InnerPanel className="p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src={ICONS.bow} alt="bow" className="h-6 w-6 object-contain" />
            <div>
              <p className="text-[14px]">{hud.bowTier} Bow</p>
              <p className="text-[12px] opacity-80 tabular-nums">
                {cur.damage} dmg · {cur.rangeTiles} tiles · {(1000 / cur.fireRateMs).toFixed(1)}/s
              </p>
            </div>
          </div>
          <Stat icon={GoldIcon} value={`${hud.gold}`} />
        </div>
      </InnerPanel>

      {nextStats && next ? (
        <>
          <InnerPanel className="mt-1 p-2">
            <p className="text-[14px]">{next} Bow</p>
            <p className="text-[12px] opacity-80 tabular-nums">
              +{nextStats.damage - cur.damage} dmg · +{nextStats.rangeTiles - cur.rangeTiles} tiles ·{" "}
              {(1000 / nextStats.fireRateMs).toFixed(1)}/s
            </p>
            {!affordable && (
              <p className="mt-1 text-[12px] text-brown-100">Not enough gold — keep farming waves.</p>
            )}
          </InnerPanel>

          <div className="mt-1 flex gap-1">
            <PixelButton className="flex-1" disabled={!affordable} onClick={() => onAction("upgrade")}>
              <span className="flex items-center gap-1 text-[13px]">
                <Coins className="h-3.5 w-3.5 text-yellow-300" />
                {nextStats.goldCost}
              </span>
            </PixelButton>
            <PixelButton className="flex-1" onClick={() => onAction("start")}>
              <span className="text-[13px]">Fight</span>
            </PixelButton>
          </div>
        </>
      ) : (
        <PixelButton className="mt-1 w-full" onClick={() => onAction("start")}>
          <span className="text-[13px]">Start next wave</span>
        </PixelButton>
      )}
    </OuterPanel>
  );
}

/** End-of-run summary. */
export function GameOverModal({
  hud,
  onRestart,
  onHome,
}: {
  hud: HudModel;
  onRestart: () => void;
  onHome?: () => void;
}) {
  return (
    <OuterPanel className="w-full max-w-sm text-center">
      <div className="flex justify-center">
        <Label className="-mt-4 mb-1 text-[11px]">Game Over</Label>
      </div>
      <InnerPanel className="space-y-1 p-3">
        <p className="text-[14px] tabular-nums">
          Reached wave {hud.wave} · level {hud.level}
        </p>
        <div className="flex justify-center gap-3 pt-1">
          <Stat icon={KillsIcon} value={`${hud.kills}`} />
          <Stat icon={GoldIcon} value={`${hud.goldEarned}`} />
        </div>
        <p className="pt-1 text-[14px] tabular-nums">{hud.score} points</p>
      </InnerPanel>
      <div className="mt-1 flex gap-1">
        <PixelButton className="flex-1" onClick={onRestart}>
          <span className="text-[13px]">Retry</span>
        </PixelButton>
        {onHome && (
          <PixelButton className="flex-1" onClick={onHome}>
            <span className="text-[13px]">World map</span>
          </PixelButton>
        )}
      </div>
    </OuterPanel>
  );
}

/** Stage-clear summary with links back to the map screen or the next stage. */
export function VictoryModal({
  hud,
  onNextStage,
  onHome,
}: {
  hud: HudModel;
  onNextStage: (() => void) | null;
  onHome: () => void;
}) {
  return (
    <OuterPanel className="w-full max-w-sm text-center">
      <div className="flex justify-center">
        <Label className="-mt-4 mb-1 text-[11px]">Stage Clear</Label>
      </div>
      <InnerPanel className="space-y-1 p-3">
        <p className="text-[14px] tabular-nums">
          Stage {hud.stage ?? 1} · {hud.stageWaves ?? hud.wave} waves survived
        </p>
        <div className="flex justify-center gap-3 pt-1">
          <Stat icon={KillsIcon} value={`${hud.kills}`} />
          <Stat icon={GoldIcon} value={`${hud.goldEarned}`} />
        </div>
        <p className="pt-1 text-[14px] tabular-nums">{hud.score} points</p>
      </InnerPanel>
      <div className="mt-1 flex gap-1">
        {onNextStage && (
          <PixelButton className="flex-1" onClick={onNextStage}>
            <span className="text-[13px]">Next stage</span>
          </PixelButton>
        )}
        <PixelButton className="flex-1" onClick={onHome}>
          <span className="text-[13px]">World map</span>
        </PixelButton>
      </div>
    </OuterPanel>
  );
}

/** Floating banner shown for a moment after each level-up. */
export function LevelUpToast({ level }: { level: number }) {
  return (
    <OuterPanel className="px-3 py-2 text-center">
      <p className="text-[14px] text-white">Level {level}!</p>
      <p className="text-[12px] opacity-80">+1 skill point</p>
    </OuterPanel>
  );
}

function SkillNode({
  skill,
  ranks,
  points,
  onLearn,
}: {
  skill: SkillDef;
  ranks: SkillRanks;
  points: number;
  onLearn: (id: SkillId) => void;
}) {
  const rank = ranks[skill.id] ?? 0;
  const locked = !!skill.requires && (ranks[skill.requires] ?? 0) < 1;
  const learnable = canLearn(skill, ranks, points);

  return (
    <InnerPanel className={clsx("p-1.5", locked && "opacity-60")}>
      <div className="flex items-center gap-2">
        <img
          src={skill.icon}
          alt=""
          className={clsx("h-5 w-5 shrink-0 object-contain", locked && "grayscale")}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px]">{skill.name}</p>
          <p className="truncate text-[12px] opacity-80">{skill.effect}</p>
        </div>
        <span className="shrink-0 text-[12px] tabular-nums">
          {rank}/{skill.maxRank}
        </span>
        <button
          type="button"
          disabled={!learnable}
          onClick={() => onLearn(skill.id)}
          className="shrink-0 rounded-full bg-brown-200 px-2 py-0.5 text-[13px] text-white text-shadow disabled:opacity-40"
        >
          +
        </button>
      </div>
    </InnerPanel>
  );
}

/** Skill tree: spend level-up points across the three branches. */
export function SkillTreeModal({
  ranks,
  points,
  onLearn,
  onClose,
}: {
  ranks: SkillRanks;
  points: number;
  onLearn: (id: SkillId) => void;
  onClose: () => void;
}) {
  const mods = getSkillModifiers(ranks);

  return (
    <OuterPanel className="w-full max-w-md">
      <div className="flex justify-center">
        <Label className="-mt-4 mb-1 text-[11px]">Skill tree · {points} points</Label>
      </div>

      <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-0.5">
        {SKILL_BRANCHES.map((branch) => (
          <div key={branch}>
            <p className="mb-1 text-[13px] opacity-80">{branch}</p>
            <div className="space-y-1">
              {SKILL_TREE.filter((s) => s.branch === branch).map((skill) => (
                <SkillNode
                  key={skill.id}
                  skill={skill}
                  ranks={ranks}
                  points={points}
                  onLearn={onLearn}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <InnerPanel className="mt-1 p-2">
        <p className="text-[12px] tabular-nums">
          DMG x{mods.damageMult.toFixed(2)} · RATE x{mods.fireRateMult.toFixed(2)} · SPD x
          {mods.speedMult.toFixed(2)} · GOLD x{mods.goldMult.toFixed(2)} · XP x
          {mods.xpMult.toFixed(2)}
        </p>
      </InnerPanel>

      <PixelButton className="mt-1 w-full" onClick={onClose}>
        <span className="text-[13px]">Close</span>
      </PixelButton>
    </OuterPanel>
  );
}
