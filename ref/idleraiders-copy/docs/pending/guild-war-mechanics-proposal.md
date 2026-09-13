# Guild War — Trade Caravan Raids Proposal

> Companion document to `guild-war-shields-proposal.md`. Shields focus on _defensive posture_; this document proposes a single, deeply-integrated **economic warfare mechanic** that creates a second battlefield alongside the existing stronghold/outpost fight.

## Elevator Pitch

Guilds dispatch **Trade Caravans** during war to earn bonus **War Supplies**. Every caravan picks a destination — one of your owned outposts, or one of the neutral territories. Higher-tier destinations pay more supplies but are easier to intercept. Enemy guilds see every in-flight caravan in the new **Caravans tab**, and can spend 15 minutes trying to raid it. Resolution is **RNG-based**, weighted by destination tier, outpost ownership, and escort investment.

No map. Card UI only. Single duration. **Supplies are the only reward — no valor, no materials, nothing else.** Every number is public by default.

---

## Design Principles

1. **Supplies only — no valor, no materials, no other currency.** Caravans pay **War Supplies**, full stop. Raiders earn **War Supplies** on successful intercepts, full stop. The whole loop is a supply-war: you ship supplies, they try to steal them.
2. **Energy-gated dispatch.** A caravan costs **50 energy** to dispatch. This ties the caravan loop to the game's existing energy rhythm — the same resource that gates missions — so regular players can run caravans as part of their normal play session without needing extra supply reserves up-front.
3. **No map needed.** Cards in a tab. Every caravan is a row with a countdown and an action button. Works on mobile, scales to any number of enemies.
4. **Pure RNG with public odds.** Every caravan shows its exact intercept chance before you commit. Both sides read the same number; the dice just roll on top. No fog of war, no scout sink — the math is already transparent enough that hiding it would only add friction.
5. **Outposts become valuable.** Owning an outpost is the only way to run **high-yield low-risk** caravans. Losing an outpost to an enemy locks you out of its safe lane.
6. **Guild-level gating mirrors outposts.** Territory tiers unlock with guild level, exactly like outposts. Solo / low-level guilds physically cannot dispatch to Tier 5 — no member-count gate, no griefing vectors, consistent with the system players already understand.
7. **Two clean outcomes.** Either the caravan **arrives** (shipper gets full payout, raider gets nothing) or it is **intercepted** (raider gets half the payout, shipper gets nothing). No consolation prizes, no partial payouts, no "close call" refunds.
8. **Tight loop.** One tier only: **30-minute caravan, 15-minute intercept window**. No long dead zones.

Integrates with:

- **Strongholds** — caravans dispatch _from_ the stronghold. A destroyed stronghold cannot dispatch.
- **Outposts** — owning an outpost unlocks it as a safe destination with reduced intercept chance.
- **War Supplies** — the sole caravan payout.
- **Energy** — the dispatch gate, same pool used by missions.
- **Missions** — caravans and raids are `IMission` records with new subtypes (`war_caravan_dispatch`, `war_caravan_raid`).

---

## Core Loop

### Single Caravan Tier

There is only **one caravan duration**: 30 minutes. Tier differentiation happens at the **destination**, not the caravan itself. A short flat duration means caravans always resolve inside a single play session, and raids always feel immediate.

| Attribute                           | Value                                                   |
| ----------------------------------- | ------------------------------------------------------- |
| Flight duration                     | **30 minutes**                                          |
| Intercept window                    | **15 minutes** (caravans in their final 15m are safe)   |
| **Dispatch cost**                   | **50 energy** (no supplies)                             |
| Base payout                         | **60 supplies** (multiplied by destination — see below) |
| Max caravans in flight per guild    | 3                                                       |
| **Max dispatches per player / day** | **5**                                                   |
| Max raids per player / day          | 3                                                       |

### Destinations — 10 Total

Every caravan must pick one of **10 destinations**: 5 outposts and 5 territories. Destination is the only thing the player chooses beyond dispatching.

- **Outposts (5)** — **must be owned by the dispatching guild**. Outposts give a safer lane because you garrison them. If you don't own it, you can't ship to it. Outpost tier access follows the existing outpost-ownership / guild-level rules already in `WAR_ECONOMY_CONFIG`.
- **Territories (5)** — **neutral**, always available to _qualified_ guilds, any side. Territories are higher-risk-higher-reward because they aren't garrisoned by anyone.

