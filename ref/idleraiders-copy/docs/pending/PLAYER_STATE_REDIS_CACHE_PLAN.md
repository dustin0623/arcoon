# Player State Redis Cache — Implementation Plan

> Scope: Cache the output of `buildPlayerState()` in Redis to eliminate the 3 MongoDB
> queries (Cards + Items + Mission) that run on every authenticated request. Evolution of
> Proposal 1 in `PLAYER_STATS_OPTIMIZATION_PROPOSALS.md`, refined against the actual game
> mechanics, the mutation surface, and the guild-bonus fan-out discovered during
> implementation of the guild energy-regen bug.

---

## 1. Executive Summary

| | |
|---|---|
| Goal | Cut p50 latency on every authenticated request by serving `PlayerState` from Redis on cache hit. |
| Approach | Short-TTL per-player cache (`player:{id}:state`, TTL 30s) with explicit invalidation at the repository / service layer. |
| Infra | Reuses existing self-hosted Redis (`REDIS_URL` + `ioredis` via `lib/redis/client.ts`). Already used by BullMQ workers. |
| Risk level | Low — graceful fallback to Mongo on any cache failure. |
| Estimated effort | 3–4 hours (Phase 1+2), +1 hour for guild fan-out (Phase 3). |

On a cache hit the request goes from **3 Mongo queries + a card-loop + a populated guild read** to **1 Redis GET + 1 JSON.parse**, dropping typical latency from 30–80 ms to 2–5 ms.

---

## 2. What `PlayerState` Actually Contains (Review)

Before caching we need to know what we are freezing for up to 30 seconds. The
current builder assembles a single object from five sources:

| Section | Source | Mutation frequency |
|---|---|---|
| `username`, `level`, `xp`, `coins`, `shards`, `dollars`, `energy`, `storageSlots`, `lastCycleUpdate`, `milestones`, `totalMissions`, `totalBossDamage`, `totalMinutesPlayed`, `missionStats`, `dailyDungeonStats`, `guildId`, `joinedAt` | `Player` document | Frequent — any mission, pack open, training, market trade, energy tick, donation |
| `stats` (`raidPower`, `mastery`, `luck`, `gm`) and `boosts` (`expBoost`, `matBoost`, `energyBoost`) | `Card` collection, aggregated per cardId via `CARDS_BY_ID` registry, passed through `applyBoostCap` | Whenever card quantities change |
| `cards[]` | `Card.find({ owner })` joined with registry | Craft, pack open, market buy/sell/cancel |
| `materials[]`, `potions[]`, `packs[]` | `Item.find({ playerId })` + `MATERIALS_BY_ID` | Mission rewards, pack open, conversion, potion use, donation |
| `activeMission` | `Mission.findById(player.activeMission)` | Mission start/complete |
| `guildBonuses` (`xpBonus`, `materialBonus`, `energyRegen`, `bossDamage`) | Populated `guildId.level` mapped through `PROGRESSION.GUILDS.LEVELS` | **Shared** — changes for all members when the guild levels up |
| `achievements[]` | Pure function of `stats`, `milestones`, cards, materials, coins, player level, guildId | Derived — changes whenever any of the above changes |

Two important properties fall out of this:

1. Every mutation in the game ultimately shows up in one of: `Player`, `Card`,
   `Item`, `Mission`, or `Guild`. We already have a thin repository layer
   around each of these, which is the ideal invalidation chokepoint.
2. `guildBonuses` is the only piece of state whose source-of-truth is **not**
   owned by the player. A guild level-up must invalidate every member, not
   just the donor.

---

## 3. Current Read/Write Pattern

### Read call sites (cache-eligible)

All of these end their happy path with `buildPlayerStateById(playerId)`:

