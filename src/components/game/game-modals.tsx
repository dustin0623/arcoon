/**
 * Every in-game panel, modal and HUD widget lives here so both the live game
 * (ArenaCanvas) and the /test-modals gallery render exactly the same UI.
 */
import React from "react";
import clsx from "clsx";
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
  heart: "/assets/icons/heart.png",
  coin: "/assets/icons/token.png",
  bow: "/assets/icons/bow.png",
  skull: "/assets/icons/goblin_head.png",
  sword: "/assets/icons/sword.png",
  star: "/assets/icons/quest.png",
};

export interface HudModel {
  hp: number;
  maxHp: number;
  wave: number;
  score: number;
  kills: number;
  enemiesLeft: number;
  intermission: boolean;
  gameOver: boolean;
  gold: number;
  goldEarned: number;
  bowTier: BowTier;
  xp: number;
  level: number;
  skillPoints: number;
  ranks: SkillRanks;
}

/** Icon + value readout used across the HUD panels. */
export function Stat({ icon, alt, value }: { icon: string; alt: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <img src={icon} alt={alt} className="h-4 w-4 object-contain" />
      <span className="text-[10px] tabular-nums">{value}</span>
    </div>
  );
}

/** Top-left panel: hearts, gold and the equipped bow. */
export function VitalsPanel({ hud }: { hud: HudModel }) {
  return (
    <OuterPanel className="px-2 py-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: Math.max(0, hud.maxHp) }).map((_, i) => (
          <img
            key={i}
            src={ICONS.heart}
            alt=""
            className={clsx("h-4 w-4 object-contain", i < hud.hp ? "" : "opacity-25 grayscale")}
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <Stat icon={ICONS.coin} alt="gold" value={`${hud.gold}`} />
        <div className="flex items-center gap-1.5">
          <img src={ICONS.bow} alt="bow" className="h-4 w-4 object-contain" />
          <span className="text-[10px]">{hud.bowTier}</span>
        </div>
      </div>
    </OuterPanel>
  );
}

/** Top-right panel: wave number, enemies left, kills and score. */
export function WavePanel({ hud }: { hud: HudModel }) {
  return (
    <OuterPanel className="px-2 py-1.5">
      <div className="flex justify-end">
        <Label className="-mt-3.5 text-[9px]">Wave {hud.wave}</Label>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <Stat icon={ICONS.skull} alt="enemies left" value={`${hud.enemiesLeft}`} />
        <Stat icon={ICONS.sword} alt="kills" value={`${hud.kills}`} />
        <span className="text-[11px] tabular-nums">{hud.score}</span>
      </div>
    </OuterPanel>
  );
}

