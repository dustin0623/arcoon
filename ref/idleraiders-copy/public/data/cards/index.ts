import { HEROES_CARD_DATA } from './heroes'
import { EQUIPMENTS_CARD_DATA } from './equipments'
import { MOUNTS_CARD_DATA } from './mounts'
import { TRANSPORTS_CARD_DATA } from './transports'
import { ARTIFACTS_CARD_DATA } from './artifacts'
import { BOOSTERS_CARD_DATA } from './boosters'
import { CRAFTING_CARD_DATA } from './crafts'
import { STORIES_CARD_DATA } from './stories'

import getCardStats from './cardConfig'

// ─── Combine All Card Definitions ────────────────────────

const RAW_CARDS = [
  ...HEROES_CARD_DATA,
  ...EQUIPMENTS_CARD_DATA,
  ...MOUNTS_CARD_DATA,
  ...TRANSPORTS_CARD_DATA,
  ...ARTIFACTS_CARD_DATA,
  ...BOOSTERS_CARD_DATA,
  ...CRAFTING_CARD_DATA,
  ...STORIES_CARD_DATA,
]

// ─── Enrich Cards With Stats ─────────────────────────────

function enrichCard(card: { type: string; rarity: string;[key: string]: unknown }) {
  return {
    ...card,
    stats: getCardStats(card),
  }
}

// ─── Final Card List ─────────────────────────────────────

export const CARDS_DATA = RAW_CARDS.map(enrichCard)

export default CARDS_DATA
