import { Wrench, ExternalLink } from 'lucide-react'

/**
 * Maintenance page rendered when NEXT_PUBLIC_IS_MAINTENANCE === 'true'.
 *
 * Swapped in for the entire app's children in the root layout, so it covers
 * every route at once — no redirects, no middleware, no race conditions.
 *
 * Server component (no 'use client') so there's no client-side flash.
 */
export default function Maintenance() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 text-center shadow-2xl">
				{/* Icon */}
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
					<Wrench size={32} className="text-primary" aria-hidden="true" />
				</div>

				{/* Headline */}
				<div className="space-y-2">
					<h1 className="font-display text-3xl font-bold text-foreground text-balance">
						Under Maintenance
					</h1>
					<p className="text-sm leading-relaxed text-muted-foreground text-pretty">
						Idle Raiders is currently undergoing scheduled maintenance. We&apos;re working to bring
						the realm back online as quickly as possible.
					</p>
				</div>

				{/* Status box */}
				<div className="rounded-lg border border-border bg-secondary/30 p-4 text-left">
					<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
						What&apos;s happening?
					</p>
					<p className="text-sm leading-relaxed text-foreground">
						Servers are temporarily offline for updates. Your progress is safe and will be available
						as soon as we&apos;re back.
					</p>
				</div>

				{/* Discord link */}
				<div className="space-y-2 border-t border-border pt-4">
					<p className="text-xs text-muted-foreground">
						For live updates and announcements:
					</p>
					<a
						href="https://discord.gg/PZzN2DKZxq"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
					>
						Join our Discord
						<ExternalLink size={14} aria-hidden="true" />
					</a>
				</div>
			</div>
		</main>
	)
}
