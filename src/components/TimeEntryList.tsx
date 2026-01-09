import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import type { TimeEntry, Project } from '@/types'
import { formatTimeInterval, calculateTotalMinutesFromIntervals } from '@/utils/time'

interface TimeEntryListProps {
  entries: TimeEntry[]
  projects: Project[]
  onDelete: (id: string) => void
}

export function TimeEntryList({ entries, projects, onDelete }: TimeEntryListProps) {
  const projectMap = new Map(projects.map((p) => [p.id, p]))

  const sortedEntries = [...entries].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.createdAt.localeCompare(a.createdAt)
  })

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        Inga tidsposter att visa. Lägg till din första post ovan!
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Datum
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tid
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Projekt
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Beskrivning
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Minuter
            </th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedEntries.map((entry) => {
            const project = projectMap.get(entry.projectId)
            // Calculate exact minutes (not rounded)
            const minutes = entry.timeIntervals && entry.timeIntervals.length > 0
              ? calculateTotalMinutesFromIntervals(entry.timeIntervals)
              : entry.hours * 60

            return (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(entry.date), 'd MMM', { locale: sv })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {entry.timeIntervals && entry.timeIntervals.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {entry.timeIntervals.map((interval, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-xs"
                        >
                          {formatTimeInterval(interval)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: project?.color || '#6b7280' }}
                    />
                    <span className="text-sm text-gray-900">{project?.name || 'Okänt'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                  {entry.description || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                  {minutes}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Ta bort
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
