import { useState, useEffect, useCallback, useRef } from 'react'
import type { ActiveTimer, TimeEntry } from '@/types'
import * as storage from '@/utils/storage'
import { calculateIntervalHours, getCurrentTime } from '@/utils/time'
import { isElectron, getAPI } from '@/api'

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000

interface UseActiveTimerOptions {
  onEntryCreated: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export function useActiveTimer({ onEntryCreated }: UseActiveTimerOptions) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [warningShown, setWarningShown] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const onEntryCreatedRef = useRef(onEntryCreated)
  onEntryCreatedRef.current = onEntryCreated

  // Load active timer from storage on mount
  useEffect(() => {
    async function loadTimer() {
      if (isElectron()) {
        const api = getAPI()
        const saved = await api.timer.get()
        if (saved) {
          setActiveTimer(saved)
          setWarningShown(saved.warningShown || false)
        }
      } else {
        const saved = storage.getActiveTimer()
        if (saved) {
          setActiveTimer(saved)
          setWarningShown(saved.warningShown || false)
        }
      }
    }
    loadTimer()
  }, [])

  // Update elapsed time every second
  useEffect(() => {
    if (activeTimer) {
      const updateElapsed = () => {
        const start = new Date(activeTimer.startTime).getTime()
        const now = Date.now()
        setElapsedMs(now - start)
      }

      updateElapsed()
      intervalRef.current = window.setInterval(updateElapsed, 1000)

      return () => {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current)
        }
      }
    } else {
      setElapsedMs(0)
    }
  }, [activeTimer])

  // Helper to save timer
  const saveTimer = useCallback(async (timer: ActiveTimer | null) => {
    if (isElectron()) {
      await getAPI().timer.save(timer)
    } else {
      if (timer) {
        storage.saveActiveTimer(timer)
      } else {
        storage.clearActiveTimer()
      }
    }
  }, [])

  // Helper to clear timer
  const clearTimer = useCallback(async () => {
    if (isElectron()) {
      await getAPI().timer.clear()
    } else {
      storage.clearActiveTimer()
    }
  }, [])

  // Helper function to stop timer and create entry
  const createEntryAndClear = useCallback(
    async (timer: ActiveTimer, autoStopped: boolean) => {
      const start = new Date(timer.startTime)
      const endTime = getCurrentTime()

      // Format start time as HH:mm
      const startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`

      // Calculate hours with rounding to nearest 15 min
      const hours = calculateIntervalHours(startTime, endTime)

      let description = timer.description
      if (autoStopped) {
        description = description
          ? `${description} [Automatiskt stoppad efter 12 timmar]`
          : '[Automatiskt stoppad efter 12 timmar]'
      }

      onEntryCreatedRef.current({
        date: start.toISOString().split('T')[0],
        projectId: timer.projectId,
        description,
        hours,
        billable: true,
        timeIntervals: [{ startTime, endTime }],
      })

      await clearTimer()
      setActiveTimer(null)
      setElapsedMs(0)
      setWarningShown(false)
    },
    [clearTimer]
  )

  // Check for 8h warning and 12h auto-stop
  useEffect(() => {
    if (!activeTimer) return

    // 8h warning
    if (elapsedMs >= EIGHT_HOURS_MS && !warningShown) {
      setWarningShown(true)
      const updated = { ...activeTimer, warningShown: true }
      saveTimer(updated)
      setActiveTimer(updated)
    }

    // 12h auto-stop
    if (elapsedMs >= TWELVE_HOURS_MS) {
      createEntryAndClear(activeTimer, true)
    }
  }, [elapsedMs, activeTimer, warningShown, createEntryAndClear, saveTimer])

  const startTimer = useCallback(
    async (projectId: string) => {
      // If another timer is running, stop it first
      if (activeTimer && activeTimer.projectId !== projectId) {
        await createEntryAndClear(activeTimer, false)
      }

      const newTimer: ActiveTimer = {
        projectId,
        startTime: new Date().toISOString(),
        description: '',
      }

      await saveTimer(newTimer)
      setActiveTimer(newTimer)
      setWarningShown(false)
      setElapsedMs(0)
    },
    [activeTimer, createEntryAndClear, saveTimer]
  )

  const stopTimer = useCallback(
    async (autoStopped = false) => {
      if (activeTimer) {
        await createEntryAndClear(activeTimer, autoStopped)
      }
    },
    [activeTimer, createEntryAndClear]
  )

  const updateDescription = useCallback(
    async (description: string) => {
      if (activeTimer) {
        const updated = { ...activeTimer, description }
        await saveTimer(updated)
        setActiveTimer(updated)
      }
    },
    [activeTimer, saveTimer]
  )

  const isTimerRunning = useCallback(
    (projectId: string) => {
      return activeTimer?.projectId === projectId
    },
    [activeTimer]
  )

  const formatElapsed = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])

  return {
    activeTimer,
    elapsedMs,
    elapsedFormatted: formatElapsed(elapsedMs),
    warningShown,
    isOverEightHours: elapsedMs >= EIGHT_HOURS_MS,
    startTimer,
    stopTimer,
    updateDescription,
    isTimerRunning,
  }
}
