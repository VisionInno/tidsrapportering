import { useState } from 'react'
import type { Project } from '@/types'

interface ProjectManagerProps {
  projects: Project[]
  onAdd: (project: Omit<Project, 'id' | 'createdAt' | 'color'>) => void
  onUpdate: (id: string, updates: Partial<Project>) => void
  onDelete: (id: string) => void
}

export function ProjectManager({ projects, onAdd, onUpdate, onDelete }: ProjectManagerProps) {
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newClient, setNewClient] = useState('')
  const [newRate, setNewRate] = useState('')

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
            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className={project.active ? '' : 'text-gray-400 line-through'}>
                      {project.name}
                    </span>
                    {project.client && (
                      <span className="text-xs text-gray-500">({project.client})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdate(project.id, { active: !project.active })}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {project.active ? 'Inaktivera' : 'Aktivera'}
                    </button>
                    {project.id !== 'default' && (
                      <button
                        onClick={() => onDelete(project.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Ta bort
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