```
app/api/players/state/route.ts            ← the hot read (GameContext polls this)
app/api/players/register/route.ts
app/api/players/storage/route.ts
app/api/training/start/route.ts
app/api/training/complete/route.ts
app/api/missions/start/route.ts
app/api/missions/complete/route.ts
app/api/missions/boss/route.ts
app/api/items/convert/route.ts
app/api/items/packs/route.ts                (returns state twice)
app/api/items/potion/route.ts
app/api/cards/craft/route.ts
app/api/market/sell/route.ts
app/api/market/listings/route.ts
app/api/guilds/route.ts
app/api/guilds/leave/route.ts
app/api/guilds/donate/route.ts
app/api/guilds/war/outpost/route.ts
app/api/guilds/war/stronghold/route.ts
app/api/guilds/war/complete/route.ts        (calls twice)
```

`GameContext.tsx:207` drives a foreground GET to `/api/players/state` on every
React mount / focus and after every mutation, so the **state endpoint is by
far the hottest read**.

### Write call sites (must invalidate)

Instead of enumerating every route, we use the natural chokepoints:

| Mongo collection | Repository | Functions we must invalidate on |
|---|---|---|
| `Player` | `lib/modules/players/player.repository.ts` | `updateById`, `updateByUsername`, `incrementField`, `setActiveMission`, `clearActiveMission`, `setGuild`, `setGuildId`, `updateGuildAndCoins`, `leaveGuild`, `deductEnergy`, `bulkIncrementShards`; plus any direct `player.save()` in `player.service.ts` (`collectMaterials`, `upgradeStorageSlots`, `getEnergy`) |
| `Card` | `lib/modules/cards/card.repository.ts` | `create`, `updateById`, `updateOne`, `upsertCard`, `incrementQuantity`, `decrementQuantity`, `deleteById`, `deleteOne` |
| `Item` | `lib/modules/items/item.repository.ts` | `create`, `updateById`, `updateOne`, `incrementQuantity`, `upsertItem`, `decrementQuantity`, `decrementQuantityById`, `deleteById`, `deleteOne` |
| `Mission` | `mission.repository.ts` / `mission.service.ts` | Mission start (sets `activeMission`), mission complete (clears `activeMission`, grants rewards) — invalidation already covered by the Player writes these flows perform |
| `Guild` | `guild.repository.ts` / `guild.service.ts` | Any change to `level` (donations, war rewards). Requires **guild-wide** fan-out — see Phase 3 |

### Silent mutation: energy regen

`getEnergy()` in `player.service.ts` mutates `player.energy` and
`player.lastCycleUpdate` on every cycle tick and calls `player.save()`. This
is hit by `POST /api/players/energy` and must invalidate the cache; otherwise
the tooltip and world page will show stale energy for up to 30 seconds after
a tick.

---

## 4. Design

### 4.1 Key schema

```
player:{playerId}:state              string, JSON-serialized PlayerState, TTL 30s
player:{playerId}:state:lock         string, SETNX lock for stampede protection, TTL 5s  (Phase 4, optional)
guild:{guildId}:members              set,    member playerIds, TTL 1h (rebuilt on miss)
```

All keys are prefixed `player:` / `guild:` so they never collide with BullMQ
queue keys (`bull:*`) or market job keys.

### 4.2 TTL choice

**30 seconds** is the sweet spot:

- `GameContext` only polls state after user actions, not on an interval, so
  90 % of repeat reads happen within the same tab session over a few seconds.
- Energy regen cycle is 15 minutes, so 30 s of stale energy is trivially
  correct for display.
- Mission timers on the client already count down locally off `startTime +
  duration`, so stale `activeMission` is a non-issue.
- Shards/coins are eventually-consistent from the user's perspective (they
  won't notice a 30-second lag on a number they can't spend yet).

Explicit invalidation on every mutation means the TTL is a **safety net**,
not the primary correctness mechanism.

### 4.3 Serialization

`PlayerState` contains `Types.ObjectId` fields (`guildId`) and `Date` fields
(`lastCycleUpdate`, `joinedAt`). `JSON.stringify` handles these but
`JSON.parse` returns strings, so we need a rehydrator:

