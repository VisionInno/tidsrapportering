import { useState } from 'react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import type { TimeEntry, Project } from '@/types'
import { exportToCSV, exportToPDF, exportInvoicePDF } from '@/utils/export'

type ExportType = 'csv' | 'pdf' | 'invoice'

interface ExportButtonProps {
  entries: TimeEntry[]
  projects: Project[]
}

export function ExportButton({ entries, projects }: ExportButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [exportType, setExportType] = useState<ExportType>('invoice')
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>('month')
  const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [customEnd, setCustomEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  const getDateRange = () => {
    const today = new Date()
    switch (dateRange) {
      case 'week':
        return {
          start: format(subDays(today, 7), 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd'),
        }
      case 'month':
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd'),
        }
      case 'custom':
        return { start: customStart, end: customEnd }
    }
  }

  const handleExport = () => {
    const range = getDateRange()
    const filteredEntries = entries.filter((e) => e.date >= range.start && e.date <= range.end)

    const data = {
      entries: filteredEntries,
      projects,
      dateRange: range,
    }

    switch (exportType) {
      case 'csv':
        exportToCSV(data)
        break
      case 'pdf':
        exportToPDF(data)
        break
      case 'invoice':
        exportInvoicePDF(data)
        break
    }

    setShowModal(false)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Exportera
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Exportera tidsrapport</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Typ av export</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="invoice"
                      checked={exportType === 'invoice'}
                      onChange={(e) => setExportType(e.target.value as ExportType)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm">Fakturaunderlag (PDF)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="pdf"
                      checked={exportType === 'pdf'}
                      onChange={(e) => setExportType(e.target.value as ExportType)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm">Detaljerad tidsrapport (PDF)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={exportType === 'csv'}
                      onChange={(e) => setExportType(e.target.value as ExportType)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm">CSV (för Excel)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | 'custom')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="week">Senaste 7 dagarna</option>
                  <option value="month">Denna månad</option>
                  <option value="custom">Anpassad period</option>
                </select>
              </div>

              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Från</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Till</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Avbryt
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Exportera
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
