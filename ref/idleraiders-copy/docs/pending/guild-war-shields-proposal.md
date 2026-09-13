# Guild War Depth Proposal — Shields & Protection Systems

**Status:** Draft / Design Proposal
**Author:** Game Design
**Date:** 2026-04-17
**Target feature:** New defensive layer for Guild War

---

## 1. Context

The current Guild War is a 24/7 chaotic PvPvE system where:

- Guilds fight over **5 outposts** (tiered 1→5, each with its own HP pool, supply rate, and valor multiplier).
- Each guild owns a **stronghold** (HP scales with guild level) that can be destroyed.
- Players attack for **100 energy** per war mission (5 min duration).
- **War supplies** are earned passively from held outposts and spent on:
  - Repairs (garrison, outpost)
  - 4 active buffs: `warCry`, `reinforce`, `rally`, `shieldWall`
- **Valor** is the ranking currency; rewards are distributed weekly based on valor share.
- Supply stealing, counter-attacks (from Reinforce), and Warlords perk already add tactical depth.

### Player Feedback

> "Can we introduce shields where we cannot get attacked, like 4h to 12h shields, as a buff?"

This is a common MMO / strategy-game request. Pure immunity shields are powerful but also **dangerous for the health of the war**: they can be used offensively, they can lock the map, and they can protect top guilds from ever losing valor.

Below are **three (3) full proposals** plus a **bonus hybrid** so the team can pick the direction that best fits Idle Raiders' tone.

---

## Design Pillars

Any shield system we ship should respect these rules:

1. **War should never stop being fun.** Shields must not create "dead hours" for attackers looking for targets.
2. **Top guilds should not snowball.** Shields must cost something meaningful relative to the benefit.
3. **You can't have your cake and eat it.** If you're shielded, your offensive power is limited — otherwise it becomes a strictly-better buff.
4. **Shields protect the underdog, not the champion.** The weaker / losing side should get the biggest structural benefit.
5. **Readable and fair.** Every player must see when a target is shielded and why they can't be attacked.

---

## Proposal A — Tiered Aegis Shields (Direct implementation of the player request)

A straightforward set of three **time-based stronghold immunity shields**, purchased from the supply shop like existing buffs.

### Shield Tiers

| Tier          | Duration | Supply Cost | Cooldown | Immunity Scope                |
| ------------- | -------- | ----------- | -------- | ----------------------------- |
| **Minor**     | 4 h      | 300         | 12 h     | Stronghold only               |
| **Standard**  | 8 h      | 600         | 20 h     | Stronghold only               |
| **Greater**   | 12 h     | 1,000       | 36 h     | Stronghold **+ 1 outpost**    |

> Costs are balanced against current buff costs (75–200) because a shield is strictly more valuable than a damage/defense buff. At a top-tier outpost (200/h), 1,000 supplies ≈ 5 hours of passive generation.

### Core Rules

