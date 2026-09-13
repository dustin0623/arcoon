# Events System Proposal

## Overview

This document outlines three proposals for implementing a time-based events system in Idle Raiders. Each proposal ties into the existing mission system and introduces a new `events.ts` card data file for event-exclusive rewards.

---

## Core Concepts (Shared Across All Proposals)

### New Data Structures

#### Event Cards (`public/data/cards/events.ts`)
```typescript
export const EVENT_CARDS: Card[] = [
  {
    id: 'event_winter_frost_knight',
    name: 'Frost Knight',
    type: 'hero',
    subtype: 'warrior',
    rarity: 'epic',
    stats: { attack: 65, defense: 70, speed: 25, luck: 20 },
    source: { type: 'event', eventId: 'winter_festival' },
    supply: { max: 500 },
    description: 'A knight blessed by the Winter Queen herself.',
  },
  // ... more event cards
]
```

#### Event Configuration (`public/data/events/events.ts`)
```typescript
export interface GameEvent {
  id: string
  name: string
  description: string
  type: 'holiday' | 'lore' | 'special'
  
  // Scheduling
  schedule: {
    startDate: string      // ISO date or 'MM-DD' for recurring
    endDate: string        // ISO date or 'MM-DD' for recurring
    recurring: boolean     // true for annual holidays
    year?: number          // specific year for one-time events
  }
  
  // Rewards
  rewards: {
    cardIds: string[]      // Event card IDs players can earn
    bonusTokens: number    // % bonus tokens during event
    bonusXP: number        // % bonus XP during event
  }
  
  // Missions
  missions: EventMission[]
  
  // UI
  banner: string           // Banner image path
  icon: string             // Icon for event card
  theme: {                 // UI theming
    primary: string
    secondary: string
    accent: string
  }
  
  // Admin
  enabled: boolean         // Toggle for quick enable/disable
}

export interface EventMission {
  id: string
  name: string
  description: string
  duration: number         // seconds
  energyCost: number
  requirements: {
    minLevel?: number
    requiredCards?: string[]
  }
  rewards: {
    eventPoints: number    // Currency to redeem event cards
    tokens: { min: number, max: number }
    xp: number
    cardDropChance?: number // Chance to drop event card directly
    cardId?: string        // Which card can drop
  }
}
```

---

## Proposal 1: Holiday Calendar Events

### Concept
A straightforward, config-driven system where events are tied to real-world holidays. Events automatically activate based on dates and offer time-limited missions with event-exclusive cards.

### How It Works

1. **Event Activation**: System checks current date against `events.ts` schedule
2. **Event Missions**: Special missions appear in a dedicated "Events" tab on the World page
3. **Event Points**: Completing missions earns "Event Points" (currency specific to that event)
4. **Event Shop**: Spend Event Points to redeem event cards from a limited-time shop
5. **Direct Drops**: Small chance to get event cards directly from missions

### Event Calendar Example
```typescript
export const HOLIDAY_EVENTS: GameEvent[] = [
  {
    id: 'winter_festival',
    name: 'Winter Festival',
    description: 'The frost spirits awaken! Complete special missions to earn Winter Cards.',
    type: 'holiday',
    schedule: {
      startDate: '12-15',
      endDate: '01-05',
      recurring: true,
    },
    rewards: {
      cardIds: ['event_frost_knight', 'event_snow_phoenix', 'event_ice_crown'],
      bonusTokens: 25,
      bonusXP: 25,
    },
    missions: [
      {
        id: 'winter_patrol',
        name: 'Winter Patrol',
        description: 'Guard the frozen northern borders.',
        duration: 1800,
        energyCost: 15,
        requirements: { minLevel: 5 },
        rewards: {
          eventPoints: 50,
          tokens: { min: 100, max: 200 },
          xp: 150,
        },
      },
      {
        id: 'frost_giant_hunt',
        name: 'Frost Giant Hunt',
        description: 'Track down the awakened Frost Giant.',
        duration: 3600,
        energyCost: 30,
        requirements: { minLevel: 10 },
        rewards: {
          eventPoints: 150,
          tokens: { min: 300, max: 500 },
          xp: 400,
          cardDropChance: 0.05,
          cardId: 'event_frost_knight',
        },
      },
    ],
    enabled: true,
  },
  {
    id: 'spring_bloom',
    name: 'Spring Bloom Festival',
    schedule: { startDate: '03-20', endDate: '04-10', recurring: true },
    // ...
  },
  {
    id: 'summer_solstice',
    name: 'Summer Solstice',
    schedule: { startDate: '06-15', endDate: '07-05', recurring: true },
    // ...
  },
  {
    id: 'harvest_moon',
    name: 'Harvest Moon Festival',
    schedule: { startDate: '09-20', endDate: '10-15', recurring: true },
    // ...
  },
]
```

