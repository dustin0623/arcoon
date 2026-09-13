# Game Improvement Proposals

## Current State Summary

The arena game is a pixel-art wave-survival prototype built with Phaser inside a TanStack Start app.

- **Combat:** Auto-attack bow combat. The closest enemy inside a 96 px (6-tile) range is targeted automatically every 650 ms. Damage is 4 per shot.
- **Enemies:** Three types — `grunt` (slow, 6 HP), `runner` (fast, 4 HP), and `brute` (tanky, 16 HP). They beeline toward the player and deal melee damage.
- **Progression:** Linear wave scaling. Each wave spawns more enemies and a small clear bonus. There is no economy, no upgrades, and no persistent progression.
- **Player:** 12 HP, brief iframes, one death ends the run.
- **Existing unused asset:** `src/features/game/bow.ts` already defines six bow tiers (`Wood` → `Ignisite`) with damage, range, fire rate, and gold cost. None of this is used in-game yet.

The following three proposals are designed to be implemented independently or in sequence. They build on the current systems without requiring an art overhaul.

---

## Proposal 1: Bow Upgrade & Gold Economy Loop

### Goal
Turn the existing bow tier table into a meaningful progression system by adding gold drops, a between-waves shop, and purchasable bow upgrades.

### Why This Improves the Game
- Gives the player something to do between waves besides waiting.
- Rewards skilled play (kiting, not getting hit) with tangible power growth.
- Uses the already-modeled `BOW_TIER` data that is currently dead code.
- Creates short-term goals inside a run: "survive long enough to afford Iron."

### Detailed Mechanics

1. **Gold Drops**
   - Enemies drop 1–3 gold coins on death.
   - Brutes drop 4–6 gold. Runners have a small chance to drop a 10-gold "bag."
   - Coins are physics bodies that magnetize toward the player within ~48 px and are auto-collected on overlap.
   - Gold persists for the current run only.

2. **Between-Waves Shop**
   - During the 3-second intermission, a shop overlay appears (React UI over the canvas).
   - The shop shows:
     - Current bow tier.
     - Next bow tier with stat deltas: damage, range, fire rate.
     - Cost and current gold.
   - One button: "Upgrade Bow" (disabled if insufficient gold).
   - The player can also choose to skip and save gold.

3. **Bow Tier Progression**
   - Start every run with `Wood`.
   - Upgrade path: Wood → Iron → Silver → Emerald → Diamond → Ignisite.
   - Cost uses the `goldCost` values already defined in `BOW_TIER`.
   - Stats replace the current flat values in `ArenaScene.handleShooting`.

4. **UI Additions**
   - HUD shows gold count.
   - Intermission screen shows shop.
   - Optional: floating "+2g" text on pickup.

### Implementation Scope

| Area | Work |
|------|------|
| Data | Use `getBowStats` with a dynamic tier stored on `Player` or `ArenaScene`. |
| Economy | Add `gold` to `ArenaScene`, gold drop logic in `resolveArrowHits`, coin entity/overlay. |
| Shop UI | New React component rendered inside `ArenaCanvas.tsx` or `src/routes/game.tsx` when `intermission` is true. |
| Save/Load | Store current tier and gold in the existing HUD event or a new game-state event. |
| Balance | Tune drop rates so a full clear of wave 3–4 roughly funds the first upgrade. |

### Files to Touch
- `src/phaser/scenes/ArenaScene.ts` — gold tracking, coin spawning, upgrade application.
- `src/phaser/systems/EnemySystem.ts` — hook death event to drop gold.
- `src/phaser/entities/Player.ts` — add `bowTier` and `gold` fields.
- `src/features/game/bow.ts` — already defined; may need balance tweaks.
- `src/phaser/ArenaCanvas.tsx` / `src/routes/game.tsx` — shop overlay and HUD gold display.

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Shop UI slows the pace | Keep it to one button; intermission already pauses spawns. |
| Gold inflation makes runs trivial | Cap max tier per run or increase costs exponentially. |
| Mobile shop is hard to tap | Use a large bottom-sheet-style panel, not small buttons. |

### Success Metrics
- Average run length increases because players have a reason to push for the next upgrade.
- Players report a sense of power growth across a run.
- First upgrade is reachable by wave 3–4 for an average player.

---

## Proposal 2: Combat Depth — Abilities, Enemy Roles & Environmental Hazards

### Goal
Make the auto-attack loop more expressive by adding active abilities, distinct enemy behaviors, and map hazards that force movement decisions.

