import type { TimeEntry, Project } from '@/types'
import { formatTimeInterval, calculateTotalMinutesFromIntervals, minutesToRoundedHours } from '@/utils/time'

interface TodayEntriesProps {
  entries: TimeEntry[]
  projects: Project[]
  onDelete: (id: string) => void
}

export function TodayEntries({ entries, projects, onDelete }: TodayEntriesProps) {
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const today = new Date().toISOString().split('T')[0]

  // Filter today's entries
  const todayEntries = entries.filter((e) => e.date === today)

  // Sort by time: use first interval's startTime, or createdAt as fallback
  const sortedEntries = [...todayEntries].sort((a, b) => {
    const aTime = a.timeIntervals?.[0]?.startTime || '99:99'
    const bTime = b.timeIntervals?.[0]?.startTime || '99:99'
    if (aTime !== bTime) return aTime.localeCompare(bTime)
    return a.createdAt.localeCompare(b.createdAt)
  })

  // Calculate minutes per project, then round each project total
  const minutesByProject = new Map<string, number>()
  for (const entry of todayEntries) {
    const currentMinutes = minutesByProject.get(entry.projectId) || 0
    const entryMinutes = entry.timeIntervals && entry.timeIntervals.length > 0
      ? calculateTotalMinutesFromIntervals(entry.timeIntervals)
      : entry.hours * 60 // fallback to stored hours if no intervals
    minutesByProject.set(entry.projectId, currentMinutes + entryMinutes)
  }

  // Sum rounded hours per project to get total
  let totalHours = 0
  for (const minutes of minutesByProject.values()) {
    totalHours += minutesToRoundedHours(minutes)
  }

  // Calculate display minutes per entry (exact, no rounding)
  const getEntryMinutes = (entry: TimeEntry): number => {
    if (entry.timeIntervals && entry.timeIntervals.length > 0) {
      return calculateTotalMinutesFromIntervals(entry.timeIntervals)
    }
    return entry.hours * 60
  }

  if (sortedEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Idag</h3>
        <p className="text-gray-400 text-sm">Inga tidsposter registrerade idag</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Idag</h3>
        <span className="text-sm font-semibold text-primary-600">
          Totalt: {totalHours.toFixed(2)} h
        </span>
      </div>

      <div className="space-y-2">
        {sortedEntries.map((entry) => {
          const project = projectMap.get(entry.projectId)
          const timeStr = entry.timeIntervals && entry.timeIntervals.length > 0
            ? entry.timeIntervals.map(formatTimeInterval).join(', ')
            : null
          const minutes = getEntryMinutes(entry)

          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
            >
              {/* Time */}
              <div className="w-24 flex-shrink-0">
                {timeStr ? (
                  <span className="text-xs text-gray-500 font-mono">{timeStr}</span>
                ) : (
                  <span className="text-xs text-gray-300">--:--</span>
                )}
              </div>

              {/* Project color dot */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: project?.color || '#6b7280' }}
              />

              {/* Project name and description */}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-900">{project?.name || 'Okänt'}</span>
                {entry.description && (
                  <span className="text-sm text-gray-400 ml-2 truncate">
                    - {entry.description}
                  </span>
                )}
              </div>

              {/* Minutes (exact, not rounded) */}
              <div className="w-16 text-right flex-shrink-0">
                <span className="text-sm font-medium text-gray-700">
                  {minutes} min
                </span>
              </div>

              {/* Delete button */}
              <button
                onClick={() => onDelete(entry.id)}
                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                title="Ta bort"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {/* Show per-project totals if multiple projects */}
      {minutesByProject.size > 1 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Per projekt (avrundat):</p>
          <div className="space-y-1">
            {Array.from(minutesByProject.entries()).map(([projectId, minutes]) => {
              const project = projectMap.get(projectId)
              const roundedHours = minutesToRoundedHours(minutes)
              return (
                <div key={projectId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: project?.color || '#6b7280' }}
                    />
                    <span className="text-gray-600">{project?.name || 'Okänt'}</span>
                  </div>
                  <span className="text-gray-700 font-medium">{roundedHours.toFixed(2)} h</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
