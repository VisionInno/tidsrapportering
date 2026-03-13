import type { TimeEntry, Project, ActiveTimer } from '@/types'

export interface FortnoxConfig {
  clientId: string | null
  clientSecret: string | null
  hasTokens: boolean
  tokenExpiresAt: string | null
}

export interface FortnoxCustomer {
  CustomerNumber: string
  Name: string
  OrganisationNumber?: string
  City?: string
}

export interface FortnoxInvoiceRow {
  AccountNumber: number
  Description: string
  DeliveredQuantity: number
  Price: number
  Unit: string
}

export interface FortnoxInvoicePayload {
  Invoice: {
    CustomerNumber: string
    InvoiceDate?: string
    DueDate?: string
    OurReference?: string
    InvoiceRows: FortnoxInvoiceRow[]
  }
}

export interface FortnoxInvoiceResponse {
  Invoice: {
    DocumentNumber: string
    CustomerNumber: string
    Total: number
    InvoiceDate: string
  }
}

// Type definition for the API exposed by Electron preload
export interface ElectronAPI {
  projects: {
    getAll: () => Promise<Project[]>
    add: (project: Project) => Promise<Project>
    update: (project: Project) => Promise<Project>
    delete: (id: string) => Promise<boolean>
    getEntriesCount: (projectId: string) => Promise<number>
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
  backup: {
    export: () => Promise<boolean>
    import: () => Promise<{ success: boolean; projectsImported?: number; entriesImported?: number; reason?: string }>
  }
  migrate: {
    fromLocalStorage: (data: {
      projects: Project[]
      entries: TimeEntry[]
      timer: ActiveTimer | null
    }) => Promise<boolean>
  }
  fortnox: {
    getConfig: () => Promise<FortnoxConfig>
    saveCredentials: (clientId: string, clientSecret: string) => Promise<boolean>
    getSetting: (key: string) => Promise<string | null>
    setSetting: (key: string, value: string) => Promise<boolean>
    disconnect: () => Promise<boolean>
    startAuth: () => Promise<{ success: boolean; error?: string }>
    listCustomers: () => Promise<FortnoxCustomer[]>
    createInvoice: (payload: FortnoxInvoicePayload) => Promise<FortnoxInvoiceResponse>
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
