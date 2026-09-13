'use client'

import { useRouter } from 'next/navigation'
import { Wallet as WalletIcon, ArrowLeftRight } from 'lucide-react'
import CurrencyIcon from '@/components/CurrencyIcon'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverBody,
  PopoverFooter,
  PopoverClose,
} from '@/components/ui/popover'
import { usePlayer } from '@/hooks/usePlayer'

// Feature flag — keep in sync with app/game/wallet/page.tsx
const WALLET_ENABLED = process.env.NEXT_PUBLIC_WALLET_ENABLED === 'true'

const WalletPopover = () => {
  const { wallet } = usePlayer()
  const router = useRouter()

  if (!wallet) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 rounded-lg bg-secondary px-2 py-1.5 transition-colors hover:bg-muted">
          <WalletIcon size={14} className="text-primary" />
          <span className="font-body text-[11px] font-semibold text-foreground hidden xs:inline">W</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <PopoverHeader>
          <WalletIcon size={18} className="text-primary" />
          <div>
            <PopoverTitle>Wallet</PopoverTitle>
            <PopoverDescription>Your balances</PopoverDescription>
          </div>
        </PopoverHeader>
        <PopoverBody className="space-y-2.5 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CurrencyIcon type="token" size={18} />
              <span className="text-xs text-muted-foreground">Realm Coins</span>
            </div>
            <span className="font-body text-sm font-bold text-primary">
              {(wallet.coins ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CurrencyIcon type="shard" size={18} />
              <span className="text-xs text-muted-foreground">Soul Shards</span>
            </div>
            <span className="font-body text-sm font-bold text-purple-400">
              {(wallet.shards ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CurrencyIcon type="dollar" size={18} />
              <span className="text-xs text-muted-foreground">Dollars</span>
            </div>
            <span className="font-body text-sm font-bold text-green-400">
              {(wallet.dollars ?? 0).toLocaleString()}
            </span>
          </div>
        </PopoverBody>
        {WALLET_ENABLED && (
          <PopoverFooter>
            <PopoverClose asChild>
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => router.push('/game/wallet')}
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Deposit / Withdraw
              </Button>
            </PopoverClose>
          </PopoverFooter>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default WalletPopover
