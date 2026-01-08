import { jsPDF } from 'jspdf'
import Papa from 'papaparse'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import type { TimeEntry, Project } from '@/types'
import { formatTimeInterval } from './time'

interface ExportData {
  entries: TimeEntry[]
  projects: Project[]
  dateRange: { start: string; end: string }
}

export function exportToCSV(data: ExportData): void {
  const projectMap = new Map(data.projects.map((p) => [p.id, p.name]))

  const rows = data.entries.map((entry) => ({
    Datum: entry.date,
    Projekt: projectMap.get(entry.projectId) || 'Okänt',
    Beskrivning: entry.description,
    Timmar: entry.hours,
    Fakturerbar: entry.billable ? 'Ja' : 'Nej',
    Timpris: entry.hourlyRate || 0,
    Summa: entry.billable ? (entry.hours * (entry.hourlyRate || 0)).toFixed(2) : '0',
  }))

  const csv = Papa.unparse(rows, {
    delimiter: ';',
    header: true,
  })

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `tidsrapport_${data.dateRange.start}_${data.dateRange.end}.csv`)
}

export function exportToPDF(data: ExportData): void {
  const doc = new jsPDF()
  const projectMap = new Map(data.projects.map((p) => [p.id, p.name]))

  // Title
  doc.setFontSize(20)
  doc.text('Tidsrapport', 20, 20)

  // Date range
  doc.setFontSize(12)
  doc.text(`Period: ${data.dateRange.start} - ${data.dateRange.end}`, 20, 30)

  // Summary
  const totalHours = data.entries.reduce((sum, e) => sum + e.hours, 0)
  const billableHours = data.entries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0)
  const totalBillable = data.entries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + e.hours * (e.hourlyRate || 0), 0)

  doc.text(`Totalt antal timmar: ${totalHours.toFixed(1)}`, 20, 45)
  doc.text(`Fakturerbara timmar: ${billableHours.toFixed(1)}`, 20, 52)
  doc.text(`Total fakturerbart belopp: ${totalBillable.toFixed(2)} kr`, 20, 59)

  // Table header
  let y = 75
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Datum', 20, y)
  doc.text('Tid', 42, y)
  doc.text('Projekt', 75, y)
  doc.text('Beskrivning', 110, y)
  doc.text('Tim', 165, y)
  doc.text('Summa', 180, y)

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

    doc.text(entry.date, 20, y)
    doc.text(timeStr.substring(0, 18), 42, y)
    doc.text((projectMap.get(entry.projectId) || 'Okänt').substring(0, 15), 75, y)
    doc.text(entry.description.substring(0, 22), 110, y)
    doc.text(entry.hours.toFixed(1), 165, y)
    doc.text(
      entry.billable ? `${(entry.hours * (entry.hourlyRate || 0)).toFixed(0)} kr` : '-',
      180,
      y
    )
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

  // Title
  doc.setFontSize(20)
  doc.text('Fakturaunderlag', 20, 20)

  // Date range
  doc.setFontSize(12)
  doc.text(`Period: ${data.dateRange.start} - ${data.dateRange.end}`, 20, 30)

  // Calculate totals per project
  const projectTotals = new Map<string, { hours: number; rate: number }>()

  for (const entry of data.entries) {
    const current = projectTotals.get(entry.projectId) || { hours: 0, rate: 0 }
    const project = projectMap.get(entry.projectId)
    projectTotals.set(entry.projectId, {
      hours: current.hours + entry.hours,
      rate: project?.defaultHourlyRate || 0,
    })
  }

  // Total hours
  const totalHours = data.entries.reduce((sum, e) => sum + e.hours, 0)
  let totalAmount = 0

  doc.setFontSize(14)
  doc.text(`Totalt antal timmar: ${totalHours.toFixed(1)}`, 20, 45)

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

  // Table rows
  doc.setFont('helvetica', 'normal')
  y += 8

  for (const [projectId, totals] of projectTotals) {
    if (y > 260) {
      doc.addPage()
      y = 20
    }

    const project = projectMap.get(projectId)
    const projectName = project?.name || 'Okänt'
    const amount = totals.hours * totals.rate
    totalAmount += amount

    doc.text(projectName.substring(0, 35), 20, y)
    doc.text(totals.hours.toFixed(1), 100, y)
    doc.text(totals.rate > 0 ? `${totals.rate.toFixed(0)} kr` : '-', 130, y)
    doc.text(totals.rate > 0 ? `${amount.toFixed(0)} kr` : '-', 160, y)
    y += 8
  }

  // Total line
  y += 4
  doc.setLineWidth(0.5)
  doc.line(20, y, 190, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.text('Totalt', 20, y)
  doc.text(totalHours.toFixed(1), 100, y)
  doc.text('', 130, y)
  doc.text(`${totalAmount.toFixed(0)} kr`, 160, y)

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
