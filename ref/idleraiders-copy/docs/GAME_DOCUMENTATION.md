# Idle Raiders - Official Game Guide

Welcome to Idle Raiders, a blockchain-integrated idle RPG where you collect cards, run missions, fight bosses, craft powerful equipment, and compete on weekly leaderboards. This guide covers everything you need to know to master the game.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Gameplay](#core-gameplay)
3. [Stats & Combat](#stats--combat)
4. [Territories & World](#territories--world)
5. [Missions](#missions)
6. [Cards & Collection](#cards--collection)
7. [Crafting System](#crafting-system)
8. [Guild System](#guild-system)
9. [Guild Wars](#guild-wars)
10. [Marketplace](#marketplace)
11. [Leaderboard & Rewards](#leaderboard--rewards)
12. [Currencies](#currencies)
13. [Potions & Consumables](#potions--consumables)
14. [Training System](#training-system)
15. [Tips & Strategies](#tips--strategies)
16. [FAQ](#faq)

---

## Getting Started

### Creating Your Account

Idle Raiders uses **HIVE blockchain** for secure authentication. To play:

1. Navigate to the login page
2. Enter your HIVE username
3. Sign the authentication challenge with **Hive Keychain**
4. Your account is now linked and ready to play

### First Steps

When you first start playing:

- **Complete the tutorial** - Learn the basics of missions and card collection
- **Run your first mission** - Start with the Goblin Cave in Evershade
- **Spend your $10 starter Dollars** - Every new player receives **10 in-game Dollars** on registration. Use them to buy Standard Packs or Booster Packs and build your starting collection
- **Join a guild** - Once you reach level 16, join a guild for passive bonuses

---

## Core Gameplay

Idle Raiders is built around a simple but deep gameplay loop:

```
Run Missions → Earn Rewards → Collect Cards → Increase Stats → Run Harder Missions
```

### The Game Loop

1. **Start a Mission** - Spend energy to begin a timed mission
2. **Wait for Completion** - Missions run in real-time (even when offline)
3. **Collect Rewards** - Earn tokens, materials, XP, and sometimes potions or cards
4. **Improve Your Collection** - Buy packs, craft cards, or trade on the marketplace
5. **Progress Through the World** - Unlock new territories with higher rewards

### Energy System

- **Maximum Energy**: 100
- **Regeneration Rate**: 1 energy every 3 minutes (180 seconds)
- **Full Recharge**: 5 hours from empty

Energy is consumed when starting missions. Different mission types require different amounts of energy. Guild energy regen buffs (up to +50%) speed up recovery.

---

## Stats & Combat

Your combat effectiveness is determined by four core stats, calculated from your card collection.

### Core Stats

| Stat | Description | Effect |
|------|-------------|--------|
| **Raid Power (RP)** | Total combat strength | Determines boss damage and bonus token rewards |
| **Mastery** | Fatigue resistance | Counters fatigue penalty on bonus rewards |
| **Luck** | Fortune stat | Increases potion drop rate, drives training mastery gains |
| **GM (Global Modifier)** | General multiplier | +2% bonus per GM point (Rare+ cards only) |

### How Stats Are Calculated

Each non-booster card contributes stats based on its **type**, **rarity**, and **class**:

```
CardStats = BaseStats[type] × RarityMultiplier[rarity] × ClassModifier[class]
GM        = BaseGM × GMMultiplier[rarity]
```

**Base Stats Per Card Type** (raidPower / mastery / luck / gm):

| Type | RP | Mastery | Luck | GM |
|------|----|---------|------|-----|
| Hero | 60 | 30 | 0 | 1 |
| Equipment | 35 | 0 | 5 | 1 |
| Mount | 25 | 0 | 15 | 1 |
| Transport | 0 | 0 | 30 | 1 |
| Artifact | 25 | 25 | 0 | 1 |
| Booster | — | — | — | — |

Boosters **do NOT contribute stats**. They provide percentage boosts (XP, Material, Energy).

**Total stats** = sum of `CardStat × Card.quantity` across all non-booster cards.

### Fatigue System

Completing dungeon missions accumulates fatigue, which affects bonus rewards:

- **Fatigue Gain**: Each mission adds fatigue (10 / 20 / 35 / 60 / 90 for Scout / Patrol / Expedition / Siege / War Campaign)
- **Fatigue Effect**: Reduces bonus token rewards
- **Counter**: Mastery stat directly counters fatigue
- **Training Sessions and Boss Raids do not add fatigue**

**Fatigue Formula**:
```
If Fatigue === 0:                 100% bonus rewards
If Mastery === 0 && Fatigue > 0:  0% bonus rewards
Otherwise: min(1, Mastery / max(1, Fatigue))
```

---

## Territories & World

The world of Idle Raiders consists of five territories, each with unique dungeons, bosses, and story quests.

### Territory Overview

| Territory | Unlock Level | Dungeons | Bosses |
|-----------|--------------|----------|--------|
| **Evershade** | 1 | Goblin Cave, Spider Den | Goblin King, Spider Queen |
| **Sunspire Citadel** | 16 | Graveyard of Souls, Crypt of the Undying | Soul Reaver, Lich King |
| **Frosthold** | 31 | Ice Cavern, Dark Forest | Frost Giant, Ancient Treant |
| **Ember City** | 61 | Molten Quarry, Ashen Fortress | Ember Colossus, Ash Lord |
| **Iron Citadel** | 91 | Demon's Gate, Dragon's Lair | Demon Lord, Ancient Dragon |

### Story Quests

Each territory has **5 story quests** (25 total) that tell the tale of the Five Realms:

- **First Completion**: 15% chance to receive a unique story card (must succeed to advance)
- **Replays**: 85% materials, 15% random story card from the territory's already-unlocked story cards
- **Duration**: 60 minutes per quest
- **Energy Cost**: 60
- **XP**: 90 per completion (before boosters)

> **Note**: Story progress is blocking — you must receive the card drop on first completion to advance to the next quest.

---

## Missions

Missions are the primary way to earn rewards in Idle Raiders.

### Dungeon Missions

| Type | Duration | Energy | Base Tokens | Material Rolls | Fatigue | Unlock Requirement |
|------|----------|--------|-------------|----------------|---------|--------------------|
| Scout | 5 min | 15 | 50 | 1 | 10 | Always available |
| Patrol | 15 min | 25 | 100 | 3 | 20 | 10 Scouts in this dungeon |
| Expedition | 30 min | 45 | 250 | 6 | 35 | 15 Patrols in this dungeon |
| Siege | 1 hr | 60 | 500 | 12 | 60 | 20 Expeditions in this dungeon |
| War Campaign | 3 hr | 80 | 750 | 36 | 90 | 25 Sieges in this dungeon |

Base tokens are multiplied by each dungeon's factor (1.2× to 3.0×).

### Mission Unlock System

Missions are gated by **two independent rules**:

1. **Level → makes the tier appear.** The dungeon's `requiredLevel` controls whether a mission tab is shown at all. New dungeons unlock every 15 levels.
2. **Completions → makes the tier playable.** Inside an unlocked dungeon, you must complete a number of runs of the *previous* tier in *that same dungeon* before the next tier becomes playable.

Completion progress is tracked **per-dungeon**: clearing 10 Scouts in Goblin Cave unlocks Patrol there, but Whispering Woods still requires its own 10 Scouts. This rewards true dungeon mastery instead of letting players skip tiers in fresh zones once they've ground out an old one.

The lifetime counter is stored on `player.milestones.missionCompletions` as a sparse map keyed `${dungeonId}_${missionTypeId}` — only missions you've actually run create entries.

**Level Requirement** = `dungeon.requiredLevel + offset` where offsets are:
`scout +0, patrol +3, expedition +6, siege +9, war +12`

### Boss Raids

- **Duration**: 30 minutes (1800 seconds)
- **Energy Cost**: 30
- **XP**: 45 per raid
- **Drops**: 12 material rolls (2 per 5 minutes)
  - 75% Component (class-specific, boss-gated)
  - 25% Catalyst (rarity scales with boss tier)
- **Leaderboard**: Damage dealt counts toward weekly shard rewards

### Story Quests

- **Duration**: 60 minutes
- **Energy Cost**: 60
- **Rewards**: 15% chance of story card on first completion; otherwise materials or previously-unlocked cards on replay
- **XP**: 90 per quest

### Training

See the [Training System](#training-system) section for details.

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

Running the same dungeon+mission combo multiple times per day reduces **bonus** rewards (base reward is always guaranteed):

- **First run**: 100% bonus
- **Each repeat**: −15% bonus (minimum 10% remaining)
- **Reset**: Daily at midnight Manila time (UTC+8)

> **Tip**: Vary your missions to maximize bonus rewards.

### Dungeon Reward Formula

```
BaseReward        = mission.baseTokenReward × dungeon.dungeonFactor
EnergyScale       = mission.energyCost / 15        ← Scout = 1.00, War = 5.33
BonusReward       = RaidPower × 0.1 × EnergyScale
RepeatMultiplier  = max(0.1, 1 − repeatCount × 0.15)
FatigueMultiplier = (fatigue === 0) ? 1 : min(1, Mastery / max(1, Fatigue))
AdjustedBonus     = BonusReward × RepeatMultiplier × FatigueMultiplier
FinalTokens       = floor(BaseReward + random(0, AdjustedBonus))
```

> The **EnergyScale** keeps tokens-per-energy roughly constant across mission types.
> A 60-energy Siege rolls a bonus pool 4× larger than a 15-energy Scout, so committing
> energy to longer missions earns proportional rewards instead of being a flat tax.

| Mission | Energy | EnergyScale |
|---------|--------|-------------|
| Scout | 15 | 1.00× |
| Patrol | 25 | 1.67× |
| Expedition | 45 | 3.00× |
| Siege | 60 | 4.00× |
| War Campaign | 80 | 5.33× |

---

## Cards & Collection

Cards are the foundation of your power in Idle Raiders.

### Card Types

| Type | Role |
|------|------|
| **Hero** | Primary combat cards (balanced RP and Mastery) |
| **Equipment** | Weapons and armor (RP and Luck) |
| **Mount** | Creatures that boost mobility (RP and Luck) |
| **Transport** | Vehicles with high Luck |
| **Artifact** | Magical items with RP and Mastery |
| **Booster** | Percentage-based bonuses (XP / Material / Energy) — no stats |

### Card Rarities

| Rarity | Stat Multiplier | GM Multiplier | Pack Drop Rate |
|--------|-----------------|----------------|----------------|
| Common | 1× | 0× | 65% |
| Uncommon | 3× | 0× | 23% |
| Rare | 8× | 1× | 10% |
| Epic | 25× | 3× | 1.9% |
| Legendary | 100× | 6× | 0.1% |
| Special | 12× | 2× | Story / Craft only |

Example: a Legendary Hero has `60 × 100 = 6,000 base Raid Power` before class modifiers.

### Booster Cards

Booster cards provide percentage bonuses with diminishing returns:

- **XP Boosters**: Increase XP earned from missions
- **Material Boosters**: Increase material drops
- **Energy Boosters**: Increase energy regeneration

**Per-card boost values:**

| Rarity | Boost |
|--------|-------|
| Common | +2% |
| Uncommon | +5% |
| Rare | +10% |
| Epic | +15% |
| Legendary | +25% |

**Booster Soft Cap Formula**:
```
RawBoost       = Σ (BOOSTER_MULTIPLIERS[rarity] × card.quantity)
EffectiveBoost = RawBoost / (1 + RawBoost / 200)
FinalMultiplier = 1 + (EffectiveBoost / 100)
```

The formula asymptotes to **+200% effective boost (3.0× multiplier)** — you can never fully reach it.

### Card Packs

| Pack Type | Contents | Pricing |
|-----------|----------|---------|
| Standard Pack | 3 cards (each rolled independently) | 2,500 Realm Coins or **$1** *(sale)* / $2 *(regular)* |
| Booster Pack | 1 booster card | 250 Soul Shards or **$3** *(sale)* / $5 *(regular)* |

> **🎉 Launch Month Sale:** Standard Packs are **$1** and Booster Packs are **$3** during the first month. Prices return to $2 and $5 after the sale ends.

Both packs share the same rarity distribution: **Common 65%, Uncommon 23%, Rare 10%, Epic 1.9%, Legendary 0.1%**. Every card is rolled fully randomly — there is **no guaranteed Rare+** card.

---

## Crafting System

Craft powerful cards using materials gathered from missions.

### How Crafting Works

1. **Gather Materials** — Run dungeons to collect zone-specific core materials
2. **Collect Components** — Boss raids drop class-specific components (75% of drops)
3. **Obtain Catalysts** — Rarer boss drops (25% of drops) that **set the crafted card's rarity**
4. **Craft Your Card** — All 3 stacks (catalyst + material + component) are consumed and a new card is added to your collection

> Crafting **does not cost Soul Shards or Realm Coins** — catalysts are the rarity gate.

### Material Sources

| Territory | Dungeon Materials |
|-----------|-------------------|
| Evershade | Goblin Iron, Crude Leather, Silk Thread, Chitin Plate |
| Sunspire Citadel | Soul Ash, Grave Cloth, Necro Dust, Bone Rune |
| Frosthold | Frostwood, Glacial Shard, Elder Bark, Living Sap |
| Ember City | Cinder Stone, Magma Core, Ash Crystal, Charred Bone |
| Iron Citadel | Demon Ichor, Cursed Steel, Dragon Bone, Void Scale |

### Material Conversion

Don't have the materials you need? Trade them up at the **Material Trader**:

- **Ratio**: **5 source materials → 1 target material**
- **Direction**: Trade only goes **up to the next zone** (D1 → D2 → … → D9 → D10)
- **Cost**: **Dynamic** — `TargetZoneIndex × 25 Realm Coins`
  - D2 = 25, D3 = 50, D4 = 75, D5 = 100, D6 = 125, D7 = 150, D8 = 175, D9 = 200, D10 = 225
- D10 materials cannot be used as a source (no zone above)

### Crafting Tiers

Each recipe consumes exactly **3 stacks** — 1 material type + 1 component type + 1 catalyst:

| Rarity | Material | Component | Catalyst |
|--------|----------|-----------|----------|
| Common | 4 | 2 | 1× Common |
| Uncommon | 6 | 3 | 1× Uncommon |
| Rare | 8 | 4 | 1× Rare |
| Epic | 12 | 6 | 1× Epic |
| Legendary | 20 | 10 | 1× Legendary |

---

## Guild System

Guilds provide passive bonuses and cooperative gameplay.

### Joining or Creating a Guild

- **Level Requirement**: 16 (both to create and to join)
- **Creation Cost**: 10,000 Realm Coins
- **Max Members**: 30 per guild (regardless of level)
- **Max Guild Level**: 15 (1,000,000 cumulative XP)

### Guild Roles

| Role | Permissions |
|------|-------------|
| Leader | All permissions, can transfer leadership |
| Officer | Invite / kick members, edit guild info |
| Member | Donate materials, participate in guild activities |

### Guild Leveling & Buffs

Guilds gain XP from member donations. Each level unlocks improved buffs:

| Level | Cumulative XP | XP Bonus | Mat Bonus | Energy Regen | Boss Damage |
|-------|---------------|----------|-----------|--------------|-------------|
| 1 | 0 | 0% | 0% | 0% | 0% |
| 2 | 5,000 | 4% | 0% | 0% | 0% |
| 3 | 15,000 | 4% | 4% | 0% | 0% |
| 5 | 50,000 | 8% | 4% | 4% | 0% |
| 8 | 170,000 | 20% | 16% | 12% | 5% |
| 10 | 300,000 | 28% | 24% | 24% | 5% |
| 12 | 480,000 | 36% | 32% | 32% | 10% |
| 15 | 1,000,000 | **50%** | **50%** | **50%** | **15%** |

### Donation XP Rates

Donations are batched in groups of **5 materials per donation** (boss materials donate 1 at a time). The displayed XP is per single batch:

| Tier | Dungeons | XP per 5 Donated |
|------|----------|------------------|
| T1 | Goblin Cave, Spider Den | 25 |
| T2 | Graveyard of Souls, Crypt of the Undying | 37 |
| T3 | Ice Cavern | 50 |
| T3 | Dark Forest | 62 |
| T4 | Molten Quarry | 75 |
| T4 | Ashen Fortress | 87 |
| T5 | Demon's Gate | 112 |
| T5 | Dragon's Lair | 150 |

> Per-batch XP is computed as `floor(rate × 5 / 10)`. Boss-tagged materials skip the batching and award the full base rate per single material donated.

---

## Guild Wars

Guild Wars is a short-form PvP system where guilds battle for valor and rewards.

### War Basics

- **War Season**: 1 week — Monday 00:00 UTC+8 to Sunday 23:59 UTC+8 (aligned with the weekly leaderboard reset). The Sunday 16:00 UTC snapshot cron finalizes the war and starts the next season.
- **Attack Energy Cost**: 10
- **Attack Cooldown**: 30 minutes between attacks
- **Matchmaking**: ±20% guild power variance
- **Fortress HP**: 100,000 base + 5,000 per member
- **Requirements**: Minimum guild level 3, minimum 5 members

### Valor Earnings

| Source | Valor |
|--------|-------|
| Damage dealt | 1 per 1,000 damage |
| Damage received | 0.3 per 1,000 damage |
| Outpost capture bonus | +1,500 |
| Stronghold destroy bonus | +500 |

**Outpost Tier Multipliers**: T1 1.0×, T2 1.5×, T3 2.0×, T4 2.5×, T5 3.0×

### End-of-War Rewards

When a war ends, Guild Points are distributed to all participating guilds by their **final leaderboard rank** (see `distributeWarRewards`). There is no flat winner/loser valor bonus or victory title — your in-war valor and the rank you finish at are the rewards.

### War Supplies

Outposts generate supplies per hour: T1 10, T2 25, T3 50, T4 100, T5 200. Supplies power guild-wide buffs and repairs:

| Action | Cost | Effect |
|--------|------|--------|
| Repair Garrison | 50 | +10% fortress HP |
| Repair Outpost | 100 | +10% outpost HP |
| War Cry | 75 | +10% damage for 1 hour |
| Reinforce | 100 | +15% defense for 2 hours |
| Rally | 150 | Free attacks for 1 hour |
| Shield Wall | 200 | −25% damage received for 2 hours |

---

## Marketplace

Trade cards with other players on the peer-to-peer marketplace.

### Listing Cards

- **Listing Fee**: 100 Realm Coins
- **Duration**: 7 days (168 hours)
- **Cancellation**: Returns card to seller (listing fee not refunded)
- **Price Range**: 1 to 100,000 Realm Coins

### Buying Cards

- **Transaction Fee**: 5% of sale price (deducted from seller)
- **Payment**: Realm Coins only
- **Seller Proceeds**: `Price − floor(Price × 0.05)`

### Tips for Trading

- Check recent sales for fair pricing
- Higher rarity cards command premium prices
- Look for underpriced listings from new players
- Consider supply limits on rare cards

---

## Leaderboard & Rewards

Weekly leaderboards track boss damage and distribute Soul Shard rewards.

### How It Works

1. **Deal Boss Damage** — Every boss raid contributes to your weekly total
2. **Climb the Rankings** — Players ranked by total damage
3. **Earn Rewards** — Weekly reset distributes Soul Shards proportionally

### Reward Pool

- **Premium Pool**: 1,000 Soul Shards (maximum weekly payout)
- **Pool Scaling**: Fully activates when global damage reaches 1,000,000
- **Distribution**: Proportional to your share of total damage

```
GlobalPool   = min(1,000, (GlobalDamage / 1,000,000) × 1,000)
PlayerReward = floor((PlayerDamage / TotalDamage) × GlobalPool)
```

### Weekly Reset

- **When**: Monday 00:00 Manila time (UTC+8)
- **What Resets**: Leaderboard damage, reward distribution

---

## Currencies

Idle Raiders has three primary currencies:

### Realm Coins (REALMC)

- **Primary currency** for most in-game transactions
- **Earned from**: Dungeon missions, story quests
- **Used for**: Card packs, marketplace, guild creation, material conversion

### Soul Shards (SSHRD)

- **Premium currency** for rare purchases
- **Earned from**: Weekly leaderboard rewards, achievements, boss-related rewards
- **Used for**: Booster Packs and special items (crafting does **not** spend shards)

### Dollars

- **Real-money currency** (optional)
- **Used for**: Premium card packs, special offers

---

## Potions & Consumables

Potions provide powerful temporary effects.

### Potion Types

| Potion | Effect |
|--------|--------|
| Energy Potion | Refill energy to 100 |
| EXP Potion | 2× XP on next mission |

> **Note**: There is no Fatigue Potion. Fatigue is reduced only by increasing Mastery relative to your Fatigue total or letting it naturally decay.

### Obtaining Potions

- **Base Drop Chance**: 10% per mission completion
- **Luck Bonus**: `min(1.5, Luck / 4000)` added as multiplier on base chance
- **Hard Cap**: 25% drop chance
- **Per-mission multiplier**: scout 1.0×, patrol 1.2×, expedition 1.4×, siege 1.7×, war 2.0×
- **Drop Distribution**: 60% EXP Potion, 40% Energy Potion

### Potion Storage

The combined storage cap covers **both** potion types — Energy Potions and EXP Potions share the same slot pool. New potion drops are blocked once the cap is reached, so plan to use or expand before grinding.

| Property | Value |
|----------|-------|
| Starting Slots | 3 (shared across all potion types) |
| Expansion | Purchased — **+1 slot per 1 in-game Dollar** |
| Cap on Slots | None — buy as many as you can afford |
| Refunds | Slots are permanent and not refundable |

> Tip: New players get **$10 in-game Dollars** on registration, which is enough to take storage from 3 → 13 if you skip pack purchases. The expand button lives on the Energy Bar popover next to your potion counters.

---

## Training System

Training is an alternative progression path that earns XP and mastery without combat.

### Training Configuration

- **Duration**: 60 minutes
- **Energy Cost**: 40
- **XP**: 2 per minute (120 XP per session)
- **Mastery Formula**: `floor(50 + totalLuck / 100)` where `totalLuck` is the sum of Luck stats from matching card types

### Training Types

| Type | Scales With |
|------|-------------|
| Weapons | Equipment card Luck |
| Mount | Mount card Luck |
| Merchant | Transport card Luck |

Training uses the same active-mission slot as regular missions, so you can only do one activity at a time. Minimum mastery reward is 50 per session regardless of luck.

---

## Tips & Strategies

### Early Game (Levels 1-30)

1. **Focus on missions** — Run as many as your energy allows
2. **Use your $10 starter Dollars** — Buy a few Standard Packs to seed your collection
3. **Buy Standard Packs** — Cheapest path to grow your card collection (every card rolled randomly)
4. **Complete story quests** — Special cards are powerful early
5. **Join a guild at level 16** — Free passive bonuses

### Mid Game (Levels 31-70)

1. **Unlock new territories** — Higher dungeons give much better rewards (up to 3.0× factor)
2. **Start crafting** — Gather materials, components, and catalysts for crafts
3. **Run boss raids** — Earn leaderboard rewards and crafting drops
4. **Optimize your collection** — Focus on cards that boost your main stats

### Late Game (Levels 71-150)

1. **Target legendary crafts** — Plan material gathering across territories
2. **Manage booster returns** — Diminishing returns get aggressive past 200% raw
3. **Compete for top leaderboard spots** — Soul Shards scale with your share of global damage
4. **Trade on marketplace** — Buy underpriced cards, sell high-demand ones

### General Tips

- **Vary your missions** to avoid repeat penalties
- **Use EXP Potions** before 60-minute or longer missions for maximum XP
- **Save Energy Potions** for grinding sessions or Guild Wars
- **Balance Raid Power and Mastery** — Both matter for consistent rewards
- **Check marketplace daily** for deals

---

## FAQ

### Getting Started

**Q: How do I create an account?**
A: You need a HIVE blockchain account and the Hive Keychain browser extension. Sign in with your HIVE username.

**Q: What should I spend my first Realm Coins on?**
A: Buy Standard Packs to grow your card collection and boost your stats.

### Gameplay

**Q: How does the daily repeat penalty work?**
A: Running the same dungeon+mission combo multiple times per day reduces the bonus reward by 15% per repeat (minimum 10% remaining). Resets at midnight Manila time.

**Q: Why can't I progress in the story?**
A: Story quests require a card drop (15% chance) to advance on first completion. Keep retrying until you get the card.

**Q: Is it better to sell or keep duplicate cards?**
A: Keep duplicates early — they stack and multiply stat contributions. Sell only when you need tokens for specific purchases.

### Cards & Collection

**Q: What's the difference between booster cards and regular cards?**
A: Regular cards provide stats (RP, Mastery, Luck, GM). Booster cards provide percentage bonuses (XP, Materials, Energy) but no stats.

**Q: How do I get legendary cards?**
A: 0.1% chance per card from Standard or Booster Packs, or craft them using materials, components, and Legendary Catalysts, or buy from the marketplace.

### Guilds

**Q: When should I join a guild?**
A: As soon as you reach level 16. Guild buffs scale up to +50% XP / Material / Energy and +15% Boss Damage at max guild level.

**Q: How do I increase my guild's level?**
A: Donate materials. Donations are batched in groups of **5 materials**, and higher-tier dungeon materials give significantly more Guild XP per batch — up to **150 XP per 5 donated** from Dragon's Lair materials.

**Q: Who can participate in Guild Wars?**
A: Guilds of at least level 3 with at least 5 members.

### Economy

**Q: How do I get Soul Shards?**
A: Weekly leaderboard rewards based on your boss damage contribution, achievements, and some boss drops.

**Q: Can I trade materials?**
A: No, only cards can be traded on the marketplace. Materials can be **converted up to the next zone** at the Material Trader at a **5:1 ratio**, with a coin fee that scales by destination zone (`TargetZoneIndex × 25` Realm Coins — 25 for D2, up to 225 for D10).

---

## Version History

- **Current Version**: Latest
- **Last Updated**: April 2026

---

*Thank you for playing Idle Raiders! May your raids be profitable and your cards legendary.*
