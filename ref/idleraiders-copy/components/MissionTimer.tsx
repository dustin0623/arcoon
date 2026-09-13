import { useTimer } from '@/hooks/useTimer'

const MissionTimer = ({ endTime, onComplete }: { endTime: number; onComplete?: () => void }) => {
	const timer = useTimer(endTime, onComplete)

	return (
		<span
			className={`font-mono text-sm font-semibold text-primary tabular-nums ${
				timer.isUrgent ? 'animate-pulse' : ''
			}`}
		>
			{timer.formatted}
		</span>
	)
}

export default MissionTimer
