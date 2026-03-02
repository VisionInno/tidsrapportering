import { useState, useRef } from 'react'
import { isElectron, getAPI } from '@/api'
import * as storage from '@/utils/storage'

interface DataManagerProps {
  onDataImported: () => void
}

export function DataManager({ onDataImported }: DataManagerProps) {
  const [status, setStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    if (isElectron()) {
      // Electron: native save dialog
      const success = await getAPI().backup.export()
      if (success) {
        setStatus('Backup exporterad!')
      }
    } else {
      // Web: download JSON
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        projects: storage.getProjects(),
        entries: storage.getTimeEntries(),
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tidsrapportering_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setStatus('Backup exporterad!')
    }
    setTimeout(() => setStatus(null), 3000)
  }

  const handleImport = async () => {
    if (isElectron()) {
      // Electron: native file dialog
      const result = await getAPI().backup.import()
      if (result.success) {
        setStatus(`Importerade ${result.projectsImported} projekt och ${result.entriesImported} tidsposter!`)
        onDataImported()
      } else if (result.reason !== 'cancelled') {
        setStatus(`Fel: ${result.reason}`)
      }
    } else {
      // Web: file input
      fileInputRef.current?.click()
    }
    setTimeout(() => setStatus(null), 5000)
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string)
        const importedProjects = backup.projects || []
        const importedEntries = backup.entries || []

        // Merge into localStorage (web mode)
        const existingProjects = storage.getProjects()
        const existingProjectIds = new Set(existingProjects.map(p => p.id))
        let projectsAdded = 0
        for (const project of importedProjects) {
          if (!existingProjectIds.has(project.id)) {
            existingProjects.push(project)
            projectsAdded++
          }
        }
        storage.saveProjects(existingProjects)

        const existingEntries = storage.getTimeEntries()
        const existingEntryIds = new Set(existingEntries.map(e => e.id))
        let entriesAdded = 0
        for (const entry of importedEntries) {
          if (!existingEntryIds.has(entry.id)) {
            existingEntries.push(entry)
            entriesAdded++
          }
        }
        storage.saveTimeEntries(existingEntries)

        setStatus(`Importerade ${projectsAdded} projekt och ${entriesAdded} tidsposter!`)
        onDataImported()
      } catch {
        setStatus('Fel: Kunde inte läsa filen')
      }
      setTimeout(() => setStatus(null), 5000)
    }
    reader.readAsText(file)
    e.target.value = '' // Reset for re-upload
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleImport}
        className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
        title="Importera backup från JSON-fil"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Importera
      </button>
      <button
        onClick={handleExport}
        className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
        title="Exportera all data som backup"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Backup
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelected}
        className="hidden"
      />
      {status && (
        <span className={`text-sm ${status.startsWith('Fel') ? 'text-red-600' : 'text-green-600'}`}>
          {status}
        </span>
      )}
    </div>
  )
}
