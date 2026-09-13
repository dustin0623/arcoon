# Idle Raiders - Application Architecture

## Overview

Idle Raiders is a blockchain-integrated idle RPG built with Next.js 15 (App Router). Players collect cards, run missions, fight bosses, craft items, and compete on weekly leaderboards.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui components |
| State Management | React Context (AuthContext, GameContext, AudioContext) |
| Database | MongoDB with Mongoose ODM |
| Caching | Redis (via lib/config/redis.ts) |
| Blockchain | HIVE blockchain integration |
| Real-time | Socket.io for transaction updates |

---

## Directory Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   │   ├── cards/         # Card crafting, supply
│   │   ├── guilds/        # Guild CRUD, chat, donations
│   │   ├── items/         # Potions, packs, materials
│   │   ├── leaderboard/   # Weekly rankings
│   │   ├── market/        # Buy/sell listings
│   │   ├── missions/      # Start, complete missions
│   │   ├── players/       # Auth, state, energy
│   │   └── transactions/  # Blockchain deposits/withdrawals
│   ├── docs/              # Documentation page
│   ├── game/              # Main game pages
│   │   ├── crafting/      # Card crafting UI
│   │   ├── explore/       # Dungeon/mission selection
│   │   ├── guild/         # Guild management
│   │   ├── inventory/     # Cards, materials, potions
│   │   ├── leaderboard/   # Weekly rankings
│   │   ├── marketplace/   # P2P trading
│   │   ├── packs/         # Pack purchase/opening
│   │   ├── profile/       # Player stats
│   │   ├── wallet/        # Blockchain wallet
│   │   └── world/         # Story, dungeons, bosses
│   ├── login/             # Authentication
│   └── register/          # Account creation
│
├── components/            # React components
│   ├── game/             # Game-specific components
│   │   ├── guild/        # Guild tabs and modals
│   │   ├── leaderboard/  # Leaderboard tabs
│   │   └── world/        # Boss, dungeon, story tabs
│   ├── modals/           # Global modals
│   ├── popover/          # Header popovers
│   └── ui/               # shadcn/ui components
│
├── context/              # React Context providers
│   ├── AuthContext.tsx   # Authentication state
│   ├── GameContext.tsx   # Player state, API, socket
│   └── AudioContext.tsx  # Game audio management
│
├── features/             # Feature modules
│   ├── actions/          # API client functions
│   └── images/           # Image asset mappings
│
├── hooks/                # Custom React hooks
│   ├── useBlockchain.ts  # HIVE blockchain
│   ├── useHiveKeychain.ts# Keychain wallet
│   ├── usePlayer.ts      # Player state shortcuts
│   └── useTimer.ts       # Mission timers
│
├── lib/                  # Core business logic
│   ├── api/              # Auth utilities
│   ├── config/           # DB, Redis config
│   ├── modules/          # Domain modules (see below)
│   ├── queues/           # Transaction queue
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
│
└── public/
    ├── assets/           # Images, icons
    └── data/             # Game configuration (see below)
```

---

## Module Architecture

Each domain module in `lib/modules/` follows a consistent pattern:

```
lib/modules/{domain}/
├── {domain}.model.ts      # Mongoose schema and types
├── {domain}.repository.ts # Database operations (CRUD)
├── {domain}.service.ts    # Business logic
└── {domain}.logic.ts      # Pure calculation functions
```

### Modules

| Module | Purpose |
|--------|---------|
| `cards` | Card collection, crafting, transfers |
| `guilds` | Guild CRUD, membership, chat, donations |
| `histories` | Event logging for player actions |
| `items` | Materials, potions, packs |
| `leaderboards` | Weekly damage rankings |
| `markets` | P2P card trading |
| `missions` | Dungeon, story, boss missions |
| `players` | Player state, energy, XP |
| `snapshots` | Periodic state snapshots |
| `transactions` | Blockchain deposits/withdrawals |

---

## Game Data Configuration

Static game data lives in `public/data/`:

```
public/data/
├── index.ts              # Root aggregator
├── cards/                # Card definitions
├── items/                # Materials, potions, packs
├── world/                # Territories, dungeons, bosses
├── progression/          # Achievements, guild levels
├── system/               # Energy, fatigue, player limits
└── economy/              # Marketplace, conversion rates
```

The `GAME_DATA` object is imported throughout:
```typescript
import GAME_DATA from '@/public/data'

// Access cards, items, world data, etc.
const cards = GAME_DATA.CARDS
const territories = GAME_DATA.WORLD.TERRITORIES
const maxLevel = GAME_DATA.SYSTEM.PLAYER.MAX_LEVEL
```

---

## Core Game Flow

### 1. Authentication Flow

```
1. Player enters HIVE username
2. Sign challenge with Hive Keychain
3. Server verifies signature → issues JWT
4. JWT stored in cookie + localStorage
5. All API requests include Authorization header
```

### 2. Player State Flow

```
GameContext.fetchPlayerState()
  ↓