### UI Flow
```
Explore Page
  └── Event Card (shows active event banner)
        └── Click → Event Page
              ├── Event Banner & Timer
              ├── Event Missions List
              ├── Event Points Balance
              └── Event Shop (Redeem Cards)
```

### Pros
- Simple to configure and maintain
- Players know when to expect events
- Easy to add new holidays
- Low development complexity

### Cons
- Less engaging narrative
- Predictable, may feel repetitive
- No progression between events

---

## Proposal 2: Lore-Based Story Events

### Concept
Events are driven by game lore and tell a story through progressive missions. Each event is a mini-narrative arc with chapters that unlock over time, culminating in a boss encounter and exclusive story cards.

### How It Works

1. **Chapter System**: Events have 3-5 chapters that unlock daily or every few days
2. **Story Missions**: Each chapter has missions with narrative text and cutscenes
3. **Boss Battles**: Final chapter features a raid-style boss with unique mechanics
4. **Story Cards**: Cards earned represent characters/items from the event story
5. **Permanent Lore**: Event stories become part of game lore, viewable in History

### Event Structure
```typescript
export interface LoreEvent extends GameEvent {
  type: 'lore'
  story: {
    prologue: string
    epilogue: string
  }
  chapters: EventChapter[]
  boss: EventBoss
}

export interface EventChapter {
  id: string
  title: string
  unlockDay: number        // Days after event start
  story: string[]          // Story text segments
  missions: EventMission[]
}

export interface EventBoss {
  id: string
  name: string
  description: string
  health: number
  weakness: string         // Card type that deals bonus damage
  rewards: {
    eventPoints: number
    guaranteedCard?: string
    tokens: { min: number, max: number }
  }
}
```

### Example Lore Event
```typescript
{
  id: 'shadow_invasion',
  name: 'The Shadow Invasion',
  type: 'lore',
  description: 'Darkness spreads from the Void Realm. Unite the kingdoms to push back the shadow.',
  
  story: {
    prologue: 'Strange portals have opened across the land, spewing forth creatures of pure darkness...',
    epilogue: 'With the Shadow Lord defeated, peace returns. But whispers speak of his eventual return...',
  },
  
  chapters: [
    {
      id: 'chapter_1',
      title: 'The First Signs',
      unlockDay: 0,
      story: [
        'Reports flood in from the eastern villages...',
        'You must investigate the source of these creatures.',
      ],
      missions: [
        {
          id: 'investigate_portals',
          name: 'Investigate the Portals',
          description: 'Scout the mysterious rifts appearing near villages.',
          duration: 1200,
          energyCost: 10,
          rewards: { eventPoints: 30, tokens: { min: 50, max: 100 }, xp: 100 },
        },
      ],
    },
    {
      id: 'chapter_2',
      title: 'Gathering Allies',
      unlockDay: 2,
      // ... unlocks 2 days after event starts
    },
    {
      id: 'chapter_3',
      title: 'The Final Stand',
      unlockDay: 5,
      // ... final chapter with boss
    },
  ],
  
  boss: {
    id: 'shadow_lord',
    name: 'The Shadow Lord',
    description: 'Master of the Void Realm, he seeks to consume all light.',
    health: 100000,
    weakness: 'artifact',
    rewards: {
      eventPoints: 500,
      guaranteedCard: 'event_shadow_blade',
      tokens: { min: 1000, max: 2000 },
    },
  },
  
  rewards: {
    cardIds: ['event_shadow_blade', 'event_void_walker', 'event_light_bringer'],
    bonusTokens: 15,
    bonusXP: 15,
  },
  
  schedule: {
    startDate: '2026-05-01',
    endDate: '2026-05-14',
    recurring: false,
  },
}
```