### Why This Improves the Game
- Auto-attack is comfortable for kiting but can feel passive. Active abilities give the player moments of agency.
- Current enemies differ only in speed/HP/tint. Behavioral differences make each wave composition feel unique.
- Hazards turn the static tilemap into a tactical space.

### Detailed Mechanics

1. **Active Abilities**
   - **Dash (Space / on-screen button):** A short, invincible burst in the current movement direction. 2.5-second cooldown. Resets on wave clear.
   - **Power Shot (Right-click / secondary button):** Next shot pierces through up to 3 enemies and deals 150% damage. 6-second cooldown.
   - **Volley (passive unlock via shop or wave milestone):** Every 5th shot fires 3 arrows in a narrow spread.
   - Abilities have short, visible cooldown indicators on the HUD.

2. **Enemy Roles**
   - **Grunt:** Basic swarm enemy (current behavior).
   - **Runner:** Fast, low HP, but now pauses briefly before charging in a straight line, giving the player a telegraph to dodge.
   - **Brute:** Slow, high HP, and now has a small AOE slam on attack with a 0.6-second wind-up.
   - **New: Shaman (wave 5+):** Stays at range, casts a slow-moving magic projectile. Low HP, high priority target.
   - **New: Swarmer (wave 4+):** Tiny enemy that spawns in groups of 3 and dies in one hit but moves erratically.

3. **Environmental Hazards**
   - **Spike patches:** Deal damage if the player stands on them; enemies path around them.
   - **Healing shrines:** Spawn once per intermission; restore 3 HP when touched.
   - **Crates/barrels:** Breakable objects that can block arrows and enemies temporarily.

4. **Status Effects**
   - **Burn:** Ignisite bow has a 25% chance to apply a 2-second burn for 2 damage ticks.
   - **Slow:** Silver bow shots reduce enemy speed by 30% for 1 second.
   - Effects are shown as small tint flashes or particle icons above enemies.

### Implementation Scope

| Area | Work |
|------|------|
| Abilities | Add cooldown fields to `Player`, input handling in `InputSystem`, effect logic in `ArenaScene`. |
| Enemy roles | Extend `EnemyConfig` with `behavior` enum; add state machine logic in `EnemySystem.update`. |
| Hazards | Read hazard tiles from the tilemap, spawn damage zones, add healing shrine entities. |
| Status effects | Add `statuses` array to `Enemy`, apply in `ProjectileSystem`/`ArenaScene`, render via tint/graphics. |
| UI | Cooldown icons, ability buttons for touch. |

### Files to Touch
- `src/phaser/entities/Player.ts` — cooldowns, ability state.
- `src/phaser/systems/InputSystem.ts` — dash and power-shot inputs.
- `src/phaser/systems/EnemySystem.ts` — role-based AI.
- `src/phaser/entities/Enemy.ts` — status effects, role-specific fields.
- `src/phaser/config/GameConfig.ts` — new enemy types and hazard config.
- `src/phaser/scenes/ArenaScene.ts` — ability resolution, hazard damage, shrine spawning.

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Abilities overshadow the bow | Keep cooldowns long and effects situational. |
| New enemy roles break balance | Add one role at a time and test wave compositions. |
| Hazards feel unfair | Telegraph spikes with a 1-second warning animation. |
| Scope creep | Ship Dash + Power Shot first; Volley and Shaman in a follow-up. |

### Success Metrics
- Players use abilities intentionally rather than spamming.
- Wave composition changes how the player moves (e.g., kiting brutes while prioritizing shamans).
- Deaths feel like player mistakes, not unavoidable damage.

---

## Proposal 3: Roguelike Run Structure & Meta-Progression

### Goal
Replace the infinite wave loop with a structured roguelike run: preparation → escalating waves → mini-boss → final boss, plus permanent unlocks that carry across runs.

### Why This Improves the Game
- Gives every run a clear climax and ending instead of an eventual inevitable death.
- Meta-progression rewards repeated play even when individual runs fail.
- Allows for higher-difficulty content that would be unfair in an endless mode.

### Detailed Mechanics

1. **Run Structure**
   - Each run has 10 waves.
   - Waves 1–3: normal enemies.
   - Wave 4: elite wave (more runners + one brute).
   - Waves 5–7: harder mix, more hazards.
   - Wave 8: mini-boss fight (a larger, named enemy with a unique attack pattern).
   - Waves 9–10: final gauntlet + final boss.
   - Clearing wave 10 is a "win." Dying at any point is a "loss."

