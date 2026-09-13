/**
 * Socket Rate Limiter
 * Per-event, per-user rate limiting using in-memory Map
 */

const rateLimitMap = new Map()

const DEFAULT_COOLDOWN_MS = 500

const EVENT_COOLDOWNS = {
  get_player_state: 2000,
  get_lands: 1000,
  get_listings: 1000,
  get_leaderboard: 3000,
  get_user_history: 2000,
  get_balances: 1000,
  check_game_version: 5000,
  // Mutations
  start_mission: 1000,
  complete_mission: 1000,
  attack_boss: 800,
  craft_item: 1000,
  open_pack: 1000,
  buy_packs: 1000,
  use_potion: 500,
  collect_materials: 500,
  claim_land_deed: 2000,
  upgrade_land: 1000,
  get_guilds: 500,
  create_guild: 2000,
  join_guild: 2000,
  leave_guild: 2000,
  send_chat: 300,
  donate_material: 1000,
  buy_card_listing: 1000,
  buy_material_listing: 1000,
  sell_card: 1000,
  sell_material: 1000,
  cancel_listing: 1000,
  create_deposit_transaction: 3000,
  create_withdraw_transaction: 3000,
  create_purchase_transaction: 5000,
  get_purchase_quote: 2000,
  regenerate_energy: 1000,
}

function getRateLimitKey(socketId, eventName) {
  return `${socketId}:${eventName}`
}

/**
 * Wraps a handler with rate limiting.
 * Returns the wrapped handler function.
 */
export function wrapWithRateLimit(socket, eventName, handler) {
  return async (data) => {
    const key = getRateLimitKey(socket.id, eventName)
    const now = Date.now()
    const cooldown = EVENT_COOLDOWNS[eventName] || DEFAULT_COOLDOWN_MS
    const lastCall = rateLimitMap.get(key) || 0

    if (now - lastCall < cooldown) {
      socket.emit('action_response', {
        success: false,
        event: eventName,
        message: 'Too many requests. Please wait.',
      })
      return
    }

    rateLimitMap.set(key, now)

    try {
      await handler(data)
    } catch (error) {
      console.error(`[SocketRateLimiter] Error in ${eventName}:`, error)
    }
  }
}

// Cleanup stale entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of rateLimitMap.entries()) {
    if (now - timestamp > 60000) {
      rateLimitMap.delete(key)
    }
  }
}, 60000)