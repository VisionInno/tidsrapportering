# Tidsrapportering

En enkel och smidig app för personlig tidsspårning. Logga arbetstid, hantera projekt och exportera rapporter.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-3-teal)

## Funktioner

- **Tidsloggning** - Registrera timmar med datum, projekt och beskrivning
- **Fakturering** - Markera tid som fakturerbar med valfritt timpris
- **Projekthantering** - Skapa och organisera projekt med färgkodning
- **Statistik** - Diagram över veckans timmar och projektfördelning
- **Export** - Ladda ner rapporter som CSV (Excel) eller PDF
- **Lokal lagring** - All data sparas i webbläsaren, inget konto krävs

## Kom igång

### Installation

```bash
git clone https://github.com/VisionInno/tidsrapportering.git
cd tidsrapportering
npm install
```

### Starta appen

```bash
npm run dev
```

Öppna http://localhost:5173 i webbläsaren.

### Bygg för produktion

```bash
npm run build
```

## Användning

1. **Logga tid** - Fyll i formuläret till vänster med datum, projekt, beskrivning och timmar
2. **Se statistik** - Överblick visas till höger med diagram och summering
3. **Hantera projekt** - Klicka på "Projekt" för att skapa nya eller redigera
4. **Exportera** - Klicka på "Exportera" för att ladda ner rapport

## Teknikstack

| Komponent | Teknologi |
|-----------|-----------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Diagram | Recharts |
| Export | jsPDF, PapaParse |
| Byggverktyg | Vite |
| Lagring | localStorage |

## Utveckling

```bash
npm run dev        # Starta utvecklingsserver
npm run typecheck  # Kontrollera TypeScript
npm run lint       # Kör ESLint
npm run format     # Formatera kod med Prettier
```

## Licens

MIT