### UI Flow
```
Explore Page
  └── Event Card (shows current chapter)
        └── Click → Event Page
              ├── Chapter Progress Bar
              ├── Story Panel (with illustrations)
              ├── Current Chapter Missions
              ├── Boss Battle (when available)
              ├── Event Points & Shop
              └── Lore Archive (completed stories)
```

### Pros
- Rich narrative engagement
- Builds game world and lore
- Creates memorable experiences
- Encourages daily login for new chapters

### Cons
- Higher development effort (writing, art)
- Harder to make recurring
- Players who miss it miss the story
- Requires more content creation

---

## Proposal 3: Hybrid Event System

### Concept
Combines both approaches: recurring holiday events with light theming, plus major lore events that advance the game's story. Includes a unified event framework that supports both types.

### Event Types

| Type | Frequency | Duration | Content Depth | Rewards |
|------|-----------|----------|---------------|---------|
| **Holiday** | 4-6/year | 2-3 weeks | Light theme, 3-5 missions | Themed cards, bonuses |
| **Lore** | 2-3/year | 1-2 weeks | Full story arc, chapters | Story cards, exclusive items |
| **Mini** | Monthly | 3-5 days | Single mission chain | Small rewards, cosmetics |
| **Anniversary** | Yearly | 1 month | Major celebration | Premium cards, all bonuses |

### Unified Data Structure
```typescript
export interface HybridEvent {
  id: string
  name: string
  type: 'holiday' | 'lore' | 'mini' | 'anniversary'
  
  // Common fields
  schedule: EventSchedule
  rewards: EventRewards
  missions: EventMission[]
  enabled: boolean
  
  // Holiday-specific (optional)
  holiday?: {
    theme: string
    bonusMultiplier: number
  }
  
  // Lore-specific (optional)
  lore?: {
    chapters: EventChapter[]
    boss?: EventBoss
    story: { prologue: string, epilogue: string }
  }
  
  // Mini-specific (optional)
  mini?: {
    focusType: 'tokens' | 'xp' | 'materials' | 'cards'
    boostedZones?: string[]
  }
}
```

### Event Calendar (Example Year)
```
January:
  - Winter Festival (Holiday, Jan 1-15) [Recurring]
  
February:
  - Valentine's Quest (Mini, Feb 10-14) [Recurring]
  - The Lost Kingdom (Lore, Feb 20 - Mar 5) [One-time]
  
March:
  - Spring Bloom (Holiday, Mar 15-31) [Recurring]
  
April:
  - Anniversary Event (Anniversary, Apr 1-30) [Recurring]
  
May:
  - Token Rush (Mini, May 1-5) [Recurring]
  - Shadow Invasion (Lore, May 15-28) [One-time]
  
June:
  - Summer Solstice (Holiday, Jun 15 - Jul 5) [Recurring]
  
... and so on
```

### Event Points Economy
```typescript
// Unified event currency that persists across events
export interface EventCurrency {
  // Event-specific points (expire when event ends)
  eventPoints: Record<string, number>  // { 'winter_festival': 500 }
  
  // Universal event tokens (persist forever, earned from all events)
  eventTokens: number
  
  // Legacy points (converted from expired event points at 10:1 ratio)
  legacyPoints: number
}

// Shop tiers
// Tier 1: Event-specific cards (cost event points)
// Tier 2: Generic event cards (cost event tokens)
// Tier 3: Premium items (cost legacy points)
```

### Implementation Phases

**Phase 1: Foundation (2 weeks)**
- Event data structures and config
- Event service (activation, scheduling, rewards)
- Basic event page UI
- Event missions integration

**Phase 2: Holiday Events (1 week)**
- Holiday event config for 4 major holidays
- Event shop with point redemption
- Event cards (3-5 per holiday)

**Phase 3: Lore Events (2 weeks)**
- Chapter system implementation
- Story UI components
- Boss battle mechanics
- First lore event content

