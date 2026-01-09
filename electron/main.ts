import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase, getDatabase } from './database/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../build/icon.png'),
  })

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    // Disable cache in development
    mainWindow.webContents.session.clearCache()
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Initialize database and register IPC handlers
function setupIPC() {
  const db = getDatabase()

  // Projects
  ipcMain.handle('db:projects:getAll', () => {
    return db.prepare('SELECT * FROM projects ORDER BY name').all()
  })

  ipcMain.handle('db:projects:add', (_event, project) => {
    const stmt = db.prepare(`
      INSERT INTO projects (id, name, client, color, defaultHourlyRate, active, createdAt)
      VALUES (@id, @name, @client, @color, @defaultHourlyRate, @active, @createdAt)
    `)
    stmt.run(project)
    return project
  })

  ipcMain.handle('db:projects:update', (_event, project) => {
    const stmt = db.prepare(`
      UPDATE projects SET
        name = @name,
        client = @client,
        color = @color,
        defaultHourlyRate = @defaultHourlyRate,
        active = @active
      WHERE id = @id
    `)
    stmt.run(project)
    return project
  })

  ipcMain.handle('db:projects:delete', (_event, id: string) => {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id)
    return true
  })

  // Time Entries
  ipcMain.handle('db:entries:getAll', () => {
    const entries = db.prepare('SELECT * FROM time_entries ORDER BY date DESC, createdAt DESC').all() as any[]

    // Load time intervals for each entry
    const intervalStmt = db.prepare('SELECT startTime, endTime FROM time_intervals WHERE entryId = ?')
    return entries.map(entry => ({
      ...entry,
      billable: Boolean(entry.billable),
      timeIntervals: intervalStmt.all(entry.id) as { startTime: string; endTime: string }[]
    }))
  })

  ipcMain.handle('db:entries:add', (_event, entry) => {
    const entryStmt = db.prepare(`
      INSERT INTO time_entries (id, date, projectId, description, hours, billable, hourlyRate, createdAt, updatedAt)
      VALUES (@id, @date, @projectId, @description, @hours, @billable, @hourlyRate, @createdAt, @updatedAt)
    `)
    entryStmt.run({
      ...entry,
      billable: entry.billable ? 1 : 0
    })

    // Insert time intervals
    if (entry.timeIntervals && entry.timeIntervals.length > 0) {
      const intervalStmt = db.prepare(`
        INSERT INTO time_intervals (entryId, startTime, endTime)
        VALUES (?, ?, ?)
      `)
      for (const interval of entry.timeIntervals) {
        intervalStmt.run(entry.id, interval.startTime, interval.endTime)
      }
    }

    return entry
  })

  ipcMain.handle('db:entries:update', (_event, entry) => {
    const stmt = db.prepare(`
      UPDATE time_entries SET
        date = @date,
        projectId = @projectId,
        description = @description,
        hours = @hours,
        billable = @billable,
        hourlyRate = @hourlyRate,
        updatedAt = @updatedAt
      WHERE id = @id
    `)
    stmt.run({
      ...entry,
      billable: entry.billable ? 1 : 0
    })

    // Update time intervals (delete and re-insert)
    db.prepare('DELETE FROM time_intervals WHERE entryId = ?').run(entry.id)
    if (entry.timeIntervals && entry.timeIntervals.length > 0) {
      const intervalStmt = db.prepare(`
        INSERT INTO time_intervals (entryId, startTime, endTime)
        VALUES (?, ?, ?)
      `)
      for (const interval of entry.timeIntervals) {
        intervalStmt.run(entry.id, interval.startTime, interval.endTime)
      }
    }

    return entry
  })

  ipcMain.handle('db:entries:delete', (_event, id: string) => {
    db.prepare('DELETE FROM time_intervals WHERE entryId = ?').run(id)
    db.prepare('DELETE FROM time_entries WHERE id = ?').run(id)
    return true
  })

  // Active Timer
  ipcMain.handle('db:timer:get', () => {
    const timer = db.prepare('SELECT * FROM active_timer WHERE id = 1').get() as any
    if (!timer || !timer.projectId) return null
    return {
      projectId: timer.projectId,
      startTime: timer.startTime,
      description: timer.description || '',
      warningShown: Boolean(timer.warningShown)
    }
  })

  ipcMain.handle('db:timer:save', (_event, timer) => {
    if (!timer) {
      db.prepare('DELETE FROM active_timer WHERE id = 1').run()
      return null
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO active_timer (id, projectId, startTime, description, warningShown)
      VALUES (1, @projectId, @startTime, @description, @warningShown)
    `)
    stmt.run({
      projectId: timer.projectId,
      startTime: timer.startTime,
      description: timer.description || '',
      warningShown: timer.warningShown ? 1 : 0
    })
    return timer
  })

  ipcMain.handle('db:timer:clear', () => {
    db.prepare('DELETE FROM active_timer WHERE id = 1').run()
    return true
  })

  // Migration from localStorage (called once from renderer)
  ipcMain.handle('db:migrate:fromLocalStorage', (_event, data: { projects: any[], entries: any[], timer: any }) => {
    const { projects, entries, timer } = data

    // Import projects
    const projectStmt = db.prepare(`
      INSERT OR IGNORE INTO projects (id, name, client, color, defaultHourlyRate, active, createdAt)
      VALUES (@id, @name, @client, @color, @defaultHourlyRate, @active, @createdAt)
    `)
    for (const project of projects) {
      projectStmt.run({
        ...project,
        active: project.active ? 1 : 0
      })
    }

    // Import entries
    const entryStmt = db.prepare(`
      INSERT OR IGNORE INTO time_entries (id, date, projectId, description, hours, billable, hourlyRate, createdAt, updatedAt)
      VALUES (@id, @date, @projectId, @description, @hours, @billable, @hourlyRate, @createdAt, @updatedAt)
    `)
    const intervalStmt = db.prepare(`
      INSERT INTO time_intervals (entryId, startTime, endTime)
      VALUES (?, ?, ?)
    `)
    for (const entry of entries) {
      entryStmt.run({
        ...entry,
        billable: entry.billable ? 1 : 0
      })
      if (entry.timeIntervals && entry.timeIntervals.length > 0) {
        for (const interval of entry.timeIntervals) {
          intervalStmt.run(entry.id, interval.startTime, interval.endTime)
        }
      }
    }

    // Import timer
    if (timer) {
      const timerStmt = db.prepare(`
        INSERT OR REPLACE INTO active_timer (id, projectId, startTime, description, warningShown)
        VALUES (1, @projectId, @startTime, @description, @warningShown)
      `)
      timerStmt.run({
        projectId: timer.projectId,
        startTime: timer.startTime,
        description: timer.description || '',
        warningShown: timer.warningShown ? 1 : 0
      })
    }

    return true
  })
}

app.whenReady().then(() => {
  initDatabase()
  setupIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
