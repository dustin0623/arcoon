'use client'

import { useGame } from '@/context/GameContext'
import { useState } from 'react'
import EnergyBar from './popover/EnergyBar'
import MenuPopover from './popover/Menu'
import WalletPopover from './popover/Wallet'
import SettingsModal from './modals/Settings'
import HistoryModal from './modals/History'
import ReferralsModal from './modals/Referrals'
import TutorialModal from './modals/Tutorial'

const GameHeader = () => {
  const { playerState } = useGame()
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showReferrals, setShowReferrals] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  if (!playerState) return null

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2">
          {/* Left: Menu */}
          <MenuPopover
            onSettingsClick={() => setShowSettings(true)}
            onHistoryClick={() => setShowHistory(true)}
            onReferralsClick={() => setShowReferrals(true)}
            onTutorialClick={() => setShowTutorial(true)}
          />

          {/* Right: Energy + Wallet */}
          <div className="flex items-center gap-1.5 shrink-0">
            <EnergyBar />
            <WalletPopover />
          </div>
        </div>
      </header>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <HistoryModal open={showHistory} onOpenChange={setShowHistory} />
      <ReferralsModal open={showReferrals} onOpenChange={setShowReferrals} />
      <TutorialModal open={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  )
}

export default GameHeader
