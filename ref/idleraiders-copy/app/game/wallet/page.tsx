'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useGame } from '@/context/GameContext'
import { useWalletActions, usePlayerActions } from '@/features/actions'
import { usePlayer } from '@/hooks/usePlayer'
import { useHiveBlockchain } from '@/hooks/useBlockchain'
import { useHiveKeychain } from '@/hooks/useHiveKeychain'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CurrencyIcon from '@/components/CurrencyIcon'
import {
	ArrowDownToLine,
	ArrowUpFromLine,
	ArrowLeft,
	Loader2,
	RefreshCw,
	Wallet,
	ChevronDown,
	DollarSign,
	Lock,
} from 'lucide-react'
import { toast } from 'sonner'

// Feature flag — wallet (deposit/withdraw/dollar purchase) is disabled by default.
// Set NEXT_PUBLIC_WALLET_ENABLED="true" to enable.
const WALLET_ENABLED = process.env.NEXT_PUBLIC_WALLET_ENABLED === 'true'

const WalletDisabled = () => {
	const router = useRouter()
	return (
		<div className="min-h-[80vh] flex flex-col">
			<div className="flex items-center gap-3 px-4 py-3 border-b border-border">
				<button
					onClick={() => router.back()}
					className="text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft size={20} />
				</button>
				<div className="flex items-center gap-2">
					<Wallet size={20} className="text-primary" />
					<h1 className="font-display text-lg font-bold text-foreground">Wallet</h1>
				</div>
			</div>
			<div className="flex-1 flex items-center justify-center px-6 py-12">
				<div className="max-w-sm w-full rounded-xl border border-border bg-card p-6 text-center space-y-3">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
						<Lock size={20} className="text-muted-foreground" />
					</div>
					<h2 className="font-display text-base font-bold text-foreground">Wallet Currently Disabled</h2>
					<p className="text-xs text-muted-foreground leading-relaxed">
						Deposits, withdrawals, and Dollar purchases are temporarily unavailable. Your in-game balances
						are safe and will resume normal function once the wallet is re-enabled.
					</p>
					<Button variant="outline" size="sm" className="w-full" onClick={() => router.back()}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Go Back
					</Button>
				</div>
			</div>
		</div>
	)
}

