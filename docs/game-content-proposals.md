# ARCOON — Full Game Content Proposals

> Three complete content proposals for what ARCOON becomes: how the game works end-to-end, maps, stages, bow items, bow-star upgrades, character progression, and whether the **Packs** tab survives or is replaced by a **Book (Encyclopedia)**.
>
> Date: 2026-09-13 · Status: **Proposal 1 adopted and built.** Proposals 2 and 3 stay as future directions.
>
> Shipped from Proposal 1: four named maps with their own enemy families, bosses and difficulty scaling; five bow rarity sets with 1★–5★ upgrades bought with gold in the Armory; the Packs tab replaced by the Book (Bestiary / Armory index / Milestones); a defeat keeps half the gold earned that run.

---

## Current State (what exists today)

- **Core loop:** Phaser arena combat — auto-attacking bow, Archero-style, with mobile joystick. Kite enemies, arrows fly straight with fixed range.
- **Campaign shell:** React homepage with Idle Raiders-style shell. Tabs: **World | Inventory | Packs | Character**. Wallet (Gold, Soul Shards, Arrow Tokens) in the header.
- **World:** 4 themed maps (forest, desert, sewer, city) × 5 stages × 10 waves. Wave 10 = boss. Stage clear unlocks the next; map completion unlocks the next map. Progress in `localStorage`.
- **Economy:** Enemies grant gold instantly on death; XP orbs must be collected. Between-wave shop upgrades the bow (Wood → Iron → Silver → Emerald → Diamond → Ignisite) using `src/features/game/bow.ts`.
- **Progression:** XP bar at the screen bottom, account level, skill points, three skill branches (Marksman / Survival / Fortune).
- **Player:** 100 HP, numeric red health bar above the player; enemies show overhead health bars.

---

## Proposal 1 — "The Forest Saga" (Content-Complete Campaign)

**One-line pitch:** Finish the game as a tight, fully-themed single-player campaign: 4 maps, 20 stages, 5 bow rarity sets with star upgrades, per-map enemy families and bosses, and replace Packs with a Book encyclopedia.

### How the game works

1. Player opens the homepage (React shell) → **World** tab.
2. Picks the highest unlocked stage on a map → enters the Phaser game.
3. Survives 10 waves; wave 10 is that stage's boss. Death = defeat screen (keep 50% gold earned that run), win = rewards + next stage unlocks.
4. Gold buys **bow upgrades** (permanent, across runs) and **consumables**. XP levels the account, which grants skill points for the skill tree.
5. The **Book** tab fills in automatically as the player encounters enemies, bows, and milestones.

### Maps & stages

| # | Map | Theme | Enemy family | Final boss |
|---|-----|-------|--------------|------------|
| 1 | Whisperwood (forest) | Tutorial → easy | Grunts, Runners | Bog Troll |
| 2 | Sunken Dunes (desert) | Faster spawns, sand hazards | Runners, Swarmers, Scorpions | Sand Wurm |
| 3 | Murkwater Sewers | Tight corridors, poison pools | Swarmers, Shamans, Brutes | Rat King |
| 4 | Neon City | Dense waves, elite mix | All families + elites | Shadow Knight |

Each map has **5 stages × 10 waves**. Difficulty scales via enemy HP/damage multipliers and wave composition, not just count.

### Items — bows only

- **5 bow sets**, one per rarity: **Common → Uncommon → Rare → Epic → Legendary**. Each set is themed per map (e.g. Whisperwood Common is living-wood; Neon City Legendary is chrome/energy).
- Every bow can be upgraded with **Stars** (1★ → 5★). Each star raises base damage, range, and fire rate by a fixed percent. Max-star bows from earlier rarities can rival low-star bows from the next rarity.
- Bow stats: damage, range, fire rate, plus one **trait** unlocked at 3★ and strengthened at 5★ (pierce, spread, burn, slow, gold-find).
- Bows are **bought with gold** in a permanent Blacksmith (homepage Inventory tab), not just the between-wave shop. Between-wave shop sells temporary boosts only; stars are upgraded outside the run.

### Character upgrades

- Keep the current skill tree (Marksman / Survival / Fortune), extend to 5 ranks per node.
- Add **character stats page**: total kills, best wave, gold earned lifetime, bosses slain.

### Packs vs Book — decision: **Book**

Remove Packs. Replace with **Book (Encyclopedia)** tab with three sections:
- **Bestiary** — every enemy/boss with sprite, stats, lore line, kill count. Silhouette until first encounter.
- **Armory** — all 5 bow sets with star-upgrade paths, stats, and how to unlock; owned ones highlighted and current star level shown.
- **Milestones** — achievements (first boss kill, 1,000 kills, full map clear, first 5★ bow) with small gold rewards.

**Why:** a single-player test-phase game has no economy that justifies packs/gacha; a Book rewards exploration, costs nothing to balance, and gives the 4th tab a real purpose.

### Effort & risk

