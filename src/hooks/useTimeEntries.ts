import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { TimeEntry } from '@/types'
import * as storage from '@/utils/storage'
import { isElectron, getAPI } from '@/api'

export function useTimeEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEntries() {
      if (isElectron()) {
        const api = getAPI()
        const dbEntries = await api.entries.getAll()
        setEntries(dbEntries)
      } else {
        setEntries(storage.getTimeEntries())
      }
      setLoading(false)
    }
    loadEntries()
  }, [])

  const addEntry = useCallback(
    async (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newEntry: TimeEntry = {
        ...entry,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      if (isElectron()) {
        await getAPI().entries.add(newEntry)
      } else {
        storage.addTimeEntry(newEntry)
      }
      setEntries((prev) => [...prev, newEntry])
      return newEntry
    },
    []
  )

  const updateEntry = useCallback(async (id: string, updates: Partial<TimeEntry>) => {
    if (isElectron()) {
      const currentEntries = await getAPI().entries.getAll()
      const entry = currentEntries.find((e) => e.id === id)
      if (entry) {
        await getAPI().entries.update({ ...entry, ...updates, updatedAt: new Date().toISOString() })
      }
    } else {
      storage.updateTimeEntry(id, updates)
    }
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e))
    )
  }, [])

  const deleteEntry = useCallback(async (id: string) => {
    if (isElectron()) {
      await getAPI().entries.delete(id)
    } else {
      storage.deleteTimeEntry(id)
    }
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