2. **Preparation Phase**
   - Before the run starts, the player chooses one starting boon from three options:
     - **Swift Boots:** +15% movement speed.
     - **Heavy Quiver:** +1 arrow pierce.
     - **Lucky Charm:** +20% gold find.
   - Boons are unlocked by meta-progression and are offered randomly.

3. **Between-Wave Rewards**
   - After every wave, offer a choice of one random upgrade:
     - +10% arrow damage.
     - +0.5 tiles range.
     - -5% fire-rate cooldown.
     - +1 max HP.
     - Gain a random ability charge.
   - These stack for the current run only.

4. **Meta-Progression (Persistent)**
   - Track total gold earned, kills, wins, and highest wave reached across all runs.
   - Unlock permanent bonuses:
     - 100 total kills → start with +1 max HP.
     - 5 wins → unlock the Silver bow as a starting option.
     - 10,000 gold earned → +5% starting gold.
   - Persist in `localStorage` for now; move to a backend (Lovable Cloud) if multiplayer/leaderboards are desired later.

5. **Boss Design**
   - **Mini-boss (wave 8):** "Bog Troll" — slow, high HP, throws rocks in an arc that leave hazard puddles.
   - **Final boss (wave 10):** "Shadow Knight" — charges across the arena, summons grunt adds, and fires a delayed cone attack.

### Implementation Scope

| Area | Work |
|------|------|
| Run flow | Replace `WaveSystem` with `RunSystem` that tracks wave 1–10, boss flags, and win/loss state. |
| Boons | New pre-run UI scene/overlay, boon definitions, apply to `Player` at start. |
| Wave rewards | Post-wave reward screen with 3 random choices from a weighted pool. |
| Bosses | New `BossEnemy` class extending `Enemy` with scripted attack phases. |
| Meta-progression | Service/module tracking lifetime stats and unlocks, `localStorage` persistence. |
| End screens | "Victory" and "Defeat" screens with run summary (score, kills, wave, gold). |

### Files to Touch
- `src/phaser/systems/WaveSystem.ts` → refactor or replace with `RunSystem`.
- `src/phaser/scenes/ArenaScene.ts` — run flow, boss spawning, reward screens.
- `src/phaser/entities/Enemy.ts` — extend for boss phases.
- `src/phaser/entities/Player.ts` — boon and temporary upgrade fields.
- New: `src/features/game/meta-progression.ts` — stats, unlocks, persistence.
- New: `src/features/game/boons.ts` — boon and reward definitions.
- `src/phaser/ArenaCanvas.tsx` / `src/routes/game.tsx` — pre-run, reward, victory/defeat overlays.

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Bosses require new art | Reuse existing enemy sprites scaled up and tinted differently; add simple projectile sprites. |
| Runs become too long | Target 8–12 minutes for a full clear; tune HP/damage accordingly. |
| Meta-progression makes early runs feel pointless | Unlock small, quality-of-life bonuses first; power bonuses later. |
| Save scumming | Use simple checksum or server persistence if competitive leaderboards are added. |

### Success Metrics
- Players complete a full run and feel a sense of accomplishment.
- Repeat play rate increases because unlocks give long-term goals.
- Average session length is predictable (10–15 minutes).

---

## Recommended Implementation Order

1. **Proposal 1 (Bow Upgrade & Gold Economy)** — lowest risk, highest immediate payoff. It activates existing code and gives players a reason to keep playing.
2. **Proposal 2 (Combat Depth)** — after the economy is in place, add abilities and enemy roles so the combat loop stays fresh as runs get longer.
3. **Proposal 3 (Roguelike Run Structure)** — once combat and economy are solid, structure the experience into a winnable run with meta-progression.

## Cross-Cutting Considerations

- **Mobile:** Every new UI (shop, rewards, boons) needs large touch targets and should work in portrait and landscape.
- **Performance:** More enemies, projectiles, and hazards require object pooling. The current `ProjectileSystem` already pools arrows; extend that pattern to coins, hazards, and enemy projectiles.
- **Balance:** All numbers in these proposals are starting points. Plan for a balance pass after each proposal is playable.
- **Art:** Proposals reuse existing sprites where possible. New visual needs are minimal: coin sprite, ability icons, boss tint/scale, hazard tiles.

---

*Document created: 2026-09-13*
*Author: Lovable Agent*
*Status: Draft — awaiting product decision on which proposal to implement first.*
