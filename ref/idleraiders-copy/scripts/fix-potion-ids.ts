/**
 * Migration Script: Fix Potion IDs
 * 
 * This script fixes the potion ID mismatch bug where potions were stored
 * with incorrect IDs ('exp' and 'energy') instead of the correct IDs
 * ('exp_potion' and 'energy_potion').
 * 
 * What this script does:
 * 1. Finds all items with incorrect potion IDs ('exp' or 'energy')
 * 2. Updates them to use the correct IDs ('exp_potion' or 'energy_potion')
 * 3. Merges quantities if the player already has potions with the correct ID
 * 4. Enforces the storage slot limit (default 3 slots)
 * 
 * Run with: npx ts-node --env-file-if-exists=/vercel/share/.env.project scripts/fix-potion-ids.ts
 */

import mongoose from 'mongoose'
import Item from '../lib/modules/items/item.model'
import Player from '../lib/modules/players/player.model'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable not set')
  process.exit(1)
}

interface PotionFix {
  playerId: string
  oldId: string
  newId: string
  quantity: number
  action: 'renamed' | 'merged' | 'capped'
}

async function fixPotionIds() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('Connected!')

  const fixes: PotionFix[] = []
  let totalFixed = 0
  let totalCapped = 0

  // Find all incorrectly named potions
  const wrongPotions = await Item.find({
    itemType: 'potion',
    id: { $in: ['exp', 'energy'] }
  })

  console.log(`Found ${wrongPotions.length} potions with incorrect IDs`)

  for (const wrongPotion of wrongPotions) {
    const playerId = wrongPotion.playerId.toString()
    const oldId = wrongPotion.id
    const newId = oldId === 'exp' ? 'exp_potion' : 'energy_potion'
    const quantity = wrongPotion.quantity ?? 0

    // Check if player already has a correctly named potion of this type
    const existingCorrectPotion = await Item.findOne({
      playerId: wrongPotion.playerId,
      itemType: 'potion',
      id: newId
    })

    if (existingCorrectPotion) {
      // Merge: add quantity to existing correct potion, delete the wrong one
      existingCorrectPotion.quantity = (existingCorrectPotion.quantity ?? 0) + quantity
      await existingCorrectPotion.save()
      await Item.findByIdAndDelete(wrongPotion._id)
      
      fixes.push({ playerId, oldId, newId, quantity, action: 'merged' })
      console.log(`  [MERGED] Player ${playerId}: ${oldId} (${quantity}) -> merged into existing ${newId}`)
    } else {
      // Rename: update the ID to the correct one
      wrongPotion.id = newId
      await wrongPotion.save()
      
      fixes.push({ playerId, oldId, newId, quantity, action: 'renamed' })
      console.log(`  [RENAMED] Player ${playerId}: ${oldId} -> ${newId} (qty: ${quantity})`)
    }

    totalFixed++
  }

  // Now enforce storage limits for all players with potions
  console.log('\nEnforcing storage limits...')
  
  const playersWithPotions = await Item.distinct('playerId', { itemType: 'potion' })
  
  for (const playerId of playersWithPotions) {
    const player = await Player.findById(playerId)
    const storageSlots = player?.storageSlots ?? 3
    
    const potions = await Item.find({ playerId, itemType: 'potion' })
    const totalQuantity = potions.reduce((sum, p) => sum + (p.quantity ?? 0), 0)
    
    if (totalQuantity > storageSlots) {
      // Cap potions to storage limit
      let remaining = storageSlots
      
      for (const potion of potions) {
        if (remaining <= 0) {
          // Delete excess potions
          await Item.findByIdAndDelete(potion._id)
          fixes.push({
            playerId: playerId.toString(),
            oldId: potion.id,
            newId: potion.id,
            quantity: potion.quantity ?? 0,
            action: 'capped'
          })
          totalCapped++
        } else if ((potion.quantity ?? 0) > remaining) {
          // Reduce quantity to fit
          const excess = (potion.quantity ?? 0) - remaining
          potion.quantity = remaining
          await potion.save()
          fixes.push({
            playerId: playerId.toString(),
            oldId: potion.id,
            newId: potion.id,
            quantity: excess,
            action: 'capped'
          })
          totalCapped++
          remaining = 0
        } else {
          remaining -= (potion.quantity ?? 0)
        }
      }
      
      console.log(`  [CAPPED] Player ${playerId}: ${totalQuantity} -> ${storageSlots} potions`)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Total potions with wrong IDs fixed: ${totalFixed}`)
  console.log(`Total players with excess potions capped: ${totalCapped}`)
  console.log(`Total fixes applied: ${fixes.length}`)

  await mongoose.disconnect()
  console.log('\nDisconnected from MongoDB. Migration complete!')
}

fixPotionIds().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