- Shields ONLY protect the **stronghold** (and one chosen outpost at Greater tier).
- **Outposts remain attackable** — this is critical. The map must not lock up.
- Shield **breaks instantly** if the guild:
  - Attacks another guild's stronghold, OR
  - Captures an outpost from another guild.
  - (Attacking neutral outposts is still allowed — you can expand, you just can't aggress other players.)
- Shields **cannot stack**; buying a new one replaces the current shield.
- Shield state is **publicly visible** on the war map with a clear icon, countdown, and tooltip ("Aegis Shield — 3h 42m remaining").
- **Valor gain is reduced by 50% while shielded** — you're playing defensively, so you don't get to also climb the leaderboard at full speed.

### Anti-Abuse

- **New guilds** entering the war get a free 6 h "Newcomer Aegis" once per season to avoid instant farming.
- Shield **cannot be activated while under attack** (stronghold has taken damage in the last 10 minutes) — prevents panic-shielding mid-fight.
- Shield **breaks if the guild is reduced below a certain member count** (leavers abandoning shielded guild to avoid losses).

### Pros

- Simple to implement — mirrors the existing buff pipeline.
- Directly answers player feedback.
- Strongly helps casual and offline guilds.

### Cons

- Static immunity can feel boring for attackers finding only shielded targets.
- Requires careful cost tuning or top guilds will keep shields up permanently (the cooldowns above are designed to prevent this).

---

## Proposal B — Sanctuary Wards (Layered Shield, Not Immunity)

Instead of true invulnerability, shields become an **additional HP layer** on top of the stronghold. Attackers still see the guild as a valid target, but they have to grind through the ward first.

### How It Works

- Purchasing a Ward adds a **Ward HP pool** on top of the stronghold's current HP.
- Attacks must chew through Ward HP before touching real stronghold HP.
- Ward HP **regenerates slowly** (e.g. 1% / minute) while active.
- Ward **decays to 0 after 12 h** regardless of damage taken.

### Ward Tiers

| Ward              | Ward HP | Supply Cost | Regen    | Lifetime |
| ----------------- | ------- | ----------- | -------- | -------- |
| **Lesser Ward**   | 50,000  | 250         | 0.5%/min | 6 h      |
| **Greater Ward**  | 150,000 | 500         | 1%/min   | 12 h     |
| **Arcane Bulwark**| 300,000 | 900         | 1.5%/min | 12 h     |

### Interactions

- **War Cry** buff still works on attackers against warded targets, so aggressors aren't nullified.
- **Counter-attack** from Reinforce still fires off Ward damage.
- When a Ward is **fully broken**, the defending guild earns bonus valor and a public "The Ward of [Guild] has shattered!" tavern announcement — creating a narrative moment.
- Attackers who break a Ward earn a **"Ward Breaker" valor bonus** (e.g., +500 valor to the guild that lands the killing blow).

### Pros

- Keeps combat flowing — targets are always attackable.
- Creates emergent "siege" gameplay: multiple guilds might pile onto a warded target.
- Naturally self-balancing: rich guilds can maintain bigger wards, but they pay for it in damage received.
- Ward-break events are great for Discord notifications and rivalry creation.

### Cons

- More complex to implement (new HP layer, regen cycle on strongholds).
- Weaker guilds still get attacked, just with a buffer — doesn't fully solve the "I'm offline" problem.

---

## Proposal C — Adaptive Protection: Exhaustion & Sanctuary (Loss-driven, automatic)

Instead of a purchased buff, shields are **earned by being attacked**. This model flips the script: shields protect the losing side automatically, so no one is farmed into oblivion.

### Mechanics

Every guild has a hidden **Exhaustion Meter** (0–100) per day:

- +20 Exhaustion when stronghold is destroyed.
- +10 Exhaustion when an outpost is lost.
- +5 Exhaustion per 10% stronghold HP lost in a single attack window (30 min).
- –5 Exhaustion / hour during peaceful time.

When Exhaustion reaches **100**, the guild enters **Sanctuary State** automatically:

| Sanctuary Level    | Trigger            | Duration | Effect                                           |
| ------------------ | ------------------ | -------- | ------------------------------------------------ |
| **Rally**          | 100 Exhaustion     | 2 h      | Incoming damage -40%, valor gain +25%            |
| **Siege Broken**   | Stronghold destroyed | 4 h    | Stronghold un-attackable, outposts still open    |
| **Scorched Earth** | 3× destroyed in 24h | 12 h   | Full immunity, cannot attack either (true truce) |

### Key Properties

- **No supply cost.** Sanctuary is a mercy system, not a purchasable buff.
- **Cannot be gamed** by top guilds because you have to lose badly to trigger it.
- Tavern / Discord broadcasts create narrative: *"Guild X has fallen into Siege Broken — they have 4 hours to regroup."*
- The attacking guild that pushed a guild into Sanctuary gets a **"Dominator"** valor bonus — rewarding aggression.
- While in Sanctuary, the guild cannot **capture new outposts** during higher-tier sanctuaries (prevents hiding + expanding).

### Pros

- Elegant: shields appear exactly when players need them most.
- Zero bookkeeping for new players.
- Encourages continued attacking (attacker is rewarded for pushing a guild into sanctuary).
- Solves the "offline farming" complaint structurally.

### Cons

- Doesn't give players an **agency** answer to the original request ("I want to buy a shield before I go offline").
- Harder to communicate — requires good UI to explain the Exhaustion meter.

---

## Bonus — Proposal D — Diplomatic Treaties (Non-Aggression Pacts)

Player-driven shields, via in-game politics.

- Two guild leaders can sign a **Non-Aggression Pact (NAP)** for 12 / 24 / 48 h.
- While active, neither guild can attack the other's stronghold.
- Each NAP slot **consumes an active buff slot** — you trade offensive flexibility for safety.
- A guild can have a **maximum of 2 NAPs** at a time.
- Breaking a NAP early costs **2,000 supplies + 10% current valor** as penalty (prevents betrayal-at-zero-cost, but allows it for a strategic play).
- Public ledger: every NAP is listed on the war page for transparency. The community can see alliances forming.

### Why This Is Interesting

- Creates **guild diplomacy**, a fresh layer on top of combat.
- Encourages chat / Discord engagement between guild leaders.
- Limits abuse via the 2-slot cap and penalty mechanics.
- Can combine with any other proposal (A/B/C).

### Cons

- Needs new UI: treaty proposal, accept/decline, active-treaty list.
- In small populations, top guilds might NAP each other and stomp everyone else (mitigated by the 2-slot cap).

---

## Recommendation

For a first implementation, **we recommend shipping Proposal C (Adaptive Sanctuary) + a light version of Proposal A (Minor Aegis Shield only)**:

- **Sanctuary** fixes the systemic problem (losing guilds getting farmed) with zero cost.
- **Minor Aegis (4h, 300 supply, 12h cooldown)** gives the player the agency buff they actually asked for, priced steeply enough that it can't be exploited.
- **Proposal B (Wards)** becomes a natural **Season 2** expansion once the shield metagame stabilizes — it's great content but adds complexity.
- **Proposal D (NAPs)** is a natural **Season 3** social/diplomacy expansion.

This combo:

1. Answers the player request.
2. Structurally protects new / losing guilds.
3. Keeps the war feeling alive and attackable.
4. Gives us a clean roadmap for future Guild War seasons.

---

## Open Questions For the Team

1. Should shields **also protect outposts**, or only the stronghold? (Current proposals: only Greater Aegis protects 1 outpost; Wards are stronghold-only.)
2. Should shielded guilds still **earn valor**? (Proposal A says 50%, Sanctuary says 125% — worth aligning.)
3. Do we want shields to **interact with Guild Perks** (e.g. "Warlords" reduces shield cost, a new "Fortifier" branch extends duration)?
4. Should there be a **per-season shield cap** (e.g. max 5 shields purchased per week) to prevent total lockout?
5. Do we want shields to **be visible as a card asset** in the war map, similar to the existing buff icons?

---

## Technical Notes (implementation sketch)

- Extend `IWarBuff.type` union to include `'aegisMinor' | 'aegisStandard' | 'aegisGreater'` (Proposal A) or `'ward'` (Proposal B).
- Add a new field `IGuildWarEntry.exhaustion: number` and `IGuildWarEntry.sanctuaryUntil?: Date` (Proposal C).
- Extend `canAttackStronghold()` and `canAttackOutpost()` in `guildwar.logic.ts` to return `{ canAttack: false, reason: 'shielded' }` when applicable.
- Add `WAR_ECONOMY_CONFIG.SUPPLY_COSTS` and `BUFF_DURATIONS` entries for new shield types.
- Add a cron job pass (e.g. in `server/workers/worker.guildwar.ts`) to decay Exhaustion on a fixed interval.
- Add a new `war_shield_activated` Discord notification and a tavern broadcast on Sanctuary triggers.
