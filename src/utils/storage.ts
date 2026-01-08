import type { TimeEntry, Project } from '@/types'

const STORAGE_KEYS = {
  TIME_ENTRIES: 'tidsrapportering_entries',
  PROJECTS: 'tidsrapportering_projects',
} as const

export function getTimeEntries(): TimeEntry[] {
  const data = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES)
  return data ? JSON.parse(data) : []
}

export function saveTimeEntries(entries: TimeEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(entries))
}

export function addTimeEntry(entry: TimeEntry): void {
  const entries = getTimeEntries()
  entries.push(entry)
  saveTimeEntries(entries)
}

export function updateTimeEntry(id: string, updates: Partial<TimeEntry>): void {
  const entries = getTimeEntries()
  const index = entries.findIndex((e) => e.id === id)
  if (index !== -1) {
    entries[index] = { ...entries[index], ...updates, updatedAt: new Date().toISOString() }
    saveTimeEntries(entries)
  }
}

export function deleteTimeEntry(id: string): void {
  const entries = getTimeEntries()
  saveTimeEntries(entries.filter((e) => e.id !== id))
}

export function getProjects(): Project[] {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS)
  if (data) {
    return JSON.parse(data)
  }
  // Return default projects if none exist
  const defaults: Project[] = [
    {
      id: 'default',
      name: 'Allmänt',
      color: '#6b7280',
      active: true,
      createdAt: new Date().toISOString(),
    },
  ]
  saveProjects(defaults)
  return defaults
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
}

export function addProject(project: Project): void {
  const projects = getProjects()
  projects.push(project)
  saveProjects(projects)
}

export function updateProject(id: string, updates: Partial<Project>): void {
  const projects = getProjects()
  const index = projects.findIndex((p) => p.id === id)
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates }
    saveProjects(projects)
  }
}

export function deleteProject(id: string): void {
  const projects = getProjects()
  saveProjects(projects.filter((p) => p.id !== id))
}
