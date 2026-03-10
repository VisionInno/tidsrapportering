# Session Log - Tidsrapportering

## Session 2026-03-03

### Completed

1. **Per-projekt PDF-export** - Faktureringsexport skapar nu alltid en separat PDF per projekt (inte en kombinerad). Tog bort checkbox-valet, det är nu standard.

2. **Månadsnavigering i Översikt** - Lade till pilar för att bläddra mellan månader i månadsvyn. Föregående månader visar hela månaden (1:a till sista), nuvarande månad visar 1:a till idag.

3. **Smart projektval** - Fixade bugg där tidsregistreringar hamnade på "Allmänt" trots att annat projekt var valt. Nu sparas senast använda projekt i localStorage och synkas med aktiv timer.

4. **Data import/backup** - Ny DataManager-komponent med export/import av backup-filer (JSON). Fungerar både i Electron (native dialoger) och webb.

5. **Electron preload-fix (KRITISK)** - Preload-scriptet kraschade med ESM-syntax i sandboxat läge. Skapade separat `tsconfig.preload.json` med CommonJS. **Detta var grundorsaken till att appen aldrig fungerade i produktionsläge** - all data hamnade i localStorage istället för SQLite.

6. **Datamigrering** - Extraherade 221 tidsposter och 4 projekt (Synergy, Tenant merger, Vattenfall, Allmänt) från Electrons LevelDB-localStorage och importerade till SQLite-databasen.

7. **Windows-installer** - Byggde och körde NSIS-installer via `npm run dist:win`.

8. **Gitignore** - Lade till `nul` (Windows-artefakt) i .gitignore.

### Commits
- `24eeda3` feat: Add month navigation, per-project export, smart project selection, data import/backup, and fix Electron preload
- `e74d041` chore: Add nul to .gitignore

### Current State
- Appen fungerar korrekt i Electron med SQLite-databas
- All historisk data (2026-01-07 till 2026-02-28) finns i databasen
- Windows-installer byggd i `release/`-mappen
- Branch `main` är uppdaterad och pushad till GitHub

### Next Session: Start Here
- Appen är fullt funktionell - inga kända buggar
- Eventuellt: byta appikon (användaren nämnde att gamla appen hade annan ikon)
- Eventuellt: städa bort temporära npm-paket (`sql.js`, `classic-level`, `level`) som installerades för datamigrering men inte behövs längre
- Eventuellt: ta bort filen `nul` från disk (den trackas inte av git men ligger kvar lokalt)

## Session 2026-03-10

### Completed

1. **Buggfix: Timer-poster sparades inte (KRITISK)** - `onEntryCreatedRef.current()` i `useActiveTimer.ts` anropades utan `await`. Om databas-sparningen misslyckades försvann felet tyst och timern rensades ändå. Fix: `await` + `try/catch` + timern behålls vid fel.

2. **Buggfix: 0-minutersavrundning** - `roundUpTo15Minutes(0) = 0` gjorde att timer-poster med samma minut-start/slut fick 0 timmar. Fix: `Math.max(calculatedHours, 0.25)` i `createEntryAndClear`.

3. **Buggfix: Tidszon-bugg i datumintervall** - `getDateRangeForViewMode` använde `toISOString()` som konverterar till UTC, vilket gav fel datum vid midnatt i CET (t.ex. 1 jan blev 31 dec). Fix: ny `toLocalDateStr()`-hjälpfunktion.

4. **Versionsnummer** - Build-tidsstämpel via Vite `define` (`__BUILD_TIMESTAMP__`), visas i footern.

5. **Testsvit med 104 tester (Vitest)** - Komplett testinfrastruktur:
   - `time.test.ts` (58 tester) - Avrundning, intervallberäkning, parsning
   - `storage.test.ts` (20 tester) - CRUD, dataintegritet, volymstest med 221 poster
   - `export-calculations.test.ts` (5 tester) - Faktureringsavrundning
   - `useTimeEntries.test.ts` (11 tester) - Alla registreringssätt
   - `useActiveTimer.test.ts` (10 tester) - Timer + regressionstester

6. **Exporterade `calculateRoundedExportTotals`** i `export.ts` för testning.

7. **Nytt verifieringskommando** - `npm run verify` kör typecheck + lint + test.

### Current State
- 104/104 tester passerar
- Typecheck och lint godkända
- `npm run verify` körs före varje commit
- Appen har versionsnummer i footern

### Next Session: Start Here
- Bygg ny Windows-installer (`npm run dist:win`) och installera
- Verifiera att bugfixarna fungerar i Electron-produktion
- Eventuellt: byta appikon
