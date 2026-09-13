/**
 * Leaderboard Logic
 * Week calculation utilities for leaderboard system
 * 
 * Week schedule: Monday 00:00 UTC+8 to Sunday 23:59 UTC+8
 * Snapshot runs: Sunday 16:00 UTC (Monday 00:00 UTC+8)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

// Week starts on Monday 00:00 UTC+8 (Sunday 16:00 UTC)
const WEEK_START_UTC_OFFSET = 8 // UTC+8 (Manila/Singapore time)
const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_DAY = 24 * MS_PER_HOUR
const MS_PER_WEEK = 7 * MS_PER_DAY

// Reference point: A known Monday 00:00 UTC+8
// Using April 6, 2026 (a Monday) as epoch reference for Week 1
const EPOCH_MONDAY_UTC8 = new Date('2026-04-06T00:00:00+08:00').getTime()

// ═══════════════════════════════════════════════════════════════════════════════
// Week Calculation Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert a UTC date to UTC+8 timestamp
 */
function toUTC8(date: Date): Date {
  const utcTime = date.getTime()
  const utc8Time = utcTime + WEEK_START_UTC_OFFSET * MS_PER_HOUR
  return new Date(utc8Time)
}

/**
 * Get the Monday 00:00 UTC+8 for a given date
 */
function getMondayOfWeek(date: Date): Date {
  // Convert to UTC+8
  const utc8Date = toUTC8(date)
  
  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = utc8Date.getUTCDay()
  
  // Calculate days since Monday (Monday = 0, Sunday = 6)
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  
  // Get start of day in UTC+8
  const startOfDay = new Date(utc8Date)
  startOfDay.setUTCHours(0, 0, 0, 0)
  
  // Subtract days to get to Monday
  const mondayTime = startOfDay.getTime() - daysSinceMonday * MS_PER_DAY
  
  // Convert back to UTC
  return new Date(mondayTime - WEEK_START_UTC_OFFSET * MS_PER_HOUR)
}

/**
 * Calculate week number since epoch
 */
function calculateWeekNumber(date: Date): number {
  const monday = getMondayOfWeek(date)
  const weeksSinceEpoch = Math.floor((monday.getTime() - EPOCH_MONDAY_UTC8 + WEEK_START_UTC_OFFSET * MS_PER_HOUR) / MS_PER_WEEK)
  return weeksSinceEpoch + 1 // Week 1 starts at epoch
}

/**
 * Get current week info
 * Returns week number, start date (Monday 00:00 UTC+8), and end date (Sunday 23:59 UTC+8)
 */
export function getCurrentWeek(): {
  weekNumber: number
  weekStart: Date
  weekEnd: Date
} {
  return getWeekForDate(new Date())
}

/**
 * Get week info for a specific date
 */
export function getWeekForDate(date: Date): {
  weekNumber: number
  weekStart: Date
  weekEnd: Date
} {
  const weekNumber = calculateWeekNumber(date)
  const weekStart = getMondayOfWeek(date)
  const weekEnd = new Date(weekStart.getTime() + MS_PER_WEEK - 1) // Sunday 23:59:59.999 UTC+8

  return {
    weekNumber,
    weekStart,
    weekEnd,
  }
}

/**
 * Get week info by week number
 */
export function getWeekByNumber(weekNumber: number): {
  weekNumber: number
  weekStart: Date
  weekEnd: Date
} {
  // Calculate the start of the week from week number
  const weekStartTime = EPOCH_MONDAY_UTC8 + (weekNumber - 1) * MS_PER_WEEK - WEEK_START_UTC_OFFSET * MS_PER_HOUR
  const weekStart = new Date(weekStartTime)
  const weekEnd = new Date(weekStartTime + MS_PER_WEEK - 1)

  return {
    weekNumber,
    weekStart,
    weekEnd,
  }
}

/**
 * Check if a date falls within the current week
 */
export function isCurrentWeek(date: Date): boolean {
  const current = getCurrentWeek()
  const check = getWeekForDate(date)
  return current.weekNumber === check.weekNumber
}

/**
 * Get time remaining until week ends (in milliseconds)
 */
export function getTimeUntilWeekEnd(): number {
  const { weekEnd } = getCurrentWeek()
  return Math.max(0, weekEnd.getTime() - Date.now())
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(ms: number): string {
  const days = Math.floor(ms / MS_PER_DAY)
  const hours = Math.floor((ms % MS_PER_DAY) / MS_PER_HOUR)
  const minutes = Math.floor((ms % MS_PER_HOUR) / (60 * 1000))

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)

  return parts.join(' ')
}
