/**
 * Time Utilities
 * Centralized timezone and date calculations for Manila (UTC+8)
 */

// Manila timezone offset in milliseconds (UTC+8)
export const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000

/**
 * Get Manila date string (YYYY-MM-DD)
 * @param date - JavaScript Date object
 * @returns Date string in Manila timezone
 */
export function getManilaDateString(date: Date): string {
  const manila = new Date(date.getTime() + MANILA_OFFSET_MS)
  return manila.toISOString().slice(0, 10)
}

/**
 * Get start of week (Monday 00:00) in Manila timezone
 * @param date - JavaScript Date object
 * @returns Date object for Monday 00:00 Manila time
 */
export function getManilaWeekStart(date: Date): Date {
  const manila = new Date(date.getTime() + MANILA_OFFSET_MS)
  const day = manila.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day // Monday = 1
  manila.setUTCDate(manila.getUTCDate() + diff)
  manila.setUTCHours(0, 0, 0, 0)
  return new Date(manila.getTime() - MANILA_OFFSET_MS)
}

/**
 * Get start of day (00:00) in Manila timezone
 * @param date - JavaScript Date object
 * @returns Date object for 00:00 Manila time
 */
export function getManilaDateStart(date: Date): Date {
  const manila = new Date(date.getTime() + MANILA_OFFSET_MS)
  manila.setUTCHours(0, 0, 0, 0)
  return new Date(manila.getTime() - MANILA_OFFSET_MS)
}

/**
 * Get end of day (23:59:59) in Manila timezone
 * @param date - JavaScript Date object
 * @returns Date object for 23:59:59 Manila time
 */
export function getManilaDateEnd(date: Date): Date {
  const manila = new Date(date.getTime() + MANILA_OFFSET_MS)
  manila.setUTCHours(23, 59, 59, 999)
  return new Date(manila.getTime() - MANILA_OFFSET_MS)
}

/**
 * Check if two dates are on the same day in Manila timezone
 * @param date1 - First date
 * @param date2 - Second date
 * @returns true if dates are on the same day in Manila timezone
 */
export function isSameManilaDay(date1: Date, date2: Date): boolean {
  return getManilaDateString(date1) === getManilaDateString(date2)
}

/**
 * Check if two dates are in the same week in Manila timezone
 * @param date1 - First date
 * @param date2 - Second date
 * @returns true if dates are in the same week in Manila timezone
 */
export function isSameManilaWeek(date1: Date, date2: Date): boolean {
  const week1 = getManilaWeekStart(date1)
  const week2 = getManilaWeekStart(date2)
  return week1.getTime() === week2.getTime()
}
