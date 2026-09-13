/**
 * Manual Weekly Snapshot Script
 *
 * This script triggers a manual weekly finalization for both:
 * - Global Leaderboard (boss damage rankings)
 * - Guild War (war season with outposts/strongholds)
 *
 * After finalization, it starts new leaderboard and guild war for the next week.
 *
 * Usage: npm run snapshot:manual
 *
 * IMPORTANT: This finalizes the current week's data. The data is preserved
 * as historical record with status='finalized'.
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import { getRedisConnection, closeRedisConnection } from '../lib/config/redis'
import * as leaderboardService from '../lib/modules/leaderboards/leaderboard.service'
import * as leaderboardRepo from '../lib/modules/leaderboards/leaderboard.repository'
import * as guildwarService from '../lib/modules/guildwars/guildwar.service'
import * as guildwarRepo from '../lib/modules/guildwars/guildwar.repository'
import { getCurrentWeek } from '../lib/modules/leaderboards/leaderboard.logic'

const MONGODB_URI = process.env.MONGO_URI || ''

async function runManualSnapshot() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('           MANUAL WEEKLY SNAPSHOT - STARTED')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`Timestamp: ${new Date().toISOString()}`)

  try {
    // Connect to MongoDB
    console.log('\n[1/8] Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('      MongoDB connected')

    // Connect to Redis
    console.log('\n[2/8] Connecting to Redis...')
    const redis = getRedisConnection()
    await redis.ping()
    console.log('      Redis connected')

    // Get current week info
    const { weekNumber, weekStart, weekEnd } = getCurrentWeek()

    console.log('\n[3/8] Week Information:')
    console.log(`      Week Number: ${weekNumber}`)
    console.log(`      Week Start: ${weekStart.toISOString()}`)
    console.log(`      Week End: ${weekEnd.toISOString()}`)

    // ═══════════════════════════════════════════════════════════════
    // PART 1: GLOBAL LEADERBOARD
    // ═══════════════════════════════════════════════════════════════
    console.log('\n───────────────────────────────────────────────────────────────')
    console.log('       PART 1: GLOBAL LEADERBOARD FINALIZATION')
    console.log('───────────────────────────────────────────────────────────────')

    // Check if already processed
    const alreadyDistributed = await leaderboardService.rewardsDistributedForWeek(weekNumber)
    let leaderboardResult = {
      playerRewards: { count: 0, totalShards: 0, distributions: [] as any[] },
      guildRewards: { count: 0, totalShards: 0, distributions: [] as any[] },
    }

    if (alreadyDistributed) {
      console.log('\n[SKIPPED] Leaderboard rewards already distributed for this week')
    } else {
      // Check if active leaderboard exists
      const activeLeaderboard = await leaderboardRepo.findActive()
      if (!activeLeaderboard) {
        console.log('\n[SKIPPED] No active leaderboard found for this week')
      } else if (activeLeaderboard.entries.length === 0) {
        console.log('\n[SKIPPED] No leaderboard entries to process')
      } else {
        console.log(`\n[4/8] Found ${activeLeaderboard.entries.length} players on leaderboard`)

        // Compute rewards preview
        console.log('\n[5/8] Computing reward distribution...')
        const computedData = await leaderboardService.getComputedLeaderboardData()
        console.log(`      Global Pool: ${computedData.global.pool} shards`)
        console.log(`      Guild Pool: ${computedData.guild.pool} points`)

        // Finalize leaderboard and distribute rewards
        console.log('\n      Finalizing leaderboard and distributing rewards...')
        const result = await leaderboardService.finalizeWeeklyLeaderboard(weekNumber, true)
        leaderboardResult = result.rewardsDistributed
        
        console.log(`      Players Rewarded: ${leaderboardResult.playerRewards.count}`)
        console.log(`      Total Shards: ${leaderboardResult.playerRewards.totalShards}`)
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // PART 2: GUILD WAR
    // ═══════════════════════════════════════════════════════════════
    console.log('\n───────────────────────────────────────────────────────────────')
    console.log('       PART 2: GUILD WAR FINALIZATION')
    console.log('───────────────────────────────────────────────────────────────')

    const activeGuildWar = await guildwarRepo.findActiveByWeek(weekNumber)
    let guildWarResult = { count: 0, totalPointsDistributed: 0 }

    if (!activeGuildWar) {
      console.log('\n[SKIPPED] No active guild war found for this week')
    } else if (activeGuildWar.status === 'finalized') {
      console.log('\n[SKIPPED] Guild war already finalized for this week')
    } else {
      console.log(`\n[6/8] Found guild war with ${activeGuildWar.entries.length} participating guilds`)
      console.log(`      Outposts: ${activeGuildWar.outposts.length}`)
      console.log(`      Strongholds: ${activeGuildWar.strongholds.length}`)

      if (activeGuildWar.entries.length > 0) {
        console.log('\n      Guild War Standings:')
        const sortedEntries = [...activeGuildWar.entries].sort((a, b) => b.points - a.points)
        sortedEntries.slice(0, 5).forEach((entry, i) => {
          console.log(`        ${i + 1}. ${entry.guildName}: ${entry.points} points`)
        })
      }

      // Finalize guild war and distribute rewards
      console.log('\n      Finalizing guild war and distributing rewards...')
      try {
        const result = await guildwarService.finalizeGuildWar(weekNumber)
        guildWarResult = result.rewardsDistributed
        console.log(`      Guilds Rewarded: ${guildWarResult.count}`)
        console.log(`      Total Points Distributed: ${guildWarResult.totalPointsDistributed}`)
      } catch (error) {
        console.error('      Error finalizing guild war:', (error as Error).message)
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // PART 3: START NEW WEEK
    // ═══════════════════════════════════════════════════════════════
    console.log('\n───────────────────────────────────────────────────────────────')
    console.log('       PART 3: STARTING NEW WEEK')
    console.log('───────────────────────────────────────────────────────────────')

    // Start new leaderboard
    console.log('\n[7/8] Creating new leaderboard for next week...')
    const newLeaderboard = await leaderboardRepo.findActive()
    if (newLeaderboard && newLeaderboard.weekNumber === weekNumber + 1) {
      console.log(`      New leaderboard already exists for week ${weekNumber + 1}`)
    } else {
      // New leaderboard will be created automatically when first entry is added
      console.log('      New leaderboard will be created when first entry is added')
    }

    // Start new guild war
    console.log('\n[8/8] Creating new guild war for next week...')
    try {
      const newGuildWar = await guildwarService.getOrCreateCurrentGuildWar()
      console.log(`      Guild war for week ${newGuildWar.weekNumber} is ready`)
      console.log(`      Outposts: ${newGuildWar.outposts.length}`)
      console.log('      Guilds can now join the war!')
    } catch (error) {
      console.error('      Error creating new guild war:', (error as Error).message)
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════')
    console.log('                    SNAPSHOT COMPLETE')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log(`Week ${weekNumber} finalized!`)
    console.log('')
    console.log('GLOBAL LEADERBOARD:')
    console.log(`  Players Rewarded: ${leaderboardResult.playerRewards.count}`)
    console.log(`  Total Shards: ${leaderboardResult.playerRewards.totalShards}`)
    console.log(`  Guilds Rewarded: ${leaderboardResult.guildRewards.count}`)
    console.log(`  Total Guild Points: ${leaderboardResult.guildRewards.totalShards}`)
    console.log('')
    console.log('GUILD WAR:')
    console.log(`  Guilds Rewarded: ${guildWarResult.count}`)
    console.log(`  Total Points Distributed: ${guildWarResult.totalPointsDistributed}`)
    console.log('')
    console.log('NEW WEEK:')
    console.log(`  Week ${weekNumber + 1} is now active`)
    console.log('  New leaderboard and guild war are ready')
    console.log('═══════════════════════════════════════════════════════════════')
  } catch (error) {
    console.error('\n[ERROR] Snapshot failed:', error)
    throw error
  } finally {
    // Cleanup connections
    await mongoose.disconnect()
    await closeRedisConnection()
    console.log('\nConnections closed. Exiting.')
  }
}

// Run the script
runManualSnapshot()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
