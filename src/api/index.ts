import type { TimeEntry, Project, ActiveTimer } from '@/types'

// Type definition for the API exposed by Electron preload
export interface ElectronAPI {
  projects: {
    getAll: () => Promise<Project[]>
    add: (project: Project) => Promise<Project>
    update: (project: Project) => Promise<Project>
    delete: (id: string) => Promise<boolean>
  }
  entries: {
    getAll: () => Promise<TimeEntry[]>
    add: (entry: TimeEntry) => Promise<TimeEntry>
    update: (entry: TimeEntry) => Promise<TimeEntry>
    delete: (id: string) => Promise<boolean>
  }
  timer: {
    get: () => Promise<ActiveTimer | null>
    save: (timer: ActiveTimer | null) => Promise<ActiveTimer | null>
    clear: () => Promise<boolean>
  }
  migrate: {
    fromLocalStorage: (data: {
      projects: Project[]
      entries: TimeEntry[]
      timer: ActiveTimer | null
    }) => Promise<boolean>
  }
  isElectron: boolean
}

// Extend Window interface
declare global {
  interface Window {
    api?: ElectronAPI
  }
}

// Check if running in Electron
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.api?.isElectron === true
}

// Get the API (throws if not in Electron)
export function getAPI(): ElectronAPI {
  if (!window.api) {
    throw new Error('Electron API not available')
  }
  return window.api
}
