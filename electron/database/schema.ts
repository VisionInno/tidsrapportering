import type Database from 'better-sqlite3'

export function createSchema(db: Database.Database): void {
  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client TEXT,
      color TEXT NOT NULL,
      defaultHourlyRate REAL,
      active INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    )
  `)

  // Time entries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      projectId TEXT NOT NULL,
      description TEXT DEFAULT '',
      hours REAL NOT NULL,
      billable INTEGER DEFAULT 1,
      hourlyRate REAL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    )
  `)

  // Time intervals table (linked to entries)
  db.exec(`
    CREATE TABLE IF NOT EXISTS time_intervals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entryId TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      FOREIGN KEY (entryId) REFERENCES time_entries(id) ON DELETE CASCADE
    )
  `)

  // Active timer table (max 1 row)
  db.exec(`
    CREATE TABLE IF NOT EXISTS active_timer (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      projectId TEXT,
      startTime TEXT,
      description TEXT DEFAULT '',
      warningShown INTEGER DEFAULT 0
    )
  `)

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_entries_date ON time_entries(date);
    CREATE INDEX IF NOT EXISTS idx_entries_project ON time_entries(projectId);
    CREATE INDEX IF NOT EXISTS idx_intervals_entry ON time_intervals(entryId);
  `)
}
