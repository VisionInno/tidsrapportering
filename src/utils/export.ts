import { jsPDF } from 'jspdf'
import Papa from 'papaparse'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import type { TimeEntry, Project } from '@/types'

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
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Datum', 20, y)
  doc.text('Projekt', 45, y)
  doc.text('Beskrivning', 85, y)
  doc.text('Tim', 145, y)
  doc.text('Summa', 165, y)

  // Table rows
  doc.setFont('helvetica', 'normal')
  y += 7

  for (const entry of data.entries) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }

    doc.text(entry.date, 20, y)
    doc.text((projectMap.get(entry.projectId) || 'Okänt').substring(0, 15), 45, y)
    doc.text(entry.description.substring(0, 25), 85, y)
    doc.text(entry.hours.toFixed(1), 145, y)
    doc.text(
      entry.billable ? `${(entry.hours * (entry.hourlyRate || 0)).toFixed(0)} kr` : '-',
      165,
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
