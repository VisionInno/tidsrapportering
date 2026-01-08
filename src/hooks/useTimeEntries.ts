import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { TimeEntry } from '@/types'
import * as storage from '@/utils/storage'

export function useTimeEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setEntries(storage.getTimeEntries())
    setLoading(false)
  }, [])

  const addEntry = useCallback(
    (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newEntry: TimeEntry = {
        ...entry,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      storage.addTimeEntry(newEntry)
      setEntries((prev) => [...prev, newEntry])
      return newEntry
    },
    []
  )

  const updateEntry = useCallback((id: string, updates: Partial<TimeEntry>) => {
    storage.updateTimeEntry(id, updates)
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e))
    )
  }, [])

  const deleteEntry = useCallback((id: string) => {
    storage.deleteTimeEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const getEntriesByDate = useCallback(
    (date: string) => {
      return entries.filter((e) => e.date === date)
    },
    [entries]
  )

  const getEntriesByDateRange = useCallback(
    (start: string, end: string) => {
      return entries.filter((e) => e.date >= start && e.date <= end)
    },
    [entries]
  )

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesByDate,
    getEntriesByDateRange,
  }
}
