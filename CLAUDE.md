# Tidsrapportering

Personal time tracking application built with React and TypeScript.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Export**: jsPDF (PDF), PapaParse (CSV)
- **Storage**: localStorage (local-first, no backend)

## Project Structure

```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── utils/          # Utilities (storage, export)
├── types/          # TypeScript type definitions
└── pages/          # Page components (future)
```

## Commands

```bash
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type check
npm run format     # Format code with Prettier
```

## Verification

Before committing changes, run:
```bash
npm run typecheck && npm run lint
```

## Key Files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All TypeScript interfaces |
| `src/utils/storage.ts` | localStorage operations |
| `src/utils/export.ts` | CSV/PDF export logic |
| `src/hooks/useTimeEntries.ts` | Time entry state management |
| `src/hooks/useProjects.ts` | Project state management |

## Data Model

- **TimeEntry**: Individual time records with hours, project, description
- **Project**: Categories for organizing time entries
- Data persists in localStorage under keys:
  - `tidsrapportering_entries`
  - `tidsrapportering_projects`

## UI Language

The app is in Swedish. Key terms:
- Tidsrapportering = Time Reporting
- Fakturerbar = Billable
- Timmar = Hours
- Projekt = Project
- Exportera = Export

## Development Notes

- Path alias `@/*` maps to `src/*`
- Use Tailwind's `primary-*` color scale for brand colors
- All forms include Swedish labels and placeholders
- Charts use date-fns with Swedish locale (`sv`)
