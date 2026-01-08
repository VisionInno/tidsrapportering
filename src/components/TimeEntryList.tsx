import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import type { TimeEntry, Project } from '@/types'

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
              Projekt
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Beskrivning
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timmar
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Summa
            </th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedEntries.map((entry) => {
            const project = projectMap.get(entry.projectId)
            const amount = entry.billable ? entry.hours * (entry.hourlyRate || 0) : 0

            return (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(entry.date), 'd MMM', { locale: sv })}
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
                  {entry.hours.toFixed(1)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                  {entry.billable ? (
                    <span className="text-green-600">{amount.toFixed(0)} kr</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
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
