import { useEffect, useState, useRef } from 'react'

interface TimerState {
  remaining: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isUrgent: boolean
  isComplete: boolean
  formatted: string
  formattedShort: string
}

/**
 * Custom hook for countdown timers
 * @param endTime - Unix timestamp in milliseconds when timer should end
 * @param onComplete - Callback function to run when timer reaches 0
 * @returns Timer state with formatted time strings and remaining milliseconds
 */
export const useTimer = (endTime: number, onComplete?: () => void): TimerState => {
  const safeEndTime = Number.isFinite(endTime) ? endTime : 0
  const [remaining, setRemaining] = useState<number>(Math.max(0, safeEndTime - Date.now()))
  
  // Track which endTime we've already called onComplete for to prevent duplicate calls
  const completedForEndTimeRef = useRef<number | null>(null)
  // Store onComplete in a ref to avoid re-running the effect when it changes
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    // Calculate initial remaining time
    const initialRemaining = Math.max(0, safeEndTime - Date.now())
    setRemaining(initialRemaining)
    
    // If already complete on mount/update and we haven't called for this endTime yet
    if (initialRemaining <= 0 && safeEndTime > 0 && completedForEndTimeRef.current !== safeEndTime) {
      completedForEndTimeRef.current = safeEndTime
      if (onCompleteRef.current) onCompleteRef.current()
      return
    }
    
    if (safeEndTime <= 0) {
      setRemaining(0)
      return
    }

    const interval = setInterval(() => {
      const r = Math.max(0, safeEndTime - Date.now())
      setRemaining(r)
      if (r <= 0) {
        clearInterval(interval)
        // Only call if we haven't already called for this endTime
        if (completedForEndTimeRef.current !== safeEndTime) {
          completedForEndTimeRef.current = safeEndTime
          if (onCompleteRef.current) onCompleteRef.current()
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [safeEndTime])

  const totalSecs = Math.floor(remaining / 1000)
  const days = Math.floor(totalSecs / 86400)
  const hours = Math.floor((totalSecs % 86400) / 3600)
  const minutes = Math.floor((totalSecs % 3600) / 60)
  const seconds = totalSecs % 60

  const format = (n: number): string => n.toString().padStart(2, '0')

  const isUrgent = totalSecs > 0 && totalSecs <= 60
  const isComplete = remaining <= 0

  return {
    remaining,
    days,
    hours,
    minutes,
    seconds,
    isUrgent,
    isComplete,
    formatted:
      days > 0
        ? `${days}d ${format(hours)}:${format(minutes)}:${format(seconds)}`
        : hours > 0
          ? `${format(hours)}:${format(minutes)}:${format(seconds)}`
          : `${format(minutes)}:${format(seconds)}`,
    formattedShort:
      days > 0
        ? `${days}d ${hours}h`
        : hours > 0
          ? `${hours}h ${minutes}m`
          : minutes > 0
            ? `${minutes}m ${seconds}s`
            : `${seconds}s`,
  }
}

export default useTimer
