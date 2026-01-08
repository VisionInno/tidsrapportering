import { useMemo } from 'react'
import type { Project, TimeEntry, ActiveTimer } from '@/types'

interface QuickTimerProps {
  projects: Project[]
  entries: TimeEntry[]
  activeTimer: ActiveTimer | null
  elapsedFormatted: string
  isOverEightHours: boolean
  onStart: (projectId: string) => void
  onStop: () => void
  onDescriptionChange: (description: string) => void
}

export function QuickTimer({
  projects,
  entries,
  activeTimer,
  elapsedFormatted,
  isOverEightHours,
  onStart,
  onStop,
  onDescriptionChange,
}: QuickTimerProps) {
  // Calculate top 4 most used projects based on entry count
  const topProjects = useMemo(() => {
    const projectCounts = new Map<string, number>()

    entries.forEach((entry) => {
      const count = projectCounts.get(entry.projectId) || 0
      projectCounts.set(entry.projectId, count + 1)
    })

    // Sort projects by usage count, then filter to active projects
    const activeProjects = projects.filter((p) => p.active)

    return activeProjects
      .map((project) => ({
        ...project,
        usageCount: projectCounts.get(project.id) || 0,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 4)
  }, [projects, entries])

  const activeProject = activeTimer
    ? projects.find((p) => p.id === activeTimer.projectId)
    : null

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Snabbtimer</h2>

      {/* Active timer display */}
      {activeTimer && activeProject && (
        <div
          className={`mb-6 p-4 rounded-lg border-2 ${
            isOverEightHours
              ? 'bg-amber-50 border-amber-400'
              : 'bg-green-50 border-green-400'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: activeProject.color }}
              />
              <span className="font-medium text-gray-900">
                {activeProject.name}
              </span>
            </div>
            <span
              className={`text-2xl font-mono font-bold ${
                isOverEightHours ? 'text-amber-600' : 'text-green-600'
              }`}
            >
              {elapsedFormatted}
            </span>
          </div>

          {isOverEightHours && (
            <div className="mb-3 p-2 bg-amber-100 rounded text-amber-800 text-sm">
              Varning: Du har jobbat mer än 8 timmar. Timern stängs automatiskt efter 12 timmar.
            </div>
          )}

          <div className="mb-3">
            <textarea
              value={activeTimer.description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Beskriv vad du gör..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <button
            onClick={onStop}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            Stoppa
          </button>
        </div>
      )}

      {/* Quick project buttons */}
      <div className="grid grid-cols-2 gap-3">
        {topProjects.map((project) => {
          const isActive = activeTimer?.projectId === project.id

          return (
            <button
              key={project.id}
              onClick={() => (isActive ? onStop() : onStart(project.id))}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                isActive
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${isActive ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: project.color }}
                />
                <span className="font-medium text-gray-900 text-sm truncate">
                  {project.name}
                </span>
              </div>

              <div
                className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-red-100 text-red-700'
                    : 'bg-primary-100 text-primary-700'
                }`}
              >
                {isActive ? (
                  <>
                    <StopIcon className="w-4 h-4" />
                    Stoppa
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4" />
                    Starta
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {topProjects.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">
          Inga projekt ännu. Lägg till projekt för att använda snabbtimern.
        </p>
      )}
    </div>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <rect x="6" y="6" width="12" height="12" />
    </svg>
  )
}
