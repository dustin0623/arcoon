import type { Rarity } from './types'

type RarityKey = Rarity | 'special'

/** Border + background styles for rarity-themed containers */
export const rarityBorder: Record<RarityKey, string> = {
  common: 'border-muted-foreground/30',
  uncommon: 'border-green-500/50',
  rare: 'border-blue-500/50',
  epic: 'border-purple-500/50',
  legendary: 'border-primary/60',
  special: 'border-red-500/50',
}

/** Combined border + bg for cards/panels */
export const rarityCardBg: Record<RarityKey, string> = {
  common: 'border-muted-foreground/40 bg-muted/30',
  uncommon: 'border-green-500/50 bg-green-500/10',
  rare: 'border-blue-500/50 bg-blue-500/10',
  epic: 'border-purple-500/50 bg-purple-500/10',
  legendary: 'border-primary/60 bg-primary/10',
  special: 'border-red-500/50 bg-red-500/10',
}

/** Outer glow shadow per rarity */
export const rarityGlow: Record<RarityKey, string> = {
  common: '',
  uncommon: 'shadow-green-500/10',
  rare: 'shadow-blue-500/10',
  epic: 'shadow-purple-500/15',
  legendary: 'shadow-primary/20',
  special: 'shadow-red-500/15',
}

export const rarityGlowStrong: Record<RarityKey, string> = {
  common: '',
  uncommon: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]',
  rare: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]',
  epic: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]',
  legendary: 'shadow-[0_0_25px_rgba(234,179,8,0.6)]',
  special: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]',
}

/** Text color per rarity */
export const rarityText: Record<RarityKey, string> = {
  common: 'text-muted-foreground',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-primary',
  special: 'text-red-400',
}

/** Badge background per rarity */
export const rarityBadgeBg: Record<RarityKey, string> = {
  common: 'bg-muted-foreground/15',
  uncommon: 'bg-green-500/15',
  rare: 'bg-blue-500/15',
  epic: 'bg-purple-500/15',
  legendary: 'bg-primary/15',
  special: 'bg-red-500/15',
}

/** Border glow (solid) for reveal animations */
export const rarityBorderGlow: Record<RarityKey, string> = {
  common: 'border-muted-foreground/40',
  uncommon: 'border-green-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-primary',
  special: 'border-amber-500',
}

/** Rarity ordering for sorting */
export const rarityOrder: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

interface RarityStyle {
  border: string
  text: string
  bg: string
}

/** Marketplace-style combined styles */
export const rarityStyles: Record<RarityKey, RarityStyle> = {
  common: { border: 'border-muted-foreground/20', text: 'text-muted-foreground', bg: 'from-muted-foreground/5' },
  uncommon: { border: 'border-green-500/40', text: 'text-green-400', bg: 'from-green-500/10' },
  rare: { border: 'border-blue-500/40', text: 'text-blue-400', bg: 'from-blue-500/10' },
  epic: { border: 'border-purple-500/40', text: 'text-purple-400', bg: 'from-purple-500/10' },
  legendary: { border: 'border-primary/50', text: 'text-primary', bg: 'from-primary/10' },
  special: { border: 'border-red-500/40', text: 'text-red-400', bg: 'from-red-500/10' },
}
