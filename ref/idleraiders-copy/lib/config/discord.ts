/**
 * Discord Webhook Configuration
 * 
 * This module handles Discord webhook notifications for game events.
 * Each channel has a dedicated webhook URL stored in environment variables.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export type DiscordChannel = 
  | 'registrations'
  | 'guild-war'
  | 'crafting'
  | 'pack-opening'
  | 'tavern'

export interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
  thumbnail?: { url: string }
  image?: { url: string }
  footer?: { text: string; icon_url?: string }
  timestamp?: string
}

export interface DiscordMessage {
  content?: string
  username?: string
  avatar_url?: string
  embeds?: DiscordEmbed[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Environment variable keys for each Discord webhook
 */
const WEBHOOK_ENV_KEYS: Record<DiscordChannel, string> = {
  'registrations': 'DISCORD_WEBHOOK_REGISTRATIONS',
  'guild-war': 'DISCORD_WEBHOOK_GUILD_WAR',
  'crafting': 'DISCORD_WEBHOOK_CRAFTING',
  'pack-opening': 'DISCORD_WEBHOOK_PACK_OPENING',
  'tavern': 'DISCORD_WEBHOOK_TAVERN',
}

/**
 * Embed colors for each channel (Discord uses decimal color values)
 */
export const CHANNEL_COLORS: Record<DiscordChannel, number> = {
  'registrations': 0x00FF00,  // Green - New players
  'guild-war': 0xFF0000,      // Red - War/Combat
  'crafting': 0xF39C12,       // Orange - Crafting
  'pack-opening': 0x9B59B6,   // Purple - Pack openings/Gacha
  'tavern': 0xFFD700,         // Gold - Highlight events (legendary pulls, captures, destructions)
}

/**
 * Rarity colors for card-related notifications
 */
export const RARITY_COLORS: Record<string, number> = {
  'common': 0x9E9E9E,     // Gray
  'uncommon': 0x4CAF50,   // Green
  'rare': 0x2196F3,       // Blue
  'epic': 0x9C27B0,       // Purple
  'legendary': 0xFFC107,  // Gold
  'mythic': 0xFF5722,     // Orange-Red
}

// ═══════════════════════════════════════════════════════════════════════════════
// Core Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get webhook URL for a specific channel
 */
function getWebhookUrl(channel: DiscordChannel): string | null {
  const envKey = WEBHOOK_ENV_KEYS[channel]
  return process.env[envKey] || null
}

/**
 * Send a message to a Discord webhook
 * Fails silently to avoid disrupting game flow
 */
