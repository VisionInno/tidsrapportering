import { useEffect, useState } from 'react'
import { isElectron, getAPI } from '@/api'
import * as storage from '@/utils/storage'

const MIGRATION_KEY = 'tidsrapportering_migrated_to_sqlite'

export function useMigration() {
  const [migrating, setMigrating] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)
  const [migrationError, setMigrationError] = useState<string | null>(null)

  useEffect(() => {
    async function runMigration() {
      console.log('[Migration] Starting migration check...')
      console.log('[Migration] isElectron:', isElectron())

      // Debug: show all localStorage keys
      console.log('[Migration] All localStorage keys:', Object.keys(localStorage))
      console.log('[Migration] Raw localStorage entries:', localStorage.getItem('tidsrapportering_entries'))
      console.log('[Migration] Raw localStorage projects:', localStorage.getItem('tidsrapportering_projects'))

      // Only migrate in Electron
      if (!isElectron()) {
        console.log('[Migration] Running in browser mode, skipping SQLite migration')
        setMigrationComplete(true)
        return
      }

      // Check if there's data in localStorage
      const hasData = storage.hasLocalStorageData()
      const alreadyMigrated = localStorage.getItem(MIGRATION_KEY) === 'true'

      console.log('[Migration] Status:', { hasData, alreadyMigrated })

      if (!hasData) {
        if (!alreadyMigrated) {
          localStorage.setItem(MIGRATION_KEY, 'true')
        }
        setMigrationComplete(true)
        return
      }

      // Even if already migrated, check if localStorage has MORE data than SQLite
      // This handles the case where user ran web version after migration
      const api = getAPI()
      const localData = storage.getAllLocalStorageData()
      const sqliteEntries = await api.entries.getAll()
      const sqliteProjects = await api.projects.getAll()

      console.log('[Migration] Data comparison:', {
        localStorage: { entries: localData.entries.length, projects: localData.projects.length },
        sqlite: { entries: sqliteEntries.length, projects: sqliteProjects.length }
      })

      // If SQLite has all the data, we're done
      if (sqliteEntries.length >= localData.entries.length &&
          sqliteProjects.length >= localData.projects.length) {
        console.log('[Migration] SQLite is up to date, clearing localStorage')
        localStorage.setItem(MIGRATION_KEY, 'true')
        storage.clearAllLocalStorage()
        setMigrationComplete(true)
        return
      }

      // localStorage has more data - need to migrate
      console.log('[Migration] localStorage has more data than SQLite, running migration...')
      setMigrating(true)

      try {
        console.log('[Migration] Starting migration with:', {
          entriesCount: localData.entries.length,
          projectsCount: localData.projects.length,
          hasActiveTimer: localData.timer !== null
        })

        // Migrate to SQLite
        await api.migrate.fromLocalStorage(localData)
        console.log('[Migration] Data sent to SQLite')

        // CRITICAL: Verify data was actually saved before clearing localStorage
        const verifyEntries = await api.entries.getAll()
        const verifyProjects = await api.projects.getAll()

        console.log('[Migration] Verification - SQLite now has:', {
          entriesCount: verifyEntries.length,
          projectsCount: verifyProjects.length
        })

        // Only clear localStorage if SQLite has the data
        const entriesMigrated = verifyEntries.length >= localData.entries.length
        const projectsMigrated = verifyProjects.length >= localData.projects.length

        if (entriesMigrated && projectsMigrated) {
          localStorage.setItem(MIGRATION_KEY, 'true')
          storage.clearAllLocalStorage()
          console.log('[Migration] SUCCESS: Cleared localStorage after verifying SQLite data')
        } else {
          console.warn('[Migration] WARNING: SQLite has less data than localStorage, keeping localStorage intact')
          console.warn('[Migration] Expected entries:', localData.entries.length, 'Got:', verifyEntries.length)
          console.warn('[Migration] Expected projects:', localData.projects.length, 'Got:', verifyProjects.length)
          setMigrationError('Migration verification failed - localStorage preserved')
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error('[Migration] FAILED:', errorMsg)
        setMigrationError(errorMsg)
        // Don't mark as migrated so it can be retried
      }

      setMigrating(false)
      setMigrationComplete(true)
    }

    runMigration()
  }, [])

  return { migrating, migrationComplete, migrationError }
}
