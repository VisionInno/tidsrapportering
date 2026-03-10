import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  roundUpTo15Minutes,
  calculateIntervalMinutes,
  calculateIntervalHours,
  calculateTotalMinutesFromIntervals,
  calculateTotalHoursFromIntervals,
  minutesToRoundedHours,
  formatTimeInterval,
  parseTimeString,
  parseIntervalString,
  getCurrentTime,
  getDateRangeForViewMode,
} from '@/utils/time'

// ============================================================
// roundUpTo15Minutes - Kärnan i faktureringslogiken
// ============================================================
describe('roundUpTo15Minutes', () => {
  it('avrundar 0 minuter till 0', () => {
    expect(roundUpTo15Minutes(0)).toBe(0)
  })

  it('avrundar 1 minut uppåt till 15', () => {
    expect(roundUpTo15Minutes(1)).toBe(15)
  })

  it('avrundar 7 minuter uppåt till 15', () => {
    expect(roundUpTo15Minutes(7)).toBe(15)
  })

  it('avrundar 14 minuter uppåt till 15', () => {
    expect(roundUpTo15Minutes(14)).toBe(15)
  })

  it('behåller exakt 15 minuter som 15', () => {
    expect(roundUpTo15Minutes(15)).toBe(15)
  })

  it('avrundar 16 minuter uppåt till 30', () => {
    expect(roundUpTo15Minutes(16)).toBe(30)
  })

  it('avrundar 29 minuter uppåt till 30', () => {
    expect(roundUpTo15Minutes(29)).toBe(30)
  })

  it('behåller exakt 30 minuter som 30', () => {
    expect(roundUpTo15Minutes(30)).toBe(30)
  })

  it('avrundar 31 minuter uppåt till 45', () => {
    expect(roundUpTo15Minutes(31)).toBe(45)
  })

  it('avrundar 59 minuter uppåt till 60', () => {
    expect(roundUpTo15Minutes(59)).toBe(60)
  })

  it('behåller exakt 60 minuter som 60', () => {
    expect(roundUpTo15Minutes(60)).toBe(60)
  })

  it('hanterar stora värden: 481 min -> 495 min (8h 1min -> 8h 15min)', () => {
    expect(roundUpTo15Minutes(481)).toBe(495)
  })
})

// ============================================================
// calculateIntervalMinutes - Exakt minutberäkning
// ============================================================
describe('calculateIntervalMinutes', () => {
  it('beräknar enkel timme: 08:00-09:00 = 60 min', () => {
    expect(calculateIntervalMinutes('08:00', '09:00')).toBe(60)
  })

  it('beräknar del av timme: 08:00-08:45 = 45 min', () => {
    expect(calculateIntervalMinutes('08:00', '08:45')).toBe(45)
  })

  it('beräknar 1 minut: 08:00-08:01 = 1 min', () => {
    expect(calculateIntervalMinutes('08:00', '08:01')).toBe(1)
  })

  it('returnerar 0 för samma start och slut: 08:00-08:00', () => {
    expect(calculateIntervalMinutes('08:00', '08:00')).toBe(0)
  })

  it('beräknar halv arbetsdag: 08:00-12:00 = 240 min', () => {
    expect(calculateIntervalMinutes('08:00', '12:00')).toBe(240)
  })

  it('hanterar midnattskorsning: 23:00-01:00 = 120 min', () => {
    expect(calculateIntervalMinutes('23:00', '01:00')).toBe(120)
  })

  it('hanterar midnattskorsning: 23:30-00:30 = 60 min', () => {
    expect(calculateIntervalMinutes('23:30', '00:30')).toBe(60)
  })
})

