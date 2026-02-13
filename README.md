# USMLE Miss Logger

A lightweight single-page app for tracking missed USMLE-style questions, identifying patterns, and reviewing the **Top 10 weak tags**.

## Stack
- React + TypeScript + Vite
- Browser `localStorage` persistence (no backend)
- GitHub Pages deployment via GitHub Actions

## Project structure
- `src/App.tsx`: Main app UI and logic
  - Add/Edit miss form
  - Filters and search
  - Entries table and actions
  - Import/Export/Clear controls
  - Top 10 weak tags analytics panel
- `src/styles.css`: Minimal responsive card/table styling
- `vite.config.ts`: Vite config with GitHub Pages base path (`/USMLE/`)
- `.github/workflows/deploy-pages.yml`: CI/CD workflow for GitHub Pages

## Run locally
```bash
npm install
npm run dev
```
Then open the local Vite URL (typically `http://localhost:5173`).

## Build
```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages
This repo is configured to deploy automatically on pushes to `main`.

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions** as source.
3. Push to `main`.
4. The workflow in `.github/workflows/deploy-pages.yml` builds and publishes `dist/`.

### Base path note
`vite.config.ts` sets:
```ts
base: '/USMLE/'
```
If your repository name changes, update this value accordingly.

## Data model
Each entry is stored as JSON with this shape:

```ts
{
  id: string,
  createdAt: string, // ISO timestamp
  topic: string,
  concept: string,
  whyMissed: 'knowledge gap' | 'misread' | 'changed answer' | 'time pressure' | 'calculation' | 'other',
  whyNotes?: string,
  rule: string,
  tags: string[] // normalized lowercase + trimmed
}
```

## Import / Export backup workflow
- **Export JSON**: downloads all entries to your machine.
- **Import JSON**: restores entries from an export file.
- **Clear all**: deletes all local entries after confirmation.

Because data lives in browser `localStorage`, entries are specific to that browser/profile unless exported and imported elsewhere.