export async function sendDiscordMessage(
  channel: DiscordChannel,
  message: DiscordMessage
): Promise<boolean> {
  const webhookUrl = getWebhookUrl(channel)
  
  if (!webhookUrl) {
    // Silently skip if webhook not configured
    console.log(`[Discord] Webhook not configured for channel: ${channel}`)
    return false
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      console.error(`[Discord] Failed to send message: ${response.status}`)
      return false
    }

    return true
  } catch (error) {
    console.error('[Discord] Error sending message:', error)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Channel-Specific Notification Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Notify when a new player registers
 */
export async function notifyRegistration(data: {
  playerName: string
  playerId: string
}): Promise<boolean> {
  return sendDiscordMessage('registrations', {
    embeds: [{
      title: 'New Raider Joined!',
      description: `**${data.playerName}** has joined Idle Raiders!`,
      color: CHANNEL_COLORS['registrations'],
      timestamp: new Date().toISOString(),
      footer: { text: 'Welcome to the adventure!' },
    }],
  })
}

/**
 * Notify guild war events (outpost attacks/captures, stronghold attacks, etc.)
 * Includes damage dealt and absorbed for combat events
 */
export async function notifyGuildWarEvent(data: {
  eventType: 'outpost_captured' | 'outpost_attacked' | 'stronghold_attacked' | 'stronghold_destroyed' | 'war_started' | 'war_ended'
  guildName: string
  playerName?: string
  targetName?: string
  defenderGuild?: string
  damage?: number
  damageAbsorbed?: number
  valorGained?: number
  defenderValor?: number
  garrisonRemaining?: number
  garrisonMax?: number
  strongholdHp?: number
  strongholdMaxHp?: number
  captureBonus?: number
  destructionBonus?: number
  weekResults?: Array<{ rank: number; guildName: string; valor: number }>
  totalDamageDealt?: number
  totalDamageAbsorbed?: number
}): Promise<boolean> {
  const eventTitles: Record<string, string> = {
    'outpost_captured': 'Outpost Captured!',
    'outpost_attacked': 'Outpost Attack!',
    'stronghold_attacked': 'Stronghold Under Siege!',
    'stronghold_destroyed': 'Stronghold Destroyed!',
    'war_started': 'Guild War Has Begun!',
    'war_ended': 'Guild War Concluded!',
  }

  const eventColors: Record<string, number> = {
    'outpost_captured': 0x4CAF50,  // Green
    'outpost_attacked': 0xFFA500,  // Orange
    'stronghold_attacked': 0xFF0000, // Red
    'stronghold_destroyed': 0x8B0000, // Dark Red
    'war_started': 0x00BCD4,  // Teal
    'war_ended': 0xFFD700,    // Gold
  }

  let description = ''
  const fields: Array<{ name: string; value: string; inline?: boolean }> = []

  switch (data.eventType) {
    case 'outpost_attacked':
      description = `**${data.playerName}** from **${data.guildName}** attacked **${data.targetName}**`
      if (data.damage) fields.push({ name: 'Damage Dealt', value: data.damage.toLocaleString(), inline: true })
      if (data.defenderGuild) fields.push({ name: 'Defender', value: data.defenderGuild, inline: true })
      if (data.damageAbsorbed) fields.push({ name: 'Damage Absorbed', value: data.damageAbsorbed.toLocaleString(), inline: true })
      if (data.garrisonRemaining !== undefined && data.garrisonMax) {
        fields.push({ name: 'Garrison Remaining', value: `${data.garrisonRemaining.toLocaleString()}/${data.garrisonMax.toLocaleString()}`, inline: true })
      }
      if (data.valorGained) fields.push({ name: 'Attacker Valor', value: `+${data.valorGained}`, inline: true })
      if (data.defenderValor) fields.push({ name: 'Defender Valor', value: `+${data.defenderValor}`, inline: true })
      break

    case 'outpost_captured':
      description = `**${data.guildName}** captured **${data.targetName}**!`
      if (data.playerName) fields.push({ name: 'Attacker', value: `${data.playerName} (${data.guildName})`, inline: true })
      if (data.defenderGuild) fields.push({ name: 'Previous Owner', value: data.defenderGuild, inline: true })
      if (data.damage) fields.push({ name: 'Final Damage', value: data.damage.toLocaleString(), inline: true })
      if (data.captureBonus) fields.push({ name: 'Capture Bonus', value: `+${data.captureBonus} valor`, inline: true })
      if (data.valorGained) fields.push({ name: 'Attacker Valor', value: `+${data.valorGained}`, inline: true })
      if (data.defenderValor) fields.push({ name: 'Defender Valor', value: `+${data.defenderValor}`, inline: true })
      break

    case 'stronghold_attacked':
      description = `**${data.playerName}** from **${data.guildName}** is attacking **${data.defenderGuild}**'s stronghold!`
      if (data.damage) fields.push({ name: 'Damage Dealt', value: data.damage.toLocaleString(), inline: true })
      if (data.damageAbsorbed) fields.push({ name: 'Damage Absorbed', value: data.damageAbsorbed.toLocaleString(), inline: true })
      if (data.strongholdHp !== undefined && data.strongholdMaxHp) {
        fields.push({ name: 'Stronghold HP', value: `${data.strongholdHp.toLocaleString()}/${data.strongholdMaxHp.toLocaleString()}`, inline: true })
      }
      if (data.valorGained) fields.push({ name: 'Attacker Valor', value: `+${data.valorGained}`, inline: true })
      if (data.defenderValor) fields.push({ name: 'Defender Valor', value: `+${data.defenderValor}`, inline: true })
      break

    case 'stronghold_destroyed':
      description = `**${data.guildName}** destroyed **${data.defenderGuild}**'s stronghold!`
      if (data.playerName) fields.push({ name: 'Final Blow', value: data.playerName, inline: true })
      if (data.damage) fields.push({ name: 'Damage Dealt', value: data.damage.toLocaleString(), inline: true })
      if (data.destructionBonus) fields.push({ name: 'Destruction Bonus', value: `+${data.destructionBonus} valor`, inline: true })
      break

    case 'war_started':
      description = 'A new Guild War season has begun! Prepare for battle!'
      break

    case 'war_ended':
      description = 'The Guild War has concluded!'
      if (data.weekResults) {
        data.weekResults.slice(0, 3).forEach((result) => {
          const medals = ['', '', '']
          fields.push({ 
            name: `${medals[result.rank - 1] || ''} #${result.rank}`, 
            value: `**${result.guildName}** (${result.valor.toLocaleString()} valor)`, 
            inline: false 
          })
        })
      }
      if (data.totalDamageDealt) fields.push({ name: 'Total Damage Dealt', value: data.totalDamageDealt.toLocaleString(), inline: true })
      if (data.totalDamageAbsorbed) fields.push({ name: 'Total Damage Absorbed', value: data.totalDamageAbsorbed.toLocaleString(), inline: true })
      break
  }

  return sendDiscordMessage('guild-war', {
    embeds: [{
      title: eventTitles[data.eventType],
      description,
      color: eventColors[data.eventType] || CHANNEL_COLORS['guild-war'],
      fields: fields.length > 0 ? fields : undefined,
      timestamp: new Date().toISOString(),
    }],
  })
}

/**
 * Notify when a player crafts a card
 */
export async function notifyCrafting(data: {
  playerName: string
  cardName: string
  cardRarity: string
  isFirstCraft?: boolean
}): Promise<boolean> {
  // Only notify for rare+ crafts or first crafts
  const notifiableRarities = ['rare', 'epic', 'legendary', 'mythic']
  if (!data.isFirstCraft && !notifiableRarities.includes(data.cardRarity.toLowerCase())) {
    return false
  }

  const color = RARITY_COLORS[data.cardRarity.toLowerCase()] || CHANNEL_COLORS['crafting']

  return sendDiscordMessage('crafting', {
    embeds: [{
      title: data.isFirstCraft ? 'First Craft!' : 'Card Crafted!',
      description: `**${data.playerName}** crafted **${data.cardName}**!`,
      color,
      fields: [
        { name: 'Rarity', value: data.cardRarity, inline: true },
      ],
      timestamp: new Date().toISOString(),
    }],
  })
}

/**
 * Notify when a player opens a pack - shows ALL cards obtained
 */
export async function notifyPackOpening(data: {
  playerName: string
  packName: string
  packId: string
  cardsObtained: Array<{
    name: string
    rarity: string
    type: string
    subtype?: string
    stats?: Record<string, number>
  }>
  remainingPacks?: number
}): Promise<boolean> {
  if (data.cardsObtained.length === 0) {
    return false
  }

  // Determine the highest rarity for embed color
  const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common']
  const bestCard = [...data.cardsObtained].sort((a, b) => {
    return rarityOrder.indexOf(a.rarity.toLowerCase()) - rarityOrder.indexOf(b.rarity.toLowerCase())
  })[0]

  const color = RARITY_COLORS[bestCard.rarity.toLowerCase()] || CHANNEL_COLORS['pack-opening']

  // Determine title based on best rarity
  const hasLegendary = data.cardsObtained.some(c => c.rarity.toLowerCase() === 'legendary')
  const hasMythic = data.cardsObtained.some(c => c.rarity.toLowerCase() === 'mythic')
  const hasEpic = data.cardsObtained.some(c => c.rarity.toLowerCase() === 'epic')
  
  let title = 'Pack Opened!'
  if (hasMythic) title = 'MYTHIC Pull!'
  else if (hasLegendary) title = 'Legendary Pull!'
  else if (hasEpic) title = 'Epic Pull!'

  // Format card list with rarity and type
  const cardList = data.cardsObtained.map((card, index) => {
    const typeStr = card.subtype ? `${card.type}/${card.subtype}` : card.type
    return `${index + 1}. **${card.name}** (${card.rarity}) - ${typeStr}`
  }).join('\n')

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: 'Cards Obtained', value: cardList, inline: false },
  ]

  // For single card packs (booster), show stats if available
  if (data.cardsObtained.length === 1 && data.cardsObtained[0].stats) {
    const stats = data.cardsObtained[0].stats
    const statsStr = Object.entries(stats)
      .map(([key, val]) => `${key.toUpperCase()}: ${val}`)
      .join(' | ')
    if (statsStr) {
      fields.push({ name: 'Stats', value: statsStr, inline: false })
    }
  }

  const footer = data.remainingPacks !== undefined 
    ? `${data.cardsObtained.length} card${data.cardsObtained.length > 1 ? 's' : ''} obtained | Remaining Packs: ${data.remainingPacks}`
    : `${data.cardsObtained.length} card${data.cardsObtained.length > 1 ? 's' : ''} obtained`

  return sendDiscordMessage('pack-opening', {
    embeds: [{
      title,
      description: `**${data.playerName}** opened a **${data.packName}**`,
      color,
      fields,
      footer: { text: footer },
      timestamp: new Date().toISOString(),
    }],
  })
}

