'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context'
import { useHiveKeychain } from '@/hooks/useHiveKeychain'
import { useWalletActions } from '@/features/actions/walletActions'
import { Loader2, Coins, Shield, Gift, CheckCircle2, LogOut, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { REGISTRATION } from '@/public/data/system/system'

const REGISTRATION_FEE_USD = REGISTRATION.FEE_USD
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'

interface RegistrationModalProps {
	open: boolean
	username: string
	referredBy?: string
	onRegistrationComplete: () => void
	onLogout: () => void
}

const RegistrationModal = ({ open, username, referredBy, onRegistrationComplete, onLogout }: RegistrationModalProps) => {
	const { setRegistered } = useAuth()
	const { registrationPayment } = useHiveKeychain()
	const { registration } = useWalletActions()

	const [isProcessing, setIsProcessing] = useState(false)
	const [registrationStatus, setRegistrationStatus] = useState<
		'idle' | 'paying' | 'confirming' | 'success' | 'error'
	>('idle')
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [hivePrice, setHivePrice] = useState<number>(0.25)
	const [registrationFeeHive, setRegistrationFeeHive] = useState<number>(0)

	// Fetch current HIVE price on mount
	useEffect(() => {
		if (!open) return
		
		const fetchPrice = async () => {
			try {
				const res = await fetch(`${SERVER_URL}/api/price`)
				if (res.ok) {
					const data = await res.json()
					setHivePrice(data.hiveUsd)
					const hiveAmount = REGISTRATION_FEE_USD / data.hiveUsd
					setRegistrationFeeHive(parseFloat(hiveAmount.toFixed(3)))
				}
			} catch (error) {
				// Use fallback calculation with default price
				const hiveAmount = REGISTRATION_FEE_USD / hivePrice
				setRegistrationFeeHive(parseFloat(hiveAmount.toFixed(3)))
			}
		}
		fetchPrice()
	}, [open, hivePrice])

	const handleRegistration = useCallback(async () => {
		if (!username) return

		setIsProcessing(true)
		setRegistrationStatus('paying')
		setErrorMessage(null)

		try {
			// Step 1: Request payment via Hive Keychain
			const paymentResult = await registrationPayment(
				username,
				'idleraiders', // Default referral - actual referral was captured at login
				registrationFeeHive,
			)

			if (!paymentResult.success) {
				throw new Error(paymentResult.message || 'Payment was cancelled or failed')
			}

			// Get the transaction ID from the result
			const transactionId = (paymentResult.result as { id?: string })?.id
			if (!transactionId) {
				throw new Error('No transaction ID received from Keychain')
			}

			// Step 2: Confirm registration with backend (referral is handled server-side from player.referredBy)
			setRegistrationStatus('confirming')
			const regResult = (await registration(transactionId, referredBy || 'idleraiders')) as Record<string, unknown>

			if (!regResult.success) {
				throw new Error((regResult.message as string) || 'Registration confirmation failed')
			}

			// Step 3: Success!
			setRegistrationStatus('success')
			setRegistered(true)
			toast.success('Registration successful! Welcome to Idle Raiders!')

			// Notify parent after a short delay
			setTimeout(() => {
				onRegistrationComplete()
			}, 1500)
		} catch (error) {
			setRegistrationStatus('error')
			const message = error instanceof Error ? error.message : 'Registration failed'
			setErrorMessage(message)
			toast.error(message)
		} finally {
			setIsProcessing(false)
		}
	}, [username, registrationPayment, registration, setRegistered, onRegistrationComplete, registrationFeeHive])

	const handleLogout = useCallback(() => {
		onLogout()
	}, [onLogout])

	if (typeof document === 'undefined') return null

	return createPortal(
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
				>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						className="fantasy-card glow-gold w-full max-w-md space-y-5 p-6"
					>
						{/* Header */}
						<div className="text-center space-y-2">
							<h2 className="font-display text-2xl font-bold text-primary text-glow-gold">
								Complete Registration
							</h2>
							<p className="text-sm text-muted-foreground">
								Welcome, <span className="text-foreground font-medium">@{username}</span>! One more step to
								start your adventure.
							</p>
						</div>

						{/* Benefits */}
						<div className="space-y-3">
							<h3 className="text-sm font-semibold text-foreground">Registration Benefits</h3>
							<div className="space-y-2">
								<div className="flex items-center gap-3 text-sm">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
										<Shield size={16} className="text-primary" />
									</div>
									<div>
										<p className="font-medium text-foreground">Full Game Access</p>
										<p className="text-xs text-muted-foreground">Unlock all features and gameplay</p>
									</div>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
										<Gift size={16} className="text-primary" />
									</div>
									<div>
										<p className="font-medium text-foreground">Starter Bonus</p>
										<p className="text-xs text-muted-foreground">
											Receive {REGISTRATION.STARTER_DOLLARS} dollars to buy packs and items
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
										<Coins size={16} className="text-primary" />
									</div>
									<div>
										<p className="font-medium text-foreground">Earn & Trade</p>
										<p className="text-xs text-muted-foreground">
											Access marketplace and withdraw earnings
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Fee Info */}
						<div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-foreground">One-Time Registration Fee</p>
									<p className="text-xs text-muted-foreground">Paid via Hive Keychain</p>
								</div>
								<div className="text-right">
									<p className="text-lg font-bold text-primary">
										{registrationFeeHive > 0 ? `${registrationFeeHive} HIVE` : 'Loading...'}
									</p>
									<p className="text-xs text-muted-foreground">
										${REGISTRATION_FEE_USD.toFixed(2)} USD
									</p>
								</div>
							</div>
						</div>

						{/* Referral Info */}
						{referredBy && referredBy !== 'idleraiders' && (
							<div className="rounded-lg border border-border bg-secondary/30 p-3">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-xs text-muted-foreground">Referred by</p>
										<p className="text-sm font-medium text-foreground">@{referredBy}</p>
									</div>
								<a
									href="https://discord.gg/PZzN2DKZxq"
									target="_blank"
									rel="noopener noreferrer"
									className="text-[10px] text-muted-foreground hover:text-primary transition-colors underline"
								>
									Wrong referral? Contact support
								</a>
								</div>
							</div>
						)}

						{/* Error Message */}
						{errorMessage && (
							<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-2">
								<AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
								<p className="text-sm text-destructive">{errorMessage}</p>
							</div>
						)}

						{/* Status Display */}
						{registrationStatus !== 'idle' && registrationStatus !== 'error' && (
							<div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
								<div className="flex items-center gap-3">
									{registrationStatus === 'paying' && (
										<>
											<Loader2 size={18} className="text-primary animate-spin" />
											<div>
												<p className="text-sm font-medium text-foreground">Waiting for Payment</p>
												<p className="text-xs text-muted-foreground">
													Confirm the transaction in Hive Keychain...
												</p>
											</div>
										</>
									)}
									{registrationStatus === 'confirming' && (
										<>
											<Loader2 size={18} className="text-primary animate-spin" />
											<div>
												<p className="text-sm font-medium text-foreground">
													Confirming Registration
												</p>
												<p className="text-xs text-muted-foreground">
													Processing your registration...
												</p>
											</div>
										</>
									)}
									{registrationStatus === 'success' && (
										<>
											<CheckCircle2 size={18} className="text-green-500" />
											<div>
												<p className="text-sm font-medium text-green-500">Registration Complete!</p>
												<p className="text-xs text-muted-foreground">Starting your adventure...</p>
											</div>
										</>
									)}
								</div>
							</div>
						)}

						{/* Action Buttons */}
						<div className="space-y-3">
							<Button
								onClick={handleRegistration}
								disabled={isProcessing || registrationStatus === 'success' || registrationFeeHive === 0}
								className="w-full fantasy-btn"
							>
								{isProcessing ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Processing...
									</>
								) : registrationStatus === 'success' ? (
									<>
										<CheckCircle2 className="mr-2 h-4 w-4" />
										Registered!
									</>
								) : registrationFeeHive === 0 ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Loading Price...
									</>
								) : (
									<>
										<Coins className="mr-2 h-4 w-4" />
										Pay {registrationFeeHive} HIVE & Register
									</>
								)}
							</Button>

							<button
								onClick={handleLogout}
								disabled={isProcessing}
								className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 py-2"
							>
								<LogOut size={12} />
								Sign out and use a different account
							</button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	)
}

export default RegistrationModal
