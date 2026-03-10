import { describe, it, expect } from 'vitest'
import { calculateRoundedExportTotals } from '@/utils/export'
import type { TimeEntry, Project } from '@/types'

function createEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: 'e-' + Math.random().toString(36).slice(2),
    date: '2026-01-15',
    projectId: 'proj-1',
    description: '',
    hours: 1.0,
    billable: true,
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
    ...overrides,
  }
}

const testProject: Project = {
  id: 'proj-1',
  name: 'Test',
  color: '#000',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  defaultHourlyRate: 1000,
}

// ============================================================
// calculateRoundedExportTotals - Faktureringsavrundning
// ============================================================
describe('calculateRoundedExportTotals', () => {
  it('avrundar per projekt per dag, inte per post', () => {
    // Två 20-min poster samma dag ska summeras till 40 min -> 45 min -> 0.75h
    // INTE 15+15=30 min (fel om man avrundar varje post separat)
    const projectMap = new Map([['proj-1', testProject]])
    const entries = [
      createEntry({ timeIntervals: [{ startTime: '08:00', endTime: '08:20' }], hours: 0 }),
      createEntry({ timeIntervals: [{ startTime: '09:00', endTime: '09:20' }], hours: 0 }),
    ]
    const result = calculateRoundedExportTotals(entries, projectMap)
    expect(result.totalHours).toBe(0.75)
  })

  it('beräknar faktureringsbelopp korrekt', () => {
    const projectMap = new Map([['proj-1', testProject]])
    const entries = [createEntry({ hours: 2.0 })]
    const result = calculateRoundedExportTotals(entries, projectMap)
    expect(result.totalBillable).toBe(2000) // 2h * 1000 kr
  })

  it('hanterar poster utan timeIntervals (använder hours-fältet)', () => {
    const projectMap = new Map([['proj-1', testProject]])
    const entries = [createEntry({ hours: 1.5, timeIntervals: undefined })]
    const result = calculateRoundedExportTotals(entries, projectMap)
    expect(result.totalHours).toBe(1.5) // 90 min -> redan på 15-min-gräns
  })

  it('spårar timmar per projekt separat', () => {
    const proj2: Project = { ...testProject, id: 'proj-2', name: 'Annat' }
    const projectMap = new Map([['proj-1', testProject], ['proj-2', proj2]])
    const entries = [
      createEntry({ projectId: 'proj-1', hours: 1.0 }),
      createEntry({ projectId: 'proj-2', hours: 2.0 }),
    ]
    const result = calculateRoundedExportTotals(entries, projectMap)
    expect(result.hoursByProject.get('proj-1')).toBe(1.0)
    expect(result.hoursByProject.get('proj-2')).toBe(2.0)
  })

  it('returnerar 0 för tom postlista', () => {
    const projectMap = new Map([['proj-1', testProject]])
    const result = calculateRoundedExportTotals([], projectMap)
    expect(result.totalHours).toBe(0)
    expect(result.totalBillable).toBe(0)
  })
})