#### Territory Gating by Guild Level

To prevent a one-person guild from dumping into Tier 5 and getting farmed for 300-supply intercepts, **territory tiers unlock with guild level**, mirroring how outpost access already works. Concrete thresholds (tunable):

| Destination Tier | Min Guild Level to Dispatch |
| ---------------- | --------------------------- |
| Tier 1           | Level 1                     |
| Tier 2           | Level 3                     |
| Tier 3           | Level 5                     |
| Tier 4           | Level 7                     |
| Tier 5           | Level 10                    |

This is consistent with how outposts already gate; players don't need to learn a second system. Solo guilds can still participate in caravans — they simply don't have access to the lanes they can't afford to lose.

### Supply Multiplier by Destination Tier

The base payout (60 supplies) is multiplied by the destination tier.

| Destination Tier | Supply Multiplier | Outpost Payout | Territory Payout |
| ---------------- | ----------------- | -------------- | ---------------- |
| Tier 1           | 1.0×              | 60             | 60               |
| Tier 2           | 1.5×              | 90             | 90               |
| Tier 3           | 2.0×              | 120            | 120              |
| Tier 4           | 3.0×              | 180            | 180              |
| Tier 5           | 5.0×              | 300            | 300              |

(Same payout for an outpost and territory of equal tier. The difference is **intercept risk**, not reward.)

### Intercept Chance by Destination Tier

Every destination publishes a **base intercept chance**. This is the number shown on the enemy's caravan card, and the number the RNG rolls against at resolution.

| Destination Tier | Base Intercept Chance (Territory) | Intercept Chance if **Outpost Owned** by sender |
| ---------------- | --------------------------------- | ----------------------------------------------- |
| Tier 1           | 10%                               | 5% (−5%)                                        |
| Tier 2           | 20%                               | 10% (−10%)                                      |
| Tier 3           | 35%                               | 20% (−15%)                                      |
| Tier 4           | 55%                               | 35% (−20%)                                      |
| Tier 5           | 75%                               | 50% (−25%)                                      |

Two takeaways:

- **Territories are riskier.** A Tier 5 territory run is a 75% coin flip — big payout, mostly lost. Worth sending in volume when raiders are low on supplies.
- **Owning the outpost halves the risk.** A Tier 5 outpost run is 50% — still dangerous, but now a live strategic option. This is the first real mechanical reason to _own_ specific outposts rather than just _flip_ them for valor.

### Final Intercept Chance — Modifiers

The number shown on the card is the **base**, but three things can shift the final roll. All modifiers are additive, clamped to a 5%–95% floor/ceiling so no caravan is ever a free win or a sure kill.

| Modifier                   | Effect                   | Who pays / earns it                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------- |
| Sender owns the outpost    | −5% to −25% (tier-based) | Automatic, already shown above                        |
| Escort Upgrade (dispatch)  | **−15%**                 | Sender spends +30 supplies at dispatch time           |
| Reactive Boost (in flight) | **−10%**                 | Sender spends +50 supplies during the 15m raid window |
| Raid Party Upgrade         | **+10%**                 | Raider spends +25 supplies at raid dispatch           |

All modifiers are **visible on the relevant card**. No scout system — both sides see the live final chance at all times, including after an Escort Upgrade or Reactive Boost is applied.

> Note: Dispatch costs **energy**, but all combat-adjacent upgrades (Escort / Reactive Boost / Raid / Raid Party) cost **supplies**. This keeps energy as the "take the action" gate, and keeps supplies as the "how hard do you commit" knob.

---

## How Enemies See Caravans (No Map)

The whole system lives in **one new tab**: **Caravans**.

### The Caravans Tab

Added to the Guild War page alongside Battles, Leaderboard, Supplies. Two stacked sections, each a list of cards:

#### Section 1 — Your Caravans (up to 3 cards)

Each card shows:

- **Destination card** (visual banner — outpost emblem or territory crest, with tier stars 1–5).
- **ETA countdown** — big readable number, e.g. `22:14`.
- **Payout** — `120 supplies` (or post-upgrade value).
- **Intercept chance** — `35%`, color-coded (green <20, yellow 20–50, red >50).
- **Escort status** — Base / Upgraded (chip).
- **Action:** `Boost Escort (−10%) — 50 supplies`, disabled after first use or outside the raid window.

