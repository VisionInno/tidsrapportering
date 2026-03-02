# Tidsrapportering

Personal time tracking application built with React, TypeScript and Electron.

## IMPORTANT: Database Preservation

**NEVER delete or clear the SQLite database when deploying updates!**

The user's time data is stored in:
```
%APPDATA%/tidsrapportering/tidsrapportering.db
```

When making changes:
- Database schema changes must use migrations, not recreation
- Never delete `release/` folder contents that users have installed from
- Test thoroughly before rebuilding the installer

## Tech Stack

- **Desktop**: Electron
- **Database**: SQLite (better-sqlite3)
- **Framework**: React 18 + TypeScript
- **Build**: Vite + electron-builder
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Export**: jsPDF (PDF), PapaParse (CSV)

## Project Structure

```
├── electron/           # Electron main process
│   ├── main.ts         # Main process, IPC handlers
│   ├── preload.ts      # Context bridge for renderer
│   └── database/       # SQLite initialization and schema
├── src/
│   ├── api/            # IPC API types for renderer
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks (with IPC support)
│   ├── utils/          # Utilities (storage, export, time)
│   └── types/          # TypeScript type definitions
├── build/              # App icons
└── scripts/            # Build scripts (icon generation)
```

## Commands

```bash
npm run dev            # Start Vite dev server (web only)
npm run dev:electron   # Start Electron in dev mode
npm run build          # Build web version
npm run build:electron # Build for Electron
npm run dist:win       # Build Windows installer
npm run typecheck      # Run TypeScript type check
npm run lint           # Run ESLint
```

## Verification

Before committing changes, run:
```bash
npm run typecheck && npm run lint
```

## Key Files

| File | Purpose |
|------|---------|
| `electron/main.ts` | Electron main process, IPC handlers |
| `electron/database/schema.ts` | SQLite table definitions |
| `src/api/index.ts` | IPC API types |
| `src/hooks/useTimeEntries.ts` | Time entry state (IPC/localStorage) |
| `src/hooks/useProjects.ts` | Project state (IPC/localStorage) |
| `src/hooks/useActiveTimer.ts` | Timer with 8h warning, 12h auto-stop |
| `src/hooks/useMigration.ts` | localStorage → SQLite migration |

## Data Model

- **TimeEntry**: Time records with hours, project, description, time intervals
- **Project**: Categories with name, color, hourly rate
- **ActiveTimer**: Currently running timer state
- **TimeInterval**: Start/end times (HH:mm format), rounded to 15 min

## Database Schema

```sql
projects (id, name, client, color, defaultHourlyRate, active, createdAt)
time_entries (id, date, projectId, description, hours, billable, hourlyRate, createdAt, updatedAt)
time_intervals (id, entryId, startTime, endTime)
active_timer (id=1, projectId, startTime, description, warningShown)
```

## UI Structure

Two tabs for privacy:
- **Registrera tid**: QuickTimer, manual form, today's entries (no billing info visible)
- **Översikt**: Summary with billing amounts, charts, full entry list, export

## UI Language

The app is in Swedish. Key terms:
- Tidsrapportering = Time Reporting
- Registrera tid = Register Time
- Översikt = Overview
- Fakturerbar = Billable
- Timmar = Hours
- Projekt = Project

## Development Notes

- Path alias `@/*` maps to `src/*`
- Use Tailwind's `primary-*` color scale for brand colors
- Time intervals are rounded up to nearest 15 minutes
- App works both as Electron desktop app and PWA in browser
- First run in Electron migrates localStorage data to SQLite
- **F12** öppnar DevTools även i produktionsbygget (för felsökning)

## Changelog

### 2025-02-03: Migration & Export improvements

**Förbättrad migrationslogik** (`src/hooks/useMigration.ts`):
- Migrationen jämför nu localStorage vs SQLite och kör om localStorage har mer data
- Verifierar att SQLite faktiskt har datan innan localStorage rensas
- Detaljerad loggning med `[Migration]` prefix för felsökning
- Hanterar scenariot där användaren kört webversionen (`npm run dev`) efter tidigare migrering

**Separata fakturaunderlag per projekt** (`src/utils/export.ts`, `src/components/ExportButton.tsx`):
- Ny funktion `exportInvoicePDFPerProject()` skapar en PDF per projekt
- Checkbox i export-dialogen: "Separata dokument per projekt"
- Filnamn: `fakturaunderlag_ProjektNamn_YYYY-MM-DD_YYYY-MM-DD.pdf`

**DevTools i produktion** (`electron/main.ts`):
- F12 öppnar DevTools även i produktionsbygget

---

## TODO: Nästa session

**Prioritet 1: Verifiera datamigrering**
- [ ] Öppna appen och tryck F12 för att se konsol-loggar
- [ ] Kolla `[Migration]` loggar - migrerades datan?
- [ ] Om inte: undersök varför localStorage inte har data (kan vara att datan redan är i SQLite från tidigare)
- [ ] Verifiera att tidsregistreringar visas korrekt

**Prioritet 2: Testa ny export-funktion**
- [ ] Testa "Separata dokument per projekt" i export-dialogen
- [ ] Verifiera att varje projekt får sin egen PDF med korrekt innehåll

**Känd issue:**
- Datan visades inte vid senaste test - behöver undersökas med DevTools (F12)
