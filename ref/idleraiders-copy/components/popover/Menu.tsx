'use client'

import { useRouter } from 'next/navigation'
import { User, LogOut, Users, Settings, BookOpen, Clock, GraduationCap } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useGame } from '@/context/GameContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverBody,
  PopoverFooter,
  PopoverClose,
} from '@/components/ui/popover'

interface MenuPopoverProps {
  onSettingsClick: () => void
  onHistoryClick: () => void
  onReferralsClick: () => void
  onTutorialClick: () => void
}

const MenuPopover = ({ onSettingsClick, onHistoryClick, onReferralsClick, onTutorialClick }: MenuPopoverProps) => {
  const { playerState } = useGame()
  const { logout } = useAuth()
  const router = useRouter()

  if (!playerState) return null

  const username = playerState.username

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg transition-colors hover:bg-secondary/50 pr-1 min-w-0">
          <Avatar className="h-9 w-9 shrink-0 border-2 border-primary/50">
            <AvatarImage src={`https://images.hive.blog/u/${username}/avatar`} />
            <AvatarFallback className="bg-secondary text-sm">{username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-left">
            <p className="font-display text-sm font-semibold text-foreground leading-tight truncate">
              {playerState.username}{' '}
              <span className="text-[10px] text-muted-foreground font-normal">
                Lv.{playerState.level}
              </span>
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="h-1.5 w-16 sm:w-20 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${((playerState.xp ?? 0) / (playerState.xpToNextLevel ?? 1)) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                {playerState.xp ?? 0}/{playerState.xpToNextLevel ?? 0}
              </span>
            </div>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <PopoverHeader>
          <Avatar className="h-10 w-10 border-2 border-primary/50">
            <AvatarImage src={`https://images.hive.blog/u/${username}/avatar`} />
            <AvatarFallback className="bg-secondary text-lg">{username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <PopoverTitle>
              {playerState.username}{' '}
              <span className="text-[10px] text-muted-foreground font-normal">
                Lv.{playerState.level}
              </span>
            </PopoverTitle>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${((playerState.xp ?? 0) / (playerState.xpToNextLevel ?? 1)) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground">
                {playerState.xp ?? 0}/{playerState.xpToNextLevel ?? 0}
              </span>
            </div>
          </div>
        </PopoverHeader>
        <PopoverBody className="space-y-1 px-2 py-1">
          <PopoverClose asChild>
            <Button
              variant="ghost"
              className="w-full justify-start"
              size="sm"
              onClick={() => router.push('/game/profile')}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </PopoverClose>
          <PopoverClose asChild>
            <Button variant="ghost" className="w-full justify-start" size="sm" onClick={onHistoryClick}>
              <Clock className="mr-2 h-4 w-4" />
              History
            </Button>
          </PopoverClose>
          <PopoverClose asChild>
            <Button variant="ghost" className="w-full justify-start" size="sm" onClick={onSettingsClick}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </PopoverClose>
          <PopoverClose asChild>
            <Button variant="ghost" className="w-full justify-start" size="sm" onClick={onReferralsClick}>
              <Users className="mr-2 h-4 w-4" />
              Referrals
            </Button>
          </PopoverClose>
          <PopoverClose asChild>
            <Button variant="ghost" className="w-full justify-start" size="sm" onClick={onTutorialClick}>
              <GraduationCap className="mr-2 h-4 w-4" />
              Tutorial
            </Button>
          </PopoverClose>
          <PopoverClose asChild>
            <Button
              variant="ghost"
              className="w-full justify-start"
              size="sm"
              onClick={() => router.push('/docs')}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Documentation
            </Button>
          </PopoverClose>
        </PopoverBody>
        <PopoverFooter>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-transparent px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => {
              logout()
              router.push('/')
            }}
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  )
}

export default MenuPopover
