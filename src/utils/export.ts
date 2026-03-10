import { jsPDF } from 'jspdf'
import Papa from 'papaparse'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import type { TimeEntry, Project } from '@/types'
import { formatTimeInterval, calculateTotalMinutesFromIntervals, minutesToRoundedHours } from './time'

/**
 * Calculate rounded hours per project per day, then sum totals
 * This is the core rounding logic used across the app
 */
export function calculateRoundedExportTotals(entries: TimeEntry[], projectMap: Map<string, Project>) {
  // Group minutes by project+date
  const minutesByProjectDate = new Map<string, number>()

  for (const entry of entries) {
    const key = `${entry.projectId}|${entry.date}`
    const currentMinutes = minutesByProjectDate.get(key) || 0
    const entryMinutes = entry.timeIntervals && entry.timeIntervals.length > 0
      ? calculateTotalMinutesFromIntervals(entry.timeIntervals)
      : entry.hours * 60
    minutesByProjectDate.set(key, currentMinutes + entryMinutes)
  }

  // Round each project+date total and aggregate
  let totalHours = 0
  const hoursByProject = new Map<string, number>()
  let totalBillable = 0

  for (const [key, minutes] of minutesByProjectDate.entries()) {
    const [projectId] = key.split('|')
    const roundedHours = minutesToRoundedHours(minutes)
    const project = projectMap.get(projectId)
    const rate = project?.defaultHourlyRate || 0

    totalHours += roundedHours
    totalBillable += roundedHours * rate

    // Aggregate by project
    const currentProjectHours = hoursByProject.get(projectId) || 0
    hoursByProject.set(projectId, currentProjectHours + roundedHours)
  }

  return { totalHours, totalBillable, hoursByProject }
}

interface ExportData {
  entries: TimeEntry[]
  projects: Project[]
  dateRange: { start: string; end: string }
}

export function exportToCSV(data: ExportData): void {
  const projectMap = new Map(data.projects.map((p) => [p.id, p]))

  // Calculate exact minutes per entry (not rounded)
  const getEntryMinutes = (entry: TimeEntry): number => {
    if (entry.timeIntervals && entry.timeIntervals.length > 0) {
      return calculateTotalMinutesFromIntervals(entry.timeIntervals)
    }
    return entry.hours * 60
  }

  const rows = data.entries.map((entry) => {
    const project = projectMap.get(entry.projectId)
    const minutes = getEntryMinutes(entry)
    return {
      Datum: entry.date,
      Projekt: project?.name || 'Okänt',
      Beskrivning: entry.description,
      Minuter: minutes,
      Fakturerbar: entry.billable ? 'Ja' : 'Nej',
      Timpris: entry.hourlyRate || 0,
    }
  })

  const csv = Papa.unparse(rows, {
    delimiter: ';',
    header: true,
  })

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `tidsrapport_${data.dateRange.start}_${data.dateRange.end}.csv`)
}

export function exportToPDF(data: ExportData): void {
  const doc = new jsPDF()
  const projectMap = new Map(data.projects.map((p) => [p.id, p]))

  // Calculate exact minutes per entry (not rounded)
  const getEntryMinutes = (entry: TimeEntry): number => {
    if (entry.timeIntervals && entry.timeIntervals.length > 0) {
      return calculateTotalMinutesFromIntervals(entry.timeIntervals)
    }
    return entry.hours * 60
  }

  // Calculate rounded totals (per project per day, then sum)
  const { totalHours, totalBillable } = calculateRoundedExportTotals(data.entries, projectMap)

  // Title
  doc.setFontSize(20)
  doc.text('Tidsrapport', 20, 20)

  // Date range
  doc.setFontSize(12)
  doc.text(`Period: ${data.dateRange.start} - ${data.dateRange.end}`, 20, 30)

  // Summary (using rounded totals)
  doc.text(`Totalt antal timmar: ${totalHours.toFixed(2)}`, 20, 45)
  doc.text(`Att fakturera: ${totalBillable.toFixed(0)} kr`, 20, 52)

  // Table header
  let y = 68
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Datum', 20, y)
  doc.text('Tid', 42, y)
  doc.text('Projekt', 75, y)
  doc.text('Beskrivning', 110, y)
  doc.text('Min', 165, y)

  // Table rows
  doc.setFont('helvetica', 'normal')
  y += 7

  for (const entry of data.entries) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }

    // Format time intervals
    const timeStr = entry.timeIntervals && entry.timeIntervals.length > 0
      ? entry.timeIntervals.map(formatTimeInterval).join(', ')
      : '-'
    const minutes = getEntryMinutes(entry)

    doc.text(entry.date, 20, y)
    doc.text(timeStr.substring(0, 18), 42, y)
    doc.text((projectMap.get(entry.projectId)?.name || 'Okänt').substring(0, 15), 75, y)
    doc.text(entry.description.substring(0, 22), 110, y)
    doc.text(minutes.toString(), 165, y)
    y += 6
  }

  // Footer
  doc.setFontSize(8)
  doc.text(
    `Genererad: ${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: sv })}`,
    20,
    doc.internal.pageSize.height - 10
  )

  doc.save(`tidsrapport_${data.dateRange.start}_${data.dateRange.end}.pdf`)
}

