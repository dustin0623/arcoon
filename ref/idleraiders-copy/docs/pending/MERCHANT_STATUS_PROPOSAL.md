# Merchant Status Feature Proposal

## Overview

This document presents three proposals for implementing a **Merchant Status** system for players, tied to the **Phoenix Merchant Guild** lore. The merchant status is a passive achievement system based on player activity in the marketplace (buying/selling cards) and the trader (material upgrades). This is not a gameplay feature that affects combat or raids - it is purely a recognition/prestige system.

---

## Lore Foundation

From the Phoenix Merchant Guild hierarchy in `GAME_LORE.md`:

| Rank | Description |
|------|-------------|
| **Grand Phoenix** | Supreme leader (not achievable by players) |
| **Phoenix Master** | Regional leaders who control territory operations |
| **Phoenix Keeper** | Senior merchants who manage major establishments |
| **Phoenix Trader** | Journeyman merchants handling day-to-day trade |
| **Phoenix Apprentice** | New members learning the trade |

**Guild Motto:** "From Ashes, Prosperity"  
**Philosophy:** "Gold knows no allegiance"

---

## Proposal A: Simple Points-Based Ranking

### Concept

A straightforward system where players earn **Merchant Points (MP)** from trading activities, and their rank is determined by total accumulated points.

### Point Earning

| Activity | Points Earned |
|----------|---------------|
| Sell a card on marketplace | 10 MP |
| Purchase a card from marketplace | 5 MP |
| Complete a trade at Trader | 3 MP per material tier upgraded |
| First sale of the day | +5 MP bonus |
| First purchase of the day | +3 MP bonus |

### Rank Thresholds

| Rank | Points Required | Badge Color |
|------|-----------------|-------------|
| Phoenix Apprentice | 0 MP | Bronze |
| Phoenix Trader | 500 MP | Silver |
| Phoenix Keeper | 2,500 MP | Gold |
| Phoenix Master | 10,000 MP | Crimson |

### Database Schema

```typescript
// Add to Player model
merchantPoints: { type: Number, default: 0 }
merchantRank: { type: String, enum: ['apprentice', 'trader', 'keeper', 'master'], default: 'apprentice' }
```

### UI Elements

- Merchant rank badge displayed on player profile
- Merchant rank shown next to seller name in marketplace listings
- Progress bar showing points to next rank
- Optional: Leaderboard for top merchants

### Pros
- Simple to implement and understand
- Clear progression path
- Easy to track and display

### Cons
- Points only go up, no decay or maintenance required
- Could encourage marketplace spam for points
- No differentiation between buy-heavy vs sell-heavy players

---

## Proposal B: Multi-Dimensional Reputation System

### Concept

A more nuanced system that tracks multiple aspects of trading behavior, creating a richer merchant identity. Players have separate reputation tracks that combine into an overall merchant status.

### Reputation Tracks

#### 1. Trade Volume (Coins Traded)
Total value of all marketplace transactions (buying + selling).

| Tier | Volume Required | Title |
|------|-----------------|-------|
| Bronze | 0 | Novice Trader |
| Silver | 50,000 coins | Active Trader |
| Gold | 250,000 coins | Veteran Trader |
| Crimson | 1,000,000 coins | Elite Trader |

#### 2. Deal Count (Transactions Completed)
Number of successful marketplace transactions.

| Tier | Deals Required | Title |
|------|----------------|-------|
| Bronze | 0 | First-Timer |
| Silver | 25 deals | Regular |
| Gold | 100 deals | Established |
| Crimson | 500 deals | Renowned |

#### 3. Craft Mastery (Trader Usage)
Number of material upgrade trades completed.

| Tier | Upgrades Required | Title |
|------|-------------------|-------|
| Bronze | 0 | Gatherer |
| Silver | 50 upgrades | Supplier |
| Gold | 200 upgrades | Artisan |
| Crimson | 1,000 upgrades | Master Craftsman |

### Overall Merchant Rank

The overall rank is determined by the lowest tier across all three tracks (weakest link), encouraging balanced activity:

| Combined Tiers | Merchant Rank |
|----------------|---------------|
| Any Bronze | Phoenix Apprentice |
| All Silver+ | Phoenix Trader |
| All Gold+ | Phoenix Keeper |
| All Crimson | Phoenix Master |

### Database Schema

```typescript
// Add to Player model
merchantStats: {
  totalVolume: { type: Number, default: 0 },      // Total coins traded
  totalDeals: { type: Number, default: 0 },       // Number of transactions
  totalUpgrades: { type: Number, default: 0 },    // Trader upgrades completed
  lastActivityAt: { type: Date }
}
```

### UI Elements

- Detailed merchant profile panel showing all three tracks
- Visual badges for each track tier
- Overall rank prominently displayed
- "Merchant Card" view showing trading specialty

### Pros
- Encourages diverse trading activity
- More meaningful progression
- Players develop unique merchant identities
- Harder to game/spam

