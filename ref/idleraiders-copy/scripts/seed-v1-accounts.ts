/**
 * Seed V1 Consolidated Accounts
 *
 * Creates accounts for all v1 players who participated in the pack purchase consolidation.
 * Each account is created with their allocated number of standard packs and the distribution
 * is logged to their history.
 *
 * This script is meant to be run ONCE before official launch to pre-populate the database
 * with all eligible v1 accounts and their pack allocations.
 *
 * Usage:
 *   pnpm seed:v1-accounts              # dry run, prints summary only
 *   pnpm seed:v1-accounts -- --apply   # actually writes to the database
 *
 * Safe to re-run: existing accounts are skipped (not overwritten).
 */

import 'dotenv/config'
import mongoose, { Types } from 'mongoose'
import Player from '../lib/modules/players/player.model'
import * as itemRepo from '../lib/modules/items/item.repository'
import History from '../lib/modules/histories/history.model'

const MONGODB_URI = process.env.MONGO_URI || ''
const APPLY = process.argv.includes('--apply')

// ═══════════════════════════════════════════════════════════════════════════════
// V1 Consolidated Account Data
// ═══════════════════════════════════════════════════════════════════════════════

interface V1Account {
  username: string
  packs: number
  consolidatedFrom?: number // number of accounts consolidated (if any)
}

const V1_ACCOUNTS: V1Account[] = [
  { username: 'tehox', packs: 592 },
  { username: 'vcelier', packs: 531, consolidatedFrom: 3 },
  { username: 'freedomprepper', packs: 490 },
  { username: 'yabapmatt', packs: 395 },
  { username: 'paleshelter', packs: 274, consolidatedFrom: 2 },
  { username: 'firstraider', packs: 238 },
  { username: 'speedtuning', packs: 238, consolidatedFrom: 2 },
  { username: 'silentriot', packs: 162 },
  { username: 'raythulhu', packs: 148 },
  { username: 'looftee', packs: 98 },
  { username: 'dekimasu', packs: 88 },
  { username: 'dadspardan', packs: 87 },
  { username: 'bakenbard', packs: 77 },
  { username: 'xurph', packs: 58 },
  { username: 'missalice', packs: 52, consolidatedFrom: 3 },
  { username: 'kobusu', packs: 48 },
  { username: 'yonyonsson', packs: 47, consolidatedFrom: 3 },
  { username: 'heemshowlive', packs: 39 },
  { username: 'windail1', packs: 38, consolidatedFrom: 1 },
  { username: 'charles1008', packs: 34, consolidatedFrom: 2 },
  { username: 'bengbenggg', packs: 22, consolidatedFrom: 1 },
  { username: 'miketronnn', packs: 21 },
  { username: 'samfoat', packs: 15 },
  { username: 'emru01', packs: 15 },
  { username: 'gamaweb', packs: 14 },
  { username: 'blockgaming', packs: 13 },
  { username: 'outwars', packs: 11 },
  { username: 'atomcollector', packs: 11 },
  { username: 'sammonsters', packs: 11 },
  { username: 'warshire', packs: 10 },
  { username: 'artem7453', packs: 10 },
  { username: 'splcards', packs: 10 },
  { username: 'kitsuki', packs: 10 },
  { username: 'supersvs', packs: 10 },
  { username: 'sudeon', packs: 9 },
  { username: 'gezellig', packs: 8 },
  { username: 'lloydi', packs: 8 },
  { username: 'bandus', packs: 8 },
  { username: 'drstealth', packs: 8 },
  { username: 'miner007', packs: 8 },
  { username: 'thewobs94', packs: 7 },
  { username: 'grimmjoe', packs: 7 },
  { username: 'masummim50', packs: 7 },
  { username: 'frazfrea', packs: 7 },
  { username: 'velourex', packs: 6 },
]

// ═══════════════════════════════════════════════════════════════════════════════
// Seed Functions
// ═══════════════════════════════════════════════════════════════════════════════

async function createAccount(account: V1Account): Promise<{ created: boolean; playerId: Types.ObjectId | null; error?: string }> {
  try {
    // Check if account already exists (case-insensitive)
    const existing = await Player.findOne({ 
      username: { $regex: new RegExp(`^${account.username}$`, 'i') } 
    })
    
    if (existing) {
      return { created: false, playerId: existing._id, error: 'Account already exists' }
    }

    // Create the player account
    const player = await Player.create({
      username: account.username,
      isRegistered: true,
      level: 1,
      xp: 0,
      coins: 0,
      shards: 0,
      dollars: 0,
      energy: 100,
      storageSlots: 3,
      milestones: {
        totalBossDamage: 0,
        totalMinutesPlayed: 0,
        totalOpenedPacks: 0,
        totalCardsCollected: 0,
        totalCraftedCards: 0,
        totalMissionsCompleted: 0,
        totalTrainingSessions: 0,
        storyProgress: 0,
        missionCompletions: {},
      },
      missionStats: {
        fatigue: 0,
        mastery: 0,
        isExpBoostActive: false,
      },
      referredBy: 'v1_transition',
    })

    return { created: true, playerId: player._id }
  } catch (error) {
    return { created: false, playerId: null, error: (error as Error).message }
  }
}

async function distributePacks(playerId: Types.ObjectId, account: V1Account): Promise<{ distributed: boolean; error?: string }> {
  try {
    // Add packs to the player's inventory using the canonical Item schema fields
    // (`playerId`, `id`, `itemType`). The previous version used legacy field
    // names (`owner`, `name`, `type`) which no longer exist on the schema and
    // tripped strict-mode upsert validation.
    await itemRepo.incrementQuantity(playerId, 'standard_pack', 'pack', account.packs)

    return { distributed: true }
  } catch (error) {
    return { distributed: false, error: (error as Error).message }
  }
}

