import { useState } from 'react'
import { TimeEntryForm, TimeEntryList, Summary, ExportButton, ProjectManager, QuickTimer, TodayEntries } from './components'
import { useTimeEntries } from './hooks/useTimeEntries'
import { useProjects } from './hooks/useProjects'
import { useActiveTimer } from './hooks/useActiveTimer'
import { useMigration } from './hooks/useMigration'
import type { ViewMode } from './types'

type Tab = 'register' | 'overview'

function App() {
  const { migrating, migrationComplete } = useMigration()
  const [activeTab, setActiveTab] = useState<Tab>('register')
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const { entries, addEntry, updateEntry, deleteEntry, loading: entriesLoading } = useTimeEntries()
  const { projects, addProject, updateProject, deleteProject, loading: projectsLoading } = useProjects()

  const {
    activeTimer,
    elapsedFormatted,
    isOverEightHours,
    startTimer,
    stopTimer,
    updateDescription,
  } = useActiveTimer({ onEntryCreated: addEntry })

  // Show loading screen while migrating or loading data
  if (migrating || !migrationComplete || entriesLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {migrating ? 'Migrerar data till ny databas...' : 'Laddar...'}
          </p>
        </div>
      </div>
    )
  }

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
            {activeTab === 'overview' && (
              <ExportButton entries={entries} projects={projects} />
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'register'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Registrera tid
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Översikt
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'register' ? (
          /* Register tab - QuickTimer, TimeEntryForm and Today's entries */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column - QuickTimer and Form */}
            <div className="space-y-8">
              {/* Quick Timer - Top 4 projects */}
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

              {/* Manual entry form */}
              <TimeEntryForm projects={projects} onSubmit={addEntry} />
            </div>

            {/* Right column - Today's entries */}
            <div>
              <TodayEntries
                entries={entries}
                projects={projects}
                onDelete={deleteEntry}
              />
            </div>
          </div>
        ) : (
          /* Overview tab - Summary, charts, and entry list */
          <div className="space-y-6">
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
            <TimeEntryList entries={entries} projects={projects} onDelete={deleteEntry} onUpdate={updateEntry} />
          </div>
        )}
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
