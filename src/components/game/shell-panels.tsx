/**
 * Shell layout for the ARCOON game screen, adapted from the Idle Raiders
 * reference (ref/idleraiders-copy): a sticky bottom tab bar with four tabs —
 * World, Inventory, Packs, Character. Tabs are state-driven overlays on the
 * single /game route so the Phaser run is never unmounted.
 * See docs/game-shell-layout.md.
 */
import React from "react";
import clsx from "clsx";
import { Backpack, Coins, Globe, Package, Skull, Swords, User } from "lucide-react";
import { InnerPanel, Label, OuterPanel, PixelButton } from "@/components/ui/pixel-panel";
import { BOW_TIER, getNextBowTier } from "@/features/game/bow";
import { getLevelProgress } from "@/features/game/experience";
import { SKILL_TREE, getSkillModifiers } from "@/features/game/skill-tree";
import { ICONS, RaccoonAvatar, Stat, type HudModel } from "@/components/game/game-modals";

export type GameTab = "world" | "inventory" | "packs" | "character";

const TABS: { id: GameTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "world", label: "World", icon: Globe },
  { id: "inventory", label: "Inventory", icon: Backpack },
  { id: "packs", label: "Packs", icon: Package },
  { id: "character", label: "Character", icon: User },
];

/** Bottom tab bar pinned to the screen edge, pixel-framed like the HUD. */
export function BottomNav({
  active,
  onChange,
}: {
  active: GameTab;
  onChange: (tab: GameTab) => void;
}) {
  return (
    <nav
      aria-label="Game tabs"
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 bg-ink-800/95 shadow-card backdrop-blur"
    >
      {/* Gold hairline along the top edge, as in the reference shell. */}
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
                <span
                  className="bg-gradient-gold absolute top-0 h-1 w-8 rounded-full"
                  aria-hidden
                />
              )}
              <Icon
                className={clsx(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-fgold" : "text-brown-100/50",
                )}
              />
              <span
                className={clsx(
                  "text-[8px]",
                  isActive ? "text-fgold text-glow-gold" : "text-brown-100/50",
                )}
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


/** Shared overlay wrapper: dims the arena and centers a pixel panel. */
function TabOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/60 px-4 pb-20">
      <OuterPanel className="w-full max-w-md">
        <div className="flex justify-center">
          <Label className="-mt-4 mb-1 text-[10px]">{title}</Label>
        </div>
        <div className="max-h-[55vh] space-y-1 overflow-y-auto pr-0.5">{children}</div>
        <PixelButton className="mt-1 w-full" onClick={onClose}>
          <span className="text-[9px]">Close</span>
        </PixelButton>
      </OuterPanel>
    </div>
  );
}

/** Inventory tab: current bow, next upgrade, gold on hand. */
export function InventoryPanel({ hud, onClose }: { hud: HudModel; onClose: () => void }) {
  const cur = BOW_TIER[hud.bowTier];
  const next = getNextBowTier(hud.bowTier);
  const nextStats = next ? BOW_TIER[next] : null;

  return (
    <TabOverlay title="Inventory" onClose={onClose}>
      <InnerPanel className="p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src={ICONS.bow} alt="bow" className="h-6 w-6 object-contain" />
            <div>
              <p className="text-[10px]">{hud.bowTier} Bow</p>
              <p className="text-[8px] tabular-nums opacity-80">
                {cur.damage} dmg · {cur.rangeTiles} tiles · {(1000 / cur.fireRateMs).toFixed(1)}/s
              </p>
            </div>
          </div>
          <Stat icon={<Coins className="h-4 w-4 text-yellow-300" />} value={`${hud.gold}`} />
        </div>
      </InnerPanel>

      {next && nextStats && (
        <InnerPanel className="p-2">
          <p className="text-[9px] opacity-80">Next upgrade</p>
          <p className="text-[10px]">{next} Bow</p>
          <p className="text-[8px] tabular-nums opacity-80">
            {nextStats.damage} dmg · {nextStats.rangeTiles} tiles ·{" "}
            {(1000 / nextStats.fireRateMs).toFixed(1)}/s · {nextStats.goldCost}g
          </p>
        </InnerPanel>
      )}

      <InnerPanel className="p-2">
        <p className="text-[8px] opacity-80">
          More gear slots arrive with the pack system — bows are just the start.
        </p>
      </InnerPanel>
    </TabOverlay>
  );
}