A `+ Dispatch Caravan` button at the bottom opens the dispatch modal. Disabled when you're at 3/3 in flight, hit your 5-dispatches/day cap, **your energy is below 50**, or your stronghold is destroyed.

#### Section 2 — Enemy Caravans

A list of every in-flight enemy caravan in the current war. Each row is a card showing:

- **Enemy guild banner**.
- **Destination name + tier** — e.g. `Ashen Wastes ★★★★` or `Gilded Reach Outpost ★★★`. Fully visible, no scouting required.
- **ETA countdown**.
- **Intercept chance** — exact percentage, e.g. `55%`, updated live when the owner upgrades escort.
- **Reward preview**: `90 supplies` (**50% of the caravan's payout** — what the raider actually takes).
- **Action:** `Intercept (15m) — 40 supplies` button. Greyed out if the caravan has <15m remaining, or you've hit your 3 raids/day cap.

Default sort: **best raid EV first** (intercept chance × raider share). Filters for destination tier and guild. Every number is transparent: the Caravans tab is a spreadsheet you can raid.

### Why No Scouting?

Earlier drafts included a 15-supply Scout action to reveal hidden fields. We cut it: **the math is already calculable**. Anyone can read the tier, look up the base chance, and subtract modifiers. Hiding numbers just punishes newer players and adds a supply sink that regular raiders route around. Public-by-default is cleaner, fairer, and removes an entire UI state.

---

## Interception — How a Raid Actually Works

A raid is a **15-minute mission** that rolls an RNG check against the caravan's final intercept chance on resolution.

### Step-by-step

1. **Spot the caravan.** Player opens Caravans tab, sees an enemy caravan with `26:00` ETA, destination `Ashen Wastes ★★★★`, intercept `55%`, reward `90 supplies` (50% of the 180 full payout).
2. **(Optional) Upgrade raid party.** Toggle in the raid modal. Spend 25 supplies to add **+10%** to the intercept chance for this raid.
3. **Confirm raid.** 40 supply cost. Raid mission starts with a 15-minute timer. The enemy's caravan card immediately shows an **incoming red chip** — "Raid inbound — 15m".
4. **Defender response window.** Caravan owner has 15 minutes to spend 50 supplies on a **Reactive Boost** (−10% intercept chance). This is the only defense available mid-flight.
5. **RNG resolution.** At the 15-minute mark, if the caravan is still in flight:
   - System computes final intercept chance (base + modifiers, clamped 5–95%).
   - Rolls a single uniform 0–100.
   - Roll ≤ final chance → **Raid succeeds**. Caravan is destroyed; raider receives 50% of the caravan's payout in supplies; sender gets 0.
   - Roll > final chance → **Raid fails**. Caravan arrives normally; sender gets full payout; **raider gets nothing**.
6. **Notify.** Both guilds get a Tavern / Discord event with the outcome, final %, and the roll.

Because each caravan can only be raided **once**, it's a first-come-first-serve race between enemy players. Subsequent raid clicks on the same caravan are blocked with "Already under raid".

### Raid Payouts — Two Clean Outcomes, Supplies Only

| Outcome                  | Raider Gets                    | Sender Gets         |
| ------------------------ | ------------------------------ | ------------------- |
| **Successful intercept** | **50% of caravan's payout**    | 0 supplies          |
| **Failed raid**          | **Nothing** (all supply costs) | Full caravan payout |

No valor on either side. No participation reward. No "close call" refund. Running your own caravan (a guaranteed full payout minus dispatch energy) is always more efficient in expectation than raiding — raids are **disruption**, not replacement economy. Failed raids are intentionally punishing: the 40-supply raid cost and 25-supply party upgrade are both burned, meaning raiders must actually pick their targets. High-% caravans are the safe play; the Tier 5 outpost at 35% is a gamble.

---

## UI Specification (Card-Based, No Map)

### 1. Caravans Tab

Add a new tab to `app/game/guildwar/page.tsx`. Tabs become: **Battles · Leaderboard · Supplies · Caravans**.

Layout: mobile-first vertical stack, max-width 640 on mobile, two columns on desktop (Your on left, Enemy on right).

### 2. Your Caravan Card

```
┌──────────────────────────────────────────┐
│  [Outpost Emblem]  TIER ★★★              │
│  Gilded Reach Outpost                    │
│                                          │
│  ETA  22:14                              │
│  Payout           120 supplies           │
│  Intercept        20% (owned)            │
│  Escort           Base                   │
│                                          │
│  [ Boost Escort (−10%)  50 supplies ]    │
└──────────────────────────────────────────┘
```

### 3. Enemy Caravan Card

```
┌──────────────────────────────────────────┐
│  [Ironclaw Banner]     TIER ★★★★         │
│  Ironclaw · Ashen Wastes · 28:42         │
│                                          │
│  Intercept         55%                   │
│  If intercepted    90 supplies (50%)     │
│                                          │
│  [        Intercept  40 supplies       ] │
└──────────────────────────────────────────┘
```

No scout button. No hidden fields. The number on the card is the number the RNG rolls against (plus any raider-side modifier applied at confirm time).

### 4. Dispatch Modal

A single-screen modal, no steps:

- **Destination picker** — segmented: `Your Outposts` | `Territories`. Grid of 5 cards per segment.
  - Locked outpost cards (not owned) are greyed with a lock icon and tooltip "Capture this outpost to dispatch here".
  - Locked territory cards (guild level too low) are greyed with a lock icon and tooltip "Unlocks at Guild Level N".
- Each destination card shows: tier stars, payout, intercept chance.
- **Escort Upgrade toggle** — "+30 supplies, −15% intercept".
- **Cost summary** — **"50 energy + (0 or 30) supplies"**, depending on whether Escort is toggled.
- **Confirm** with total cost and final intercept %. Confirm disabled if energy < 50.

### 5. Raid Confirmation Modal

- Target summary (guild, destination, ETA).
- **Final intercept chance** — large, exact number. Updates live as the player toggles Raid Party.
- **Potential reward** — `90 supplies` (50% of full payout), shown prominently.
- **Raid Party Upgrade toggle** — "+25 supplies, +10% intercept".
- **Reminder banner:** "Failed raids refund nothing. No valor is awarded — supplies only."
- **Confirm** with total supply cost and your final chance.
- Disabled state if the caravan ETA < 15m or daily cap hit, with a clear reason line.

### 6. Notifications (Tavern + Discord)

| Event                | Fires to     | Example copy                                                        |
| -------------------- | ------------ | ------------------------------------------------------------------- |
| `caravan_dispatched` | Owning guild | "Shadowmoon dispatched a Tier 4 caravan to Ashen Wastes."           |
| `caravan_under_raid` | Owning guild | "Ironclaw is raiding your caravan — 15m window. Boost escort now."  |
| `caravan_arrived`    | Both guilds  | "Shadowmoon caravan arrived. +180 supplies."                        |
| `caravan_raided`     | Both guilds  | "Ironclaw intercepted Shadowmoon's caravan. 55% roll hit. +90."     |
| `caravan_defended`   | Both guilds  | "Ironclaw's raid failed (roll missed 55%). Your caravan is safe."   |

---

## Integration Touchpoints

Concrete wiring for when this is scheduled:

- `lib/types/index.ts` — add `ICaravan`: `{ _id, guildId, destinationId, destinationType: 'outpost'|'territory', destinationTier: 1|2|3|4|5, dispatchedAt, arrivesAt, baseInterceptChance, interceptModifiers: { escortUpgrade, reactiveBoost }, payoutSupplies, escortUpgraded, status: 'in_flight'|'arrived'|'raided', activeRaid?: { raidId, raiderGuildId, partyUpgraded, resolvesAt } }`.
- `public/data/progression/progression.ts` — extend `WAR_ECONOMY_CONFIG` with a new `CARAVAN_CONFIG` block:

  ```ts
  CARAVAN_CONFIG: {
    FLIGHT_MINUTES: 30,
    INTERCEPT_WINDOW_MINUTES: 15,
    DISPATCH_ENERGY_COST: 50,   // energy, not supplies
    BASE_PAYOUT: 60,            // supplies
    TIER_MULTIPLIERS: { 1: 1, 2: 1.5, 3: 2, 4: 3, 5: 5 },
    INTERCEPT_CHANCE: {
      territory: { 1: 10, 2: 20, 3: 35, 4: 55, 5: 75 },
      outpost_owned_reduction: { 1: 5, 2: 10, 3: 15, 4: 20, 5: 25 },
    },
    TERRITORY_GUILD_LEVEL_GATE: { 1: 1, 2: 3, 3: 5, 4: 7, 5: 10 },
    MODIFIERS: { escortUpgrade: -15, reactiveBoost: -10, raidParty: 10 },
    ESCORT_COST: 30,           // supplies
    REACTIVE_BOOST_COST: 50,   // supplies
    RAID_COST: 40,             // supplies
    RAID_PARTY_COST: 25,       // supplies
    RAIDER_SHARE: 0.5,         // 50% of caravan payout on intercept
    FAILED_RAID_CONSOLATION: 0,
    // No valor fields — caravans and raids never award valor
    CARAVANS_PER_GUILD: 3,
    DISPATCHES_PER_DAY: 5,
    RAIDS_PER_DAY: 3,
    INTERCEPT_FLOOR: 5,
    INTERCEPT_CEILING: 95,
  }
  ```

- `lib/modules/guildwars/guildwar.service.ts` — new functions: `dispatchCaravan` (deducts 50 energy, not supplies), `initiateRaid`, `boostEscort`, `resolveCaravanArrival`, `resolveCaravanRaid`. The resolver performs the RNG roll, awards 50% payout on success, 0 on failure, and emits the Discord / Tavern events. **No valor mutations.**
- `lib/modules/missions/mission.service.ts` — two new subtypes: `war_caravan_dispatch`, `war_caravan_raid`.
- `app/game/guildwar/page.tsx` — new **Caravans** tab.
- `app/game/guildwar/_components/` — four new components: `caravan-card.tsx`, `caravan-enemy-card.tsx`, `caravan-dispatch-modal.tsx`, `caravan-raid-modal.tsx`.
- `lib/config/discord.ts` — add the five new event types listed above.
- Daily cap counters on the `IUser` or `IGuildMember` document: `caravanDispatchesToday` (cap 5), `caravanRaidsToday` (cap 3), reset at daily tick.

---

## Why This Works

- **Always something to do.** Shields can protect a stronghold; nothing protects a caravan. A war with every stronghold shielded still has up to 3 caravans per guild in flight at any moment, and each guild can push 5 per player per day.
- **Outpost ownership finally matters.** Before: outposts were valor generators. Now: they're the only way to run Tier 4/5 caravans at survivable odds.
- **Guild-level gating is consistent.** Territory access follows the same progression curve players already know from outposts — no new rule to learn.
- **Energy gating keeps pace with the rest of the game.** 50 energy per dispatch puts caravans in the same rhythm as missions — no separate "war fatigue" system, no new reset timers.
- **Card-first, mobile-first.** No map to render, no routes to simulate. Every interaction is a tap on a card.
- **Public math, hidden dice.** Both sides see the intercept %. Neither side knows the roll until it resolves. Every raid ends with a clean story — "They rolled 67 against a 55% intercept, we survived."
- **Supplies only, two clean outcomes.** Arrive or intercepted. Full payout or half to the raider. No valor, no other currency. The whole loop is a single resource war.
- **All-or-nothing raids.** Failing a raid costs 40–65 supplies and you get nothing back. Every raid click is a real decision, not a free lottery ticket.

---

## Open Questions

1. Do the **guild-level territory gates** (1/3/5/7/10) match the curve of existing outpost gates, or should they be tighter/looser? Likely want to align exactly with what `WAR_ECONOMY_CONFIG` already uses for outposts.
2. Should **guilds at war** also need to be within N levels of each other for Tier 5 lanes to be raidable? Prevents whale guilds from farming fresh guilds that stumbled into Tier 5 territory.
3. Daily caps of **5 dispatches / 3 raids** per player — tune after first-month telemetry?
4. Should the **Reactive Boost** stack with an already-applied Escort Upgrade, or does the defender get only one of the two per caravan? Current draft: both can apply for a combined −25%.
5. Should the 50-energy dispatch cost scale with destination tier (e.g. 30 for Tier 1, 70 for Tier 5), or stay flat? Current draft: flat 50 for every dispatch — simpler UX, and tier risk/reward is already encoded in intercept % and payout multiplier.

---

_Pair this with `guild-war-shields-proposal.md`. Shields protect what you have; caravans **create a reason to keep building it**. Caravans are never shielded, no matter what — turtling is punished._