/api/players/state (GET)
  ↓
playerService.getPlayerState()
  ↓
player.builder.buildPlayerState()
  ↓
Returns: {
  username, level, xp, energy, coins, shards,
  stats, boosts, cards, materials, potions,
  activeMission, guildId, milestones...
}
```

### 3. Mission Flow

```
Start Mission:
  /api/missions/start → missionService.startMission()
    ↓
  Validates: energy, level requirements, no active mission
    ↓
  Creates Mission document, deducts energy
    ↓
  Sets player.activeMission

Complete Mission:
  /api/missions/complete → missionService.completeMission()
    ↓
  Routes to: completeDungeonMission | completeStoryQuest | completeBossMission
    ↓
  Calculates rewards (tokens, materials, XP, potions)
    ↓
  Updates player state, clears activeMission
```

### 4. Card/Item Flow

```
Open Pack:
  itemService.openPack()
    ↓
  Roll cards based on dropRates
    ↓
  cardService.addCard() for each
    ↓
  Update player milestones

Craft Card:
  cardService.craftCard()
    ↓
  Validate materials in inventory
    ↓
  Consume materials (itemRepo.decrementQuantity)
    ↓
  Add crafted card (cardRepo.upsertCard)
```

---

## Key Formulas (from logic files)

### XP & Leveling (`player.logic.ts`)
```typescript
getXPForLevel(level) = round(215 × 1.02^(level - 1))
MAX_LEVEL = 150
```

### Dungeon Rewards (`mission.logic.ts`)
```typescript
bonusReward = raidPower × 0.1
repeatMultiplier = max(0.1, 1 - repeatCount × 0.15)
fatigueMultiplier = min(1, mastery / max(1, fatigue))
finalTokens = baseReward + random(0, bonusReward × repeatMult × fatigueMult)
```

### Boss Damage (`mission.service.ts`)
```typescript
baseDamage = floor(raidPower × (0.8 + random() × 0.4))
finalDamage = max(1, baseDamage)
```

### Booster Soft Cap (`player.builder.ts`)
```typescript
if (rawBoost <= 100) return rawBoost
else return min(200, 100 + 100 × sqrt((rawBoost - 100) / 100))
```

### Potion Drop (`item.logic.ts`)
```typescript
BASE_CHANCE = 0.15
luckBonus = luck / (luck + 400)
potionChance = BASE_CHANCE × (1 + luckBonus) × missionMultiplier
```

### Guild XP (`guild.logic.ts`)
```typescript
XP_THRESHOLDS = [0, 7500, 19000, 37000, 63000, 101000, 155000, 232000, 340000, 500000]
MAX_GUILD_LEVEL = 10
```

### Leaderboard Rewards (`player.logic.ts`)
```typescript
EXPECTED_DAMAGE = 1,000,000
PREMIUM_POOL = 1,000 Soul Shards
pool = min(PREMIUM_POOL, (globalDamage / EXPECTED_DAMAGE) × PREMIUM_POOL)
playerReward = floor((playerDamage / totalDamage) × pool)
```

---

## API Structure

All API routes follow the pattern:
```typescript
// app/api/{resource}/{action}/route.ts
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.ok) return auth.response
  
  const { playerId } = auth.payload
  const body = await request.json()
  
  try {
    const result = await domainService.action(playerId, body)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
```

### Response Format
```typescript
// Success
{ success: true, data: {...}, delta?: Partial<PlayerState> }

// Error
{ success: false, error: "Error message" }
```

The `delta` field contains partial player state updates that the client can merge.

---

## Real-time Updates

Socket.io connection in `GameContext`:

```typescript
// Connect on auth
socket = io(WORKER_SOCKET_URL, {
  auth: { token, username }
})

// Listen for transaction completions
socket.on('transaction_success', (payload) => {
  patchPlayerState(payload.result.delta)
  toast.success(payload.message)
})
```

---

## Database Models

### Player
```typescript
{
  username: string
  isRegistered: boolean
  level: number
  xp: number
  coins: number      // Realm Coins (REALMC)
  shards: number     // Soul Shards (SSHRD)
  dollars: number    // Premium currency
  energy: number
  storageSlots: number
  missionStats: { fatigue, isExpBoostActive }
  milestones: { totalBossDamage, totalMissionsCompleted, storyProgress, ... }
  activeMission: ObjectId | null
  guildId: ObjectId | null
  dailyDungeonStats: { lastReset, runs: Map<string, number> }
}
```

### Card
```typescript
{
  owner: ObjectId
  cardId: string      // e.g., "hero_warrior_001"
  rarity: string
  type: string
  class?: string      // For boosters: xpBoost, materialBoost, energyBoost
  quantity: number
  source?: string     // "pack", "story", "craft", "market"
}
```

### Mission
```typescript
{
  owner: ObjectId
  type: "dungeon" | "story" | "boss"
  sourceName: string
  startTime: Date
  duration: number    // seconds
  dungeonId?: string
  missionTypeId?: string
  territoryId?: string
  questNumber?: number
  bossId?: string
  completedAt: Date | null
}
```

### Market Listing
```typescript
{
  seller: ObjectId
  sellerName: string
  listingType: "card"
  cardId: string
  cardName: string
  cardRarity: string
  cardType: string
  quantity: number
  price: number
  expiresAt: Date
  soldAt?: Date
  buyerName?: string
}
```

### Guild
```typescript
{
  name: string
  motto: string
  level: number
  xp: number
  members: [{
    playerId: ObjectId
    name: string
    role: "leader" | "officer" | "member"
    totalGuildDamage: number
  }]
  chat: [{ sender, text, timestamp }]
}
```

---

## Environment Variables

Required:
```
MONGODB_URI          # MongoDB connection string
REDIS_URL            # Redis connection string
JWT_SECRET           # JWT signing secret
NEXT_PUBLIC_SERVER_URL    # Backend server URL
NEXT_PUBLIC_WORKER_SOCKET_URL  # Socket.io server
```

Optional:
```
HIVE_ACCOUNT         # Game's HIVE account
HIVE_ACTIVE_KEY      # For blockchain transactions
```

---

## Development Notes

### Adding a New Feature

1. **Data**: Add configuration to `public/data/`
2. **Model**: Create Mongoose schema in `lib/modules/{feature}/`
3. **Logic**: Add pure calculation functions to `{feature}.logic.ts`
4. **Repository**: Add CRUD operations to `{feature}.repository.ts`
5. **Service**: Implement business logic in `{feature}.service.ts`
6. **API**: Create route handlers in `app/api/{feature}/`
7. **Actions**: Add client-side API calls in `features/actions/`
8. **UI**: Build components and pages

### Testing Locally

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# The app runs on http://localhost:3000
```

### Key Design Decisions

1. **Separation of concerns**: Logic files contain pure functions, services handle orchestration
2. **Optimistic updates**: Client-side state patching via `patchPlayerState(delta)`
3. **Daily resets**: Dungeon repeat counts reset at midnight Manila time (UTC+8)
4. **Weekly resets**: Leaderboard resets Monday 00:00 UTC+8
5. **Soft caps**: Booster bonuses use sqrt diminishing returns above 100%
6. **Supply limits**: Cards can have max supply limits enforced during pack opening

---

## Guild War System

Guild Wars is an asynchronous PvP system where guilds compete for control of outposts and strongholds.

### War Structure
```
War Duration: 7 days
War Cooldown: 24 hours after declaration
Max Active Wars per Guild: 1

Territory Structure:
- 5 Outposts (capturable, provide valor generation)
- 1 Stronghold per guild (main base, destroyable)
```

### War Missions
```typescript
// Outpost Attack
energyCost: 40
duration: 1200 (20 minutes)
reward: valor based on tier

// Stronghold Attack
energyCost: 50
duration: 1800 (30 minutes)
reward: major valor on destruction

// War Supply Gathering
energyCost: 30
duration: 900 (15 minutes)
reward: war supplies for guild upgrades
```

### Valor & Rewards
```typescript
// Valor is the war currency
OutpostCapture = tier × 50 valor
StrongholdDamage = damage × 0.1 valor
DailyValorCap = 500 per player

// War Victory Conditions
Win: Destroy enemy stronghold OR hold majority outposts at war end
Rewards: War chest (materials, shards, tokens)
```

---

## Training System

Training allows players to earn XP and mastery without combat.

### Training Configuration
```typescript
// Training Mission
duration: 3600 (1 hour)
energyCost: 60
xpPerMinute: 2 (120 XP per session)
masteryGain: 5 per completion

// Training Grounds Unlock
Level 10+: Basic Training
Level 30+: Advanced Training
Level 60+: Elite Training
```

---

## Changelog Context

This document reflects the codebase as of the documented version. Key mechanics:
- Story quests have 25% card drop on first completion (blocking gate)
- Boss raids drop components (75%) and catalysts (25%)
- Material boost soft cap at 200% effective
- Guild minimum level requirement: 16
- Marketplace listing fee: 100 Realm Coins
- Marketplace sale fee: 5%
- Guild Wars: 7-day asynchronous PvP system
- Training: Alternative XP/mastery progression path
