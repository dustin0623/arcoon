'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/context'
import {
	Swords,
	Shield,
	Trophy,
	Castle,
	Coins,
	Crown,
	Users,
	Menu,
	X,
	ArrowRight,
	FileText,
	ShieldCheck,
	Flame,
	BookOpen,
} from 'lucide-react'

import { GAME_UI_IMAGES, CARD_IMAGES } from '@/features/images'
import LegalModal from '@/components/modals/Legal'

/* ─── Data ─── */

const navLinks = [
	{ label: 'Features', href: '#features' },
	{ label: 'How to Play', href: '#how' },
	{ label: 'Heroes', href: '#heroes' },
	{ label: 'Docs', href: '/docs', isRoute: true },
]

const features = [
	{ icon: Swords, title: 'Epic Raids', desc: 'Storm dungeons solo or with allies. Defeat bosses for legendary loot.' },
	{ icon: Castle, title: 'Conquer Territories', desc: 'Claim 5+ unique realms, each with its own enemies and rewards.' },
	{ icon: Users, title: 'Collect Heroes', desc: '100+ unique cards across warriors, mages, rogues, and more.' },
	{ icon: Coins, title: 'Player Economy', desc: 'Trade rare items in a dynamic, player-driven marketplace.' },
	{ icon: Shield, title: 'Idle Progression', desc: "Your raiders fight while you're away. Always grow stronger." },
	{ icon: Crown, title: 'Endgame Glory', desc: 'Climb leaderboards and prove your dominance season after season.' },
]

const steps = [
	{ n: '01', title: 'Recruit', desc: 'Summon your first heroes and assemble a balanced raiding party.' },
	{ n: '02', title: 'Raid', desc: 'Send your party into dungeons. They fight automatically — even offline.' },
	{ n: '03', title: 'Ascend', desc: 'Upgrade gear, evolve heroes, and conquer increasingly deadly territories.' },
]

	const heroes = [
		{ img: CARD_IMAGES.legendary_hero_1, name: 'Aurelion the Dragonlord', class: 'Warrior', rarity: 'Legendary', power: 7200 },
		{ img: CARD_IMAGES.epic_hero_1, name: 'Nyx Shadowblade', class: 'Rogue', rarity: 'Epic', power: 1425 },
		{ img: CARD_IMAGES.rare_hero_1, name: 'Evershade Ranger', class: 'Archer', rarity: 'Rare', power: 480 },
	]

const footerLinks = [
	{ label: 'Discord', icon: Users, href: 'https://discord.gg/PZzN2DKZxq', external: true },
	{ label: 'Peakd', icon: Flame, href: 'https://peakd.com/@idleraiders', external: true },
	{ label: 'Documentation', icon: BookOpen, href: '/docs' },
	{ label: 'Terms', icon: FileText, action: 'terms' },
	{ label: 'Privacy', icon: ShieldCheck, action: 'privacy' },
]

/* ─── Page ─── */

