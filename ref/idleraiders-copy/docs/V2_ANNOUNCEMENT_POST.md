---
title: "IDLE RAIDERS v2 — A Full Reforge of the Realms"
date: 2026-04-23
author: idleraiders
tags: [hivegaming, announcement, v2, launch, idleraiders]
---

# ⚔️ IDLE RAIDERS v2 — Reopening the Realms

> **v1 was the official game. It launched, it failed, and I shut it down.**
> **v2 is me reopening the doors and starting over — properly this time.**
>
> Idle Raiders v1 officially launched on the Hive blockchain on **September 1, 2025**. Over the following months it accumulated enough economic and design debt that it couldn't be patched back to health. I made the call to **close v1** and rebuild the game from the ground up.
>
> **Idle Raiders v2 is that rebuild.** New world, new economy, new systems, and a codebase I can actually maintain — designed from day one to avoid the specific mistakes that killed v1.
>
> ### 🗓️ Target Reopening: on or before **April 30, 2026**
>
> v2 is **not live yet**. The final stretch is being spent squashing remaining bugs and polishing the last round of systems. This post is your advance look at what's coming so you can plan, budget your HIVE, and be ready the moment servers reopen.
>
> The exact reopening date will be announced on Discord and on peakd the moment it's locked in.

![Idle Raiders v2 Hero](https://your-image-host.com/idle-raiders-v2-hero.png)

&nbsp;

> ### 📌 Important Notes Before You Read Any Further
>
> **1. Test phase progress will be wiped at official launch.**
> The reopening on or before April 30 is a **test phase**, not the full official launch. When v2 officially launches, **all account progress will be reset** — levels, XP, card collections, currency balances, guild progress, and mission history all start from zero so every official-launch player begins on equal footing. This applies to anything earned or purchased during the test phase.
>
> **The only spend that carries value forward is your v1 pack purchase history.** Accounts in the [Pack Purchase Record](#-pack-purchase-record-v1--v2-transition) below are **whitelisted**, and the moment those accounts log in at official launch, the recorded USD value will be **credited directly to their in-game USD (dollars) balance**. Your HIVE from v1 is not lost — it converts into launch-day USD credit you can spend on packs, boss fees, or anything else the economy accepts USD for.
>
> **2. All numeric values are tuning targets, not final.**
> Pack prices, boss mission fees, drop rates, XP tables, leaderboard thresholds, fatigue penalties, crafting costs, energy regen, and every other formula in this post will be **actively adjusted throughout the test phase** based on real economy data, circulation, and player behavior. The goal is a healthy, self-regulating economy, and that requires live tuning.
>
> **3. Currency token names are now official.**
> The main currency is **Realm Coins** (REALMC) and the premium currency is **Soul Shards** (SSHRD). These are the official v2 on-chain tokens — the v1 RAID and SHRD tokens are not carrying forward.
>
> Bookmark the **[Game Guide](https://www.idleraiders.site/docs)** — it will always reflect the current live values.

&nbsp;

---

## 📜 The v1 Timeline — Launch to Shutdown

v1 had a real run. It went through closed beta, officially launched on Hive, shipped seven major content updates, and was actively played for months before the economy and maintenance debt forced me to close it. Here's the full timeline:

| Date | Milestone |
|------|-----------|
| **Jul 15, 2025** | The Start of the Journey — closed beta opened |
| **Jul 17, 2025** | World Boss, Packs, New Races & Hero Generation deep-dive |
| **Jul 23, 2025** | New Buildings, Raid Reworks, Referral Rewards + Data Reset |
| **Aug 15, 2025** | Hero Fusion, Territory Wars & Dungeon Revamp |
| **Sep 1, 2025**  | **Official Launch on Hive Blockchain** |
| **Oct 6, 2025**  | Workshop & Enhancement Update |
| **Oct 23, 2025** | Commander System & Quest Mode Major Update |
| **2026**         | **v1 officially closed** — economy collapse + feature bloat made it unsalvageable |

&nbsp;

![v1 Journey Collage](https://your-image-host.com/v1-recap.png)

&nbsp;

---

## 💥 Why v1 Failed and Had to Be Closed

I want to be honest about this part — v1 was an officially launched, paid-entry game on Hive, and it failed. Not because of bad design ideas, but because of **economy pressure** and **feature bloat** that stacked up faster than I could balance them as a solo dev.

What actually broke v1:

- **I removed dynamic pricing.** The single biggest mistake. v1 originally had dynamic pack pricing that adjusted to supply, but I forced it to a stable price mid-way through — and that's the moment the economy started to collapse. Circulation had no natural brake, and card value followed.
- **Currency inflation outran the sinks.** Token generation scaled faster than crafting, marketplace fees, and pack purchases could remove tokens from circulation.
- **Too many overlapping features.** By the end of v1 we had Hero Fusion (5 stages, up to 12x bonus), Training Hall, Workshop, 20-tier Enhancement, Commander System, Commander Equipment Leveling, Stat Upgrades, Quest Mode, Expedition Runs, Inventory Bag, Fragments, Boss Cores, Health Potions, Commander Death & Revival, Material Shop, Hero's Keep, Vault, and Territory Wars — all stacked on top of each other in a few months. Every new system added more knobs to balance and more code paths to maintain solo.
- **Formulas no one could trace.** `(Level - 1)² × 4000 + 1000` for equipment, `floor(Current^1.5)` for stat upgrades, 20 enhancement tiers with success rates bottoming out at 2.5% — the math became impossible to balance without breaking something upstream.
- **Maintainability hit a wall.** The more systems we layered on, the harder it became to ship a clean fix without breaking something else.

**v2 fixes the root cause:** dynamic pricing is back — for packs *and* for boss mission fees. Pricing reacts to circulation so the economy breathes on its own instead of relying on me to hand-tune it every week.

So instead of patching a broken live game forever, I made the call to **close v1, simplify everything, and rebuild it as v2**.

**v2 is intentionally leaner**: fewer overlapping systems, dynamic pricing that controls circulation, higher starting pack costs, and formulas you can actually read in the [Game Guide](https://www.idleraiders.site/docs). Every feature in v2 has to earn its place.

**v1 is closed. v2 is the restart — the version the game was always supposed to be.**

&nbsp;

---

## 🔄 v1 vs v2 At a Glance

The simplest way to explain v2 is to show you what's gone, what's replaced, and what's new.

| System | v1 | v2 |
|--------|----|----|
| **Registration** | $10 HIVE one-time fee (stable pricing) | **$10 HIVE one-time fee** — or **$0.10 HIVE for the test phase** |
| **Core stats** | 4 commander stats + per-hero Attack/Defense/Speed/Crit + fusion bonuses | **4 clean stats**: Raid Power / Mastery / Luck / Global Modifier |
| **Heroes** | 4 races × 5 classes × 4 rarities, **fused in 5 stages up to 12×** | 6 card types × 6 rarities, stats come from the collection — no fusion grind |
| **Equipment** | Forged, enhanced across 20 tiers, success rates down to 2.5% | **Crafted directly** from dungeon materials + boss components + catalyst |
| **Commander System** | Full second character with levels, equipment, stats, HP/mana | **Removed.** Your collection is your power. |
| **Quest Mode** | Turn-based solo combat, 6 expedition runs, bag management, mob rarity rolls | **Removed.** Replaced by clean mission tiers (Scout → War Campaign). |
| **Death & Revival** | Commander could die, lose all rewards, pay Max HP × 5 RAID or wait 24h | **Removed.** |
| **Fragments / Boss Cores** | Drop from mobs, convert 10 → 1 Boss Core for equipment | **Simplified** to Components + Catalysts from boss raids |
| **Materials** | Metals, Leather, Wood, Arcane, Essence, Fragments, Boss Cores | **20 dungeon materials** (4 per territory) + Components + Catalysts |
| **Currencies** | RAID tokens, SHRD, dynamic pack pricing (removed mid-v1) | **Realm Coins (REALMC), Soul Shards (SSHRD), USD** — with **dynamic pricing brought back** for packs and boss missions |
| **Enhancement** | 20 tiers, base success rate as low as 2.5%, blacksmith bonuses | **Removed.** Power comes from collection depth, not RNG reforging |
| **Leveling** | Sacrifice heroes for commander XP, `(Level - 1)² × 1000` | **Flat player XP from missions**, readable in a single table |
| **Seasons** | 15-day seasons | **Weekly leaderboard**, every Monday 00:00 Manila (UTC+8) |
| **Packs** | Dynamic RAID price (then forced-stable, which broke the economy) | **Starts at 10,000 Realm Coins**, then shifts to **dynamic pricing** once circulation hits the threshold |

If you played v1, you'll feel the difference immediately. v2 has **fewer screens**, **fewer menus**, **fewer hidden formulas**, and the gameplay loop comes through much harder.

&nbsp;

---

## 🔥 What's New in v2

v2 is **not a patch** — it's a complete rewrite. Every system was redesigned with the lessons we learned from v1.

### 🗺️ Five Territories, Ten Dungeons, Ten Bosses
A fully redesigned world. Each territory has 2 dungeons, 2 bosses, and a 5-quest story arc (**25 story quests total**).

| Territory | Unlock Lv | Dungeons | Bosses |
|-----------|----------:|----------|--------|
| **Evershade** | 1 | Goblin Cave, Spider Den | Goblin King, Spider Queen |
| **Sunspire Citadel** | 16 | Graveyard of Souls, Crypt of the Undying | Soul Reaver, Lich King |
| **Frosthold** | 31 | Ice Cavern, Dark Forest | Frost Giant, Ancient Treant |
| **Ember City** | 61 | Molten Quarry, Ashen Fortress | Ember Colossus, Ash Lord |
| **Iron Citadel** | 91 | Demon's Gate, Dragon's Lair | Demon Lord, Ancient Dragon |

Dungeon reward factors scale from **1.2× (Goblin Cave)** up to **3.0× (Dragon's Lair)**. The same 5 territories from v1 exist on the map, but the content inside them is completely new.

### ⚔️ Four Clean Core Stats
Gone are the dozen overlapping stats from v1 (Attack, Defense, Speed, Critical, fusion bonuses, commander stats, equipment bonuses). v2 runs on four:

| Stat | What it does |
|------|--------------|
| **Raid Power (RP)** | Boss damage + bonus token rewards |
| **Mastery** | Counters fatigue penalty on bonus rewards |
| **Luck** | Drives potion drop rate + training mastery gains |
| **Global Modifier (GM)** | Leaderboard points modifier only (Rare+ cards only) — multiplies your weekly boss damage when leaderboard scores are tallied. Does **not** affect in-mission rewards |

Stats come from your collection: `CardStats = BaseStats[type] × RarityMultiplier × ClassModifier`. No hidden math, no `^1.5` upgrade curves.

### 🃏 New Card Architecture
- **6 card types**: Hero, Equipment, Mount, Transport, Artifact, Booster
- **6 rarities** with stat multipliers — Common 1× → **Legendary 100×** (Special story cards 12×)
- **Pack drop rates**: Common 65% / Uncommon 23% / Rare 10% / Epic 1.9% / Legendary 0.1%
- **Booster soft-cap** asymptotes at **+200% effective** (3.0× multiplier) — no infinite stacking

No more Hero Fusion. No more "feed 20 commons to get 1 rare." Your cards keep the value they drop at.

### 🧪 Missions That Actually Mean Something

| Type | Duration | Energy | Base Tokens | Mat Rolls | Fatigue |
|------|---------:|-------:|------------:|----------:|--------:|
| Scout | 5 min | 15 | 50 | 1 | 10 |
| Patrol | 15 min | 25 | 100 | 3 | 20 |
| Expedition | 30 min | 45 | 250 | 6 | 35 |
| Siege | 1 hr | 60 | 500 | 12 | 60 |
| War Campaign | 3 hr | 80 | 750 | 36 | 90 |

Plus **Boss Raids** (30 min, 30 energy, 12 mat rolls, leaderboard damage) and **Story Quests** (60 min, 60 energy, 15% chance for a unique Special card on first clear).

v1's Quest Mode turn-based combat, expedition runs, and bag management are all gone. One mission bar. One timer. Done.

### ♻️ A Real Fatigue & Repeat System
- Fatigue accumulates per dungeon mission and is countered by **Mastery**
- Repeating the same dungeon+mission daily drops bonus rewards by **−15% per repeat** (min 10%)
- Resets at midnight Manila time (UTC+8)

This is the v1 inflation fix in gameplay form: you can't just farm one dungeon all day for infinite tokens.

### 🏰 Guilds & Guild Wars
- 30-member guilds, level cap **15** (1,000,000 cumulative XP)
- Max-level buffs: **+50% XP / +50% Material / +50% Energy Regen / +15% Boss Damage**
- **One-week Guild Wars** — fortress HP scales with members, valor from damage + objectives, supplies fund tactical buffs (War Cry, Rally, Shield Wall, Reinforce)
- **Only requirement is a Guild Level 1 guild** — and since guilds can only be joined at **Player Level 16+**, every war participant is naturally at least Level 16. There are **no additional war-specific level gates** beyond that
- Attack cost: 10 energy, 30 min cooldown

Guild Wars are built around participation, not gatekeeping. Once you've hit Level 16 and joined a guild, you're eligible to declare, attack, and defend — no extra tiers to grind through first.

### 🛒 Peer-to-Peer Marketplace
- List cards for **1 – 100,000 Realm Coins**
- **7-day** listing duration
- **100 Realm Coin** listing fee + **5% sale fee** (real token sinks, finally)

Replaces the v1 NPC Material Shop and Equipment Listing. Player-to-player only, with fees that actually burn tokens.

### 🏆 Weekly Leaderboard
Every point of boss damage counts toward your weekly share of the **1,000 Soul Shard** premium pool. Distribution is proportional to your damage share. Reset every Monday 00:00 Manila time.

- **Launch threshold:** the pool fully activates at **1,000,000 global damage** for the week
- **Future scaling:** once v2 stabilizes, the threshold becomes **dynamic** — it will automatically adjust each week based on the **previous week's total accumulated Raid Power across all players**. As the playerbase grows in power, the bar to unlock the full pool grows with it

This keeps the leaderboard competitive at every stage of the game's life. Whales can't coast on old numbers, and new players aren't locked out by a threshold that only made sense six months ago.

v1's 15-day seasons and triple-category leaderboard (World Boss / Collection / Territory War) are replaced by one clean weekly race.

### 💸 Boss Mission Fees — A Real Premium Token Sink
Boss Raids cost **Realm Coins** to attempt — on top of the energy cost. This is intentional:

- Boss raids are the **only** way to earn Soul Shards outside the weekly leaderboard
- Charging Realm Coins per attempt creates a direct **token → premium currency** sink
- The fee is **dynamic** — it scales with circulation, so as more tokens enter the economy, boss attempts cost more. This pairs with dynamic pack pricing to keep inflation in check

If you want premium currency, you have to burn standard currency to get it. That's the trade that keeps both lanes healthy.

### ⚒️ Crafting Reforged
Real crafted cards, gated by territory and boss:

- **Materials** from dungeons (4 per territory, 20 total)
- **Components** from boss raids (75% of drops, class-specific)
- **Catalysts** from boss raids (25% of drops, set the crafted rarity)
- **Soul Shards** as the gate: 1 / 2 / 4 / 8 / **16 shards** for Common → Legendary
- Don't have the right material? Convert at **20 → 1** for 250 Realm Coins

No Blacksmith hero requirement. No 20-tier enhancement RNG. No `+0 → +20` gambling with 2.5% success rates.

### 💪 Training System (No-Combat Progression)
A separate path that earns XP and Mastery without fatigue:
- 60 min, 40 energy, 120 XP per session
- Mastery reward: `floor(50 + totalLuck / 100)` (min 50)
- Three branches: **Weapons** (Equipment Luck), **Mount** (Mount Luck), **Merchant** (Artifact Luck)

This replaces v1's Training Hall grind where you clicked +/- buttons to raise individual hero stats.

### 🔋 Energy, Potions, and the Economy
- Max energy **100**, regen **1 every 3 min** (full recharge in 5 hours)
- Guild buffs add up to **+50% energy regen**
- Potion base drop rate **10%**, scales with Luck up to a **25% hard cap**
- Drop split: **60% EXP Potion** (2× XP next mission) / **40% Energy Potion** (full refill)
- No fatigue potion — Mastery is the only counter. On purpose.

### 💰 Three-Currency Economy
- **Realm Coins (REALMC)** — earned from missions, spent on packs, marketplace, conversions, guild creation
- **Soul Shards (SSHRD)** — premium currency from leaderboard, achievements, boss drops; spent on crafts and Booster Packs
- **Dollars** — optional real-money tier for premium packs

### 📦 Pack Pricing (the v1 fix — done right this time)
- **Standard Pack** — 3 cards, each rolled independently from the standard rarity table — **10,000 Realm Coins or $2**
- **Booster Pack** — 1 booster card — **250 Soul Shards or $5**

**The Realm Coin price is a starting floor, not a fixed number.**

- At launch, packs cost **10,000 Realm Coins** — 4× higher than v1's 2,500 baseline
- Once total circulation crosses the threshold, pack pricing becomes **fully dynamic**, adjusting automatically to supply so the economy self-regulates
- Bringing back dynamic pricing is **the single biggest fix** from v1's collapse. The mistake was removing it. v2 doesn't make that mistake twice

&nbsp;

![v2 Gameplay](https://your-image-host.com/v2-gameplay.png)

&nbsp;

---

## 📦 Pack Purchase Record (v1 → v2 Transition)

This list shows pack purchases during the transition from v1 to v2.

> **Note:** Some values include rolled-over in-game currency from v1, so this is **not purely fresh spending**.

> ⚠️ **Only SWAP.HIVE purchases are recorded here.** Any other forms of purchases are not included in this list.

> ⚠️ **Multi-accounts will NOT be supported at launch.**
> Please stick to one account only for now.
> Multi-account support is planned later (up to **3 accounts per verified Discord account**).

> ⚠️ If you currently have multiple accounts in this pack purchase list, please let me know which account you want everything consolidated into.

| # | Account | Packs | USD |
|---|---------|------:|----:|
| 1 | tehox | 587 | $1,174 |
| 2 | freedomprepper | 485 | $970 |
| 3 | vcelier | 464 | $928 |
| 4 | yabapmatt | 390 | $780 |
| 5 | firstraider | 233 | $466 |
| 6 | paleshelter | 223 | $446 |
| 7 | speedtuning | 212 | $424 |
| 8 | silentriot | 157 | $314 |
| 9 | raythulhu | 143 | $286 |
| 10 | looftee | 93 | $186 |
| 11 | dekimasu | 83 | $166 |
| 12 | dadspardan | 82 | $164 |
| 13 | bakenbard | 72 | $144 |
| 14 | xurph | 53 | $106 |
| 15 | kobusu | 43 | $86 |
| 16 | heemshowlive | 34 | $68 |
| 17 | miketronnn | 16 | $32 |
| 18 | risingstar1 | 15 | $30 |
| 19 | steemshorts | 14 | $28 |
| 20 | likhamoph | 14 | $28 |
| 21 | marcel.dubrovnik | 14 | $28 |
| 22 | anonymous.donor | 14 | $28 |
| 23 | boathead | 11 | $22 |
| 24 | samfoat | 10 | $20 |
| 25 | emru01 | 10 | $20 |
| 26 | windail1 | 9 | $18 |
| 27 | gamaweb | 9 | $18 |
| 28 | blockgaming | 8 | $16 |
| 29 | outwars | 6 | $12 |
| 30 | atomcollector | 6 | $12 |
| 31 | sammonsters | 6 | $12 |
| 32 | warshire | 5 | $10 |
| 33 | missalice | 5 | $10 |
| 34 | artem7453 | 5 | $10 |
| 35 | splcards | 5 | $10 |
| 36 | kitsuki | 5 | $10 |
| 37 | supersvs | 5 | $10 |
| 38 | tiamoon | 4 | $8 |
| 39 | sudeon | 4 | $8 |
| 40 | artejones | 4 | $8 |
| 41 | bengbenggg | 4 | $8 |
| 42 | chloewildd | 4 | $8 |
| 43 | charles1008 | 3 | $6 |
| 44 | gezellig | 3 | $6 |
| 45 | yonyonsson3 | 3 | $6 |
| 46 | lloydi | 3 | $6 |
| 47 | yonyonsson4 | 3 | $6 |
| 48 | yonyonsson | 3 | $6 |
| 49 | sync1008 | 3 | $6 |
| 50 | aki1104 | 3 | $6 |
| 51 | killer21 | 3 | $6 |
| 52 | cmmd1008 | 3 | $6 |
| 53 | monster20 | 3 | $6 |
| 54 | yonyonsson2 | 3 | $6 |
| 55 | bandus | 3 | $6 |
| 56 | drstealth | 3 | $6 |
| 57 | miner007 | 3 | $6 |
| 58 | thewobs94 | 2 | $4 |
| 59 | grimmjoe | 2 | $4 |
| 60 | masummim50 | 2 | $4 |
| 61 | frazfrea | 2 | $4 |
| 62 | velourex | 1 | $2 |

**Thank you to everyone who supported the transition ❤️**

&nbsp;

---

## 🧾 Not on the List? Read This.

If you were actively playing v1 but **don't see your account above**, your account still exists — but because of the **one Discord = one account** rule at v2 launch, multi-accounts need to be consolidated manually.

👉 **Please contact me on [Discord](https://discord.com/invite/PZzN2DKZxq)** so we can:
1. Verify your Discord identity
2. Pick which v1 account you want to keep as your main
3. Cut off the rest (multi-account support returns later — up to 3 per verified Discord)
4. Migrate your stuff onto the correct v2 account

This is a one-time cleanup to keep v2's economy and leaderboard fair from day one.

&nbsp;

---

## 🚀 How to Be Ready for Reopening Day

v2 **reopens on or before April 30, 2026**. Here's how to hit the ground running:

> **Test Phase Entry:** When v2 opens, test-phase registration costs only **$0.10 worth of HIVE** instead of the full $10. This is your window to get in at near-zero cost, help battle-test the new systems, and build familiarity with v2 before full launch pricing kicks in.

> ### ⚠️ Read This Before You Spend
>
> The reopening is a **test phase**. All progress *and* all test-phase spend — levels, collections, currencies, guild data, packs bought during the test phase — **will be reset at official launch** so everyone starts the real game together.
>
> **Only one thing carries forward: your v1 pack purchase history.** Accounts in the [Pack Purchase Record](#-pack-purchase-record-v1--v2-transition) are whitelisted, and their recorded USD value is credited to their in-game **USD balance** at official launch. That USD balance can then be spent on packs, boss fees, marketplace listings, and anything else the economy accepts USD for.
>
> Translation: **v1 pack spend converts to launch-day USD credit. Test-phase spend does not.**

**Before reopening day:**
1. Make sure your **Hive Keychain** is installed and funded with at least **$0.10 HIVE** for test-phase registration (plus any HIVE you want to spend on packs)
2. Read the full **[Game Guide](https://www.idleraiders.site/docs)** so you know the systems before the clock starts
3. Join the **[Discord](https://discord.com/invite/PZzN2DKZxq)** — that's where reopening time is announced first, and where multi-account consolidations get resolved

**On reopening day:**
1. Visit **[idleraiders.site](https://www.idleraiders.site)**
2. Sign in with your **HIVE username** via Hive Keychain and pay the **$0.10 HIVE test-phase registration** (will move to $10 at official launch)
3. Use your **$10 starter Dollars** to buy your first packs, then run your first mission in the **Goblin Cave**
4. Hit **Level 16** to unlock Sunspire Citadel and join a guild for passive bonuses
5. Compete on the **Weekly Leaderboard** for Soul Shards
6. Remember: **buy your packs now if you want them protected** — pack spend converts to USD credit at official launch, progress does not carry over

&nbsp;

![Get Started](https://your-image-host.com/v2-get-started.png)

&nbsp;

---

## 💬 Final Words

To everyone who tested v1 — **thank you**. Every bug report, every Discord message, every pack purchased helped us build something I'm genuinely proud of.

v2 is the game v1 was always trying to be: fewer systems, sharper feedback loops, an economy with real sinks, and a codebase that can actually grow without collapsing under its own weight.

See you in the realms — **on or before April 30**. 🔥

— **Idle Raiders Team**

&nbsp;

🔗 **Play:** [idleraiders.site](https://www.idleraiders.site)
📖 **Docs:** [idleraiders.site/docs](https://www.idleraiders.site/docs)
💬 **Discord:** [discord.com/invite/PZzN2DKZxq](https://discord.com/invite/PZzN2DKZxq) — support, multi-account consolidation, and community
🐝 **Hive:** [@idleraiders](https://peakd.com/@idleraiders)
