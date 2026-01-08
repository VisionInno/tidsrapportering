import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import { createSchema } from './schema.js'

let db: Database.Database | null = null

export function initDatabase(): Database.Database {
  if (db) return db

  // Store database in user data directory
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'tidsrapportering.db')

  console.log('Database path:', dbPath)

  db = new Database(dbPath)

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Create tables if they don't exist
  createSchema(db)

  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
