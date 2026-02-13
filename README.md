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
- `vite.config.ts`: Vite config with an automatic GitHub Pages base path (derived from repo name)
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

## Deploy to GitHub Pages (make it live)
This repo is configured to deploy automatically on pushes to `main`.

1. Push this repository to GitHub (replace placeholders):
   ```bash
   git remote add origin https://github.com/yourusername/project-name.git
   git push -u origin main
   ```
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as source.
4. Push new commits to `main`.
5. The workflow in `.github/workflows/deploy-pages.yml` builds and publishes `dist/`.

Your app will be live at:
- `https://yourusername.github.io/project-name`

### Base path note
`vite.config.ts` automatically sets `base` using the GitHub repository name in CI (`GITHUB_REPOSITORY`).
- For `yourusername/project-name`, it builds with `base: '/project-name/'`.
- For local dev, it falls back to `base: '/'`.

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