const TOKENS = [
	{ symbol: 'REALMC', label: 'Realm Coins', currencyType: 'token' as const, hiveEngineSymbol: 'REALMC' },
	{ symbol: 'SSHRD', label: 'Soul Shards', currencyType: 'shard' as const, hiveEngineSymbol: 'SSHRD' },
]

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 3 })
const fmtUsd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtHivePrice = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`
const fmtHivePerDollar = (hiveUsd: number) => hiveUsd > 0 ? (1 / hiveUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 }) : '...'

// ─── Component ─────────────────────────────────────────────
const WalletPage = () => {
	if (!WALLET_ENABLED) return <WalletDisabled />

	return <WalletPageInner />
}

const WalletPageInner = () => {
	const router = useRouter()
	const { username } = useAuth()
	const { hiveUsdPrice, requestHivePrice } = useGame()
	const { wallet } = usePlayer()
	const {
		deposit: depositAction,
		withdraw: withdrawAction,
		purchase: purchaseAction,
		fetchPurchaseQuote,
	} = useWalletActions()
	const { getPlayerState } = usePlayerActions()

	const { hiveBalance, realmcBalance, sshrdBalance, refetch: refetchBalances } = useHiveBlockchain(username)
	const { depositToken, creditPurchasePayment } = useHiveKeychain()

	// Use hivePriceUsd from GameContext (from socket)
	const hivePriceUsd = hiveUsdPrice

	const [txTab, setTxTab] = useState<'deposit' | 'withdraw'>('deposit')
	const [selectedToken, setSelectedToken] = useState(TOKENS[0])
	const [amount, setAmount] = useState('')
	const [isProcessing, setIsProcessing] = useState(false)
	const [dollarPurchaseAmount, setDollarPurchaseAmount] = useState('')
	const [isDollarPurchasing, setIsDollarPurchasing] = useState(false)
	const [showTokenSelect, setShowTokenSelect] = useState(false)

	const refetch = useCallback(() => {
		refetchBalances()
		requestHivePrice()
	}, [refetchBalances, requestHivePrice])

	const gameBalance = selectedToken.symbol === 'REALMC' ? (wallet.coins ?? 0) : (wallet.shards ?? 0)
	const onChainBalance = selectedToken.symbol === 'REALMC' ? realmcBalance : sshrdBalance
	const playerDollars = wallet.dollars ?? 0

	const handleDeposit = async () => {
		if (!username || !amount || parseFloat(amount) <= 0) return
		setIsProcessing(true)
		try {
			// Use integer quantity for consistency between keychain and API
			const qty = Math.floor(parseFloat(amount))
			if (qty <= 0) {
				toast.error('Invalid amount', { description: 'Quantity must be at least 1' })
				return
			}
			const symbol = selectedToken.hiveEngineSymbol

			// Get the real blockchain transaction ID from Hive Keychain
			const keychainResult = await depositToken(username, qty, symbol)

			if (!keychainResult?.success) {
				toast.error('Keychain transaction failed', {
					description: keychainResult?.message || 'Check Hive Keychain.',
				})
				return
			}

			// Extract the real blockchain transaction ID
			const txId = (keychainResult?.result as { id?: string; trx_id?: string })?.id || 
			             (keychainResult?.result as { id?: string; trx_id?: string })?.trx_id

			if (!txId) {
				toast.error('Could not read blockchain transaction ID from Hive Keychain.')
				return
			}

			// Queue the deposit with the real blockchain txId
			await depositAction(txId, qty, symbol)
			toast.success(`Deposited ${amount} ${selectedToken.label}!`)
			setAmount('')
			refetch()
		} catch (err) {
			toast.error('Deposit failed', { description: (err as Error)?.message || 'Check Hive Keychain and try again.' })
		} finally {
			setIsProcessing(false)
		}
	}

	const handleWithdraw = async () => {
		if (!username || !amount || parseFloat(amount) <= 0) return
		const qty = Math.floor(parseFloat(amount))
		if (qty > gameBalance) {
			toast.error('Insufficient balance')
			return
		}
		setIsProcessing(true)
		try {
			const symbol = selectedToken.hiveEngineSymbol
			const result = await withdrawAction(qty, symbol, username)
			if (result?.success !== false) {
				toast.success(`Withdrawal of ${qty} ${selectedToken.label} requested!`, {
					description: 'Tokens will arrive in your Hive-Engine wallet shortly.',
				})
				setAmount('')
			} else {
				toast.error(result?.error || 'Withdrawal failed')
			}
		} catch (err) {
			toast.error('Withdrawal failed', { description: (err as Error)?.message })
		} finally {
			setIsProcessing(false)
		}
	}

	const handleBuyDollars = async () => {
		const quantity = Math.floor(parseFloat(dollarPurchaseAmount))
		if (!username || !quantity || quantity <= 0) return

		setIsDollarPurchasing(true)
		try {
			// Get authoritative HIVE amount from backend
			const quote = await fetchPurchaseQuote(quantity)
			if (!quote) {
				toast.error('Could not get price quote', { description: 'Please try again.' })
				return
			}

			// Send HIVE via Keychain using backend-computed amount
			const keychainResult = await creditPurchasePayment(username, quote.expectedHive)
			const txId = (keychainResult?.result as { id?: string; trx_id?: string })?.id || 
			             (keychainResult?.result as { id?: string; trx_id?: string })?.trx_id
			if (!txId) {
				toast.error('Could not read transaction ID from Hive Keychain.')
				return
			}

			// Queue on backend for blockchain verification and crediting
			await purchaseAction(txId, quantity)
			setDollarPurchaseAmount('')
			setTimeout(() => getPlayerState().catch(() => {}), 2000)
		} catch (err) {
			toast.error('Purchase failed', { description: (err as Error)?.message || 'Check Hive Keychain.' })
		} finally {
			setIsDollarPurchasing(false)
		}
	}

	return (
		<div className="min-h-[80vh] flex flex-col">
			{/* Header */}
			<div className="flex items-center gap-3 px-4 py-3 border-b border-border">
				<button
					onClick={() => router.back()}
					className="text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft size={20} />
				</button>
				<div className="flex items-center gap-2">
					<Wallet size={20} className="text-primary" />
					<h1 className="font-display text-lg font-bold text-foreground">Wallet</h1>
				</div>
				<div className="ml-auto flex items-center gap-1.5">
					<button
						onClick={() => refetch()}
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						<RefreshCw size={16} />
					</button>
				</div>
			</div>
			{hivePriceUsd !== null && hivePriceUsd > 0 && (
				<div className="mx-4 mt-3 flex items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-1.5">
					<DollarSign size={12} className="text-muted-foreground" />
					<span className="text-[10px] text-muted-foreground">1 HIVE =</span>
					<span className="text-xs font-semibold text-foreground">{fmtHivePrice(hivePriceUsd)}</span>
					<span className="text-[10px] text-muted-foreground ml-2">|</span>
					<span className="text-[10px] text-muted-foreground ml-2">{fmtHivePerDollar(hivePriceUsd)} HIVE per $1</span>
				</div>
			)}

			{/* Balances overview */}
			<div className="px-4 py-4 space-y-3">
				<p className="text-[10px] text-muted-foreground uppercase tracking-wider">In-Game Balances</p>
				<div className="grid grid-cols-3 gap-3">
					<div className="rounded-xl border border-border bg-card p-3">
						<div className="flex items-center gap-2 mb-1">
							<CurrencyIcon type="token" size={16} />
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">
								Realm Coins
							</span>
						</div>
						<p className="font-display text-xl font-bold text-primary">
							{(wallet.coins ?? 0).toLocaleString()}
						</p>
					</div>
					<div className="rounded-xl border border-border bg-card p-3">
						<div className="flex items-center gap-2 mb-1">
							<CurrencyIcon type="shard" size={16} />
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">Soul Shards</span>
						</div>
						<p className="font-display text-xl font-bold text-accent">
							{(wallet.shards ?? 0).toLocaleString()}
						</p>
					</div>
					<div className="rounded-xl border border-border bg-card p-3">
						<div className="flex items-center gap-2 mb-1">
							<CurrencyIcon type="dollar" size={16} />
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">Dollar</span>
						</div>
						<p className="font-display text-xl font-bold text-green-400">
							{(wallet.dollars ?? 0).toLocaleString()}
						</p>
					</div>
				</div>

				<p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">
					On-Chain (Hive-Engine)
				</p>
				<div className="grid grid-cols-3 gap-2">
					<div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
						<p className="text-[10px] text-muted-foreground mb-0.5">HIVE</p>
						<p className="text-sm font-bold text-foreground">
							{hiveBalance !== null ? fmt(hiveBalance) : '...'}
						</p>
						{hiveBalance !== null && hivePriceUsd !== null && hivePriceUsd > 0 && (
							<p className="text-[9px] text-muted-foreground">{fmtUsd(hiveBalance * hivePriceUsd)}</p>
						)}
					</div>
					<div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
						<p className="text-[10px] text-muted-foreground mb-0.5">REALMC</p>
						<p className="text-sm font-bold text-primary">
							{realmcBalance !== null ? fmt(realmcBalance) : '...'}
						</p>
					</div>
					<div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
						<p className="text-[10px] text-muted-foreground mb-0.5">SSHRD</p>
						<p className="text-sm font-bold text-accent">
							{sshrdBalance !== null ? fmt(sshrdBalance) : '...'}
						</p>
					</div>
				</div>

				<div className="rounded-xl border border-border bg-card p-4 space-y-3 mt-2">
					<div className="flex items-center gap-2">
						<DollarSign size={16} className="text-green-400" />
						<p className="text-xs font-semibold text-foreground">Purchase In-Game Dollars</p>
					</div>
					<p className="text-[10px] text-muted-foreground">
						Buy Dollars with HIVE at the current exchange rate. Use Dollars for pack purchases and other
						in-game features.
					</p>
					{hivePriceUsd !== null && hivePriceUsd > 0 && (
						<p className="text-[10px] text-muted-foreground">
							Rate:{' '}
							<span className="font-semibold text-green-400">{fmtHivePerDollar(hivePriceUsd)} HIVE</span>
							{' '}per $1 Dollar
						</p>
					)}
					<div className="flex gap-2">
						<Input
							type="number"
							min="1"
							max={playerDollars}
							step="1"
							placeholder="Dollars to buy"
							value={dollarPurchaseAmount}
							onChange={(e) => {
								const val = e.target.value
								if (val === '' || /^\d+$/.test(val)) setDollarPurchaseAmount(val)
							}}
							className="flex-1 h-10 text-sm font-display"
						/>
						<Button
							onClick={handleBuyDollars}
							disabled={
								isDollarPurchasing || !dollarPurchaseAmount || parseFloat(dollarPurchaseAmount) <= 0
							}
							className="h-10 px-4"
						>
							{isDollarPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Buy</>}
						</Button>
					</div>
					{dollarPurchaseAmount &&
						parseFloat(dollarPurchaseAmount) > 0 &&
						hivePriceUsd &&
						hivePriceUsd > 0 && (
							<p className="text-[10px] text-muted-foreground">
								You&apos;ll receive:{' '}
								<span className="font-semibold text-green-400">
									{Math.floor(parseFloat(dollarPurchaseAmount))} Dollars
								</span>
								{' '}&bull;{' '}Total cost:{' '}
								<span className="font-semibold text-amber-400">
									{(Math.floor(parseFloat(dollarPurchaseAmount)) / hivePriceUsd).toFixed(3)} HIVE
								</span>
							</p>
						)}
				</div>
			</div>

			{/* Deposit / Withdraw */}
			<>
				{/* Deposit/Withdraw sub-tabs */}
				<div className="px-4 pt-3">
					<div className="flex rounded-lg bg-secondary/50 p-0.5 gap-0.5">
						{(['deposit', 'withdraw'] as const).map((tab) => (
							<button
								key={tab}
								onClick={() => setTxTab(tab)}
								className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all ${
									txTab === tab
										? 'bg-background text-foreground shadow-sm'
										: 'text-muted-foreground hover:text-foreground'
								}`}
							>
								{tab === 'deposit' ? <ArrowDownToLine size={12} /> : <ArrowUpFromLine size={12} />}
								{tab === 'deposit' ? 'Deposit' : 'Withdraw'}
							</button>
						))}
					</div>
				</div>

				<motion.div
					key={txTab}
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2 }}
					className="px-4 py-4 space-y-4 flex-1"
				>
					<p className="text-xs text-muted-foreground">
						{txTab === 'deposit'
							? 'Transfer tokens from your Hive-Engine wallet into the game.'
							: 'Withdraw in-game tokens back to your Hive-Engine wallet.'}
					</p>

					{/* Token selector */}
					<div className="space-y-1.5">
						<label className="text-xs font-medium text-muted-foreground">Token</label>
						<div className="relative">
							<button
								onClick={() => setShowTokenSelect(!showTokenSelect)}
								className="w-full flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
							>
								<div className="flex items-center gap-2">
									<CurrencyIcon type={selectedToken.currencyType} size={18} />
									<span className="font-medium text-foreground">{selectedToken.label}</span>
									<span className="text-[10px] text-muted-foreground">
										({selectedToken.hiveEngineSymbol})
									</span>
								</div>
								<ChevronDown size={14} className="text-muted-foreground" />
							</button>
							<AnimatePresence>
								{showTokenSelect && (
									<motion.div
										initial={{ opacity: 0, y: -4 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -4 }}
										className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
									>
										{TOKENS.map((t) => (
											<button
												key={t.symbol}
												onClick={() => {
													setSelectedToken(t)
													setShowTokenSelect(false)
												}}
												className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary/60 transition-colors ${
													selectedToken.symbol === t.symbol ? 'bg-secondary' : ''
												}`}
											>
												<CurrencyIcon type={t.currencyType} size={16} />
												<span className="text-foreground">{t.label}</span>
												<span className="text-[10px] text-muted-foreground">
													({t.hiveEngineSymbol})
												</span>
											</button>
										))}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>

					{/* Amount */}
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<label className="text-xs font-medium text-muted-foreground">Amount</label>
							<button
								onClick={() => {
									const max = txTab === 'withdraw' ? gameBalance : (onChainBalance ?? 0)
									setAmount(String(Math.floor(max)))
								}}
								className="text-[10px] text-primary font-medium hover:underline"
							>
								MAX
							</button>
						</div>
						<Input
							type="number"
							min="1"
							max={txTab === 'withdraw' ? gameBalance : Math.floor(onChainBalance ?? 0)}
							step="1"
							placeholder="0"
							value={amount}
							onChange={(e) => {
								const val = e.target.value
								if (val === '' || /^\d+$/.test(val)) setAmount(val)
							}}
							className="text-lg font-display font-bold h-12"
						/>
						<p className="text-[10px] text-muted-foreground">
							Available:{' '}
							{txTab === 'withdraw'
								? `${gameBalance.toLocaleString()} ${selectedToken.label}`
								: `${onChainBalance !== null ? fmt(onChainBalance) : '...'} ${selectedToken.hiveEngineSymbol} (on-chain)`}
						</p>
					</div>

					<Button
						onClick={txTab === 'deposit' ? handleDeposit : handleWithdraw}
						disabled={isProcessing || !amount || parseFloat(amount) <= 0}
						className="w-full py-6 text-base font-display"
					>
						{isProcessing ? (
							<>
								<Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
							</>
						) : txTab === 'deposit' ? (
							<>
								<ArrowDownToLine className="mr-2 h-5 w-5" /> Deposit {selectedToken.hiveEngineSymbol}
							</>
						) : (
							<>
								<ArrowUpFromLine className="mr-2 h-5 w-5" /> Withdraw {selectedToken.hiveEngineSymbol}
							</>
						)}
					</Button>

					{txTab === 'withdraw' && (
						<p className="text-[10px] text-muted-foreground text-center">
							Withdrawals are processed by the game server and may take a few minutes.
						</p>
					)}
				</motion.div>
			</>
		</div>
	)
}

export default WalletPage