const PACKS = [
  { name: "Hunter Pack", desc: "Starter gear and a pouch of gold.", cost: "—" },
  { name: "Ranger Pack", desc: "Rare bows and skill tomes.", cost: "—" },
  { name: "Royal Pack", desc: "Legendary loot for deep runs.", cost: "—" },
];

/** Packs tab: placeholder pack shop, ready for real contents later. */
export function PacksPanel({ onClose }: { onClose: () => void }) {
  return (
    <TabOverlay title="Packs" onClose={onClose}>
      {PACKS.map((pack) => (
        <InnerPanel key={pack.name} className="p-2">
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
        </InnerPanel>
      ))}
    </TabOverlay>
  );
}

/** Character tab: avatar, level, run stats and learned skills. */
export function CharacterPanel({
  hud,
  onOpenSkills,
  onClose,
}: {
  hud: HudModel;
  onOpenSkills: () => void;
  onClose: () => void;
}) {
  const progress = getLevelProgress(hud.xp);
  const mods = getSkillModifiers(hud.ranks);
  const learned = SKILL_TREE.filter((s) => (hud.ranks[s.id] ?? 0) > 0);

  return (
    <TabOverlay title="Character" onClose={onClose}>
      <InnerPanel className="p-2">
        <div className="flex items-center gap-2">
          <RaccoonAvatar className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px]">Raccoon · Lv {progress.level}</p>
            <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-black/50">
              <div
                className="h-full bg-neon"
                style={{ width: `${Math.round(progress.ratio * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </InnerPanel>

      <InnerPanel className="p-2">
        <div className="flex items-center justify-between">
          <Stat icon={<Swords className="h-4 w-4 text-brown-100" />} value={`Wave ${hud.wave}`} />
          <Stat icon={<Skull className="h-4 w-4 text-brown-100" />} value={`${hud.kills}`} />
          <Stat icon={<Coins className="h-4 w-4 text-yellow-300" />} value={`${hud.goldEarned}`} />
          <span className="text-[10px] tabular-nums opacity-80">{hud.score} pts</span>
        </div>
      </InnerPanel>

      <InnerPanel className="p-2">
        <p className="text-[9px] opacity-80">Skills</p>
        {learned.length === 0 ? (
          <p className="mt-1 text-[8px] opacity-60">No skills learned yet — level up to earn points.</p>
        ) : (
          <div className="mt-1 space-y-1">
            {learned.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <img src={s.icon} alt="" className="h-4 w-4 object-contain" />
                <span className="flex-1 truncate text-[9px]">{s.name}</span>
                <span className="text-[8px] tabular-nums">
                  {hud.ranks[s.id]}/{s.maxRank}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-1 text-[8px] tabular-nums opacity-80">
          DMG x{mods.damageMult.toFixed(2)} · RATE x{mods.fireRateMult.toFixed(2)} · SPD x
          {mods.speedMult.toFixed(2)} · GOLD x{mods.goldMult.toFixed(2)} · XP x
          {mods.xpMult.toFixed(2)}
        </p>
        <PixelButton className="mt-1 w-full" onClick={onOpenSkills}>
          <span className="text-[9px]">
            Open skill tree{hud.skillPoints > 0 ? ` (${hud.skillPoints})` : ""}
          </span>
        </PixelButton>
      </InnerPanel>
    </TabOverlay>
  );
}
