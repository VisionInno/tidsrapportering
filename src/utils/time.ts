import type { TimeInterval, ViewMode } from '@/types'

/**
 * Rounds minutes up to nearest 15-minute interval
 */
export function roundUpTo15Minutes(minutes: number): number {
  return Math.ceil(minutes / 15) * 15
}

/**
 * Calculates exact minutes from a time interval (no rounding)
 */
export function calculateIntervalMinutes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  // Handle case where end time is before start time (crosses midnight)
  return endMinutes >= startMinutes
    ? endMinutes - startMinutes
    : (24 * 60 - startMinutes) + endMinutes
}

/**
 * Calculates hours from a time interval, rounding up to nearest 15 minutes
 * @deprecated Use calculateIntervalMinutes and round at summary level instead
 */
export function calculateIntervalHours(startTime: string, endTime: string): number {
  const diffMinutes = calculateIntervalMinutes(startTime, endTime)
  const roundedMinutes = roundUpTo15Minutes(diffMinutes)
  return roundedMinutes / 60
}

/**
 * Calculates exact total minutes from multiple time intervals (no rounding)
 */
export function calculateTotalMinutesFromIntervals(intervals: TimeInterval[]): number {
  return intervals.reduce((total, interval) => {
    return total + calculateIntervalMinutes(interval.startTime, interval.endTime)
  }, 0)
}

/**
 * Calculates total hours from intervals, summing minutes first then rounding
 */
export function calculateTotalHoursFromIntervals(intervals: TimeInterval[]): number {
  const totalMinutes = calculateTotalMinutesFromIntervals(intervals)
  const roundedMinutes = roundUpTo15Minutes(totalMinutes)
  return roundedMinutes / 60
}

/**
 * Converts minutes to hours, rounding up to nearest 15 minutes
 */
export function minutesToRoundedHours(minutes: number): number {
  const roundedMinutes = roundUpTo15Minutes(minutes)
  return roundedMinutes / 60
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

/**
 * Gets date range for the specified view mode
 * Week starts on Monday (calendar week)
 */
export function getDateRangeForViewMode(viewMode: ViewMode, monthOffset = 0): { start: string; end: string; label: string } {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  switch (viewMode) {
    case 'day':
      return { start: todayStr, end: todayStr, label: 'Idag' }
    case 'week': {
      // Monday of this week (calendar week)
      const weekStart = new Date(today)
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      weekStart.setDate(diff)
      return { start: weekStart.toISOString().split('T')[0], end: todayStr, label: 'Denna vecka' }
    }
    case 'month': {
      const targetMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
      const monthStart = targetMonth.toISOString().split('T')[0]

      // If viewing current month, end is today. Otherwise end of that month.
      const isCurrentMonth = monthOffset === 0
      const monthEnd = isCurrentMonth
        ? todayStr
        : new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).toISOString().split('T')[0]

      const label = targetMonth.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })
      return { start: monthStart, end: monthEnd, label }
    }
  }
}
