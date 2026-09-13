'use client'

import { useState, useEffect, Suspense, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/context'
import { Loader2, FileText, ShieldCheck, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import LegalModal from '@/components/modals/Legal'
import { GAME_UI_IMAGES } from '@/features/images'

interface LoginResult {
	success: boolean
	isRegistered?: boolean
}

const LoginPage = () => {
	const router = useRouter()
	const { login, isLoading, error } = useAuth()
	const [username, setUsername] = useState<string>('')
	const [referralCode, setReferralCode] = useState<string>('')
	const [showReferral, setShowReferral] = useState<boolean>(false)
	const [termsOpen, setTermsOpen] = useState<boolean>(false)
	const [privacyOpen, setPrivacyOpen] = useState<boolean>(false)
	const [sessionExpired, setSessionExpired] = useState<boolean>(false)

	// Check for session expired parameter and referral code from URL
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		if (params.get('session_expired') === 'true') {
			setSessionExpired(true)
		}
		// Check for referral code in URL (e.g., /login?ref=someuser)
		const ref = params.get('ref')
		if (ref) {
			setReferralCode(ref)
			setShowReferral(true)
		}
	}, [])

	const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!username.trim()) return

		// Pass referral code to login - it will be saved if this is a new account
		const result = (await login(username.trim().toLowerCase(), referralCode.trim())) as LoginResult

		if (result?.success) {
			// Always redirect to /game - the game layout will show registration modal if needed
			router.push('/game')
		}
	}

	return (
		<div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="w-full max-w-sm space-y-6 text-center"
			>
				<motion.div className="flex flex-col items-center gap-3">
					<motion.img
						src={GAME_UI_IMAGES.logo}
						alt="IdleRaiders Logo"
						className="h-12"
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ delay: 0.1, duration: 0.6 }}
					/>
				</motion.div>
				<p className="text-sm text-muted-foreground">Sign in with your Hive account</p>

			{sessionExpired && (
				<div className="rounded-lg border border-amber-600/50 bg-amber-600/10 p-4 text-sm text-amber-600">
					<p className="font-semibold">⏱️ Session Expired</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Your login session has expired. Please sign in again.
					</p>
				</div>
			)}

			<form onSubmit={handleLogin} className="space-y-4">
					<Input
						placeholder="Hive username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						disabled={isLoading}
						className="text-center font-body"
						autoFocus
					/>
					
					{/* Referral code section */}
					{!showReferral ? (
						<button
							type="button"
							onClick={() => setShowReferral(true)}
							className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mx-auto"
						>
							<UserPlus size={12} />
							Have a referral code?
						</button>
					) : (
						<div className="space-y-2">
							<Input
								placeholder="Referral code (optional)"
								value={referralCode}
								onChange={(e) => setReferralCode(e.target.value)}
								disabled={isLoading}
								className="text-center font-body text-sm"
							/>
							<p className="text-[10px] text-muted-foreground">
								Enter a friend&apos;s username if they referred you
							</p>
						</div>
					)}
					
					{error && (
						<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive space-y-2">
							<p className="font-semibold">Error: {error}</p>
							{error.includes('timed out') && (
								<div className="text-[11px] space-y-1">
									<p className="font-semibold text-destructive">Quick fixes:</p>
									<ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
										<li>Ensure Hive Keychain is enabled (not in private/incognito mode)</li>
										<li>Refresh the page and try again</li>
										<li>Check if the keychain extension icon appears in your browser</li>
										<li>Try a different browser if issue persists</li>
									</ul>
								</div>
							)}
						</div>
					)}
				<Button
					type="submit"
					disabled={isLoading || !username.trim()}
					className="w-full fantasy-btn"
				>
					{isLoading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Waiting for Keychain…
						</>
					) : (
						'Sign In with Keychain'
					)}
				</Button>
				</form>

				<button
					onClick={() => router.push('/')}
					className="text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					← Back to home
				</button>

				<div className="flex items-center justify-center gap-3 pt-2">
					<button
						onClick={() => setTermsOpen(true)}
						className="text-[10px] text-muted-foreground/50 hover:text-primary transition-colors inline-flex items-center gap-1"
					>
						<FileText size={10} /> Terms
					</button>
					<span className="text-muted-foreground/20">·</span>
					<button
						onClick={() => setPrivacyOpen(true)}
						className="text-[10px] text-muted-foreground/50 hover:text-primary transition-colors inline-flex items-center gap-1"
					>
						<ShieldCheck size={10} /> Privacy
					</button>
				</div>
			</motion.div>

			<LegalModal open={termsOpen} onClose={() => setTermsOpen(false)} title="Terms & Conditions">
				<p>
					<strong className="text-foreground">Last Updated:</strong> March 8, 2026
				</p>
				<p>
					Welcome to Idle Raiders. By accessing or playing the game, you agree to be bound by these Terms and
					Conditions.
				</p>
				<h4 className="font-display font-bold text-foreground !mt-5">1. Acceptance of Terms</h4>
				<p>
					By creating an account or playing Idle Raiders, you acknowledge that you have read, understood, and
					agree to these Terms.
				</p>
				<h4 className="font-display font-bold text-foreground !mt-5">2. Game Assets & Virtual Items</h4>
				<p>
					All in-game items, cards, currencies (Realm Coins, Soul Shards), and other virtual assets are the
					property of Idle Raiders. Virtual items have no real-world monetary value outside of the Hive
					blockchain ecosystem.
				</p>
				<h4 className="font-display font-bold text-foreground !mt-5">3. User Accounts</h4>
				<p>
					You are responsible for maintaining the security of your account credentials. You must not share,
					sell, or transfer your account.
				</p>
				<h4 className="font-display font-bold text-foreground !mt-5">4. Fair Play</h4>
				<p>Use of bots, automation tools, exploits, or any form of cheating is strictly prohibited.</p>
				<h4 className="font-display font-bold text-foreground !mt-5">5. Marketplace Transactions</h4>
				<p>
					All marketplace transactions are final once confirmed. Idle Raiders is not responsible for trades
					conducted between players.
				</p>
				<h4 className="font-display font-bold text-foreground !mt-5">6. Modifications</h4>
				<p>
					We reserve the right to modify game mechanics, stats, reward formulas, and card balances at any
					time.
				</p>
				<h4 className="font-display font-bold text-foreground !mt-5">7. Contact</h4>
				<p>For questions, contact us at support@idleraiders.site.</p>
			</LegalModal>

			<LegalModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Privacy Policy">
				<p>
					<strong className="text-foreground">Last Updated:</strong> March 8, 2026
				</p>
				<p>This Privacy Policy describes how Idle Raiders collects, uses, and protects your information.</p>
				<h4 className="font-display font-bold text-foreground !mt-5">1. Information We Collect</h4>
				<p>
					We collect your Hive blockchain username and public key for authentication, plus gameplay data
					including mission history, card collections, and achievement progress.
				</p>
				<h4 className="font-display font-bold text-foreground !mt-5">2. How We Use Your Information</h4>
				<p>
					To provide the game service, display leaderboards, process marketplace transactions, and improve
					game balance.
				</p>
				<h4 className="font-display font-bold text-foreground !mt-5">3. Data Storage</h4>
				<p>
					Game data is stored securely and associated with your Hive account. Blockchain transactions are
					publicly visible on the Hive blockchain.
				</p>
				<h4 className="font-display font-bold text-foreground !mt-5">4. Third-Party Services</h4>
				<p>
					We integrate with the Hive blockchain for authentication. We do not sell your personal data to third
					parties.
				</p>
				<h4 className="font-display font-bold text-foreground !mt-5">5. Cookies & Local Storage</h4>
				<p>We use browser local storage for game preferences. No tracking cookies are used for advertising.</p>
				<h4 className="font-display font-bold text-foreground !mt-5">6. Contact</h4>
				<p>For privacy inquiries, contact us at privacy@idleraiders.site.</p>
			</LegalModal>
		</div>
	)
}

const LoginPageWrapper = () => (
	<Suspense fallback={null}>
		<LoginPage />
	</Suspense>
)

export default LoginPageWrapper
