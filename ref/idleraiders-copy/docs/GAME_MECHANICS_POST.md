---
title: "Idle Raiders — Complete Game Mechanics Guide"
date: 2026-04-25
author: idleraiders
tags: [hivegaming, guide, mechanics, idleraiders, tutorial]
---

# Complete Game Mechanics Guide

> **Everything you need to know about how Idle Raiders works — from your first mission to endgame mastery.**
>
> This guide covers every system, formula, and mechanic in the game. Whether you're a new raider starting your journey or a veteran optimizing your collection, this is your definitive reference.

![Idle Raiders Banner](https://your-image-host.com/idle-raiders-banner.png)

&nbsp;

---

## Table of Contents

1. [Getting Started](#-getting-started)
2. [The Core Gameplay Loop](#-the-core-gameplay-loop)
3. [Stats & Combat System](#-stats--combat-system)
4. [Card System](#-card-system)
5. [Mission System](#-mission-system)
6. [Boss Raids](#-boss-raids)
7. [Story Quests](#-story-quests)
8. [Training System](#-training-system)
9. [Territories & World](#-territories--world)
10. [Energy System](#-energy-system)
11. [Fatigue System](#-fatigue-system)
12. [Crafting System](#-crafting-system)
13. [Guild System](#-guild-system)
14. [Guild Wars](#-guild-wars)
15. [Marketplace](#-marketplace)
16. [Leaderboard & Rewards](#-leaderboard--rewards)
17. [Potions & Consumables](#-potions--consumables)
18. [Currencies](#-currencies)
19. [Formulas Reference](#-formulas-reference)

&nbsp;

---

## Getting Started

### Creating Your Account

Idle Raiders is built on the **HIVE blockchain** for secure, decentralized authentication.

**Requirements:**
- A HIVE blockchain account
- The **Hive Keychain** browser extension installed
- HIVE tokens for registration

**Registration Process:**
1. Navigate to [idleraiders.site](https://www.idleraiders.site)
2. Enter your HIVE username
3. Sign the authentication challenge with Hive Keychain
4. Pay the registration fee
5. Your account is now linked and ready to play

![Login Screen](https://your-image-host.com/login-screen.png)

### Your First Steps

When you first enter the game:

1. **Pay registration fee** — Registration costs **$10 worth of HIVE tokens**. This one-time payment creates your account and is converted to **$10 in-game Dollars** to start your collection
2. **Run your first mission** — Start with a Scout mission in the Goblin Cave
3. **Complete the tutorial** — Learn the basics of missions and card collection
4. **Level up to 16** — Unlocks guilds and the second territory
5. **Join a guild** — Access powerful passive bonuses that accelerate your progress

&nbsp;

---

## The Core Gameplay Loop

Idle Raiders follows a satisfying progression cycle that rewards both active play and patient collection building.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│   │   RUN    │───►│  COLLECT │───►│ IMPROVE  │             │
│   │ MISSIONS │    │ REWARDS  │    │  CARDS   │             │
│   └──────────┘    └──────────┘    └──────────┘             │
│        ▲                               │                    │
│        │                               │                    │
│        │         ┌──────────┐          │                    │
│        └─────────│ INCREASE │◄─────────┘                    │
│                  │  STATS   │                               │
│                  └──────────┘                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### The Progression Cycle

| Phase | Action | Result |
|-------|--------|--------|
| **Run Missions** | Spend energy to start timed missions | Earn tokens, materials, XP |
| **Collect Rewards** | Complete missions (even offline) | Grow your currency and inventory |
| **Improve Cards** | Buy packs, craft, or trade | Add new cards to your collection |
| **Increase Stats** | Collection grows | Higher Raid Power, Mastery, Luck |
| **Unlock Content** | Level up, get stronger | Access harder dungeons with better rewards |

**Key Insight:** Missions run in real-time even when you're offline. Start a 3-hour War Campaign before bed and collect your rewards in the morning.

![Gameplay Loop](https://your-image-host.com/gameplay-loop.png)

&nbsp;

---

## Stats & Combat System

Your combat effectiveness is determined by **four core stats**, all calculated from your card collection.

### The Four Core Stats

| Stat | Symbol | Primary Function | Derived From |
|------|--------|------------------|--------------|
| **Raid Power** | RP | Boss damage + bonus token rewards | Heroes, Equipment, Mounts, Artifacts |
| **Mastery** | — | Counters fatigue penalty | Heroes, Artifacts |
| **Luck** | — | Potion drops + training mastery | Equipment, Mounts, Transports |
| **Global Modifier** | GM | Leaderboard damage multiplier | Rare+ cards only |

### How Stats Work

**Raid Power (RP)**
Your total combat strength. Higher RP means:
- More damage to bosses during raids
- Higher bonus token rewards from dungeon missions
- Better leaderboard positioning

**Mastery**
Your resistance to fatigue. As you run missions, fatigue accumulates and reduces your bonus rewards. Mastery directly counters this effect:
- If your Mastery equals your Fatigue → 100% bonus rewards
- If Mastery is lower than Fatigue → reduced bonus rewards
- Training sessions and boss raids don't add fatigue

**Luck**
Your fortune stat. Higher Luck means:
- Increased potion drop rate (up to 25% cap)
- Higher mastery gains from training sessions
- Better outcomes across various RNG-based mechanics

**Global Modifier (GM)**
A leaderboard-only multiplier that increases your weekly boss damage score. GM only comes from **Rare or higher** rarity cards and does **not** affect in-mission rewards — only your final leaderboard standing.

### Stat Calculation Formula

Every non-booster card contributes stats based on its **type**, **rarity**, and **class**:

```
Card Stats = Base Stats[type] × Rarity Multiplier × Class Modifier
GM = Base GM × GM Multiplier[rarity]
Total Stats = Sum of (Card Stats × Card Quantity) for all cards
```

![Stats Overview](https://your-image-host.com/stats-overview.png)

&nbsp;

---

## Card System

Cards are the foundation of your power. Your entire stat profile comes from your card collection.

### Card Types

| Type | Role | Primary Stats |
|------|------|---------------|
| **Hero** | Core combat cards | High RP, High Mastery |
| **Equipment** | Weapons and armor | High RP, Moderate Luck |
| **Mount** | Creature companions | Moderate RP, High Luck |
| **Transport** | Vehicles | Very High Luck |
| **Artifact** | Magical items | Balanced RP and Mastery |
| **Booster** | Percentage bonuses | No stats (special function) |

### Base Stats by Card Type

| Type | Raid Power | Mastery | Luck | Base GM |
|------|------------|---------|------|---------|
| Hero | 60 | 30 | 0 | 1 |
| Equipment | 35 | 0 | 5 | 1 |
| Mount | 25 | 0 | 15 | 1 |
| Transport | 0 | 0 | 30 | 1 |
| Artifact | 25 | 25 | 0 | 1 |
| Booster | — | — | — | — |

### Card Rarities

| Rarity | Stat Multiplier | GM Multiplier | Pack Drop Rate | Color |
|--------|-----------------|---------------|----------------|-------|
| **Common** | 1× | 0× | 65% | Gray |
| **Uncommon** | 3× | 0× | 23% | Green |
| **Rare** | 8× | 1× | 10% | Blue |
| **Epic** | 25× | 3× | 1.9% | Purple |
| **Legendary** | 100× | 6× | 0.1% | Orange |
| **Special** | 12× | 2× | Story/Craft only | Gold |

**Example Calculation:**
A Legendary Hero has `60 (base RP) × 100 (legendary multiplier) = 6,000 Raid Power` before class modifiers.

### Booster Cards

Boosters are unique — they provide **percentage bonuses** instead of stats:

| Booster Type | Effect |
|--------------|--------|
| **XP Booster** | Increases XP earned from missions |
| **Material Booster** | Increases material drops |
| **Energy Booster** | Increases energy regeneration rate |

**Booster Values by Rarity:**

| Rarity | Boost Per Card |
|--------|----------------|
| Common | +2% |
| Uncommon | +5% |
| Rare | +10% |
| Epic | +15% |
| Legendary | +25% |

**Important:** Boosters have diminishing returns. The effective boost asymptotes at **+200% (3.0× multiplier)** — you can stack boosters, but the returns decrease as you approach the cap.

```
Soft Cap Formula:
Raw Boost = Sum of (Booster Multiplier × Card Quantity)
Effective Boost = Raw Boost / (1 + Raw Boost / 200)
Final Multiplier = 1 + (Effective Boost / 100)
```

### Card Packs

| Pack Type | Contents | Price |
|-----------|----------|-------|
| **Standard Pack** | 3 cards (each rolled independently) | 2,500 Realm Coins or **$1** *(sale)* / $2 *(regular)* |
| **Booster Pack** | 1 booster card | 250 Soul Shards or **$3** *(sale)* / $5 *(regular)* |

> **🎉 Launch Month Sale:** Standard Packs are **$1** and Booster Packs are **$3** during the first month. Prices return to $2 and $5 after the sale ends.

Both packs use the same rarity distribution: **Common 65% / Uncommon 23% / Rare 10% / Epic 1.9% / Legendary 0.1%**. Every card in a Standard Pack is rolled fully randomly — there is **no guaranteed Rare+** card.

---

## Mission System

Missions are your primary source of rewards. All missions run on real-time timers and continue even when you're offline.

### Dungeon Missions

| Mission Type | Duration | Energy Cost | Base Tokens | Material Rolls | Fatigue |
|--------------|----------|-------------|-------------|----------------|---------|
| **Scout** | 5 min | 15 | 50 | 1 | 10 |
| **Patrol** | 15 min | 25 | 100 | 3 | 20 |
| **Expedition** | 30 min | 45 | 250 | 6 | 35 |
| **Siege** | 1 hr | 60 | 500 | 12 | 60 |
| **War Campaign** | 3 hr | 80 | 750 | 36 | 90 |

### Level Requirements

Each mission type has a level offset from the dungeon's base requirement:

| Mission | Level Offset |
|---------|--------------|
| Scout | +0 |
| Patrol | +3 |
| Expedition | +6 |
| Siege | +9 |
| War Campaign | +12 |

**Example:** Crypt of the Undying requires Level 46. War Campaign there requires Level 58 (46 + 12).

### Dungeon Factors

Each dungeon has a reward multiplier applied to base tokens:

| Dungeon | Level Req | Factor | Territory |
|---------|-----------|--------|-----------|
| Goblin Cave | 1 | 1.2× | Evershade |
| Spider Den | 16 | 1.4× | Evershade |
| Graveyard of Souls | 31 | 1.6× | Sunspire Citadel |
| Crypt of the Undying | 46 | 1.8× | Sunspire Citadel |
| Ice Cavern | 61 | 2.0× | Frosthold |
| Dark Forest | 76 | 2.2× | Frosthold |
| Molten Quarry | 91 | 2.4× | Ember City |
| Ashen Fortress | 106 | 2.6× | Ember City |
| Demon's Gate | 121 | 2.8× | Iron Citadel |
| Dragon's Lair | 136 | 3.0× | Iron Citadel |

### Daily Repeat Penalty

Running the same dungeon + mission combo multiple times per day reduces **bonus** rewards:

| Run | Bonus Reward |
|-----|--------------|
| First | 100% |
| Second | 85% |
| Third | 70% |
| Fourth | 55% |
| Fifth | 40% |
| Sixth | 25% |
| Seventh+ | 10% (minimum) |

**Reset Time:** Daily at midnight Manila time (UTC+8)

**Tip:** Vary your missions across different dungeons to maximize bonus rewards.

![Mission Selection](https://your-image-host.com/mission-selection.png)

&nbsp;

---

## Boss Raids

Boss raids are 30-minute encounters that drop crafting materials and contribute to the weekly leaderboard.

### Boss Raid Basics

| Property | Value |
|----------|-------|
| Duration | 30 minutes |
| Energy Cost | 30 |
| XP Earned | 45 per raid |
| Material Rolls | 12 (2 per 5 minutes) |
| Fatigue Added | None |

### Boss Drops

| Drop Type | Chance | Description |
|-----------|--------|-------------|
| **Component** | 75% | Class-specific crafting material, gated by boss |
| **Catalyst** | 25% | Determines crafted card rarity |

### Boss List

| Territory | Boss 1 | Boss 2 |
|-----------|--------|--------|
| Evershade | Goblin King | Spider Queen |
| Sunspire Citadel | Soul Reaver | Lich King |
| Frosthold | Frost Giant | Ancient Treant |
| Ember City | Ember Colossus | Ash Lord |
| Iron Citadel | Demon Lord | Ancient Dragon |

### Leaderboard Contribution

All damage dealt to bosses counts toward your weekly leaderboard total. Higher Raid Power = more damage = better leaderboard ranking = more Soul Shards at weekly reset.

![Boss Raid](https://your-image-host.com/boss-raid.png)

&nbsp;

---

## Story Quests

Each territory has a 5-quest story arc that tells the tale of the Five Realms. That's **25 story quests total** across the entire game.

### Story Quest Basics

| Property | Value |
|----------|-------|
| Duration | 60 minutes |
| Energy Cost | 60 |
| XP Earned | 90 per quest |

### Story Card Drops

| Scenario | Drop Chance | Result |
|----------|-------------|--------|
| **First Completion** | 15% | Unique Special-rarity story card |
| **Replay (after obtaining card)** | 85% materials, 15% card | Random already-unlocked story card |

### Story Progression

Story progress is **blocking** — you must receive the card drop on first completion to advance to the next quest.

**Example:** If you complete Quest 1 but don't get the card drop, you must replay Quest 1 until the 15% chance succeeds before Quest 2 unlocks.

![Story Quest](https://your-image-host.com/story-quest.png)

&nbsp;

---

## Training System

Training is an alternative progression path that earns XP and Mastery without combat or fatigue.

### Training Basics

| Property | Value |
|----------|-------|
| Duration | 60 minutes |
| Energy Cost | 40 |
| XP Earned | 120 (2 per minute) |
| Fatigue Added | None |

### Training Types

| Training | Scales With |
|----------|-------------|
| **Weapons Training** | Equipment card Luck |
| **Mount Training** | Mount card Luck |
| **Merchant Training** | Transport card Luck |

### Mastery Reward Formula

```
Mastery Gained = floor(50 + Total Matching Luck / 100)
Minimum: 50 Mastery per session
```

**Example:** If you have 500 total Luck from Equipment cards, Weapons Training grants `50 + 500/100 = 55 Mastery`.

### Important Notes

- Training uses the same active-mission slot as regular missions
- You can only do one activity at a time
- Training does **not** add fatigue — making it ideal for building Mastery

![Training System](https://your-image-host.com/training-system.png)

&nbsp;

---

## Territories & World

The world of Idle Raiders consists of five territories, each with unique dungeons, bosses, and story quests.

### Territory Overview

| Territory | Unlock Level | Theme |
|-----------|--------------|-------|
| **Evershade** | 1 | Forests and caves |
| **Sunspire Citadel** | 16 | Undead and crypts |
| **Frosthold** | 31 | Ice and ancient forests |
| **Ember City** | 61 | Fire and volcanic |
| **Iron Citadel** | 91 | Demons and dragons |

### Territory Details

#### Evershade (Levels 1-15)
*Where every adventure begins*

| Content | Details |
|---------|---------|
| Dungeons | Goblin Cave, Spider Den |
| Bosses | Goblin King, Spider Queen |
| Materials | Goblin Iron, Crude Leather, Silk Thread, Chitin Plate |

#### Sunspire Citadel (Levels 16-30)
*The realm of the undead*

| Content | Details |
|---------|---------|
| Dungeons | Graveyard of Souls, Crypt of the Undying |
| Bosses | Soul Reaver, Lich King |
| Materials | Soul Ash, Grave Cloth, Necro Dust, Bone Rune |

#### Frosthold (Levels 31-60)
*Frozen wastes and ancient forests*

| Content | Details |
|---------|---------|
| Dungeons | Ice Cavern, Dark Forest |
| Bosses | Frost Giant, Ancient Treant |
| Materials | Frostwood, Glacial Shard, Elder Bark, Living Sap |

#### Ember City (Levels 61-90)
*The burning heart of the world*

| Content | Details |
|---------|---------|
| Dungeons | Molten Quarry, Ashen Fortress |
| Bosses | Ember Colossus, Ash Lord |
| Materials | Cinder Stone, Magma Core, Ash Crystal, Charred Bone |

#### Iron Citadel (Levels 91+)
*The final frontier*

| Content | Details |
|---------|---------|
| Dungeons | Demon's Gate, Dragon's Lair |
| Bosses | Demon Lord, Ancient Dragon |
| Materials | Demon Ichor, Cursed Steel, Dragon Bone, Void Scale |

![World Map](https://your-image-host.com/world-map.png)

&nbsp;

---

## Energy System

Energy is the resource that gates mission activity. Managing it well is key to efficient progression.

### Energy Basics

| Property | Value |
|----------|-------|
| Maximum Energy | 100 |
| Regeneration Rate | 1 energy per 3 minutes |
| Full Recharge Time | 5 hours (from 0 to 100) |

### Energy Costs by Activity

| Activity | Energy Cost |
|----------|-------------|
| Scout Mission | 15 |
| Patrol Mission | 25 |
| Boss Raid | 30 |
| Expedition Mission | 45 |
| Training Session | 40 |
| Siege Mission | 60 |
| Story Quest | 60 |
| War Campaign | 80 |

### Guild Energy Buffs

Guild buffs can increase your energy regeneration by up to **+50%** at max guild level, reducing full recharge time to approximately 3 hours 20 minutes.

### Energy Potions

Energy Potions instantly refill your energy to 100. Save them for:
- Grinding sessions
- Guild Wars attacks
- Time-limited events

![Energy Bar](https://your-image-host.com/energy-bar.png)

&nbsp;

---

## Fatigue System

Fatigue is a mechanic that prevents infinite grinding and encourages varied gameplay.

### How Fatigue Works

1. **Dungeon missions add fatigue** based on mission type
2. **Fatigue reduces bonus rewards** from missions
3. **Mastery stat counters fatigue** — higher Mastery = less penalty
4. **Boss raids and training don't add fatigue**

### Fatigue Values by Mission

| Mission Type | Fatigue Added |
|--------------|---------------|
| Scout | 10 |
| Patrol | 20 |
| Expedition | 35 |
| Siege | 60 |
| War Campaign | 90 |

### Fatigue Effect Formula

```
If Fatigue = 0:
  Bonus Rewards = 100%

If Mastery = 0 and Fatigue > 0:
  Bonus Rewards = 0%

Otherwise:
  Fatigue Multiplier = min(1, Mastery / max(1, Fatigue))
  Bonus Rewards = Base Bonus × Fatigue Multiplier
```

### Managing Fatigue

| Strategy | Effect |
|----------|--------|
| **Build Mastery** | Increase via Heroes and Artifacts |
| **Run Training** | Gain Mastery without adding fatigue |
| **Mix in Boss Raids** | No fatigue, still earn rewards |
| **Vary Dungeons** | Spread fatigue across different activities |

![Fatigue Indicator](https://your-image-host.com/fatigue-indicator.png)

&nbsp;

---

## Crafting System

Craft powerful cards using materials gathered from missions and bosses.

### Crafting Components

Every recipe consumes exactly **3 stacks** — no Soul Shards, no Realm Coins.

| Component | Source | Usage |
|-----------|--------|-------|
| **Materials** | Dungeon missions | Zone-specific base ingredient |
| **Components** | Boss raids (75% drop) | Class-specific requirement |
| **Catalysts** | Boss raids (25% drop) | Sets the crafted card&apos;s rarity |

### Material Sources by Territory

| Territory | Materials |
|-----------|-----------|
| Evershade | Goblin Iron, Crude Leather, Silk Thread, Chitin Plate |
| Sunspire Citadel | Soul Ash, Grave Cloth, Necro Dust, Bone Rune |
| Frosthold | Frostwood, Glacial Shard, Elder Bark, Living Sap |
| Ember City | Cinder Stone, Magma Core, Ash Crystal, Charred Bone |
| Iron Citadel | Demon Ichor, Cursed Steel, Dragon Bone, Void Scale |

### Crafting Costs

Stack sizes are fixed by rarity. The catalyst is the only rarity gate.

| Rarity | Material | Component | Catalyst |
|--------|----------|-----------|----------|
| Common | 4 | 2 | 1× Common |
| Uncommon | 6 | 3 | 1× Uncommon |
| Rare | 8 | 4 | 1× Rare |
| Epic | 12 | 6 | 1× Epic |
| Legendary | 20 | 10 | 1× Legendary |

### Material Conversion

Don&apos;t have the materials you need? Trade them up at the **Material Trader**:

| Property | Value |
|----------|-------|
| Conversion Ratio | **5 source → 1 target** |
| Direction | **Next zone up only** (D1 → D2 → … → D9 → D10) |
| Coin Cost | **Dynamic** — `TargetZoneIndex × 25 Realm Coins` |

**Cost by destination zone:**

| Destination | Cost | Destination | Cost |
|-------------|------|-------------|------|
| D2 (Spider Den) | 25 | D7 (Molten Quarry) | 150 |
| D3 (Graveyard of Souls) | 50 | D8 (Ashen Fortress) | 175 |
| D4 (Crypt of the Undying) | 75 | D9 (Demon&apos;s Gate) | 200 |
| D5 (Ice Cavern) | 100 | D10 (Dragon&apos;s Lair) | 225 |
| D6 (Dark Forest) | 125 | | |

> D10 materials cannot be a source — there is no zone above. You also cannot skip zones; trades flow strictly one zone at a time.

![Crafting Interface](https://your-image-host.com/crafting-interface.png)

&nbsp;

---

## Guild System

Guilds provide powerful passive bonuses and unlock cooperative gameplay.

### Guild Basics

| Property | Value |
|----------|-------|
| Join/Create Requirement | Level 16 |
| Creation Cost | 10,000 Realm Coins |
| Maximum Members | 30 |
| Maximum Guild Level | 15 |

### Guild Roles

| Role | Permissions |
|------|-------------|
| **Leader** | All permissions, can transfer leadership |
| **Officer** | Invite/kick members, edit guild info |
| **Member** | Donate materials, participate in activities |

### Guild Buffs by Level

| Level | XP Bonus | Material Bonus | Energy Regen | Boss Damage |
|-------|----------|----------------|--------------|-------------|
| 1 | 0% | 0% | 0% | 0% |
| 2 | 4% | 0% | 0% | 0% |
| 3 | 4% | 4% | 0% | 0% |
| 5 | 8% | 4% | 4% | 0% |
| 8 | 20% | 16% | 12% | 5% |
| 10 | 28% | 24% | 24% | 5% |
| 12 | 36% | 32% | 32% | 10% |
| **15** | **50%** | **50%** | **50%** | **15%** |

### Guild XP from Donations

Donate materials to level up your guild. Donations are batched in groups of **5 materials per donation** (boss-tagged materials donate 1 at a time). Higher-tier dungeon materials give significantly more XP:

| Tier | Dungeons | XP per 5 Materials |
|------|----------|--------------------|
| T1 | Goblin Cave, Spider Den | 25 |
| T2 | Graveyard of Souls, Crypt of the Undying | 37 |
| T3 | Ice Cavern | 50 |
| T3 | Dark Forest | 62 |
| T4 | Molten Quarry | 75 |
| T4 | Ashen Fortress | 87 |
| T5 | Demon&apos;s Gate | 112 |
| T5 | Dragon&apos;s Lair | 150 |

> Per-batch XP is computed as `floor(rate × 5 / 10)`. Spam-donating low-tier materials still levels guilds, but a single batch of T5 materials is worth **6×** a batch of T1.

### Guild Level Requirements

| Level | Cumulative XP Required |
|-------|------------------------|
| 1 | 0 |
| 2 | 5,000 |
| 3 | 15,000 |
| 5 | 50,000 |
| 10 | 300,000 |
| 15 | 1,000,000 |

![Guild Interface](https://your-image-host.com/guild-interface.png)

&nbsp;

---

## Guild Wars

Guild Wars is a competitive PvP system where guilds battle for valor and rewards.

### War Basics

| Property | Value |
|----------|-------|
| War Season | 1 week (Mon 00:00 → Sun 23:59 UTC+8) |
| Attack Energy Cost | 10 |
| Attack Cooldown | 30 minutes |
| Matchmaking | ±20% guild power variance |
| Fortress HP | 100,000 base + 5,000 per member |

> Wars run on the same weekly cycle as the leaderboard. The Sunday 16:00 UTC snapshot job finalizes the season, distributes Guild Points by rank, and a fresh war season begins immediately afterward. Guilds that join mid-week get less than 7 full days of battle time.

### War Requirements

| Requirement | Value |
|-------------|-------|
| Minimum Guild Level | 3 |
| Minimum Members | 5 |
| Player Level | 16+ (required to join any guild) |

### Earning Valor

| Action | Valor Earned |
|--------|--------------|
| Damage Dealt | 1 per 1,000 damage |
| Damage Received | 0.3 per 1,000 damage |
| Outpost Capture | +1,500 bonus |
| Stronghold Destroy | +500 bonus |

### Outpost Tiers

| Tier | Valor Multiplier | Supplies/Hour |
|------|------------------|---------------|
| T1 | 1.0× | 10 |
| T2 | 1.5× | 25 |
| T3 | 2.0× | 50 |
| T4 | 2.5× | 100 |
| T5 | 3.0× | 200 |

### War Supplies & Buffs

Captured outposts generate supplies that fund powerful tactical abilities:

| Action | Supply Cost | Effect |
|--------|-------------|--------|
| Repair Garrison | 50 | +10% fortress HP |
| Repair Outpost | 100 | +10% outpost HP |
| War Cry | 75 | +10% damage for 1 hour |
| Reinforce | 100 | +15% defense for 2 hours |
| Rally | 150 | Free attacks for 1 hour |
| Shield Wall | 200 | −25% damage received for 2 hours |

### End-of-War Rewards

When the weekly war ends at the **Sunday 16:00 UTC snapshot** (Monday 00:00 UTC+8), **Guild Points are distributed by final leaderboard rank** — higher placements earn more points toward the seasonal guild standings. There is no separate winner/loser valor bonus or victory title; the valor and Guild Points you accumulate during the war (and your final rank) are the entire reward.

![Guild Wars](https://your-image-host.com/guild-wars.png)

&nbsp;

---

## Marketplace

Trade cards with other players on the peer-to-peer marketplace.

### Listing Cards

| Property | Value |
|----------|-------|
| Listing Fee | 100 Realm Coins |
| Duration | 7 days |
| Price Range | 1 – 100,000 Realm Coins |
| Cancellation | Returns card (fee not refunded) |

### Buying Cards

| Property | Value |
|----------|-------|
| Transaction Fee | 5% (deducted from seller) |
| Payment | Realm Coins only |

### Seller Proceeds Formula

```
Seller Receives = Price − floor(Price × 0.05)
```

**Example:** Selling a card for 10,000 tokens nets you 9,500 tokens (10,000 − 500 fee).

### Marketplace Tips

- Check recent sales for fair pricing
- Higher rarity cards command premium prices
- Look for underpriced listings from new players
- Consider supply limits on rare cards
- Time your listings around weekly reset for visibility

![Marketplace](https://your-image-host.com/marketplace.png)

&nbsp;

---

## Leaderboard & Rewards

Weekly leaderboards track boss damage and distribute Soul Shard rewards.

> **Heads up — reward formulas are not final.** The numbers in this section (the 10,000-shard cap, the 1,000,000-damage activation threshold, and the proportional split) are the values currently live in the game and used for the ongoing season, but they are still under active balancing review. Expect them to change in a future patch once we have more snapshot data from real seasons.

### How It Works

1. **Deal Boss Damage** — Every boss raid contributes to your weekly total
2. **Climb the Rankings** — Players ranked by total damage dealt
3. **Weekly Reset** — Rewards distributed, leaderboard resets

### Reward Pool *(current values — subject to change)*

| Property | Value |
|----------|-------|
| Maximum Weekly Pool | 1,000 Soul Shards |
| Activation Threshold | 1,000,000 global damage |
| Distribution | Proportional to damage share |

### Reward Formula *(current values — subject to change)*

```
Global Pool = min(1,000, (Global Damage / 1,000,000) × 1,000)
Your Reward = floor((Your Damage / Total Damage) × Global Pool)
```

**Example:** If global damage is 2,000,000 (pool fully active at 1,000 shards) and you dealt 5% of total damage, you receive 50 Soul Shards.

### Weekly Reset

| Property | Value |
|----------|-------|
| Reset Time | Monday 00:00 Manila time (UTC+8) |
| What Resets | Leaderboard damage, rewards distributed |

![Leaderboard](https://your-image-host.com/leaderboard.png)

&nbsp;

---

## Potions & Consumables

Potions provide powerful temporary effects to boost your gameplay.

### Potion Types

| Potion | Effect |
|--------|--------|
| **Energy Potion** | Instantly refill energy to 100 |
| **EXP Potion** | 2× XP on your next mission |

### Obtaining Potions

Potions drop from mission completions:

| Property | Value |
|----------|-------|
| Base Drop Chance | 10% |
| Luck Bonus | +min(1.5, Luck / 4000) multiplier |
| Hard Cap | 25% maximum drop chance |
| Distribution | 60% EXP Potion, 40% Energy Potion |

### Mission Drop Multipliers

| Mission Type | Drop Multiplier |
|--------------|-----------------|
| Scout | 1.0× |
| Patrol | 1.2× |
| Expedition | 1.4× |
| Siege | 1.7× |
| War Campaign | 2.0× |

### Potion Strategy

- **EXP Potions:** Use before 60+ minute missions for maximum value
- **Energy Potions:** Save for grinding sessions or Guild Wars
- **No Fatigue Potion:** Fatigue is only countered by Mastery

### Potion Storage

The combined storage cap covers **both** potion types — Energy Potions and EXP Potions share the same slot pool. New potion drops are blocked once the cap is reached, so plan to use or expand before grinding.

| Property | Value |
|----------|-------|
| Starting Slots | 3 (shared across all potion types) |
| Expansion | Purchased — **+1 slot per 1 in-game Dollar** |
| Cap on Slots | None — buy as many as you can afford |
| Refunds | Slots are permanent and not refundable |

> Tip: New players get **$10 in-game Dollars** on registration, which is enough to take storage from 3 → 13 if you skip pack purchases. The expand button lives on the Energy Bar popover next to your potion counters.

![Potions](https://your-image-host.com/potions.png)

&nbsp;

---

## Currencies

Idle Raiders has three primary currencies, each with specific purposes.

### Realm Coins (REALMC)

| Property | Details |
|----------|---------|
| Type | Primary currency (standard) |
| Earned From | Dungeon missions, story quests, boss raids |
| Used For | Card packs, marketplace, guild creation, material conversion, boss mission fees |

### Soul Shards (SSHRD)

| Property | Details |
|----------|---------|
| Type | Premium currency |
| Earned From | Weekly leaderboard rewards, boss raids, achievements |
| Used For | Booster Packs, crafting (rare→legendary cards) |

### Dollars

| Property | Details |
|----------|---------|
| Type | Real-money currency (optional) |
| Earned From | Purchase only |
| Used For | Premium card packs, special offers |

### Currency Flow

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   DUNGEONS ──────► REALM COINS ──────► PACKS               │
│       │                  │               │                  │
│       │                  ▼               ▼                  │
│       │           MARKETPLACE         CARDS                 │
│       │                  │               │                  │
│       ▼                  ▼               ▼                  │
│   BOSSES ──────► SOUL SHARDS ──────► CRAFTING              │
│                          │                                  │
│                          ▼                                  │
│                    BOOSTER PACKS                            │
���                                                             │
└──────────────���───────────────────────────────────��────────����─┘
```

![Currencies](https://your-image-host.com/currencies.png)

&nbsp;

---

## Formulas Reference

All the key formulas in one place for quick reference.

### Stat Calculations

```
Card Stats = Base Stats[type] × Rarity Multiplier × Class Modifier
Total Stats = Σ (Card Stats × Quantity) for all non-booster cards
GM = Σ (Base GM × GM Multiplier[rarity] × Quantity) for Rare+ cards only
```

### Dungeon Rewards

```
Base Reward = Mission Base Tokens × Dungeon Factor
Bonus Reward = Raid Power × 0.1
Repeat Multiplier = max(0.1, 1 − Repeat Count × 0.15)
Fatigue Multiplier = (Fatigue = 0) ? 1 : min(1, Mastery / max(1, Fatigue))
Adjusted Bonus = Bonus Reward × Repeat Multiplier × Fatigue Multiplier
Final Tokens = floor(Base Reward + random(0, Adjusted Bonus))
```

### Booster Soft Cap

```
Raw Boost = Σ (Booster Multiplier[rarity] × Quantity)
Effective Boost = Raw Boost / (1 + Raw Boost / 200)
Final Multiplier = 1 + (Effective Boost / 100)
```

### Potion Drop Rate

```
Base Chance = 10%
Luck Bonus = min(1.5, Luck / 4000)
Final Chance = min(25%, Base Chance × (1 + Luck Bonus) × Mission Multiplier)
```

### Training Mastery

```
Mastery Gained = floor(50 + Total Matching Luck / 100)
Minimum = 50
```

### Leaderboard Rewards *(not final — current values used for now)*

```
Global Pool = min(10,000, (Global Damage / 1,000,000) × 10,000)
Player Reward = floor((Player Damage / Total Damage) × Global Pool)
```

### Marketplace Fees

```
Listing Fee = 100 Realm Coins (non-refundable)
Sale Fee = 5% of sale price (deducted from seller)
Seller Receives = Price − floor(Price × 0.05)
```

&nbsp;

---

## Tips for Success

### Early Game (Levels 1-30)

1. **Spend your $10 starter Dollars** — Buy your first Standard / Booster Packs to seed your collection
2. **Run missions constantly** — Keep your energy working for you
3. **Buy Standard Packs** — Cheapest token-priced way to grow your card collection (every card rolled randomly)
4. **Complete story quests** — Special cards are powerful early game
5. **Join a guild at level 16** — Free passive bonuses immediately

### Mid Game (Levels 31-70)

1. **Unlock new territories** — Higher dungeon factors (up to 3.0×) mean much better rewards
2. **Start crafting** — Gather materials, components, and catalysts
3. **Run boss raids regularly** — Leaderboard rewards and crafting drops
4. **Balance your stats** — Don't neglect Mastery

### Late Game (Levels 71+)

1. **Target legendary crafts** — Plan material gathering across territories
2. **Manage booster diminishing returns** — Don't over-invest past soft cap
3. **Compete for top leaderboard spots** — Soul Shards compound your advantage
4. **Trade on marketplace** — Buy underpriced, sell high-demand

### General Strategy

- **Vary your missions** daily to avoid repeat penalties
- **Use EXP Potions** before long missions (60+ minutes)
- **Save Energy Potions** for grinding or Guild Wars
- **Check marketplace daily** for deals
- **Balance Raid Power and Mastery** — both matter for consistent rewards

&nbsp;

---

## Quick Reference Card

| System | Key Numbers |
|--------|-------------|
| **Energy** | 100 max, 1 per 3 min, 5 hr full recharge |
| **Rarities** | Common 65% / Uncommon 23% / Rare 10% / Epic 1.9% / Legendary 0.1% |
| **Stats** | Raid Power, Mastery, Luck, GM |
| **Territories** | 5 total, 2 dungeons + 2 bosses each |
| **Guild Max** | Level 15, 30 members, +50% bonuses |
| **Leaderboard** | Weekly reset Monday 00:00 UTC+8 |
| **Packs** | Standard (3 cards, all random) / Booster (1 card) |
| **Starter Bonus** | $10 in-game Dollars on registration |

&nbsp;

---

*May your raids be profitable and your cards legendary.*

**Play now:** [idleraiders.site](https://www.idleraiders.site)
**Full Documentation:** [idleraiders.site/docs](https://www.idleraiders.site/docs)
**Discord:** [discord.com/invite/PZzN2DKZxq](https://discord.com/invite/PZzN2DKZxq)
**Hive:** [@idleraiders](https://peakd.com/@idleraiders)