/** Full-width experience bar pinned to the bottom of the screen. */
export function XpBar({
  xp,
  skillPoints,
  onOpenSkills,
}: {
  xp: number;
  skillPoints: number;
  onOpenSkills?: () => void;
}) {
  const p = getLevelProgress(xp);

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 px-2 pb-2">
      <OuterPanel className="flex items-center gap-2 px-2 py-1">
        <Label className="shrink-0 text-[9px]">Lv {p.level}</Label>

        <div className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full rounded-full bg-neon transition-[width] duration-300"
            style={{ width: `${Math.round(p.ratio * 100)}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white text-outline tabular-nums">
            {p.maxed ? "MAX LEVEL" : `${p.into} / ${p.needed} XP`}
          </span>
        </div>

        {onOpenSkills && (
          <PixelButton className="shrink-0" onClick={onOpenSkills}>
            <span className="flex items-center gap-1 text-[8px] whitespace-nowrap">
              <img src={ICONS.star} alt="" className="h-3 w-3" />
              Skills{skillPoints > 0 ? ` (${skillPoints})` : ""}
            </span>
          </PixelButton>
        )}
      </OuterPanel>
    </div>
  );
}

/** Loading screen shown while the arena assets stream in. */
export function LoadingOverlay({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#1b1526] font-pixel">
      <p className="text-[11px] tracking-widest text-white text-outline">LOADING ARCOON</p>
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
        <Label className="-mt-4 mb-1 text-[10px]">Wave {hud.wave + 1} incoming</Label>
      </div>

      <InnerPanel className="p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src={ICONS.bow} alt="bow" className="h-6 w-6 object-contain" />
            <div>
              <p className="text-[10px]">{hud.bowTier} Bow</p>
              <p className="text-[8px] opacity-80 tabular-nums">
                {cur.damage} dmg · {cur.rangeTiles} tiles · {(1000 / cur.fireRateMs).toFixed(1)}/s
              </p>
            </div>
          </div>
          <Stat icon={ICONS.coin} alt="gold" value={`${hud.gold}`} />
        </div>
      </InnerPanel>

      {nextStats && next ? (
        <>
          <InnerPanel className="mt-1 p-2">
            <p className="text-[10px]">{next} Bow</p>
            <p className="text-[8px] opacity-80 tabular-nums">
              +{nextStats.damage - cur.damage} dmg · +{nextStats.rangeTiles - cur.rangeTiles} tiles ·{" "}
              {(1000 / nextStats.fireRateMs).toFixed(1)}/s
            </p>
            {!affordable && (
              <p className="mt-1 text-[8px] text-brown-100">Not enough gold — keep farming waves.</p>
            )}
          </InnerPanel>

          <div className="mt-1 flex gap-1">
            <PixelButton className="flex-1" disabled={!affordable} onClick={() => onAction("upgrade")}>
              <span className="flex items-center gap-1 text-[9px]">
                <img src={ICONS.coin} alt="" className="h-3.5 w-3.5" />
                {nextStats.goldCost}
              </span>
            </PixelButton>
            <PixelButton className="flex-1" onClick={() => onAction("start")}>
              <span className="text-[9px]">Fight</span>
            </PixelButton>
          </div>
        </>
      ) : (
        <PixelButton className="mt-1 w-full" onClick={() => onAction("start")}>
          <span className="text-[9px]">Start next wave</span>
        </PixelButton>
      )}
    </OuterPanel>
  );
}

/** End-of-run summary. */
export function GameOverModal({ hud, onRestart }: { hud: HudModel; onRestart: () => void }) {
  return (
    <OuterPanel className="w-full max-w-sm text-center">
      <div className="flex justify-center">
        <Label className="-mt-4 mb-1 text-[10px]">Game Over</Label>
      </div>
      <InnerPanel className="space-y-1 p-3">
        <p className="text-[10px] tabular-nums">
          Reached wave {hud.wave} · level {hud.level}
        </p>
        <div className="flex justify-center gap-3 pt-1">
          <Stat icon={ICONS.sword} alt="kills" value={`${hud.kills}`} />
          <Stat icon={ICONS.coin} alt="gold earned" value={`${hud.goldEarned}`} />
        </div>
        <p className="pt-1 text-[10px] tabular-nums">{hud.score} points</p>
      </InnerPanel>
      <PixelButton className="mt-1 w-full" onClick={onRestart}>
        <span className="text-[9px]">Play again</span>
      </PixelButton>
    </OuterPanel>
  );
}

/** Floating banner shown for a moment after each level-up. */
export function LevelUpToast({ level }: { level: number }) {
  return (
    <OuterPanel className="px-3 py-2 text-center">
      <p className="text-[10px] text-white">Level {level}!</p>
      <p className="text-[8px] opacity-80">+1 skill point</p>
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
          <p className="truncate text-[9px]">{skill.name}</p>
          <p className="truncate text-[8px] opacity-80">{skill.effect}</p>
        </div>
        <span className="shrink-0 text-[8px] tabular-nums">
          {rank}/{skill.maxRank}
        </span>
        <button
          type="button"
          disabled={!learnable}
          onClick={() => onLearn(skill.id)}
          className="shrink-0 rounded-full bg-brown-200 px-2 py-0.5 text-[9px] text-white text-shadow disabled:opacity-40"
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
        <Label className="-mt-4 mb-1 text-[10px]">Skill tree · {points} points</Label>
      </div>

      <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-0.5">
        {SKILL_BRANCHES.map((branch) => (
          <div key={branch}>
            <p className="mb-1 text-[9px] opacity-80">{branch}</p>
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
        <p className="text-[8px] tabular-nums">
          DMG x{mods.damageMult.toFixed(2)} · RATE x{mods.fireRateMult.toFixed(2)} · SPD x
          {mods.speedMult.toFixed(2)} · GOLD x{mods.goldMult.toFixed(2)} · XP x
          {mods.xpMult.toFixed(2)}
        </p>
      </InnerPanel>

      <PixelButton className="mt-1 w-full" onClick={onClose}>
        <span className="text-[9px]">Close</span>
      </PixelButton>
    </OuterPanel>
  );
}
