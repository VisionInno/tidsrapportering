import type { TimeInterval } from '@/types'

/**
 * Rounds minutes up to nearest 15-minute interval
 * Examples: 12:51 -> 13:00, 13:01 -> 13:15, 13:16 -> 13:30
 */
export function roundUpTo15Minutes(minutes: number): number {
  return Math.ceil(minutes / 15) * 15
}

/**
 * Calculates hours from a time interval, rounding up to nearest 15 minutes
 */
export function calculateIntervalHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  // Handle case where end time is before start time (crosses midnight)
  const diffMinutes = endMinutes >= startMinutes
    ? endMinutes - startMinutes
    : (24 * 60 - startMinutes) + endMinutes

  // Round up to nearest 15 minutes
  const roundedMinutes = roundUpTo15Minutes(diffMinutes)

  return roundedMinutes / 60
}

/**
 * Calculates total hours from multiple time intervals
 * Each interval is rounded up individually to nearest 15 minutes
 */
export function calculateTotalHoursFromIntervals(intervals: TimeInterval[]): number {
  return intervals.reduce((total, interval) => {
    return total + calculateIntervalHours(interval.startTime, interval.endTime)
  }, 0)
}

/**
 * Formats a time interval for display
 */
export function formatTimeInterval(interval: TimeInterval): string {
  return `${interval.startTime}-${interval.endTime}`
}

/**
 * Parses a time string like "12:51" or "12.51" to "HH:mm" format
 */
export function parseTimeString(time: string): string | null {
  // Replace . with : for flexibility
  const normalized = time.replace('.', ':')
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/)

  if (!match) return null

  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Parses an interval string like "12:51-13:12" or "12.51-13.12"
 */
export function parseIntervalString(input: string): TimeInterval | null {
  const parts = input.split('-').map(s => s.trim())

  if (parts.length !== 2) return null

  const startTime = parseTimeString(parts[0])
  const endTime = parseTimeString(parts[1])

  if (!startTime || !endTime) return null

  return { startTime, endTime }
}

/**
 * Gets current time in HH:mm format
 */
export function getCurrentTime(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}
