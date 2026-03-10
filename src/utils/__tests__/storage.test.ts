import { describe, it, expect } from 'vitest'
import {
  getTimeEntries,
  addTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getProjects,
  saveProjects,
  updateProject,
  deleteProject,
  getActiveTimer,
  saveActiveTimer,
  clearActiveTimer,
  hasLocalStorageData,
  clearAllLocalStorage,
} from '@/utils/storage'
import type { TimeEntry, Project, ActiveTimer } from '@/types'

// ============================================================
// Hjälpfunktioner för att skapa testdata
// ============================================================
function createTestEntry(overrides?: Partial<TimeEntry>): TimeEntry {
  return {
    id: 'test-' + Math.random().toString(36).slice(2),
    date: '2026-01-15',
    projectId: 'proj-1',
    description: 'Testpost',
    hours: 1.5,
    billable: true,
    timeIntervals: [{ startTime: '08:00', endTime: '09:30' }],
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
    ...overrides,
  }
}

function createTestProject(overrides?: Partial<Project>): Project {
  return {
    id: 'proj-' + Math.random().toString(36).slice(2),
    name: 'Testprojekt',
    color: '#3b82f6',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ============================================================
// TimeEntry CRUD
// ============================================================
describe('TimeEntry CRUD', () => {
  it('startar med tom lista', () => {
    expect(getTimeEntries()).toEqual([])
  })

  it('lägger till och hämtar en post', () => {
    const entry = createTestEntry()
    addTimeEntry(entry)
    const stored = getTimeEntries()
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe(entry.id)
  })

  it('bevarar alla fält inklusive timeIntervals och hourlyRate', () => {
    const entry = createTestEntry({
      timeIntervals: [
        { startTime: '08:00', endTime: '12:00' },
        { startTime: '13:00', endTime: '17:00' },
      ],
      hourlyRate: 850,
    })
    addTimeEntry(entry)
    const stored = getTimeEntries()[0]
    expect(stored.timeIntervals).toHaveLength(2)
    expect(stored.hourlyRate).toBe(850)
    expect(stored.billable).toBe(true)
  })

  it('uppdaterar en post utan att förlora andra fält', () => {
    const entry = createTestEntry({ description: 'Original' })
    addTimeEntry(entry)
    updateTimeEntry(entry.id, { description: 'Uppdaterad' })
    const stored = getTimeEntries()[0]
    expect(stored.description).toBe('Uppdaterad')
    expect(stored.hours).toBe(entry.hours)
    expect(stored.projectId).toBe(entry.projectId)
  })

  it('tar bara bort den specifika posten', () => {
    const entry1 = createTestEntry({ id: 'behåll' })
    const entry2 = createTestEntry({ id: 'radera' })
    addTimeEntry(entry1)
    addTimeEntry(entry2)
    deleteTimeEntry('radera')
    const stored = getTimeEntries()
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe('behåll')
  })
})

// ============================================================
// Dataintegritet - Gammal data bevaras (användarkrav)
// ============================================================
describe('Dataintegritet - gammal data bevaras', () => {
  it('att lägga till ny post ändrar inte befintliga', () => {
    const existing = createTestEntry({ id: 'befintlig', description: 'Viktig gammal data' })
    addTimeEntry(existing)

    const newEntry = createTestEntry({ id: 'ny-post' })
    addTimeEntry(newEntry)

    const stored = getTimeEntries()
    const oldEntry = stored.find(e => e.id === 'befintlig')
    expect(oldEntry).toBeDefined()
    expect(oldEntry!.description).toBe('Viktig gammal data')
    expect(oldEntry!.hours).toBe(existing.hours)
  })

  it('att uppdatera en post påverkar inte andra', () => {
    const entry1 = createTestEntry({ id: 'post-1', hours: 2.0 })
    const entry2 = createTestEntry({ id: 'post-2', hours: 3.0 })
    addTimeEntry(entry1)
    addTimeEntry(entry2)

    updateTimeEntry('post-1', { hours: 5.0 })

    const stored = getTimeEntries()
    expect(stored.find(e => e.id === 'post-2')!.hours).toBe(3.0)
  })

  it('bevarar data genom flera save/load-cykler', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      createTestEntry({ id: `post-${i}`, date: `2026-01-${(i + 1).toString().padStart(2, '0')}` })
    )
    entries.forEach(addTimeEntry)

    // Ladda om från storage
    const loaded = getTimeEntries()
    expect(loaded).toHaveLength(10)
    loaded.forEach((entry, i) => {
      expect(entry.id).toBe(`post-${i}`)
    })
  })

  it('hanterar realistisk datavolym (221 poster som i riktiga databasen)', () => {
    const entries = Array.from({ length: 221 }, (_, i) =>
      createTestEntry({ id: `bulk-${i}` })
    )
    entries.forEach(addTimeEntry)
    expect(getTimeEntries()).toHaveLength(221)
  })
})

