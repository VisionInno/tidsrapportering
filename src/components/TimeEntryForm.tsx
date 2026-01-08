import { useState } from 'react'
import { format } from 'date-fns'
import type { Project, TimeEntry, TimeInterval } from '@/types'
import {
  parseIntervalString,
  calculateTotalHoursFromIntervals,
  formatTimeInterval,
} from '@/utils/time'

type InputMode = 'hours' | 'intervals'

interface TimeEntryFormProps {
  projects: Project[]
  onSubmit: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialDate?: string
}

export function TimeEntryForm({ projects, onSubmit, initialDate }: TimeEntryFormProps) {
  const [date, setDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'))
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [description, setDescription] = useState('')
  const [inputMode, setInputMode] = useState<InputMode>('intervals')
  const [hours, setHours] = useState('')
  const [intervalInput, setIntervalInput] = useState('')
  const [intervals, setIntervals] = useState<TimeInterval[]>([])
  const [intervalError, setIntervalError] = useState('')

  const handleAddInterval = () => {
    const parsed = parseIntervalString(intervalInput)
    if (parsed) {
      setIntervals((prev) => [...prev, parsed])
      setIntervalInput('')
      setIntervalError('')
    } else {
      setIntervalError('Ogiltigt format. Använd t.ex. 12:51-13:12 eller 12.51-13.12')
    }
  }

  const handleRemoveInterval = (index: number) => {
    setIntervals((prev) => prev.filter((_, i) => i !== index))
  }

  const handleIntervalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddInterval()
    }
  }

  const calculatedHours = intervals.length > 0 ? calculateTotalHoursFromIntervals(intervals) : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (inputMode === 'hours') {
      if (!projectId || !hours || parseFloat(hours) <= 0) return

      onSubmit({
        date,
        projectId,
        description,
        hours: parseFloat(hours),
        billable: true,
      })
    } else {
      if (!projectId || intervals.length === 0) return

      onSubmit({
        date,
        projectId,
        description,
        hours: calculatedHours,
        billable: true,
        timeIntervals: intervals,
      })
    }

    // Reset form
    setDescription('')
    setHours('')
    setIntervals([])
    setIntervalInput('')
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

      {/* Input mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setInputMode('intervals')}
          className={`flex-1 py-1.5 px-3 text-sm rounded-md transition-colors ${
            inputMode === 'intervals'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tidsintervall
        </button>
        <button
          type="button"
          onClick={() => setInputMode('hours')}
          className={`flex-1 py-1.5 px-3 text-sm rounded-md transition-colors ${
            inputMode === 'hours'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Timmar
        </button>
      </div>

      {inputMode === 'hours' ? (
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
      ) : (
        <div className="space-y-3">
          <div>
            <label htmlFor="interval" className="block text-sm font-medium text-gray-700">
              Lägg till tidsintervall
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                id="interval"
                value={intervalInput}
                onChange={(e) => {
                  setIntervalInput(e.target.value)
                  setIntervalError('')
                }}
                onKeyDown={handleIntervalKeyDown}
                placeholder="12:51-13:12"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={handleAddInterval}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                +
              </button>
            </div>
            {intervalError && (
              <p className="mt-1 text-xs text-red-600">{intervalError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Varje intervall avrundas uppåt till närmaste 15 min
            </p>
          </div>

          {/* Display added intervals */}
          {intervals.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {intervals.map((interval, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded text-sm"
                  >
                    {formatTimeInterval(interval)}
                    <button
                      type="button"
                      onClick={() => handleRemoveInterval(index)}
                      className="text-primary-500 hover:text-primary-700"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-sm font-medium text-gray-700">
                Totalt: {calculatedHours.toFixed(2)} timmar (avrundat)
              </p>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={
          inputMode === 'hours'
            ? !projectId || !hours || parseFloat(hours) <= 0
            : !projectId || intervals.length === 0
        }
        className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Lägg till
      </button>
    </form>
  )
}
