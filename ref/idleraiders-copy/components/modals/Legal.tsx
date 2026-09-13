'use client'
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const LegalModal = ({
	open,
	onClose,
	title,
	children,
}: {
	open: boolean
	onClose: () => void
	title: string
	children: React.ReactNode
}) => {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted || typeof document === 'undefined') return null

	return createPortal(
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-border p-6 md:p-8"
						style={{ background: 'linear-gradient(160deg, hsl(230 15% 13%), hsl(230 12% 8%))' }}
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-5">
							<h3 className="font-display text-lg md:text-xl font-bold text-primary">{title}</h3>
							<button
								onClick={onClose}
								className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
							>
								<X size={18} />
							</button>
						</div>
						<div className="prose-invert text-xs md:text-sm text-muted-foreground leading-relaxed space-y-4">
							{children}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	)
}

export default LegalModal