```ts
function rehydrate(raw: CachedShape): PlayerState {
  return {
    ...raw,
    lastCycleUpdate: new Date(raw.lastCycleUpdate),
    joinedAt: raw.joinedAt ? new Date(raw.joinedAt) : null,
    // guildId stays as string — it's serialized to string anyway before leaving
    // the API boundary, and every consumer already treats it as a string.
  }
}
```

We store a `cacheVersion: 1` tag in the envelope so a schema bump (e.g. new
fields like `guildBonuses`) can auto-invalidate older cached blobs instead of
poisoning clients on deploy:

```ts
interface CacheEnvelope {
  version: number          // bump on PlayerState shape change
  cachedAt: number         // ms since epoch, for debug headers
  state: PlayerState
}
const CACHE_VERSION = 1
```

### 4.4 Fail-open philosophy

Every cache call is wrapped in try/catch. A Redis outage must **never** take
down the game — reads fall through to Mongo, writes just log and continue.

```ts
try {
  return await redis.get(key)
} catch (err) {
  console.warn('[playerStateCache] redis GET failed, falling back', err)
  return null
}
```

---

## 5. Implementation Plan

### Phase 1 — Cache module (1 hour)

**New file:** `lib/cache/playerStateCache.ts`

```ts
import { redis } from '@/lib/redis/client'
import type { PlayerState } from '@/lib/modules/players/player.builder'

const STATE_TTL_SECONDS = 30
const CACHE_VERSION = 1
const stateKey = (playerId: string) => `player:${playerId}:state`
const guildMembersKey = (guildId: string) => `guild:${guildId}:members`

interface CacheEnvelope {
  version: number
  cachedAt: number
  state: Omit<PlayerState, 'lastCycleUpdate' | 'joinedAt'> & {
    lastCycleUpdate: string
    joinedAt: string | null
  }
}

export async function getCachedPlayerState(playerId: string): Promise<PlayerState | null> {
  try {
    const raw = await redis.get(stateKey(playerId))
    if (!raw) return null
    const envelope = JSON.parse(raw) as CacheEnvelope
    if (envelope.version !== CACHE_VERSION) return null
    return {
      ...envelope.state,
      lastCycleUpdate: new Date(envelope.state.lastCycleUpdate),
      joinedAt: envelope.state.joinedAt ? new Date(envelope.state.joinedAt) : null,
    } as PlayerState
  } catch (err) {
    console.warn('[playerStateCache] get failed', err)
    return null
  }
}

export async function setCachedPlayerState(
  playerId: string,
  state: PlayerState
): Promise<void> {
  try {
    const envelope: CacheEnvelope = {
      version: CACHE_VERSION,
      cachedAt: Date.now(),
      state: state as unknown as CacheEnvelope['state'],
    }
    await redis.setex(stateKey(playerId), STATE_TTL_SECONDS, JSON.stringify(envelope))

    // Track membership for guild-wide invalidation (Phase 3).
    if (state.guildId) {
      await redis.sadd(guildMembersKey(state.guildId.toString()), playerId)
      await redis.expire(guildMembersKey(state.guildId.toString()), 3600)
    }
  } catch (err) {
    console.warn('[playerStateCache] set failed', err)
  }
}

export async function invalidatePlayerState(playerId: string | { toString(): string }): Promise<void> {
  try {
    await redis.del(stateKey(playerId.toString()))
  } catch (err) {
    console.warn('[playerStateCache] invalidate failed', err)
  }
}

export async function invalidateGuildMembers(guildId: string | { toString(): string }): Promise<void> {
  try {
    const members = await redis.smembers(guildMembersKey(guildId.toString()))
    if (members.length === 0) return
    const pipeline = redis.pipeline()
    for (const id of members) pipeline.del(stateKey(id))
    await pipeline.exec()
  } catch (err) {
    console.warn('[playerStateCache] guild invalidate failed', err)
  }
}
```

Unit tests (Vitest) cover: hit, miss, TTL expiry, version mismatch,
fail-open on Redis down, `Date` rehydration round-trip.

### Phase 2 — Integrate into `buildPlayerState` (45 min)

**Edit:** `lib/modules/players/player.builder.ts`