### Cons
- More complex to understand
- Requires activity across multiple systems
- Players who only use marketplace won't progress in Craft track

---

## Proposal C: Active Reputation with Decay

### Concept

A dynamic system where merchant status must be maintained through continued activity. Reputation can decay over time, creating a "living" merchant ecosystem where only active traders hold high ranks.

### Reputation Points

Players earn and lose reputation based on activity:

#### Earning Reputation

| Activity | Reputation Gained |
|----------|-------------------|
| Sell a card | +15 RP |
| Buy a card | +10 RP |
| Complete trader upgrade | +5 RP |
| Successful sale within 24h of listing | +5 RP bonus |

#### Reputation Decay

- **Daily Decay:** -5 RP per day of inactivity (no marketplace/trader activity)
- **Minimum Floor:** Reputation cannot drop below rank threshold minus 10% (prevents instant demotion)
- **Grace Period:** No decay for first 3 days of inactivity

### Rank Thresholds

| Rank | Reputation Required | Decay Rate |
|------|---------------------|------------|
| Phoenix Apprentice | 0 RP | No decay |
| Phoenix Trader | 300 RP | -3 RP/day inactive |
| Phoenix Keeper | 1,500 RP | -5 RP/day inactive |
| Phoenix Master | 5,000 RP | -10 RP/day inactive |

### Database Schema

```typescript
// Add to Player model
merchantReputation: {
  current: { type: Number, default: 0 },
  peak: { type: Number, default: 0 },           // Highest ever achieved
  lastActivityAt: { type: Date },
  monthlyVolume: { type: Number, default: 0 },  // Reset monthly
  monthlyDeals: { type: Number, default: 0 }    // Reset monthly
}
```

### Scheduled Jobs

```typescript
// Daily job to process reputation decay
async function processMerchantDecay() {
  const inactivePlayers = await findPlayersInactiveFor(1, 'day')
  for (const player of inactivePlayers) {
    const decayAmount = getDecayForRank(player.merchantRank)
    await decrementReputation(player._id, decayAmount)
  }
}
```

### UI Elements

- Live reputation counter with trend indicator (rising/falling)
- "Last Active" indicator on merchant section in profile
- Notification when reputation is decaying
- Progress bar to next rank with decay warning

### Pros
- Creates active, engaged merchant community
- High ranks are meaningful bragging rights
- Prevents inactive players from holding top spots
- Encourages consistent marketplace activity

### Cons
- More complex to implement (scheduled jobs)
- May frustrate casual players
- Requires careful balance to avoid excessive grind
- Players may feel punished for taking breaks
- Purely cosmetic - no tangible benefit may reduce motivation

---

## Comparison Matrix

| Feature | Proposal A | Proposal B | Proposal C |
|---------|-----------|-----------|-----------|
| **Complexity** | Low | Medium | High |
| **Implementation Time** | 1-2 days | 3-4 days | 5-7 days |
| **Player Engagement** | Low | Medium | High |
| **Casual-Friendly** | Yes | Moderate | No |
| **Prevents Gaming** | No | Partial | Yes |
| **Maintenance** | None | None | Daily jobs |
| **Rewards Active Play** | No | Partial | Yes |
| **Lore Integration** | Basic | Good | Excellent |

---

## Recommendation

**For initial implementation:** Start with **Proposal A** for simplicity, then iterate.

**For long-term vision:** **Proposal B** offers the best balance of depth and accessibility.

**For competitive/engaged playerbase:** **Proposal C** creates the most meaningful merchant ecosystem but requires significant ongoing maintenance.

---

## Implementation Phases (If Approved)

### Phase 1: Core System
1. Add merchant fields to Player model
2. Create merchant service for point/reputation tracking
3. Hook into marketplace buy/sell events
4. Hook into trader upgrade events

### Phase 2: UI Integration
1. Add merchant badge component
2. Display rank and progress on existing player profile page
3. Show merchant rank badge next to seller name on marketplace listings
4. Add merchant section within profile (rank, points, progress bar)

### Phase 3: Enhancements (Optional)
1. Add merchant leaderboard (bragging rights)
2. Add merchant-specific achievements
3. Show "Top Merchants" section on marketplace page

---

## Confirmed Requirements

1. **No tangible benefits** - Merchant status is purely for bragging rights, no gameplay advantages (no reduced fees, no priority listings)
2. **Integrated into existing Profile page** - No separate Merchant Profile page, display merchant rank/progress within the current player profile
3. ~~Should merchant activity be visible to other players or kept private?~~ - TBD
4. ~~Should there be guild-level merchant rankings?~~ - TBD
5. ~~How does this interact with the Ember Tavern (casino)?~~ - TBD (Ember Tavern is a separate external app)

---

## Next Steps

1. Review proposals and select preferred approach
2. Finalize point/reputation values through playtesting
3. Design merchant badge/rank visuals
4. Plan database migration
5. Implement core tracking system
6. Add UI elements incrementally

---

*Document created: April 14, 2026*  
*Status: Awaiting Review*
