import type { TimeEntry, Project } from '@/types'
import type { FortnoxInvoicePayload, FortnoxInvoiceRow } from '@/api'
import { calculateTotalMinutesFromIntervals, minutesToRoundedHours } from './time'

interface DailyRow {
  date: string
  description: string
  hours: number
  rate: number
  amount: number
}

export interface FortnoxPreviewProject {
  project: Project
  customerNumber: string
  rows: DailyRow[]
  totalHours: number
  totalAmount: number
}

/**
 * Build preview data for Fortnox invoice, grouped by project and date.
 * Uses the same 15-min rounding logic as the PDF export.
 */
export function buildFortnoxPreviewData(
  entries: TimeEntry[],
  projects: Project[],
): FortnoxPreviewProject[] {
  const projectMap = new Map(projects.map(p => [p.id, p]))
  const result: FortnoxPreviewProject[] = []

  // Group entries by project
  const entriesByProject = new Map<string, TimeEntry[]>()
  for (const entry of entries) {
    if (!entry.billable) continue
    const list = entriesByProject.get(entry.projectId) || []
    list.push(entry)
    entriesByProject.set(entry.projectId, list)
  }

  for (const [projectId, projectEntries] of entriesByProject) {
    const project = projectMap.get(projectId)
    if (!project || !project.fortnoxCustomerNumber) continue

    const rate = project.defaultHourlyRate || 0

    // Group minutes by date
    const minutesByDate = new Map<string, number>()
    const descriptionsByDate = new Map<string, string[]>()

    for (const entry of projectEntries) {
      const minutes = entry.timeIntervals && entry.timeIntervals.length > 0
        ? calculateTotalMinutesFromIntervals(entry.timeIntervals)
        : entry.hours * 60
      minutesByDate.set(entry.date, (minutesByDate.get(entry.date) || 0) + minutes)

      if (entry.description) {
        const descs = descriptionsByDate.get(entry.date) || []
        descs.push(entry.description)
        descriptionsByDate.set(entry.date, descs)
      }
    }

    // Build rows sorted by date
    const rows: DailyRow[] = []
    let totalHours = 0
    let totalAmount = 0

    const sortedDates = Array.from(minutesByDate.keys()).sort()
    for (const date of sortedDates) {
      const minutes = minutesByDate.get(date)!
      const hours = minutesToRoundedHours(minutes)
      const amount = hours * rate
      const descriptions = descriptionsByDate.get(date) || []

      rows.push({
        date,
        description: descriptions.join(', ') || project.name,
        hours,
        rate,
        amount,
      })

      totalHours += hours
      totalAmount += amount
    }

    if (rows.length > 0) {
      result.push({
        project,
        customerNumber: project.fortnoxCustomerNumber,
        rows,
        totalHours,
        totalAmount,
      })
    }
  }

  return result
}

/**
 * Convert preview data to Fortnox API payload for a single project.
 */
export function buildFortnoxPayload(
  preview: FortnoxPreviewProject,
  accountNumber: number,
  ourReference?: string,
): FortnoxInvoicePayload {
  const invoiceRows: FortnoxInvoiceRow[] = preview.rows.map(row => ({
    AccountNumber: accountNumber,
    Description: `${row.date} - ${row.description}`,
    DeliveredQuantity: row.hours,
    Price: row.rate,
    Unit: 'tim',
  }))

  return {
    Invoice: {
      CustomerNumber: preview.customerNumber,
      InvoiceDate: new Date().toISOString().split('T')[0],
      OurReference: ourReference,
      InvoiceRows: invoiceRows,
    },
  }
}