export default function LandingPage() {
	const router = useRouter()
	const { isAuthenticated } = useAuth()
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [termsOpen, setTermsOpen] = useState(false)
	const [privacyOpen, setPrivacyOpen] = useState(false)

	// Redirect authenticated users to game
	useEffect(() => {
		if (isAuthenticated) {
			router.replace('/game')
		}
	}, [isAuthenticated, router])

	return (
		<div className="min-h-screen bg-background">
			{/* ═══ NAVBAR ═══ */}
			<header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-primary/10">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
					<Link href="/" className="flex items-center group">
						<img
							src={GAME_UI_IMAGES.logo}
							alt="Idle Raiders"
							className="h-10 sm:h-11 w-auto drop-shadow-[0_2px_8px_rgba(255,180,60,0.35)] transition-transform group-hover:scale-105"
						/>
					</Link>

					<nav className="hidden md:flex items-center gap-8">
						{navLinks.map((l) =>
							l.isRoute ? (
								<Link
									key={l.label}
									href={l.href}
									className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
								>
									{l.label}
								</Link>
							) : (
								<a
									key={l.label}
									href={l.href}
									className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
								>
									{l.label}
								</a>
							)
						)}
					</nav>

						<button
							onClick={() => router.push('/login')}
							className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105"
							style={{
								background: 'linear-gradient(135deg, hsl(43 85% 55%), hsl(43 85% 45%))',
								color: 'hsl(230 15% 8%)',
								boxShadow: '0 4px 12px hsl(43 85% 59% / 0.3)'
							}}
						>
							Play Now <ArrowRight className="h-4 w-4" />
						</button>

					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="md:hidden h-10 w-10 grid place-items-center rounded-lg border border-primary/20 text-primary"
						aria-label="Menu"
					>
						{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</button>
				</div>

				{mobileMenuOpen && (
					<div className="md:hidden border-t border-primary/10 bg-background/95 backdrop-blur-xl">
						<div className="px-4 py-4 flex flex-col gap-1">
							{navLinks.map((l) =>
								l.isRoute ? (
									<Link
										key={l.label}
										href={l.href}
										onClick={() => setMobileMenuOpen(false)}
										className="px-3 py-3 rounded-lg text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
									>
										{l.label}
									</Link>
								) : (
									<a
										key={l.label}
										href={l.href}
										onClick={() => setMobileMenuOpen(false)}
										className="px-3 py-3 rounded-lg text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
									>
										{l.label}
									</a>
								)
							)}
								<button
									onClick={() => {
										setMobileMenuOpen(false)
										router.push('/login')
									}}
									className="mt-2 text-center px-5 py-3 rounded-full font-bold"
									style={{
										background: 'linear-gradient(135deg, hsl(43 85% 55%), hsl(43 85% 45%))',
										color: 'hsl(230 15% 8%)',
										boxShadow: '0 4px 12px hsl(43 85% 59% / 0.3)'
									}}
								>
									Play Now <ArrowRight className="h-4 w-4 inline ml-1" />
								</button>
						</div>
					</div>
				)}
			</header>

			<main>
				{/* ═══ HERO SECTION ═══ */}
				<section id="top" className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
					{/* Background image */}
					<div className="absolute inset-0 -z-10">
						<img
							src="/assets/hero-raiders.jpg"
							alt="Idle Raiders fantasy battle scene"
							className="w-full h-full object-cover opacity-40"
							width={1536}
							height={1024}
						/>
						<div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
						<div className="absolute inset-0 ember-glow" />
					</div>

					{/* Floating embers */}
					<div className="absolute inset-0 -z-10 pointer-events-none">
						{[...Array(12)].map((_, i) => (
							<span
								key={i}
								className="absolute h-1 w-1 rounded-full bg-primary animate-ember"
								style={{
									left: `${(i * 8.3) % 100}%`,
									top: `${(i * 17) % 90}%`,
									animationDelay: `${i * 0.5}s`,
									opacity: 0.6,
								}}
							/>
						))}
					</div>

					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
						<motion.h1
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.8 }}
							className="flex justify-center"
						>
							<img
								src={GAME_UI_IMAGES.logo}
								alt="Idle Raiders"
								className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl h-auto drop-shadow-[0_8px_40px_rgba(255,180,60,0.45)]"
							/>
						</motion.h1>

						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.8 }}
							className="mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed"
						>
							Build legendary armies, raid powerful dungeons, and battle fearsome bosses in the ultimate collectible
							RPG — where <span className="text-primary font-semibold">every card matters</span>.
						</motion.p>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.5, duration: 0.8 }}
								className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
							>
								<button
									onClick={() => router.push('/login')}
									className="group inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform"
									style={{
										background: 'linear-gradient(135deg, hsl(43 85% 55%), hsl(43 85% 45%))',
										color: 'hsl(230 15% 8%)',
										boxShadow: '0 8px 24px hsl(43 85% 59% / 0.35), 0 4px 12px hsl(43 85% 59% / 0.2)'
									}}
								>
									Begin Your Quest
									<ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
								</button>
								<a
									href="#features"
									className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-primary/50 text-foreground font-bold hover:bg-primary/10 hover:border-primary transition-colors"
								>
									Learn More
								</a>
							</motion.div>

						{/* Stats */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.7, duration: 0.8 }}
							className="mt-20 grid grid-cols-3 gap-4 sm:gap-12 max-w-2xl mx-auto"
						>
								{[
									{ value: '5+', label: 'Territories' },
									{ value: '100+', label: 'Unique Cards' },
									{ value: '∞', label: 'Progression' },
								].map((s) => (
									<div key={s.label} className="text-center">
										<div className="font-display text-4xl sm:text-5xl font-bold text-primary">{s.value}</div>
										<div className="mt-2 text-xs sm:text-sm uppercase tracking-widest text-secondary-foreground">
											{s.label}
										</div>
									</div>
								))}
						</motion.div>
					</div>
				</section>

				{/* ═══ FEATURES ═══ */}
				<section id="features" className="relative py-24 sm:py-32">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
							<div className="text-center max-w-2xl mx-auto">
								<p className="text-primary text-sm font-bold uppercase tracking-widest">Features</p>
								<h2 className="mt-4 font-display text-4xl sm:text-5xl font-bold text-foreground">
									Forged for <span className="text-primary">true raiders</span>
								</h2>
								<p className="mt-4 text-secondary-foreground">
									Every system designed to reward strategy, persistence, and a sharp blade.
								</p>
							</div>

						<div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{features.map((f) => (
								<motion.div
									key={f.title}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									className="group relative p-8 rounded-2xl bg-card/60 backdrop-blur border border-primary/10 hover:border-primary/40 transition-all hover:-translate-y-1 hover:shadow-gold"
								>
									<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
								<div className="relative">
									<div 
										className="h-12 w-12 rounded-xl grid place-items-center mb-5"
										style={{ 
											background: 'linear-gradient(135deg, hsl(43 85% 55%), hsl(43 85% 45%))',
											boxShadow: '0 4px 12px hsl(43 85% 59% / 0.3)'
										}}
									>
										<f.icon className="h-6 w-6" style={{ color: 'hsl(230 15% 8%)' }} />
									</div>
									<h3 className="font-display text-xl font-bold text-foreground">{f.title}</h3>
									<p className="mt-2 text-secondary-foreground leading-relaxed">{f.desc}</p>
								</div>
								</motion.div>
							))}
						</div>
					</div>
				</section>

				{/* ═══ HEROES ═══ */}
				<section id="heroes" className="relative py-24 sm:py-32">
					<div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-accent/10 to-transparent" />

					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
							<div className="text-center max-w-2xl mx-auto">
								<p className="text-primary text-sm font-bold uppercase tracking-widest">Heroes</p>
								<h2 className="mt-4 font-display text-4xl sm:text-5xl font-bold text-foreground">
									Summon <span className="text-primary">legends</span>
								</h2>
								<p className="mt-4 text-secondary-foreground">
									Collect and ascend over 100 unique heroes — each with signature abilities.
								</p>
							</div>

						<div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
							{heroes.map((h, i) => (
								<motion.div
									key={h.name}
									initial={{ opacity: 0, y: 30 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ delay: i * 0.1 }}
									className="group relative rounded-3xl overflow-hidden border border-primary/20 bg-card shadow-card hover:shadow-gold-lg transition-all duration-500 hover:-translate-y-2"
									style={{ transform: `rotate(${(i - 1) * 1.5}deg)` }}
								>
									<div className="aspect-[2/3] overflow-hidden bg-gradient-to-b from-accent/40 to-background">
										<img
											src={h.img}
											alt={`${h.name} the ${h.class}`}
											loading="lazy"
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
										/>
									</div>
									<div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent">
										<div className="flex items-center justify-between mb-2">
											<span className="text-xs font-bold uppercase tracking-wider text-primary">{h.rarity}</span>
											<span className="text-xs text-muted-foreground">PWR {h.power.toLocaleString()}</span>
										</div>
										<h3 className="font-display text-2xl font-bold text-foreground">{h.name}</h3>
										<p className="text-sm text-muted-foreground">{h.class}</p>
									</div>
								</motion.div>
							))}
						</div>
					</div>
				</section>

				{/* ═══ HOW TO PLAY ═══ */}
				<section id="how" className="relative py-24 sm:py-32">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
							<div className="text-center max-w-2xl mx-auto">
								<p className="text-primary text-sm font-bold uppercase tracking-widest">How to Play</p>
								<h2 className="mt-4 font-display text-4xl sm:text-5xl font-bold text-foreground">
									Three steps to <span className="text-primary">glory</span>
								</h2>
							</div>

						<div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 relative">
							{/* Connecting line */}
							<div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

								{steps.map((s) => (
									<motion.div
										key={s.n}
										initial={{ opacity: 0, y: 20 }}
										whileInView={{ opacity: 1, y: 0 }}
										viewport={{ once: true }}
										className="relative text-center"
									>
										<div 
											className="mx-auto h-24 w-24 rounded-full bg-card border-2 border-primary/40 grid place-items-center font-display text-3xl font-black text-primary animate-glow-pulse"
											style={{ boxShadow: '0 4px 12px hsl(43 85% 59% / 0.3)' }}
										>
											{s.n}
										</div>
										<h3 className="mt-6 font-display text-2xl font-bold text-foreground">{s.title}</h3>
										<p className="mt-2 text-secondary-foreground max-w-xs mx-auto">{s.desc}</p>
									</motion.div>
								))}
						</div>
					</div>
				</section>

					{/* ═══ CTA ═══ */}
					<section id="play" className="relative py-24 sm:py-32">
						<div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
							<motion.div
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								className="relative overflow-hidden rounded-3xl border border-primary/30 p-10 sm:p-16 text-center"
								style={{
									background: 'linear-gradient(135deg, hsl(230 12% 12%), hsl(230 12% 16%), hsl(230 12% 10%))',
									boxShadow: '0 8px 32px hsl(43 85% 59% / 0.15), 0 0 60px hsl(43 85% 59% / 0.08)'
								}}
							>
								<div className="absolute inset-0 ember-glow opacity-60" />
								<div className="relative">
									<h2 className="font-display text-4xl sm:text-6xl font-black text-foreground">
										The dungeon <span className="text-primary">awaits</span>
									</h2>
										<p className="mt-6 max-w-xl mx-auto text-lg text-secondary-foreground">
											Join thousands of raiders. No downloads. Pure adventure.
										</p>
									<button
										onClick={() => router.push('/login')}
										className="mt-10 group inline-flex items-center gap-2 px-10 py-5 rounded-full font-bold text-lg hover:scale-105 transition-transform"
										style={{
											background: 'linear-gradient(135deg, hsl(43 85% 55%), hsl(43 85% 45%))',
											color: 'hsl(230 15% 8%)',
											boxShadow: '0 8px 24px hsl(43 85% 59% / 0.35), 0 4px 12px hsl(43 85% 59% / 0.2)'
										}}
										>
											Play Now
											<ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
									</button>
								</div>
							</motion.div>
						</div>
					</section>
			</main>

			{/* ═══ FOOTER ═══ */}
			<footer className="relative border-t border-primary/10 mt-12">
				<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
					<div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-8">
						<Link href="/" className="flex items-center gap-2 group">
							<img
								src={GAME_UI_IMAGES.logo}
								alt="Idle Raiders"
								className="h-9 w-auto drop-shadow-[0_2px_8px_rgba(255,180,60,0.35)] transition-transform group-hover:scale-105"
							/>
						</Link>

						<nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm">
							{footerLinks.map((link, i) => {
								const Icon = link.icon
								const content = (
									<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-muted-foreground hover:text-primary transition-colors">
										<Icon className="h-4 w-4" />
										{link.label}
									</span>
								)
								return (
									<div key={link.label} className="flex items-center">
										{link.external ? (
											<a href={link.href} target="_blank" rel="noopener noreferrer">
												{content}
											</a>
										) : link.action ? (
											<button onClick={() => (link.action === 'terms' ? setTermsOpen(true) : setPrivacyOpen(true))}>
												{content}
											</button>
										) : (
											<Link href={link.href!}>{content}</Link>
										)}
										{i < footerLinks.length - 1 && <span className="text-primary/30 select-none">·</span>}
									</div>
								)
							})}
						</nav>
					</div>

					<div className="mt-10 pt-6 border-t border-primary/10 text-center">
						<p className="text-xs text-muted-foreground">
							© 2026 Idle Raiders. All rights reserved. Crafted with passion for epic adventures.
						</p>
					</div>
				</div>
			</footer>

			{/* ═══ LEGAL MODALS ═══ */}
			<LegalModal open={termsOpen} onClose={() => setTermsOpen(false)} title="Terms & Conditions">
				<p>
					<strong className="text-foreground">Last Updated:</strong> March 8, 2026
				</p>
				<p>
					Welcome to Idle Raiders. By accessing or playing the game, you agree to be bound by these Terms and
					Conditions.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">1. Acceptance of Terms</h4>
				<p>
					By creating an account or playing Idle Raiders, you acknowledge that you have read, understood, and agree
					to these Terms. If you do not agree, you must not use the service.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">2. Game Assets & Virtual Items</h4>
				<p>
					All in-game items, cards, currencies (Realm Coins, Soul Shards), and other virtual assets are the property
					of Idle Raiders. You are granted a limited, non-transferable license to use these items within the game.
					Virtual items have no real-world monetary value outside of the Hive blockchain ecosystem.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">3. User Accounts</h4>
				<p>
					You are responsible for maintaining the security of your account credentials. You must not share, sell, or
					transfer your account to another person. Idle Raiders reserves the right to suspend or terminate accounts
					that violate these terms.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">4. Fair Play</h4>
				<p>
					Use of bots, automation tools, exploits, or any form of cheating is strictly prohibited. Players found
					violating fair play policies may have their accounts permanently banned without prior notice.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">5. Marketplace Transactions</h4>
				<p>
					All marketplace transactions are final once confirmed. Idle Raiders is not responsible for trades conducted
					between players. Users engage in marketplace activity at their own risk.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">6. Modifications</h4>
				<p>
					We reserve the right to modify game mechanics, stats, reward formulas, and card balances at any time to
					maintain game integrity. We will communicate major changes through in-game announcements.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">7. Limitation of Liability</h4>
				<p>
					Idle Raiders is provided &quot;as is&quot; without warranties of any kind. We are not liable for any
					losses, damages, or interruptions arising from the use of the game or its services.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">8. Contact</h4>
				<p>
					For questions regarding these terms, please reach out through our community channels or contact us at
					support@idleraiders.site.
				</p>
			</LegalModal>

			<LegalModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Privacy Policy">
				<p>
					<strong className="text-foreground">Last Updated:</strong> March 8, 2026
				</p>
				<p>This Privacy Policy describes how Idle Raiders collects, uses, and protects your information.</p>
				<h4 className="font-display font-bold text-foreground mt-5!">1. Information We Collect</h4>
				<p>
					We collect your Hive blockchain username and public key for authentication. We also collect gameplay data
					including mission history, card collections, marketplace activity, and achievement progress.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">2. How We Use Your Information</h4>
				<p>
					Your information is used to: provide and maintain the game service, display leaderboards and player
					profiles, process marketplace transactions, improve game balance and mechanics, and communicate important
					updates.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">3. Data Storage</h4>
				<p>
					Game data is stored securely and associated with your Hive account. Blockchain transactions (if any) are
					publicly visible on the Hive blockchain by nature of the technology.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">4. Third-Party Services</h4>
				<p>
					We integrate with the Hive blockchain for authentication and may use analytics services to monitor game
					performance. We do not sell your personal data to third parties.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">5. Cookies & Local Storage</h4>
				<p>
					We use browser local storage to save game preferences such as audio settings and UI state. No tracking
					cookies are used for advertising purposes.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">6. Data Retention</h4>
				<p>
					Your game data is retained as long as your account is active. You may request account deletion by
					contacting support, which will remove all associated game data.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">7. Children&apos;s Privacy</h4>
				<p>
					Idle Raiders is not intended for children under 13. We do not knowingly collect data from children under
					this age.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">8. Changes to This Policy</h4>
				<p>
					We may update this Privacy Policy periodically. Continued use of the game after changes constitutes
					acceptance of the updated policy.
				</p>
				<h4 className="font-display font-bold text-foreground mt-5!">9. Contact</h4>
				<p>For privacy-related inquiries, contact us at privacy@idleraiders.site.</p>
			</LegalModal>
		</div>
	)
}