**Phase 4: Polish (1 week)**
- Event notifications
- History/archive for past events
- Event leaderboards (optional)
- Analytics integration

### UI Architecture
```
/app/game/events/
  ├── page.tsx              # Events hub (list all active/upcoming)
  ├── [eventId]/
  │   ├── page.tsx          # Individual event page
  │   ├── shop/page.tsx     # Event shop
  │   └── story/page.tsx    # Story viewer (lore events)
  
/components/events/
  ├── EventCard.tsx         # Card shown on Explore page
  ├── EventBanner.tsx       # Top banner for active events
  ├── EventMissionList.tsx  # Mission list component
  ├── EventShop.tsx         # Shop component
  ├── ChapterProgress.tsx   # Lore event chapter tracker
  └── BossBattle.tsx        # Boss encounter UI
```

### Pros
- Maximum flexibility
- Caters to different player preferences
- Keeps content fresh year-round
- Scalable system

### Cons
- Most complex to implement
- Requires ongoing content creation
- More systems to maintain
- Higher initial development cost

---

## Recommendation

**Start with Proposal 1 (Holiday Events)** as the foundation, then expand to **Proposal 3 (Hybrid)** over time.

### Rationale
1. Holiday events are simpler to implement and test
2. The data structures from Proposal 1 can be extended for Proposal 3
3. Players get events quickly while lore content is developed
4. Allows time to gauge player interest before investing in story content

### Suggested Roadmap
```
Month 1: Implement Holiday Event System
  - Event config and service
  - Basic event page
  - First holiday event (nearest upcoming)
  
Month 2: Add Mini Events
  - Quick-turnaround events
  - Focus events (2x tokens, 2x XP, etc.)
  
Month 3: Implement Lore Framework
  - Chapter system
  - Story UI
  - First lore event
  
Month 4+: Full Hybrid System
  - All event types operational
  - Event calendar planning
  - Regular content updates
```

---

## Database Schema

### Event Progress Collection
```typescript
interface PlayerEventProgress {
  odlayerId: ObjectId
  eventId: string
  
  // Progress
  eventPoints: number
  completedMissions: string[]
  currentChapter?: number      // For lore events
  bossContribution?: number    // Damage dealt to boss
  
  // Rewards claimed
  claimedRewards: string[]     // Card IDs already redeemed
  
  // Timestamps
  firstParticipation: Date
  lastActivity: Date
}
```

### Event State Collection
```typescript
interface EventState {
  eventId: string
  
  // Global progress (for lore events)
  globalBossHealth?: number
  totalParticipants: number
  
  // Leaderboard data
  topContributors?: Array<{
    odlayerId: ObjectId
    points: number
  }>
  
  // Admin overrides
  manuallyEnabled?: boolean
  extendedEndDate?: Date
}
```

---

## API Endpoints

```typescript
// Get active events
GET /api/events/active

// Get specific event details
GET /api/events/[eventId]

// Get player's event progress
GET /api/events/[eventId]/progress

// Start event mission
POST /api/events/[eventId]/missions/start
Body: { missionId: string, cardIds: string[] }

// Complete event mission
POST /api/events/[eventId]/missions/complete
Body: { missionId: string }

// Redeem event reward
POST /api/events/[eventId]/redeem
Body: { cardId: string }

// Attack boss (lore events)
POST /api/events/[eventId]/boss/attack
Body: { cardIds: string[] }
```

---

## Questions to Resolve

1. **Event Point Expiration**: Do event points expire immediately when event ends, or is there a grace period?

2. **Missed Events**: Can players ever get event cards after the event ends? (Legacy shop? Future re-runs?)

3. **Event Difficulty Scaling**: Should event missions scale with player level?

4. **Multiplayer Bosses**: For lore events, should boss health be global (all players contribute) or individual?

5. **Event Notifications**: Push notifications for event start/end? In-game only?

6. **Card Tradability**: Can event cards be sold on the marketplace?

---

## Next Steps

1. Review and select proposal approach
2. Finalize data structures
3. Create first event cards in `events.ts`
4. Implement event service
5. Build event UI components
6. Configure first holiday event
7. Test and iterate