The cache layer lives **inside `buildPlayerStateById`** (the by-id variant
that controls how `player` is loaded and populated) rather than
`buildPlayerState(player)` — because `buildPlayerState(player)` takes an
already-loaded document and callers expect it to honour whatever they passed
in. Keeping the cache out of the lower-level function also means unit tests
and internal utilities that pre-load a player don't get surprise cache hits.

```ts
export async function buildPlayerStateById(
  playerId: string | Types.ObjectId,
  options: { skipCache?: boolean } = {}
): Promise<PlayerState> {
  if (!playerId) throw new Error('Player ID is required')
  const idStr = playerId.toString()

  if (!options.skipCache) {
    const cached = await getCachedPlayerState(idStr)
    if (cached) return cached
  }

  const player = await Player.findById(playerId)
    .populate('activeMission')
    .populate('guildId')
  if (!player) throw new Error('Player not found')

  const state = await buildPlayerState(player)
  // Best-effort write; a failure here just means the next read is a miss.
  await setCachedPlayerState(idStr, state)
  return state
}
```

Notes:
- `options.skipCache = true` is used for admin/debug routes and by
  `invalidate-and-rebuild` helpers.
- `buildPlayerState(player)` itself is unchanged — anyone who already holds a
  Mongoose doc bypasses the cache intentionally.

### Phase 3 — Invalidation at the repository layer (1.5 hours)

We centralise invalidation so route authors don't have to remember it.

**Edit:** `lib/modules/players/player.repository.ts` — wrap every mutation
function to invalidate after a successful write:

```ts
import { invalidatePlayerState } from '@/lib/cache/playerStateCache'

export async function updateById(id, update, options = { returnDocument: 'after' }) {
  const doc = await Player.findByIdAndUpdate(id, update, options)
  if (doc) await invalidatePlayerState(doc._id)
  return doc
}

export async function incrementField(id, field, amount) {
  const doc = await Player.findByIdAndUpdate(id, { $inc: { [field]: amount } }, { returnDocument: 'after' })
  if (doc) await invalidatePlayerState(doc._id)
  return doc
}

// same wrapping for: updateByUsername, setActiveMission, clearActiveMission,
// setGuild, setGuildId, updateGuildAndCoins, leaveGuild, deductEnergy

export async function bulkIncrementShards(updates) {
  const result = await Player.bulkWrite(...)
  // Invalidate each updated player in parallel.
  await Promise.all(updates.map(u => invalidatePlayerState(u.playerId)))
  return result
}
```

**Edit:** `lib/modules/cards/card.repository.ts` — every write invalidates
the owning player:

```ts
export async function upsertCard(owner, cardId, data) {
  const doc = await Card.findOneAndUpdate(...)
  if (doc) await invalidatePlayerState(owner)
  return doc
}
// same wrapping for: create, updateById, updateOne, incrementQuantity,
// decrementQuantity, deleteById, deleteOne.
// For deleteOne / updateOne where `owner` isn't in the filter, read the doc
// first or accept TTL-based eventual consistency.
```

**Edit:** `lib/modules/items/item.repository.ts` — mirror the card pattern.

**Edit:** `lib/modules/players/player.service.ts` — these methods do
`player.save()` directly and bypass the repo:

```ts
import { invalidatePlayerState } from '@/lib/cache/playerStateCache'

// collectMaterials: after player.save()
await invalidatePlayerState(player._id)

// upgradeStorageSlots: after player.save()
await invalidatePlayerState(player._id)

// getEnergy: after the `if (dirty) await player.save()` branch
if (dirty) {
  await player.save()
  await invalidatePlayerState(player._id)
}
```

**Guild level-up fan-out** (`lib/modules/guilds/guild.service.ts`):

Whenever guild `level` increases (via donation threshold or war rewards):

```ts
import { invalidateGuildMembers } from '@/lib/cache/playerStateCache'

if (newLevel > oldLevel) {
  await invalidateGuildMembers(guild._id)
}
```

