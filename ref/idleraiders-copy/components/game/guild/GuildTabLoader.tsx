'use client'

import { Swords, Sparkles, Shield, Users, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface GuildTabLoaderProps {
  tab: 'war' | 'perks' | 'overview' | 'members' | 'chat'
  message?: string
}

const tabConfig: Record<string, { icon: LucideIcon; defaultMessage: string; color: string }> = {
  war: { icon: Swords, defaultMessage: 'Loading war data...', color: 'text-red-400' },
  perks: { icon: Sparkles, defaultMessage: 'Loading perks...', color: 'text-amber-400' },
  overview: { icon: Shield, defaultMessage: 'Loading guild data...', color: 'text-purple-400' },
  members: { icon: Users, defaultMessage: 'Loading members...', color: 'text-blue-400' },
  chat: { icon: MessageCircle, defaultMessage: 'Loading chat...', color: 'text-green-400' },
}

export function GuildTabLoader({ tab, message }: GuildTabLoaderProps) {
  const config = tabConfig[tab] ?? tabConfig.overview
  const Icon = config.icon
  const displayMessage = message ?? config.defaultMessage

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <Icon className={`absolute inset-0 m-auto ${config.color}`} size={20} />
      </div>
      <p className="text-sm text-muted-foreground">{displayMessage}</p>
    </div>
  )
}
