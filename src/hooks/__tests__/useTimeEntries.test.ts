import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import * as storage from '@/utils/storage'

// ============================================================
// useTimeEntries - Registrera tid på olika sätt (användarkrav)
// ============================================================
describe('useTimeEntries - registrera tid på olika sätt', () => {
  it('registrerar med manuella timmar (utan intervall)', async () => {
    const { result } = renderHook(() => useTimeEntries())

    await act(async () => {
      await result.current.addEntry({
        date: '2026-01-15',
        projectId: 'proj-1',
        description: 'Manuell registrering',
        hours: 2.5,
        billable: true,
      })
    })

    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].hours).toBe(2.5)
    expect(result.current.entries[0].timeIntervals).toBeUndefined()
  })

  it('registrerar med enstaka tidsintervall', async () => {
    const { result } = renderHook(() => useTimeEntries())

    await act(async () => {
      await result.current.addEntry({
        date: '2026-01-15',
        projectId: 'proj-1',
        description: 'Intervallregistrering',
        hours: 4.0,
        billable: true,
        timeIntervals: [{ startTime: '08:00', endTime: '12:00' }],
      })
    })

    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].timeIntervals).toHaveLength(1)
    expect(result.current.entries[0].timeIntervals![0].startTime).toBe('08:00')
  })

  it('registrerar med flera intervall (delad arbetsdag)', async () => {
    const { result } = renderHook(() => useTimeEntries())

    await act(async () => {
      await result.current.addEntry({
        date: '2026-01-15',
        projectId: 'proj-1',
        description: 'Delad dag',
        hours: 8.0,
        billable: true,
        timeIntervals: [
          { startTime: '08:00', endTime: '12:00' },
          { startTime: '13:00', endTime: '17:00' },
        ],
      })
    })

    expect(result.current.entries[0].timeIntervals).toHaveLength(2)
  })

  it('registrerar kort tid (simulerar snabbtimer 1-2 min)', async () => {
    const { result } = renderHook(() => useTimeEntries())

    await act(async () => {
      await result.current.addEntry({
        date: '2026-01-15',
        projectId: 'proj-1',
        description: 'Kort samtal',
        hours: 0.25, // Minimum 15 min avrundning
        billable: true,
        timeIntervals: [{ startTime: '15:00', endTime: '15:01' }],
      })
    })

    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].hours).toBe(0.25)
  })

  it('genererar unika ID:n för varje post', async () => {
    const { result } = renderHook(() => useTimeEntries())

    await act(async () => {
      await result.current.addEntry({
        date: '2026-01-15', projectId: 'proj-1', description: 'Första',
        hours: 1, billable: true,
      })
      await result.current.addEntry({
        date: '2026-01-15', projectId: 'proj-1', description: 'Andra',
        hours: 1, billable: true,
      })
    })

    expect(result.current.entries[0].id).not.toBe(result.current.entries[1].id)
  })

  it('sätter createdAt och updatedAt', async () => {
    const { result } = renderHook(() => useTimeEntries())

    await act(async () => {
      await result.current.addEntry({
        date: '2026-01-15', projectId: 'proj-1', description: 'Test',
        hours: 1, billable: true,
      })
    })

    expect(result.current.entries[0].createdAt).toBeTruthy()
    expect(result.current.entries[0].updatedAt).toBeTruthy()
  })

  it('sparar poster i localStorage', async () => {
    const { result } = renderHook(() => useTimeEntries())

    await act(async () => {
      await result.current.addEntry({
        date: '2026-01-15', projectId: 'proj-1', description: 'Sparad',
        hours: 1, billable: true,
      })
    })

    const stored = storage.getTimeEntries()
    expect(stored).toHaveLength(1)
    expect(stored[0].description).toBe('Sparad')
  })
})

// ============================================================
// Uppdatera och ta bort poster
// ============================================================
describe('useTimeEntries - uppdatera och radera', () => {
  it('uppdaterar en post', async () => {
    const { result } = renderHook(() => useTimeEntries())

    await act(async () => {
      await result.current.addEntry({
        date: '2026-01-15', projectId: 'proj-1', description: 'Original',
        hours: 1, billable: true,
      })
    })

    const entryId = result.current.entries[0].id

    await act(async () => {
      await result.current.updateEntry(entryId, { description: 'Ändrad' })
    })

    expect(result.current.entries[0].description).toBe('Ändrad')
  })

  it('raderar en post och tar bort från storage', async () => {
    const { result } = renderHook(() => useTimeEntries())

    await act(async () => {
      await result.current.addEntry({
        date: '2026-01-15', projectId: 'proj-1', description: 'Ta bort mig',
        hours: 1, billable: true,
      })
    })

    const entryId = result.current.entries[0].id

    await act(async () => {
      await result.current.deleteEntry(entryId)
    })

    expect(result.current.entries).toHaveLength(0)
    expect(storage.getTimeEntries()).toHaveLength(0)
  })
})

// ============================================================
// Filtrering
// ============================================================
describe('useTimeEntries - filtrering', () => {
  it('filtrerar poster per datum', async () => {
    const { result } = renderHook(() => useTimeEntries())

    await act(async () => {
      await result.current.addEntry({ date: '2026-01-15', projectId: 'proj-1', description: 'A', hours: 1, billable: true })
      await result.current.addEntry({ date: '2026-01-16', projectId: 'proj-1', description: 'B', hours: 1, billable: true })
      await result.current.addEntry({ date: '2026-01-15', projectId: 'proj-1', description: 'C', hours: 1, billable: true })
    })

    const jan15 = result.current.getEntriesByDate('2026-01-15')
    expect(jan15).toHaveLength(2)
  })

  it('filtrerar poster per datumintervall', async () => {
    const { result } = renderHook(() => useTimeEntries())

    await act(async () => {
      await result.current.addEntry({ date: '2026-01-14', projectId: 'proj-1', description: 'Före', hours: 1, billable: true })
      await result.current.addEntry({ date: '2026-01-15', projectId: 'proj-1', description: 'I range', hours: 1, billable: true })
      await result.current.addEntry({ date: '2026-01-16', projectId: 'proj-1', description: 'I range', hours: 1, billable: true })
      await result.current.addEntry({ date: '2026-01-17', projectId: 'proj-1', description: 'Efter', hours: 1, billable: true })
    })

    const range = result.current.getEntriesByDateRange('2026-01-15', '2026-01-16')
    expect(range).toHaveLength(2)
  })
})
