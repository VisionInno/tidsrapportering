import { useState } from 'react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import type { TimeEntry, Project, TimeInterval } from '@/types'
import { formatTimeInterval, calculateTotalMinutesFromIntervals, parseIntervalString } from '@/utils/time'

interface EditState {
  time: string
  projectId: string
  description: string
  date: string
}

interface TimeEntryListProps {
  entries: TimeEntry[]
  projects: Project[]
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<TimeEntry>) => void
  onAdd: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export function TimeEntryList({ entries, projects, onDelete, onUpdate, onAdd }: TimeEntryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ time: '', projectId: '', description: '', date: '' })
  const [isAdding, setIsAdding] = useState(false)
  const [newEntry, setNewEntry] = useState<EditState>({
    time: '',
    projectId: projects[0]?.id || '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  const projectMap = new Map(projects.map((p) => [p.id, p]))

  const startEditing = (entry: TimeEntry) => {
    setEditingId(entry.id)
    setEditState({
      time: entry.timeIntervals && entry.timeIntervals.length > 0
        ? entry.timeIntervals.map(formatTimeInterval).join(', ')
        : '',
      projectId: entry.projectId,
      description: entry.description || '',
      date: entry.date,
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditState({ time: '', projectId: '', description: '', date: '' })
  }

  const saveEditing = (entry: TimeEntry) => {
    const intervalStrings = editState.time.split(',').map(s => s.trim()).filter(s => s.length > 0)
    const newIntervals: TimeInterval[] = []

    for (const str of intervalStrings) {
      const interval = parseIntervalString(str)
      if (interval) {
        newIntervals.push(interval)
      }
    }

    const updates: Partial<TimeEntry> = {
      projectId: editState.projectId,
      description: editState.description,
      date: editState.date,
    }

    if (newIntervals.length > 0) {
      const totalMinutes = calculateTotalMinutesFromIntervals(newIntervals)
      updates.timeIntervals = newIntervals
      updates.hours = totalMinutes / 60
    }

    onUpdate(entry.id, updates)
    setEditingId(null)
    setEditState({ time: '', projectId: '', description: '', date: '' })
  }

  const startAdding = () => {
    setIsAdding(true)
    setNewEntry({
      time: '',
      projectId: projects[0]?.id || '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    })
  }

  const cancelAdding = () => {
    setIsAdding(false)
    setNewEntry({ time: '', projectId: '', description: '', date: '' })
  }

  const saveNewEntry = () => {
    const intervalStrings = newEntry.time.split(',').map(s => s.trim()).filter(s => s.length > 0)
    const intervals: TimeInterval[] = []

    for (const str of intervalStrings) {
      const interval = parseIntervalString(str)
      if (interval) {
        intervals.push(interval)
      }
    }

    if (intervals.length === 0 || !newEntry.projectId) {
      return // Need at least time and project
    }

    const totalMinutes = calculateTotalMinutesFromIntervals(intervals)
    const project = projectMap.get(newEntry.projectId)

    onAdd({
      date: newEntry.date,
      projectId: newEntry.projectId,
      description: newEntry.description,
      timeIntervals: intervals,
      hours: totalMinutes / 60,
      billable: true,
      hourlyRate: project?.defaultHourlyRate || 0,
    })

    setIsAdding(false)
    setNewEntry({ time: '', projectId: '', description: '', date: '' })
  }

  const sortedEntries = [...entries].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.createdAt.localeCompare(a.createdAt)
  })

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Add button */}
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Tidsposter</span>
        {!isAdding && (
          <button
            onClick={startAdding}
            className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Lägg till
          </button>
        )}
      </div>

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
          {/* Add new row */}
          {isAdding && (
            <tr className="bg-primary-50">
              <td className="px-4 py-3">
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={newEntry.time}
                  onChange={(e) => setNewEntry({ ...newEntry, time: e.target.value })}
                  placeholder="08:00-12:00"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  autoFocus
                />
              </td>
              <td className="px-4 py-3">
                <select
                  value={newEntry.projectId}
                  onChange={(e) => setNewEntry({ ...newEntry, projectId: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="Beskrivning..."
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-400">
                -
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                <button
                  onClick={saveNewEntry}
                  className="text-green-600 hover:text-green-800"
                >
                  Spara
                </button>
                <button
                  onClick={cancelAdding}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Avbryt
                </button>
              </td>
            </tr>
          )}

          {/* Existing entries */}
          {sortedEntries.map((entry) => {
            const project = projectMap.get(entry.projectId)
            const isEditing = editingId === entry.id
            const minutes = entry.timeIntervals && entry.timeIntervals.length > 0
              ? calculateTotalMinutesFromIntervals(entry.timeIntervals)
              : entry.hours * 60

            return (
              <tr key={entry.id} className={isEditing ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {isEditing ? (
                    <input
                      type="date"
                      value={editState.date}
                      onChange={(e) => setEditState({ ...editState, date: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  ) : (
                    format(new Date(entry.date), 'd MMM', { locale: sv })
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editState.time}
                      onChange={(e) => setEditState({ ...editState, time: e.target.value })}
                      placeholder="08:00-12:00, 13:00-17:00"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  ) : entry.timeIntervals && entry.timeIntervals.length > 0 ? (
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
                  {isEditing ? (
                    <select
                      value={editState.projectId}
                      onChange={(e) => setEditState({ ...editState, projectId: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: project?.color || '#6b7280' }}
                      />
                      <span className="text-sm text-gray-900">{project?.name || 'Okänt'}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editState.description}
                      onChange={(e) => setEditState({ ...editState, description: e.target.value })}
                      placeholder="Beskrivning..."
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  ) : (
                    <span className="truncate block">{entry.description || '-'}</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                  {minutes}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveEditing(entry)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Spara
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Avbryt
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(entry)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        Ändra
                      </button>
                      <button
                        onClick={() => onDelete(entry.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Ta bort
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}

          {/* Empty state */}
          {sortedEntries.length === 0 && !isAdding && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                Inga tidsposter att visa. Klicka "Lägg till" för att skapa en.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
