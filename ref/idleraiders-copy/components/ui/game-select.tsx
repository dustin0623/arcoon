import * as React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export const GameSelect = ({
	value,
	onValueChange,
	options,
	placeholder,
	className,
}: {
	value: any
	onValueChange: any
	options: any
	placeholder?: any
	className?: any
}) => {
	return (
		<Select value={value} onValueChange={onValueChange}>
			<SelectTrigger
				className={cn(
					'h-9 rounded-lg border border-input bg-secondary/50 px-2.5 text-[11px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
					className,
				)}
			>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent className="border-border bg-popover text-popover-foreground">
				{(options || []).map((opt: Record<string, any>) => (
					<SelectItem key={opt.value} value={opt.value} className="text-xs cursor-pointer">
						{opt.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

export default GameSelect
