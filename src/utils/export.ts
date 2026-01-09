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
function calculateRoundedExportTotals(entries: TimeEntry[], projectMap: Map<string, Project>) {
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

export function exportInvoicePDF(data: ExportData): void {
  const doc = new jsPDF()
  const projectMap = new Map(data.projects.map((p) => [p.id, p]))

  // Calculate rounded totals (per project per day, then sum)
  const { totalHours, totalBillable, hoursByProject } = calculateRoundedExportTotals(data.entries, projectMap)

  // Title
  doc.setFontSize(20)
  doc.text('Fakturaunderlag', 20, 20)

  // Date range
  doc.setFontSize(12)
  doc.text(`Period: ${data.dateRange.start} - ${data.dateRange.end}`, 20, 30)

  // Total hours (rounded)
  doc.setFontSize(14)
  doc.text(`Totalt antal timmar: ${totalHours.toFixed(2)}`, 20, 45)

  // Table header
  let y = 65
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Projekt', 20, y)
  doc.text('Timmar', 100, y)
  doc.text('Timpris', 130, y)
  doc.text('Summa', 160, y)

  // Divider line
  y += 3
  doc.setLineWidth(0.5)
  doc.line(20, y, 190, y)

  // Table rows (using rounded hours per project)
  doc.setFont('helvetica', 'normal')
  y += 8

  for (const [projectId, hours] of hoursByProject) {
    if (y > 260) {
      doc.addPage()
      y = 20
    }

    const project = projectMap.get(projectId)
    const projectName = project?.name || 'Okänt'
    const rate = project?.defaultHourlyRate || 0
    const amount = hours * rate

    doc.text(projectName.substring(0, 35), 20, y)
    doc.text(hours.toFixed(2), 100, y)
    doc.text(rate > 0 ? `${rate.toFixed(0)} kr` : '-', 130, y)
    doc.text(rate > 0 ? `${amount.toFixed(0)} kr` : '-', 160, y)
    y += 8
  }

  // Total line
  y += 4
  doc.setLineWidth(0.5)
  doc.line(20, y, 190, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.text('Totalt', 20, y)
  doc.text(totalHours.toFixed(2), 100, y)
  doc.text('', 130, y)
  doc.text(`${totalBillable.toFixed(0)} kr`, 160, y)

  // Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(
    `Genererad: ${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: sv })}`,
    20,
    doc.internal.pageSize.height - 10
  )

  doc.save(`fakturaunderlag_${data.dateRange.start}_${data.dateRange.end}.pdf`)
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