Also on `joinGuild` / `leaveGuild` we invalidate the specific player (already
covered by `setGuild` in the repo). No guild-wide fan-out is needed for
membership changes because existing members' bonuses don't change when
someone joins or leaves.

### Phase 4 — Observability (30 min)

Add lightweight metrics to `playerStateCache.ts`:

```ts
// In-process counters, flushed to logs every 60s.
let hits = 0, misses = 0, errors = 0
setInterval(() => {
  const total = hits + misses
  if (total === 0) return
  console.log(`[playerStateCache] hits=${hits} misses=${misses} errors=${errors} hitRate=${(hits / total * 100).toFixed(1)}%`)
  hits = misses = errors = 0
}, 60_000)
```

(Wrap the `setInterval` in a module-level guard so HMR doesn't stack it up
in dev.)

Also include `X-Cache: HIT|MISS` on responses from `/api/players/state` for
quick in-browser verification:

```ts
const { fresh, state } = await buildPlayerStateByIdTraced(playerId)
return new Response(JSON.stringify({ playerState: state }), {
  headers: { 'X-Cache': fresh ? 'MISS' : 'HIT' },
})
```

### Phase 5 — Rollout (30 min)

1. Ship with a kill-switch env var `PLAYER_STATE_CACHE_DISABLED=1` checked
   inside `getCachedPlayerState` — returns `null` immediately when set.
2. Deploy to staging. Watch the hit-rate log line for 10 minutes across a
   normal play session; expected hit rate after warmup is 70–90 %.
3. Deploy to production. Monitor:
   - Mongo `db.currentOp()` QPS on `players`/`cards`/`items` — expect a
     sharp drop.
   - Next.js route p50/p95 for `/api/players/state`.
   - Redis memory (`INFO memory`) — a cached state is ~3–8 KB, so 10k
     concurrent players is ~50 MB worst case.

---

## 6. Edge Cases & Pitfalls

| Case | Handling |
|---|---|
| Two mutations race on the same player: A writes, B writes, A's invalidate runs after B's (out-of-order). | Both invalidate the same key; the **next** read repopulates from the post-commit DB state. No corruption possible because we never write stale state back — we only delete. |
| Cache stampede: 100 concurrent misses on a freshly-expired key. | Each one does 3 Mongo queries; the extra load is brief (30-second TTL limits repeats). If it becomes a problem, add a `SET NX EX 5` lock in `buildPlayerStateById` and have waiters re-GET once. Not worth the complexity in phase 1. |
| Writer crashes between Mongo commit and cache invalidate. | Stale data for up to 30 s. Acceptable. |
| Reader reads cache before writer's invalidate reaches Redis. | Same — stale for up to 30 s. Acceptable. |
| `buildPlayerState(player)` called directly with a stale in-memory `IPlayerDocument`. | By design we don't cache inside the low-level builder, so this call goes straight to Mongo via `Card.find` / `Item.find`. Safe. |
| Schema change adds a required field. | Bump `CACHE_VERSION`. Old envelopes are treated as cache misses and re-cached under the new version. No manual `FLUSHDB` needed. |
| `guildBonuses` fan-out misses a member whose state hasn't been cached yet. | `guild:{id}:members` only tracks players whose state was written to the cache. A member who hasn't been seen yet has no cached state to invalidate — they'll build fresh on their next read. |
| BullMQ market workers mutate cards/players outside the HTTP path. | Worker code calls the same repositories (`playerRepo.incrementField`, `cardRepo.upsertCard`), so repo-level invalidation covers it automatically. |
| `Player.bulkWrite` in reward distribution. | Already covered in `bulkIncrementShards` — iterate updates and invalidate each. Any future bulk helpers must follow the same pattern. |

---

## 7. Performance Model

Assume a playing user triggers 1 state rebuild every 3 seconds on average:

| Path | Ops per state build | Latency estimate |
|---|---|---|
| Cache hit | 1 `GET`, 1 JSON.parse | 1–3 ms |
| Cache miss | 1 `GET` + 3 Mongo reads + 1 populate + 1 `SETEX` + 1 `SADD` | 35–90 ms |
| Cache-bypass `buildPlayerState(doc)` | 3 Mongo reads | 30–80 ms |