async function logDistribution(playerId: Types.ObjectId, account: V1Account): Promise<{ logged: boolean; error?: string }> {
  try {
    await History.create({
      username: account.username,
      source: 'system',
      eventType: 'v1_transition',
      eventKey: 'system.v1_pack_distribution',
      status: 'completed',
      actor: {
        playerId,
        username: account.username,
      },
      target: {
        entityType: 'pack',
        entityId: 'standard_pack',
        label: 'Standard Pack',
      },
      context: {
        service: 'system',
        action: 'v1_transition',
      },
      data: {
        type: 'v1_pack_distribution',
        packsDistributed: account.packs,
        consolidatedAccounts: account.consolidatedFrom || 0,
        reason: 'V1 pack purchase compensation - packs distributed at official launch',
        distributedAt: new Date().toISOString(),
      },
      metadata: {
        type: 'v1_pack_distribution',
        packsDistributed: account.packs,
        consolidatedAccounts: account.consolidatedFrom || 0,
        reason: 'V1 pack purchase compensation - packs distributed at official launch',
      },
      tags: ['v1_transition', 'pack_distribution', 'launch'],
    })

    return { logged: true }
  } catch (error) {
    return { logged: false, error: (error as Error).message }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Script
// ═══════════════��═══════════════════════════════════════════════════════════════

async function seedV1Accounts() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('         SEED V1 CONSOLIDATED ACCOUNTS')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`Mode: ${APPLY ? 'APPLY (writes will be committed)' : 'DRY RUN (no writes)'}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log(`Total accounts to process: ${V1_ACCOUNTS.length}`)
  console.log(`Total packs to distribute: ${V1_ACCOUNTS.reduce((sum, a) => sum + a.packs, 0).toLocaleString()}`)

  if (!MONGODB_URI) {
    console.error('\n❌ MONGO_URI is not set. Aborting.')
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URI)
  console.log('\n[1/4] MongoDB connected')

  // ─────────────────────────────────────────────────────────────────────────
  // Process each account
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[2/4] Processing accounts...\n')

  const results = {
    created: 0,
    skipped: 0,
    packsDistributed: 0,
    historyLogged: 0,
    errors: [] as string[],
  }

  for (const account of V1_ACCOUNTS) {
    const padUsername = account.username.padEnd(16)
    const padPacks = account.packs.toString().padStart(3)

    if (!APPLY) {
      console.log(`  [DRY] ${padUsername} → ${padPacks} packs`)
      results.created += 1
      results.packsDistributed += account.packs
      results.historyLogged += 1
      continue
    }

    // Step 1: Create account
    const createResult = await createAccount(account)
    
    if (!createResult.playerId) {
      console.log(`  [ERR] ${padUsername} → Failed to create: ${createResult.error}`)
      results.errors.push(`${account.username}: ${createResult.error}`)
      continue
    }

    if (!createResult.created) {
      // Account exists, but we still want to distribute packs if they don't have them
      const existingPacks = await itemRepo.findPack(createResult.playerId, 'standard_pack')

      if (existingPacks && existingPacks.quantity >= account.packs) {
        console.log(`  [SKP] ${padUsername} → Already has ${existingPacks.quantity} packs (expected ${account.packs})`)
        results.skipped += 1
        continue
      }
    }

    // Step 2: Distribute packs
    const packResult = await distributePacks(createResult.playerId, account)
    if (!packResult.distributed) {
      console.log(`  [ERR] ${padUsername} → Failed to distribute packs: ${packResult.error}`)
      results.errors.push(`${account.username}: Pack distribution failed - ${packResult.error}`)
      continue
    }

    // Step 3: Log to history
    const historyResult = await logDistribution(createResult.playerId, account)
    if (!historyResult.logged) {
      console.log(`  [WRN] ${padUsername} → Packs distributed but history log failed: ${historyResult.error}`)
    }

    const status = createResult.created ? 'NEW' : 'UPD'
    console.log(`  [${status}] ${padUsername} → ${padPacks} packs distributed`)
    
    if (createResult.created) {
      results.created += 1
    } else {
      results.skipped += 1
    }
    results.packsDistributed += account.packs
    if (historyResult.logged) {
      results.historyLogged += 1
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n[3/4] Summary')
  console.log('─────────────────────────────────────────────────────────────────')
  console.log(`  Accounts created:    ${results.created}`)
  console.log(`  Accounts skipped:    ${results.skipped}`)
  console.log(`  Packs distributed:   ${results.packsDistributed.toLocaleString()}`)
  console.log(`  History entries:     ${results.historyLogged}`)
  
  if (results.errors.length > 0) {
    console.log(`\n  Errors (${results.errors.length}):`)
    for (const error of results.errors.slice(0, 10)) {
      console.log(`    - ${error}`)
    }
    if (results.errors.length > 10) {
      console.log(`    ... and ${results.errors.length - 10} more`)
    }
  }

  if (!APPLY) {
    console.log('\n[4/4] DRY RUN — no writes performed.')
    console.log('      Re-run with `-- --apply` to commit changes.')
  } else {
    console.log('\n[4/4] All changes committed to database.')
  }

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('         SEED COMPLETE')
  console.log('═══════════════════════════════════════════════════════════════')

  await mongoose.disconnect()
}

seedV1Accounts().catch((err) => {
  console.error('\n❌ Seed failed:', err)
  process.exit(1)
})