/**
 * Notify tavern channel for highlight events
 * - Outpost captured
 * - Stronghold destroyed  
 * - Legendary/Mythic card pulled
 */
export async function notifyTavernEvent(data: {
  eventType: 'outpost_captured' | 'stronghold_destroyed' | 'legendary_pull'
  playerName: string
  guildName?: string
  // For outpost capture
  outpostName?: string
  previousOwner?: string
  // For stronghold destruction
  defenderGuild?: string
  // For legendary pull
  cardName?: string
  cardRarity?: string
  packName?: string
}): Promise<boolean> {
  const eventConfig: Record<string, { title: string; color: number }> = {
    'outpost_captured': { title: 'Outpost Captured!', color: 0x4CAF50 },
    'stronghold_destroyed': { title: 'Stronghold Destroyed!', color: 0x8B0000 },
    'legendary_pull': { title: 'Legendary Pull!', color: RARITY_COLORS[data.cardRarity?.toLowerCase() ?? 'legendary'] ?? 0xFFD700 },
  }

  const config = eventConfig[data.eventType]
  let description = ''
  const fields: Array<{ name: string; value: string; inline?: boolean }> = []

  switch (data.eventType) {
    case 'outpost_captured':
      description = `**${data.playerName}** from **${data.guildName}** captured **${data.outpostName}**!`
      if (data.previousOwner) {
        fields.push({ name: 'Previous Owner', value: data.previousOwner, inline: true })
      }
      break

    case 'stronghold_destroyed':
      description = `**${data.playerName}** from **${data.guildName}** destroyed **${data.defenderGuild}**'s stronghold!`
      break

    case 'legendary_pull':
      description = `**${data.playerName}** pulled **${data.cardName}** (${data.cardRarity})!`
      if (data.packName) {
        fields.push({ name: 'Pack', value: data.packName, inline: true })
      }
      break
  }

  return sendDiscordMessage('tavern', {
    embeds: [{
      title: config.title,
      description,
      color: config.color,
      fields: fields.length > 0 ? fields : undefined,
      timestamp: new Date().toISOString(),
      footer: { text: 'Idle Raiders Tavern' },
    }],
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// Batch/Admin Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a custom announcement to all channels or a specific channel
 */
export async function sendAnnouncement(
  message: string,
  channel?: DiscordChannel
): Promise<void> {
  const channels: DiscordChannel[] = channel 
    ? [channel] 
    : ['registrations', 'guild-war', 'crafting', 'pack-opening', 'tavern']

  for (const ch of channels) {
    await sendDiscordMessage(ch, {
      embeds: [{
        title: 'Announcement',
        description: message,
        color: 0xFFD700, // Gold
        timestamp: new Date().toISOString(),
      }],
    })
  }
}

/**
 * Test all webhook connections
 */
export async function testWebhooks(): Promise<Record<DiscordChannel, boolean>> {
  const results: Record<DiscordChannel, boolean> = {
    'registrations': false,
    'guild-war': false,
    'crafting': false,
    'pack-opening': false,
    'tavern': false,
  }

  for (const channel of Object.keys(results) as DiscordChannel[]) {
    results[channel] = await sendDiscordMessage(channel, {
      content: `Webhook test for #${channel} - ${new Date().toISOString()}`,
    })
  }

  return results
}
