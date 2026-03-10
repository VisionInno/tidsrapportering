import { useState, useMemo } from 'react'
import { TimeEntryForm, TimeEntryList, Summary, ExportButton, ProjectManager, QuickTimer, TodayEntries, DataManager } from './components'
import { useTimeEntries } from './hooks/useTimeEntries'
import { useProjects } from './hooks/useProjects'
import { useActiveTimer } from './hooks/useActiveTimer'
import { useMigration } from './hooks/useMigration'
import { getDateRangeForViewMode } from './utils/time'
import type { ViewMode } from './types'

type Tab = 'register' | 'overview'

function App() {
  const { migrating, migrationComplete } = useMigration()
  const [activeTab, setActiveTab] = useState<Tab>('register')
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [monthOffset, setMonthOffset] = useState(0)
  const { entries, addEntry, updateEntry, deleteEntry, loading: entriesLoading, reload: reloadEntries } = useTimeEntries()
  const { projects, addProject, updateProject, deleteProject, getEntriesCountForProject, loading: projectsLoading, reload: reloadProjects } = useProjects()

  const {
    activeTimer,
    elapsedFormatted,
    isOverEightHours,
    startTimer,
    stopTimer,
    updateDescription,
  } = useActiveTimer({ onEntryCreated: addEntry })

  // Filter entries based on viewMode
  const dateRange = useMemo(() => getDateRangeForViewMode(viewMode, monthOffset), [viewMode, monthOffset])
  const filteredEntries = useMemo(() => {
    return entries.filter(e => e.date >= dateRange.start && e.date <= dateRange.end)
  }, [entries, dateRange])

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
              getEntriesCount={getEntriesCountForProject}
            />
            {activeTab === 'overview' && (
              <>
                <DataManager
                  onDataImported={() => { reloadEntries(); reloadProjects() }}
                />
                <ExportButton entries={entries} projects={projects} />
              </>
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
              <TimeEntryForm projects={projects} onSubmit={addEntry} activeTimerProjectId={activeTimer?.projectId} />
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
                  onClick={() => { setViewMode(mode); setMonthOffset(0) }}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {mode === 'day' ? 'Dag' : mode === 'week' ? 'Vecka' : 'Månad'}
                </button>
              ))}

              {viewMode === 'month' && (
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => setMonthOffset(prev => prev - 1)}
                    className="p-1.5 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                    title="Föregående månad"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-700 min-w-[120px] text-center capitalize">
                    {dateRange.label}
                  </span>
                  <button
                    onClick={() => setMonthOffset(prev => prev + 1)}
                    disabled={monthOffset >= 0}
                    className={`p-1.5 rounded-md ${
                      monthOffset >= 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    title="Nästa månad"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Summary */}
            <Summary entries={filteredEntries} projects={projects} />

            {/* Entry list */}
            <TimeEntryList entries={filteredEntries} projects={projects} onDelete={deleteEntry} onUpdate={updateEntry} onAdd={addEntry} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between text-sm text-gray-500">
          <span>Tidsrapportering - Personlig tidsspårning</span>
          <span className="text-xs text-gray-400" title={__BUILD_TIMESTAMP__}>
            v{new Date(__BUILD_TIMESTAMP__).toLocaleDateString('sv-SE')} {new Date(__BUILD_TIMESTAMP__).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </footer>
    </div>
  )
}

export default App
