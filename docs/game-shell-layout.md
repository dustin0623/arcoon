# ARCOON Game Shell Layout

Adapted from the Idle Raiders copy at `ref/idleraiders-copy`. This document
describes their shell, what we copy, and how ARCOON's four tabs work.

## 1. Reference analysis — Idle Raiders shell

The reference (`ref/idleraiders-copy/app/game/layout.tsx`) wraps every game
screen in one persistent shell:

```text
┌─────────────────────────────────────────────┐
│ GameHeader (sticky top)                     │
│   left:  Menu popover                       │
│   right: Energy bar + Wallet popover        │
├─────────────────────────────────────────────┤
│ ActiveMissionBar (current mission progress) │
├─────────────────────────────────────────────┤
│                                             │
│ <main> page content, max-w-3xl, px-4        │
│                                             │
├─────────────────────────────────────────────┤
│ BottomNavigation (sticky bottom)            │
│   Packs | World | Inventory | Explore       │
└─────────────────────────────────────────────┘
```

Key patterns from `components/BottomNavigation.tsx` and
`components/GameHeader.tsx`:

- **Sticky chrome**: header pinned top, tab bar pinned bottom, both with
  `bg-background/95 backdrop-blur` so content scrolls beneath.
- **Tab bar**: one flex row, each tab is icon + 10px label, the active tab
  gets a colored icon and a small pill indicator above it (theirs animates
  with framer-motion `layoutId`; ours is plain CSS).
- **Route-per-tab**: they use Next.js routes (`/game/world`, `/game/packs`,
  ...). We deliberately do **not** copy this — see below.

## 2. What we change for ARCOON

Our game is a live Phaser canvas. Unmounting it on tab switch would destroy
the run, so tabs are **state-driven overlays on one route** (`/game`), not
separate routes. The canvas keeps running underneath.

```text
┌─────────────────────────────────────────────┐
│ TopBar HUD (existing): avatar/bow/level |   │
│ wave progress | kills/gold/score            │
├─────────────────────────────────────────────┤
│                                             │
│ Phaser arena (World)                        │
│   · Inventory / Packs / Character open as   │
│     dimmed pixel-panel overlays on top      │
│                                             │
├─────────────────────────────────────────────┤
│ XP bar (thin strip, sits above the tab bar) │
├─────────────────────────────────────────────┤
│ Bottom tab bar: World | Inventory | Packs | │
│ Character                                   │
└─────────────────────────────────────────────┘
```

Mapping to the reference:

| Idle Raiders        | ARCOON equivalent                        |
| ------------------- | ---------------------------------------- |
| GameHeader          | Existing in-game `TopBar` HUD            |
| ActiveMissionBar    | Wave progress block in `TopBar` (center) |
| Page content        | Phaser canvas (World tab)                |
| BottomNavigation    | New `BottomNav` (4 tabs, pixel style)    |
| PageLoader per tab  | Existing `LoadingOverlay`                |

## 3. The four tabs

State lives in `ArenaCanvas` (`activeTab`), default `world`.

### World (Globe icon)
The live arena. No overlay. Touch joystick only appears on this tab.

### Inventory (Backpack icon)
Overlay panel listing what the player currently holds:

- Current bow: tier icon, damage, range, fire rate (from `BOW_TIER`).
- Next bow tier + cost (mirrors the shop data).
- Gold on hand.

### Packs (Package icon)
Placeholder pack shop — three pixel-framed pack cards (Hunter, Ranger,
Royal) marked "Coming soon". Structure is ready for real pack contents in a
later phase.

### Character (User icon)
Overlay panel with the persistent player sheet:

- Avatar + level + XP progress.
- Run stats: wave, kills, score, gold earned.
- Learned skill ranks with icons.
- "Open skill tree" button (opens the existing `SkillTreeModal`).

## 4. Files

| File                                        | Change                                   |
| ------------------------------------------- | ---------------------------------------- |
| `src/components/game/shell-panels.tsx`      | New: `BottomNav`, `InventoryPanel`, `PacksPanel`, `CharacterPanel`, `GameTab` type |
| `src/components/game/game-modals.tsx`       | `XpBar` accepts a `className` so it can sit above the tab bar |
| `src/phaser/ArenaCanvas.tsx`                | Tab state, bottom nav, overlay wiring, joystick hidden off-world |
| `src/routes/test-modals.tsx`                | Gallery entries for the new shell widgets |

## 5. Behavior rules

- Tab overlays never pause the game; enemies keep moving behind the dim
  (same as the reference, where timers keep running).
- The XP bar stays a thin full-width strip; it now rests directly on top of
  the tab bar instead of the screen edge.
- The touch joystick and intermission shop only show on the World tab so
  overlays never fight for the same screen space.
- Game Over takes priority over every tab overlay.

## 6. Later phases

- Real pack contents + gold purchases in Packs.
- Persist inventory/character between runs (needs Lovable Cloud).
- Settings gear in `TopBar` opens a settings modal (menu popover equivalent).
