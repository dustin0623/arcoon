const images = {
	token: '/assets/currencies/raid.png',
	hive: '/assets/currencies/hive.png',
	shard: '/assets/currencies/shards.png',
}

const CurrencyIcon = ({ type, size = 16, className = '' }: { type: string; size?: number; className?: string }) => {
	if (type === 'dollar') {
		return (
			<span
				aria-label="dollar"
				className={`inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-500/15 font-bold leading-none text-emerald-400 ${className}`}
				style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.75)) }}
			>
				$
			</span>
		)
	}

	return (
		<img
			src={images[type as keyof typeof images]}
			alt={type}
			width={size}
			height={size}
			className={`inline-block shrink-0 ${className}`}
			style={{ width: size, height: size }}
		/>
	)
}

export default CurrencyIcon
