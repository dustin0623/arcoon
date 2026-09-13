export default function ProgressBar({ value, max, label }) {
  const percentage = max > 0 ? Math.floor((value / max) * 100) : 0

  return (
    <div className="w-full space-y-1">
      {label && <div className="text-xs text-muted-foreground">{label}</div>}
      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground text-right">
        {value} / {max}
      </div>
    </div>
  )
}
