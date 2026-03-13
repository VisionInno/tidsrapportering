# Session Log - Tidsrapportering

## Session 2026-03-10
### Completed
- Fixed QuickTimer "Stoppa" button crash: missing `hourlyRate` in SQLite INSERT caused better-sqlite3 v12 `RangeError`
- Fixed `toISOString()` timezone bug in timer date → `toLocalDateStr()`
- Exported `toLocalDateStr` from time.ts
- Built new Windows installer, pushed to GitHub (ff33b8d)

### Current State
- All 104 tests passing, typecheck + lint clean
- New installer at `release\Tidsrapportering Setup 1.0.0.exe`

### Next Session: Start Here
- Install and verify fix in production Electron app
- Consider looking up project's `defaultHourlyRate` for timer entries (currently 0)

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

### Commits
- `dc92829` feat: Add test suite (104 tests) and fix timer/date bugs

### Current State
- 104/104 tester passerar
- Typecheck och lint godkända
- `npm run verify` körs före varje commit (typecheck + lint + test)
- Appen har versionsnummer i footern (build-tidsstämpel)
- Windows-installer byggd: `release\Tidsrapportering Setup 1.0.0.exe` (~101 MB)
- Branch `main`, ej pushad till GitHub ännu

### Next Session: Start Here
1. **Installera och testa** - Kör installern, verifiera:
   - Versionsnummer syns i footern
   - Snabbtimer sparar poster korrekt (testa kort timer <1 min)
   - Gammal data finns kvar efter uppdatering
   - Felmeddelande visas om sparning misslyckas
2. **Pusha till GitHub** - `git push`
3. Eventuellt: byta appikon
4. Eventuellt: städa bort temporära npm-paket från datamigrering
