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
npm run test           # Run all tests (104 tests)
npm run test:watch     # Run tests in watch mode
npm run verify         # typecheck + lint + test (all-in-one)
```

## Verification

Before committing changes, ALWAYS run:
```bash
npm run verify
```

## Tests

Tests use Vitest and are located in `__tests__/` folders next to the code they test:

| Test file | What it tests |
|-----------|--------------|
| `src/utils/__tests__/time.test.ts` | Time calculations, rounding, parsing (58 tests) |
| `src/utils/__tests__/storage.test.ts` | Data integrity, CRUD, cleanup (20 tests) |
| `src/utils/__tests__/export-calculations.test.ts` | Billing rounding logic (5 tests) |
| `src/hooks/__tests__/useTimeEntries.test.ts` | All registration methods (11 tests) |
| `src/hooks/__tests__/useActiveTimer.test.ts` | Timer logic + regression tests (10 tests) |

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

### 2026-03-03: Major fixes and features

**Electron preload-fix (KRITISK)**:
- Preload-scriptet kompilerades som ESM men Electron kräver CommonJS i sandbox
- Separat `tsconfig.preload.json` med `module: "CommonJS"`
- **Detta var grundorsaken till att appen aldrig fungerade i produktionsläge**

**Per-projekt PDF-export**:
- Faktureringsexport skapar alltid en separat PDF per projekt (inget val)
- Tog bort den kombinerade `exportInvoicePDF`-funktionen

**Månadsnavigering**:
- Pilar för att bläddra mellan månader i översiktens månadsvy
- `getDateRangeForViewMode` tar nu `monthOffset`-parameter

**Smart projektval**:
- Sparar senast använda projekt i localStorage
- Synkar med aktiv timer via `activeTimerProjectId`-prop

**Data import/backup**:
- DataManager-komponent med export/import av JSON-backuper
- IPC-handlers `db:backup:export` och `db:backup:import` i main.ts

**Datamigrering**:
- 221 poster och 4 projekt migrerade från LevelDB till SQLite
- Data: 2026-01-07 till 2026-02-28
