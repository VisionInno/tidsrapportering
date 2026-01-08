import { useState } from 'react'
import { TimeEntryForm, TimeEntryList, Summary, ExportButton, ProjectManager, QuickTimer } from './components'
import { useTimeEntries } from './hooks/useTimeEntries'
import { useProjects } from './hooks/useProjects'
import { useActiveTimer } from './hooks/useActiveTimer'
import type { ViewMode } from './types'

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const { entries, addEntry, deleteEntry } = useTimeEntries()
  const { projects, addProject, updateProject, deleteProject } = useProjects()

  const {
    activeTimer,
    elapsedFormatted,
    isOverEightHours,
    startTimer,
    stopTimer,
    updateDescription,
  } = useActiveTimer({ onEntryCreated: addEntry })

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <polyline points="12 6 12 12 16 14" strokeWidth="2" />
            </svg>
            <h1 className="text-xl font-bold text-gray-900">Tidsrapportering</h1>
          </div>
          <div className="flex items-center gap-3">
            <ProjectManager
              projects={projects}
              onAdd={addProject}
              onUpdate={updateProject}
              onDelete={deleteProject}
            />
            <ExportButton entries={entries} projects={projects} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Timer - Top 4 projects */}
        <div className="mb-8">
          <QuickTimer
            projects={projects}
            entries={entries}
            activeTimer={activeTimer}
            elapsedFormatted={elapsedFormatted}
            isOverEightHours={isOverEightHours}
            onStart={startTimer}
            onStop={() => stopTimer(false)}
            onDescriptionChange={updateDescription}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Entry form */}
          <div className="lg:col-span-1">
            <TimeEntryForm projects={projects} onSubmit={addEntry} />
          </div>

          {/* Right column - Summary and list */}
          <div className="lg:col-span-2 space-y-6">
            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {mode === 'day' ? 'Dag' : mode === 'week' ? 'Vecka' : 'Månad'}
                </button>
              ))}
            </div>

            {/* Summary */}
            <Summary entries={entries} projects={projects} />

            {/* Entry list */}
            <TimeEntryList entries={entries} projects={projects} onDelete={deleteEntry} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          Tidsrapportering - Personlig tidsspårning
        </div>
      </footer>
    </div>
  )
}

export default App
