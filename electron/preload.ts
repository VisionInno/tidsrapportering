import { contextBridge, ipcRenderer } from 'electron'

// Define types locally to avoid rootDir issues
interface TimeInterval {
  startTime: string
  endTime: string
}

interface TimeEntry {
  id: string
  date: string
  projectId: string
  description: string
  hours: number
  billable: boolean
  hourlyRate?: number
  timeIntervals?: TimeInterval[]
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  client?: string
  color: string
  defaultHourlyRate?: number
  active: boolean
  createdAt: string
}

interface ActiveTimer {
  projectId: string
  startTime: string
  description: string
  warningShown?: boolean
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Projects
  projects: {
    getAll: (): Promise<Project[]> => ipcRenderer.invoke('db:projects:getAll'),
    add: (project: Project): Promise<Project> => ipcRenderer.invoke('db:projects:add', project),
    update: (project: Project): Promise<Project> => ipcRenderer.invoke('db:projects:update', project),
    delete: (id: string): Promise<boolean> => ipcRenderer.invoke('db:projects:delete', id),
  },

  // Time Entries
  entries: {
    getAll: (): Promise<TimeEntry[]> => ipcRenderer.invoke('db:entries:getAll'),
    add: (entry: TimeEntry): Promise<TimeEntry> => ipcRenderer.invoke('db:entries:add', entry),
    update: (entry: TimeEntry): Promise<TimeEntry> => ipcRenderer.invoke('db:entries:update', entry),
    delete: (id: string): Promise<boolean> => ipcRenderer.invoke('db:entries:delete', id),
  },

  // Active Timer
  timer: {
    get: (): Promise<ActiveTimer | null> => ipcRenderer.invoke('db:timer:get'),
    save: (timer: ActiveTimer | null): Promise<ActiveTimer | null> => ipcRenderer.invoke('db:timer:save', timer),
    clear: (): Promise<boolean> => ipcRenderer.invoke('db:timer:clear'),
  },

  // Migration
  migrate: {
    fromLocalStorage: (data: { projects: Project[], entries: TimeEntry[], timer: ActiveTimer | null }): Promise<boolean> =>
      ipcRenderer.invoke('db:migrate:fromLocalStorage', data),
  },

  // Check if running in Electron
  isElectron: true,
})
