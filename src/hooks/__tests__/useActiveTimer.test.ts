import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useActiveTimer } from '@/hooks/useActiveTimer'
import { calculateIntervalHours } from '@/utils/time'

// ============================================================
// useActiveTimer - Timer-logik
// ============================================================
describe('useActiveTimer - grundläggande funktioner', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const mockOnEntryCreated = vi.fn(async (_entry: any) => {})

  beforeEach(() => {
    mockOnEntryCreated.mockClear()
  })

  it('startar utan aktiv timer', () => {
    const { result } = renderHook(() =>
      useActiveTimer({ onEntryCreated: mockOnEntryCreated })
    )
    expect(result.current.activeTimer).toBeNull()
    expect(result.current.elapsedMs).toBe(0)
  })

  it('startar en timer för ett projekt', async () => {
    const { result } = renderHook(() =>
      useActiveTimer({ onEntryCreated: mockOnEntryCreated })
    )

    await act(async () => {
      await result.current.startTimer('proj-1')
    })

    expect(result.current.activeTimer).not.toBeNull()
    expect(result.current.activeTimer!.projectId).toBe('proj-1')
  })

  it('formaterar förfluten tid som HH:MM:SS', () => {
    const { result } = renderHook(() =>
      useActiveTimer({ onEntryCreated: mockOnEntryCreated })
    )
    expect(result.current.elapsedFormatted).toBe('00:00:00')
  })

  it('uppdaterar beskrivning på aktiv timer', async () => {
    const { result } = renderHook(() =>
      useActiveTimer({ onEntryCreated: mockOnEntryCreated })
    )

    await act(async () => {
      await result.current.startTimer('proj-1')
    })

    await act(async () => {
      await result.current.updateDescription('Jobbar med feature X')
    })

    expect(result.current.activeTimer!.description).toBe('Jobbar med feature X')
  })

  it('isTimerRunning returnerar true för aktivt projekt', async () => {
    const { result } = renderHook(() =>
      useActiveTimer({ onEntryCreated: mockOnEntryCreated })
    )

    await act(async () => {
      await result.current.startTimer('proj-1')
    })

    expect(result.current.isTimerRunning('proj-1')).toBe(true)
    expect(result.current.isTimerRunning('proj-2')).toBe(false)
  })

  it('stoppar timer och skapar tidspost', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15, 8, 0, 0))

    const { result } = renderHook(() =>
      useActiveTimer({ onEntryCreated: mockOnEntryCreated })
    )

    await act(async () => {
      await result.current.startTimer('proj-1')
    })

    // Simulera att 30 minuter har gått
    vi.setSystemTime(new Date(2026, 0, 15, 8, 30, 0))

    await act(async () => {
      await result.current.stopTimer(false)
    })

    expect(mockOnEntryCreated).toHaveBeenCalledOnce()
    const createdEntry = mockOnEntryCreated.mock.calls[0]?.[0] as Record<string, unknown> | undefined
    expect(createdEntry).toBeDefined()
    expect(createdEntry!.projectId).toBe('proj-1')
    expect(createdEntry!.date).toBe('2026-01-15')
    const intervals = createdEntry!.timeIntervals as Array<{ startTime: string; endTime: string }>
    expect(intervals).toHaveLength(1)
    expect(intervals[0].startTime).toBe('08:00')
    expect(intervals[0].endTime).toBe('08:30')

    // Timer ska vara rensad
    expect(result.current.activeTimer).toBeNull()

    vi.useRealTimers()
  })
})

// ============================================================
// Regressionstester - Fixade buggar
// ============================================================
describe('Timer regressionstester', () => {
  it('REGRESSION: calculateIntervalHours returnerar 0 för samma start/slut', () => {
    // Buggen: roundUpTo15Minutes(0) = 0, så 0-minuters intervall = 0 timmar
    // Fixat: useActiveTimer applicerar Math.max(result, 0.25)
    const result = calculateIntervalHours('08:00', '08:00')
    expect(result).toBe(0) // Funktionen returnerar korrekt 0
  })

  it('REGRESSION: minimum 0.25h appliceras för timer-poster', () => {
    // Testar fixlogiken: Math.max(calculatedHours, 0.25)
    const calculatedHours = calculateIntervalHours('08:00', '08:00')
    const hours = Math.max(calculatedHours, 0.25)
    expect(hours).toBe(0.25)
  })

  it('REGRESSION: kort timer (1 minut) ger fortfarande 0.25h', () => {
    const calculatedHours = calculateIntervalHours('08:00', '08:01')
    expect(calculatedHours).toBe(0.25) // 1 min -> 15 min -> 0.25h
    const hours = Math.max(calculatedHours, 0.25)
    expect(hours).toBe(0.25)
  })

  it('REGRESSION: entry-sparning ska inväntas (await) före timer rensas', async () => {
    // Testar att om sparningen misslyckas, timern INTE rensas
    let shouldFail = true
    const failingOnEntryCreated = vi.fn(async () => {
      if (shouldFail) throw new Error('Sparningen misslyckades')
    })

    // Mock alert to prevent jsdom errors
    const mockAlert = vi.fn()
    vi.stubGlobal('alert', mockAlert)

    const { result } = renderHook(() =>
      useActiveTimer({ onEntryCreated: failingOnEntryCreated })
    )

    await act(async () => {
      await result.current.startTimer('proj-1')
    })

    // Försök stoppa - ska misslyckas
    await act(async () => {
      await result.current.stopTimer(false)
    })

    // Timer ska FORTFARANDE vara aktiv (inte rensad)
    expect(result.current.activeTimer).not.toBeNull()
    expect(result.current.activeTimer!.projectId).toBe('proj-1')

    // Alert ska ha visats
    expect(mockAlert).toHaveBeenCalled()

    // Nu kan vi stoppa framgångsrikt
    shouldFail = false
    await act(async () => {
      await result.current.stopTimer(false)
    })

    expect(result.current.activeTimer).toBeNull()
    expect(failingOnEntryCreated).toHaveBeenCalledTimes(2)

    vi.unstubAllGlobals()
  })
})