With a target hit rate of 80 %, average latency is:

$$0.8 \times 2\ \text{ms} + 0.2 \times 60\ \text{ms} = 13.6\ \text{ms}$$

vs the current baseline of ~60 ms average, or about a **4.4× reduction in
average state-build cost** with zero Mongo reads on the common path.

Mongo load scales with misses only, so at 1000 concurrent users we go from
3000 queries/s to ~600 queries/s on the `players`/`cards`/`items` collections.

---

## 8. Not In Scope (Future Work)

- **Proposal 2 (denormalized stats)** — only worth doing if we ever need
  leaderboards sorted by `raidPower` without recomputing per-row. Until then
  the card-loop is ~0.1 ms and caching eliminates it entirely.
- **Proposal 3 (hybrid)** — natural next step at 2k+ concurrent users: we
  keep the Redis cache and add `player.computedStats` as a durable fallback
  so cache misses skip the card-loop. No schema changes required now.
- **Redis cluster / read replicas** — only at 10k+ players.
- **Per-field partial caching** (cache `cards` / `items` independently) —
  more invalidation surface, less clear win; revisit only if the state
  envelope grows beyond ~20 KB.

---

## 9. Implementation Checklist

### Phase 1 — Cache module
- [ ] Create `lib/cache/playerStateCache.ts` with `get`, `set`,
      `invalidatePlayerState`, `invalidateGuildMembers`, and a
      `PLAYER_STATE_CACHE_DISABLED` kill switch.
- [ ] Add `cacheVersion` envelope and `Date` rehydration.
- [ ] Vitest: hit / miss / expiry / version mismatch / fail-open.

### Phase 2 — Builder integration
- [ ] Wrap `buildPlayerStateById` with cache read/write and `skipCache`
      option. Leave `buildPlayerState(player)` untouched.

### Phase 3 — Invalidation
- [ ] Wrap every mutating function in `lib/modules/players/player.repository.ts`.
- [ ] Wrap every mutating function in `lib/modules/cards/card.repository.ts`.
- [ ] Wrap every mutating function in `lib/modules/items/item.repository.ts`.
- [ ] Add `invalidatePlayerState` calls in `player.service.ts` after each
      direct `player.save()` (`collectMaterials`, `upgradeStorageSlots`,
      `getEnergy`).
- [ ] Add `invalidateGuildMembers` calls on guild level-up inside
      `guild.service.ts`.

### Phase 4 — Observability
- [ ] Hit-rate counter with 60 s log flush, HMR-safe.
- [ ] `X-Cache: HIT|MISS` header on `/api/players/state`.

### Phase 5 — Rollout
- [ ] Deploy behind `PLAYER_STATE_CACHE_DISABLED` kill switch.
- [ ] Verify hit rate > 70 % in staging.
- [ ] Monitor Mongo QPS and Redis memory in production.
- [ ] Remove the kill switch once stable for 48 h.

---

## 10. Appendix — Why the repository layer (not the route layer)?

The original Proposal 1 checklist enumerated ~8 specific routes to
invalidate. In practice, once we trace back every mutation path:

- Mission complete writes to `Player` + `Item` + `Card` + `Mission`
- Market buy writes to `Player` + `Card` via a BullMQ worker (not a route
  at all)
- Guild donation writes to `Player` + `Guild` and can level up the guild,
  affecting **every member's** `guildBonuses`
- Energy regen writes to `Player` with no explicit route-level hook

Centralising invalidation at the repository layer means every one of these
paths — HTTP, worker, service-internal — is covered by the same 8 lines of
wrapping code, and future mutation paths are covered automatically as long
as they go through the repositories (which is the architectural rule in
`docs/ARCHITECTURE.md`).

The guild fan-out is the only thing the repository layer can't cover
cleanly, because `Guild` writes don't name the affected players. That's
handled explicitly in `guild.service.ts` where we already know whether the
level changed.
