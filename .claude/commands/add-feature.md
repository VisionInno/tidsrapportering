# Add Feature

Add a new feature to the time tracking application.

## Arguments
$ARGUMENTS contains the feature description.

## Steps

1. Understand the feature request
2. Identify which files need modification
3. Check existing types in `src/types/index.ts`
4. Implement the feature following existing patterns
5. Ensure Swedish UI text for any new labels
6. Run verification: `npm run typecheck && npm run lint`

## Patterns to Follow

- Use hooks for state management (`useTimeEntries`, `useProjects`)
- Store data in localStorage via `src/utils/storage.ts`
- Use Tailwind classes for styling
- Use `primary-*` color scale for brand consistency
- Date formatting should use `date-fns` with Swedish locale

## Example Features

- Add tags/categories to entries
- Weekly/monthly summary views
- Timer for tracking in real-time
- Import from CSV
- Dark mode support