// ============================================================
// Project CRUD
// ============================================================
describe('Project CRUD', () => {
  it('returnerar standardprojekt när inga finns', () => {
    const projects = getProjects()
    expect(projects.length).toBeGreaterThanOrEqual(1)
    expect(projects[0].name).toBe('Allmänt')
  })

  it('lägger till och hämtar projekt', () => {
    const project = createTestProject({ name: 'Nytt Projekt' })
    saveProjects([project])
    expect(getProjects()[0].name).toBe('Nytt Projekt')
  })

  it('uppdaterar projekt utan att förlora fält', () => {
    const project = createTestProject({ id: 'proj-1', defaultHourlyRate: 850 })
    saveProjects([project])
    updateProject('proj-1', { name: 'Nytt namn' })
    const stored = getProjects()[0]
    expect(stored.name).toBe('Nytt namn')
    expect(stored.defaultHourlyRate).toBe(850)
  })

  it('att radera projekt raderar inte dess tidsposter', () => {
    const project = createTestProject({ id: 'proj-1' })
    saveProjects([project])
    const entry = createTestEntry({ projectId: 'proj-1' })
    addTimeEntry(entry)

    deleteProject('proj-1')

    expect(getProjects()).toHaveLength(0)
    expect(getTimeEntries()).toHaveLength(1) // Posten finns kvar
  })
})

// ============================================================
// Active Timer
// ============================================================
describe('Active Timer', () => {
  it('returnerar null när ingen timer är aktiv', () => {
    expect(getActiveTimer()).toBeNull()
  })

  it('sparar och hämtar en timer', () => {
    const timer: ActiveTimer = {
      projectId: 'proj-1',
      startTime: '2026-01-15T08:00:00.000Z',
      description: 'Jobbar med tester',
    }
    saveActiveTimer(timer)
    expect(getActiveTimer()).toEqual(timer)
  })

  it('rensar timern', () => {
    saveActiveTimer({ projectId: 'p1', startTime: 'x', description: '' })
    clearActiveTimer()
    expect(getActiveTimer()).toBeNull()
  })
})

// ============================================================
// Testdata rensas automatiskt (användarkrav)
// ============================================================
describe('Testdata rensas mellan tester', () => {
  it('localStorage är tom i början av varje test (setup.ts hanterar detta)', () => {
    expect(localStorage.length).toBe(0)
  })
})

// ============================================================
// Migreringshjälpare
// ============================================================
describe('Migreringshjälpare', () => {
  it('hasLocalStorageData returnerar false när tomt', () => {
    expect(hasLocalStorageData()).toBe(false)
  })

  it('hasLocalStorageData returnerar true efter att poster lagts till', () => {
    addTimeEntry(createTestEntry())
    expect(hasLocalStorageData()).toBe(true)
  })

  it('clearAllLocalStorage tar bort all appdata', () => {
    addTimeEntry(createTestEntry())
    saveProjects([createTestProject()])
    saveActiveTimer({ projectId: 'p1', startTime: 'x', description: '' })

    clearAllLocalStorage()

    expect(getActiveTimer()).toBeNull()
    expect(localStorage.getItem('tidsrapportering_entries')).toBeNull()
    expect(localStorage.getItem('tidsrapportering_projects')).toBeNull()
  })
})
