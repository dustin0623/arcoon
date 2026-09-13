'use client'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, Music } from 'lucide-react'
import { useAudio } from '@/context/AudioContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

const SettingsModal = ({ open, onClose }) => {
  const {
    musicEnabled,
    musicVolume,
    toggleMusic,
    setMusicVolume,
    sfxEnabled,
    sfxVolume,
    toggleSfx,
    setSfxVolume,
  } = useAudio()
  const isMobile = useIsMobile()

  if (typeof document === 'undefined') return null

  // Body controls shared between the drawer (mobile) and dialog (desktop).
  // Spacing is handled by the outer shell so this fragment just emits the
  // two toggle sections.
  const controls = (
    <div className="space-y-5">
      {/* Music */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music size={16} className="text-primary md:w-5 md:h-5" />
            <span className="text-sm md:text-base font-semibold text-foreground">Background Music</span>
          </div>
          <button
            onClick={toggleMusic}
            aria-label="Toggle background music"
            className={`relative h-6 w-11 md:h-7 md:w-12 rounded-full transition-colors ${
              musicEnabled ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 md:h-6 md:w-6 rounded-full bg-foreground transition-transform ${
                musicEnabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
        {musicEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-6"
          >
            <label className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Volume</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              className="mt-1 w-full accent-primary"
            />
          </motion.div>
        )}
      </div>

      {/* SFX */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-primary md:w-5 md:h-5" />
            <span className="text-sm md:text-base font-semibold text-foreground">Card Flip Sound</span>
          </div>
          <button
            onClick={toggleSfx}
            aria-label="Toggle sound effects"
            className={`relative h-6 w-11 md:h-7 md:w-12 rounded-full transition-colors ${
              sfxEnabled ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 md:h-6 md:w-6 rounded-full bg-foreground transition-transform ${
                sfxEnabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
        {sfxEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-6"
          >
            <label className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Volume</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sfxVolume}
              onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
              className="mt-1 w-full accent-primary"
            />
          </motion.div>
        )}
      </div>
    </div>
  )

  // ── Mobile: bottom drawer (default max-h-[80vh]) ──────────────────────────
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="border-border p-0 flex flex-col">
          <DrawerHeader className="px-6 pb-2 text-left">
            <DrawerTitle className="font-display text-lg font-bold text-primary">Settings</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">{controls}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  // ── Desktop: centered card modal ──────────────────────────────────────────
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fantasy-card glow-gold mx-4 w-full max-w-sm space-y-5 p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg md:text-xl font-bold text-primary">Settings</h3>
              <button
                onClick={onClose}
                aria-label="Close settings"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            {controls}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default SettingsModal