- Mostly content + data (enemy/boss/bow tables), low systems risk. Biggest cost: boss behaviors (reuse + tint + scale, 1–2 custom attacks each).

---

## Proposal 2 — "Endless Bog" (Roguelite Runs)

**One-line pitch:** Maps stay, but each stage becomes a replayable roguelite run with draftable relics and a win/lose structure; gold becomes meta-currency; Packs become a **relic draft**, Book still added later.

### How the game works

1. Choose a stage → run starts with base bow.
2. Each cleared wave offers **1 of 3 relics** (stack for the run): +damage, multishot, homing-lite, thorns, lifesteal, XP/gold multipliers, dash charges, etc.
3. Wave 10 boss → stage clear → permanent gold + unlocks.
4. Death keeps earned gold but loses relics. Higher stages = better relic pools.

### Maps & stages

Same 4 maps × 5 stages × 10 waves, but each map adds a **map modifier** (forest: healing shrines; desert: heat slows regen; sewer: poison pools; city: elite squads).

### Items — bows only

- **5 bow sets** (Common → Uncommon → Rare → Epic → Legendary) are **permanent unlocks** bought with gold. They define your base stats entering a run.
- **Stars** upgrade a bow permanently outside the run, raising damage / range / fire rate and unlocking traits at 3★ / 5★.
- **Relics** are **run-scoped** — this is the main wave-to-wave variety.

### Character upgrades

- Skill tree persists as meta-progression; add a 4th branch, **Fortune → Alchemy** (better relic odds/rerolls).
- Reroll tokens ("Arrow Tokens" already in the wallet) let you reroll relic choices — gives the third currency a job.

### Packs vs Book — decision: **Packs repurposed, no gambling**

Keep the Packs tab but make it a **Relic Pack shop**: spend gold/tokens to unlock *new relics into the draft pool* (fixed contents, no randomness — buy the relic, it can now appear in runs). No gacha, no duplicates, everything visible before purchase.

### Effort & risk

- Medium: needs a relic system (~20 relics), draft UI, and run-state management on top of current waves. Highest replay value per hour of work.

---

## Proposal 3 — "Guild of the Glade" (Light MMO / Social Layer)

**One-line pitch:** Single-player campaign of Proposal 1, plus a backend (Lovable Cloud) for accounts, leaderboards, daily bounties, and cosmetic packs — the long-term live game.

### How the game works

- Everything in Proposal 1, but progress, wallet, bows, and Book completion live in a **cloud account** instead of `localStorage`.
- **Daily bounty:** a seeded stage modifier + target (e.g. "clear Sewers 3 with 8+ waves no-hit") for bonus Soul Shards.
- **Leaderboards:** fastest boss kills, highest endless wave, most kills — per map and global.

### Maps & stages

- Same 4 maps to start; the backend makes adding map #5 a content drop instead of a release.

### Items — bows only

- **5 bow sets** (Common → Uncommon → Rare → Epic → Legendary) with star upgrades, same as Proposal 1.
- **Cosmetic bow skins** (trail colors, arrow effects) — no stat power, pure style, bought with Soul Shards.

### Character upgrades

- Same skill tree, cloud-persisted.
- Soul Shards (currently in the wallet) become the cosmetic/prestige currency earned from bounties and milestones.

### Packs vs Book — decision: **both**

- **Book** ships exactly as in Proposal 1 (it's the collection heart of the game).
- **Packs** returns as **cosmetic bundles**: arrow trails, avatar frames, bow skins — bought with Soul Shards. Fixed contents, no gacha; pricing is transparent.

### Effort & risk

- Highest: requires enabling Lovable Cloud (auth, tables, RLS), migrating save data, and moderation-light leaderboards. Recommend doing this **after** Proposal 1 or 2 proves the loop.

---

## The Packs question — recommendation

| Option | Verdict |
|--------|---------|
| Gacha/loot packs | ❌ No — wrong for a test-phase single-player game, invites balance and trust problems. |
| Fixed-content cosmetic/relic packs | ✅ Only with Proposal 2 (relic unlocks) or 3 (cosmetics). |
| **Book encyclopedia (Bestiary / Armory / Milestones)** | ✅ **Recommended now** — fits every proposal, replaces the placeholder tab with real content, near-zero balance risk. |

**Suggested path:** adopt the Book immediately (it ships with any proposal), build **Proposal 1** as the content-complete base game, then layer **Proposal 2's relic draft** as the replay mode, and keep **Proposal 3** as the live-service horizon once the game is fun.

---

## Decision checklist

- [ ] Which proposal (1 / 2 / 3 or hybrid)?
- [ ] Packs: remove (Book) or repurpose (fixed-content)?
- [ ] Bow rarity sets: keep the current 6 material tiers or move to 5 rarity sets (Common / Uncommon / Rare / Epic / Legendary) with star upgrades?
- [ ] Star upgrade curve: flat percentage per star, or diminishing returns after 3★?
- [ ] Backend: stay on `localStorage` for now or enable cloud accounts?