// ============================================================
// calculateIntervalHours - Timmar med 15-min avrundning
// ============================================================
describe('calculateIntervalHours', () => {
  it('1 timme exakt: 08:00-09:00 = 1.0h', () => {
    expect(calculateIntervalHours('08:00', '09:00')).toBe(1.0)
  })

  it('avrundar uppåt: 08:00-08:10 = 0.25h (10 min -> 15 min)', () => {
    expect(calculateIntervalHours('08:00', '08:10')).toBe(0.25)
  })

  it('avrundar uppåt: 08:00-08:20 = 0.5h (20 min -> 30 min)', () => {
    expect(calculateIntervalHours('08:00', '08:20')).toBe(0.5)
  })

  it('avrundar uppåt: 08:00-08:40 = 0.75h (40 min -> 45 min)', () => {
    expect(calculateIntervalHours('08:00', '08:40')).toBe(0.75)
  })

  it('returnerar 0 för samma start och slut (anroparen hanterar minimum)', () => {
    expect(calculateIntervalHours('08:00', '08:00')).toBe(0)
  })

  it('1 minut ger 0.25h (avrundas till 15 min)', () => {
    expect(calculateIntervalHours('15:00', '15:01')).toBe(0.25)
  })
})

// ============================================================
// calculateTotalMinutesFromIntervals / calculateTotalHoursFromIntervals
// ============================================================
describe('calculateTotalMinutesFromIntervals', () => {
  it('returnerar 0 för tom lista', () => {
    expect(calculateTotalMinutesFromIntervals([])).toBe(0)
  })

  it('summerar ett intervall', () => {
    expect(calculateTotalMinutesFromIntervals([
      { startTime: '08:00', endTime: '12:00' }
    ])).toBe(240)
  })

  it('summerar flera intervall', () => {
    expect(calculateTotalMinutesFromIntervals([
      { startTime: '08:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '17:00' },
    ])).toBe(480)
  })
})

describe('calculateTotalHoursFromIntervals', () => {
  it('returnerar 0 för tom lista', () => {
    expect(calculateTotalHoursFromIntervals([])).toBe(0)
  })

  it('summerar minuterna först, avrundar sedan: 2x20 min = 40 min -> 0.75h', () => {
    // Viktigt: ska summera till 40 min -> avrunda till 45 min -> 0.75h
    // INTE 15 + 15 = 30 min (det vore fel att avrunda varje intervall separat)
    expect(calculateTotalHoursFromIntervals([
      { startTime: '08:00', endTime: '08:20' },
      { startTime: '09:00', endTime: '09:20' },
    ])).toBe(0.75)
  })

  it('hanterar enstaka intervall: 08:00-12:00 = 4.0h', () => {
    expect(calculateTotalHoursFromIntervals([
      { startTime: '08:00', endTime: '12:00' }
    ])).toBe(4.0)
  })
})

// ============================================================
// minutesToRoundedHours
// ============================================================
describe('minutesToRoundedHours', () => {
  it('0 minuter = 0 timmar', () => {
    expect(minutesToRoundedHours(0)).toBe(0)
  })

  it('45 minuter = 0.75 timmar', () => {
    expect(minutesToRoundedHours(45)).toBe(0.75)
  })

  it('50 minuter avrundar till 1.0 timmar', () => {
    expect(minutesToRoundedHours(50)).toBe(1.0)
  })

  it('90 minuter = 1.5 timmar', () => {
    expect(minutesToRoundedHours(90)).toBe(1.5)
  })
})

// ============================================================
// parseTimeString - Parsning av tider från användarinput
// ============================================================
describe('parseTimeString', () => {
  it('parsar "12:51" -> "12:51"', () => {
    expect(parseTimeString('12:51')).toBe('12:51')
  })

  it('parsar "8:05" -> "08:05" (paddar timmar)', () => {
    expect(parseTimeString('8:05')).toBe('08:05')
  })

  it('parsar "12.51" (punkt) -> "12:51"', () => {
    expect(parseTimeString('12.51')).toBe('12:51')
  })

  it('parsar "0:00" -> "00:00"', () => {
    expect(parseTimeString('0:00')).toBe('00:00')
  })

  it('parsar "23:59" -> "23:59"', () => {
    expect(parseTimeString('23:59')).toBe('23:59')
  })

  it('returnerar null för "25:00" (ogiltig timme)', () => {
    expect(parseTimeString('25:00')).toBeNull()
  })

  it('returnerar null för "12:60" (ogiltig minut)', () => {
    expect(parseTimeString('12:60')).toBeNull()
  })

  it('returnerar null för "abc"', () => {
    expect(parseTimeString('abc')).toBeNull()
  })

  it('returnerar null för tom sträng', () => {
    expect(parseTimeString('')).toBeNull()
  })
})

// ============================================================
// parseIntervalString - Parsning av tidsintervall
// ============================================================
describe('parseIntervalString', () => {
  it('parsar "12:51-13:12"', () => {
    expect(parseIntervalString('12:51-13:12')).toEqual({
      startTime: '12:51',
      endTime: '13:12',
    })
  })

  it('parsar "12.51-13.12" (punkter)', () => {
    expect(parseIntervalString('12.51-13.12')).toEqual({
      startTime: '12:51',
      endTime: '13:12',
    })
  })

  it('parsar "8:00-9:00" (enkel-siffrig timme)', () => {
    expect(parseIntervalString('8:00-9:00')).toEqual({
      startTime: '08:00',
      endTime: '09:00',
    })
  })

  it('parsar med mellanslag runt bindestreck: "8:00 - 9:00"', () => {
    expect(parseIntervalString('8:00 - 9:00')).toEqual({
      startTime: '08:00',
      endTime: '09:00',
    })
  })

  it('returnerar null för "12:51" (saknar bindestreck)', () => {
    expect(parseIntervalString('12:51')).toBeNull()
  })

  it('returnerar null för "abc-def"', () => {
    expect(parseIntervalString('abc-def')).toBeNull()
  })

  it('returnerar null för tom sträng', () => {
    expect(parseIntervalString('')).toBeNull()
  })
})

// ============================================================
// formatTimeInterval
// ============================================================
describe('formatTimeInterval', () => {
  it('formaterar { startTime: "08:00", endTime: "12:00" } -> "08:00-12:00"', () => {
    expect(formatTimeInterval({ startTime: '08:00', endTime: '12:00' })).toBe('08:00-12:00')
  })
})

// ============================================================
// getCurrentTime
// ============================================================
describe('getCurrentTime', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returnerar nuvarande tid i HH:mm-format', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 14, 30, 0))
    expect(getCurrentTime()).toBe('14:30')
    vi.useRealTimers()
  })

  it('paddar timmar och minuter med nolla', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 8, 5, 0))
    expect(getCurrentTime()).toBe('08:05')
    vi.useRealTimers()
  })
})

// ============================================================
// getDateRangeForViewMode
// ============================================================
describe('getDateRangeForViewMode', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('dagvy returnerar dagens datum', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0)) // 2026-01-15 kl 12 (undviker tidszonproblem)
    const range = getDateRangeForViewMode('day')
    expect(range.start).toBe('2026-01-15')
    expect(range.end).toBe('2026-01-15')
  })

  it('veckoläge börjar på måndag', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0)) // 2026-01-15, torsdag
    const range = getDateRangeForViewMode('week')
    expect(range.start).toBe('2026-01-12') // Måndag
    expect(range.end).toBe('2026-01-15')   // Idag (torsdag)
  })

  it('månadsvy utan offset visar nuvarande månad start till idag', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0)) // 2026-01-15
    const range = getDateRangeForViewMode('month', 0)
    expect(range.start).toBe('2026-01-01')
    expect(range.end).toBe('2026-01-15')
  })

  it('månadsvy med offset -1 visar hela föregående månad', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 1, 15, 12, 0, 0)) // 2026-02-15
    const range = getDateRangeForViewMode('month', -1)
    expect(range.start).toBe('2026-01-01')
    expect(range.end).toBe('2026-01-31')
  })
})