export function exportInvoicePDFPerProject(data: ExportData): void {
  const projectMap = new Map(data.projects.map((p) => [p.id, p]))

  // Group entries by project
  const entriesByProject = new Map<string, TimeEntry[]>()
  for (const entry of data.entries) {
    const projectEntries = entriesByProject.get(entry.projectId) || []
    projectEntries.push(entry)
    entriesByProject.set(entry.projectId, projectEntries)
  }

  // Create a PDF for each project
  for (const [projectId, projectEntries] of entriesByProject) {
    const project = projectMap.get(projectId)
    if (!project) continue

    const doc = new jsPDF()

    // Group minutes by date for this project
    const minutesByDate = new Map<string, number>()
    for (const entry of projectEntries) {
      const entryMinutes = entry.timeIntervals && entry.timeIntervals.length > 0
        ? calculateTotalMinutesFromIntervals(entry.timeIntervals)
        : entry.hours * 60
      const currentMinutes = minutesByDate.get(entry.date) || 0
      minutesByDate.set(entry.date, currentMinutes + entryMinutes)
    }

    // Calculate rounded hours per day
    const dailyHours: Array<{ date: string; hours: number }> = []
    let totalHours = 0
    const sortedDates = Array.from(minutesByDate.keys()).sort()

    for (const date of sortedDates) {
      const minutes = minutesByDate.get(date)!
      const roundedHours = minutesToRoundedHours(minutes)
      dailyHours.push({ date, hours: roundedHours })
      totalHours += roundedHours
    }

    const rate = project.defaultHourlyRate || 0
    const totalAmount = totalHours * rate

    // Title
    doc.setFontSize(20)
    doc.text('Fakturaunderlag', 20, 20)

    // Project name
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(project.name, 20, 32)
    if (project.client) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(`Kund: ${project.client}`, 20, 40)
    }

    // Date range
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Period: ${data.dateRange.start} - ${data.dateRange.end}`, 20, project.client ? 50 : 42)

    let y = project.client ? 65 : 57

    // Rate info
    if (rate > 0) {
      doc.text(`Timpris: ${rate.toFixed(0)} kr/h`, 20, y)
      y += 10
    }

    // Table header
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Datum', 20, y)
    doc.text('Timmar', 100, y)
    y += 7

    // Daily breakdown
    doc.setFont('helvetica', 'normal')
    for (const day of dailyHours) {
      if (y > 260) {
        doc.addPage()
        y = 20
      }

      const dateStr = format(new Date(day.date), 'd MMMM yyyy', { locale: sv })
      doc.text(dateStr, 20, y)
      doc.text(`${day.hours.toFixed(2)} h`, 100, y)
      y += 6
    }

    // Total
    y += 5
    doc.setLineWidth(0.5)
    doc.line(20, y, 130, y)
    y += 8

    doc.setFont('helvetica', 'bold')
    doc.text('SUMMA', 20, y)
    doc.text(`${totalHours.toFixed(2)} h`, 100, y)
    if (rate > 0) {
      doc.text(`${totalAmount.toFixed(0)} kr`, 140, y)
    }

    // Footer
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(
      `Genererad: ${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: sv })}`,
      20,
      doc.internal.pageSize.height - 10
    )

    // Clean filename - remove special characters
    const cleanProjectName = project.name.replace(/[^a-zA-Z0-9åäöÅÄÖ\s-]/g, '').replace(/\s+/g, '_')
    doc.save(`fakturaunderlag_${cleanProjectName}_${data.dateRange.start}_${data.dateRange.end}.pdf`)
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
