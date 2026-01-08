export interface TimeEntry {
  id: string
  date: string // ISO date string YYYY-MM-DD
  projectId: string
  description: string
  hours: number
  billable: boolean
  hourlyRate?: number
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  client?: string
  color: string
  defaultHourlyRate?: number
  active: boolean
  createdAt: string
}

export interface DailySummary {
  date: string
  totalHours: number
  billableHours: number
  entries: TimeEntry[]
}

export interface WeeklySummary {
  weekStart: string
  weekEnd: string
  totalHours: number
  billableHours: number
  totalBillable: number
  entriesByProject: Record<string, number>
}

export interface MonthlySummary {
  month: string // YYYY-MM
  totalHours: number
  billableHours: number
  totalBillable: number
  entriesByProject: Record<string, number>
  entriesByDay: Record<string, number>
}

export type ViewMode = 'day' | 'week' | 'month'

export type ExportFormat = 'csv' | 'pdf'
