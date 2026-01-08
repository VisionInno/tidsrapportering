import { useState } from 'react'
import { format } from 'date-fns'
import type { Project, TimeEntry } from '@/types'

interface TimeEntryFormProps {
  projects: Project[]
  onSubmit: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialDate?: string
}

export function TimeEntryForm({ projects, onSubmit, initialDate }: TimeEntryFormProps) {
  const [date, setDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'))
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [description, setDescription] = useState('')
  const [hours, setHours] = useState('')
  const [billable, setBillable] = useState(false)
  const [hourlyRate, setHourlyRate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId || !hours || parseFloat(hours) <= 0) return

    onSubmit({
      date,
      projectId,
      description,
      hours: parseFloat(hours),
      billable,
      hourlyRate: billable && hourlyRate ? parseFloat(hourlyRate) : undefined,
    })

    // Reset form
    setDescription('')
    setHours('')
    setBillable(false)
    setHourlyRate('')
  }

  const activeProjects = projects.filter((p) => p.active)

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Ny tidspost</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Datum
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700">
            Projekt
          </label>
          <select
            id="project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            {activeProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Beskrivning
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Vad arbetade du med?"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
            Timmar
          </label>
          <input
            type="number"
            id="hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="0.0"
            step="0.25"
            min="0"
            max="24"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>

        <div className="flex items-end gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Fakturerbar</span>
          </label>
        </div>
      </div>

      {billable && (
        <div>
          <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
            Timpris (kr)
          </label>
          <input
            type="number"
            id="hourlyRate"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="0"
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
      >
        Lägg till
      </button>
    </form>
  )
}
