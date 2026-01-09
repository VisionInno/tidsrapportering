# Tidsrapportering

En Windows desktop-app för personlig tidsspårning. Logga arbetstid med tidsintervall, hantera projekt och exportera fakturaunderlag.

![Electron](https://img.shields.io/badge/Electron-39-blue)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![SQLite](https://img.shields.io/badge/SQLite-3-green)

## Funktioner

### Tidsregistrering
- **Snabbtimer** - Starta/stoppa timer för de mest använda projekten
- **Tidsintervall** - Logga exakta tider (t.ex. 08:00-12:00, 13:00-17:00)
- **Avrundning** - Minuter summeras per projekt och dag, avrundas uppåt till närmaste kvart
- **Dagens översikt** - Se alla registreringar för dagen i realtid

### Projekthantering
- Skapa projekt med namn, färg och timpris
- Färgkodning för enkel identifiering
- Standardtimpris för fakturering

### Översikt & Redigering
- **Statistik** - Diagram över veckans timmar och projektfördelning
- **Redigera** - Ändra datum, tid, projekt och beskrivning på befintliga poster
- **Lägg till** - Skapa nya poster direkt i översiktslistan

### Export
- **CSV** - För vidare bearbetning i Excel
- **PDF Tidsrapport** - Detaljerad lista med alla poster
- **Fakturaunderlag** - Per projekt med daglig nedbrytning och summering
- **Periodval** - Senaste 7 dagar, denna månad, föregående månad eller anpassad period

### Teknik
- **Desktop-app** - Native Windows-app med Electron
- **Lokal databas** - SQLite för pålitlig datalagring
- **Offline** - Fungerar utan internetanslutning

## Installation

### Ladda ner installer
Hämta senaste `Tidsrapportering Setup 1.0.0.exe` från [Releases](https://github.com/VisionInno/tidsrapportering/releases).

### Eller bygg själv

```bash
git clone https://github.com/VisionInno/tidsrapportering.git
cd tidsrapportering
npm install
npm run dist:win
```

Installern skapas i `release/`-mappen.

## Utveckling

```bash
npm run dev              # Starta webbversion (localhost:5173)
npm run dev:electron     # Starta Electron i dev-läge
npm run build:electron   # Bygg för Electron
npm run electron:start   # Starta byggd Electron-app
npm run dist:win         # Bygg Windows-installer
npm run typecheck        # Kontrollera TypeScript
npm run lint             # Kör ESLint
```

## Teknikstack

| Komponent | Teknologi |
|-----------|-----------|
| Desktop | Electron 39 |
| Frontend | React 18 + TypeScript |
| Databas | SQLite (better-sqlite3) |
| Styling | Tailwind CSS |
| Diagram | Recharts |
| Export | jsPDF, PapaParse |
| Byggverktyg | Vite + electron-builder |

## Datalagring

Data sparas lokalt i:
```
%APPDATA%/tidsrapportering/tidsrapportering.db
```

Databasen bevaras vid uppdateringar.

## Licens

MIT
