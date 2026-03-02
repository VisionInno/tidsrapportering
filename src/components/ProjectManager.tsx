import { useState, useEffect } from 'react'
import type { Project } from '@/types'

interface ProjectManagerProps {
  projects: Project[]
  onAdd: (project: Omit<Project, 'id' | 'createdAt' | 'color'>) => void
  onUpdate: (id: string, updates: Partial<Project>) => void
  onDelete: (id: string) => void
  getEntriesCount: (projectId: string) => Promise<number>
}

export function ProjectManager({ projects, onAdd, onUpdate, onDelete, getEntriesCount }: ProjectManagerProps) {
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newClient, setNewClient] = useState('')
  const [newRate, setNewRate] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editClient, setEditClient] = useState('')
  const [editRate, setEditRate] = useState('')

  // Track entries count per project
  const [entriesCount, setEntriesCount] = useState<Map<string, number>>(new Map())

  // Load entries count when modal opens
  useEffect(() => {
    if (showModal) {
      const loadCounts = async () => {
        const counts = new Map<string, number>()
        for (const project of projects) {
          const count = await getEntriesCount(project.id)
          counts.set(project.id, count)
        }
        setEntriesCount(counts)
      }
      loadCounts()
    }
  }, [showModal, projects, getEntriesCount])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    onAdd({
      name: newName.trim(),
      client: newClient.trim() || undefined,
      defaultHourlyRate: newRate ? parseFloat(newRate) : undefined,
      active: true,
    })

    setNewName('')
    setNewClient('')
    setNewRate('')
    setShowModal(false)
  }

  const startEditing = (project: Project) => {
    setEditingId(project.id)
    setEditName(project.name)
    setEditClient(project.client || '')
    setEditRate(project.defaultHourlyRate?.toString() || '')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditName('')
    setEditClient('')
    setEditRate('')
  }

  const saveEditing = (projectId: string) => {
    if (!editName.trim()) return

    onUpdate(projectId, {
      name: editName.trim(),
      client: editClient.trim() || undefined,
      defaultHourlyRate: editRate ? parseFloat(editRate) : undefined,
    })

    setEditingId(null)
    setEditName('')
    setEditClient('')
    setEditRate('')
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        Projekt
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hantera projekt</h2>

            {/* Existing projects */}
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {projects.map((project) => {
                const count = entriesCount.get(project.id) || 0
                const hasEntries = count > 0
                const isEditing = editingId === project.id

                return (
                  <div
                    key={project.id}
                    className={`p-2 rounded-md ${isEditing ? 'bg-yellow-50 border border-yellow-200' : 'hover:bg-gray-50'}`}
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Projektnamn"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center gap-2 ml-6">
                          <input
                            type="text"
                            value={editClient}
                            onChange={(e) => setEditClient(e.target.value)}
                            placeholder="Kund (valfritt)"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                          <input
                            type="number"
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            placeholder="Timpris"
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="flex justify-end gap-2 ml-6">
                          <button
                            onClick={() => saveEditing(project.id)}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Spara
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Avbryt
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <div>
                            <span className={project.active ? '' : 'text-gray-400 line-through'}>
                              {project.name}
                            </span>
                            {project.client && (
                              <span className="text-xs text-gray-500 ml-1">({project.client})</span>
                            )}
                            {project.defaultHourlyRate && (
                              <span className="text-xs text-gray-400 ml-2">{project.defaultHourlyRate} kr/h</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditing(project)}
                            className="text-xs text-primary-500 hover:text-primary-700"
                          >
                            Redigera
                          </button>
                          <button
                            onClick={() => onUpdate(project.id, { active: !project.active })}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            {project.active ? 'Inaktivera' : 'Aktivera'}
                          </button>
                          {hasEntries ? (
                            <span className="text-xs text-gray-400">(har tidsposter)</span>
                          ) : (
                            <button
                              onClick={() => onDelete(project.id)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Ta bort
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add new project form */}
            <form onSubmit={handleSubmit} className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Lägg till nytt projekt</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Projektnamn"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    placeholder="Kund (valfritt)"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  <input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    placeholder="Timpris (valfritt)"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lägg till projekt
                </button>
              </div>
            </form>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
