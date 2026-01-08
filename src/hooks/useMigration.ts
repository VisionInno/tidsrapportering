import { useEffect, useState } from 'react'
import { isElectron, getAPI } from '@/api'
import * as storage from '@/utils/storage'

const MIGRATION_KEY = 'tidsrapportering_migrated_to_sqlite'

export function useMigration() {
  const [migrating, setMigrating] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)

  useEffect(() => {
    async function runMigration() {
      // Only migrate in Electron and if not already migrated
      if (!isElectron()) {
        setMigrationComplete(true)
        return
      }

      // Check if already migrated
      if (localStorage.getItem(MIGRATION_KEY) === 'true') {
        setMigrationComplete(true)
        return
      }

      // Check if there's data to migrate
      if (!storage.hasLocalStorageData()) {
        localStorage.setItem(MIGRATION_KEY, 'true')
        setMigrationComplete(true)
        return
      }

      setMigrating(true)

      try {
        const api = getAPI()
        const data = storage.getAllLocalStorageData()

        // Migrate to SQLite
        await api.migrate.fromLocalStorage(data)

        // Mark as migrated and clear localStorage
        localStorage.setItem(MIGRATION_KEY, 'true')
        storage.clearAllLocalStorage()

        console.log('Migration complete: moved data from localStorage to SQLite')
      } catch (error) {
        console.error('Migration failed:', error)
        // Don't mark as migrated so it can be retried
      }

      setMigrating(false)
      setMigrationComplete(true)
    }

    runMigration()
  }, [])

  return { migrating, migrationComplete }
}
