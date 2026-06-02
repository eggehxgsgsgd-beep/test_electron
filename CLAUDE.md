# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

FocusDo is an Electron desktop app for tasks, pomodoro focus sessions, and insights/stats. Built with electron-vite + React. UI strings are Chinese. There is no test suite.

## Commands

- `npm run dev` — start electron-vite in dev mode (hot reload; renderer DevTools open detached automatically when unpackaged).
- `npm run build` — typecheck (`tsc --noEmit`) **and** bundle all three Electron targets. This is the closest thing to CI's correctness gate; run it after any change. A type error fails the build.
- `npm run dist:win` / `dist:mac` / `dist:linux` — build then package an installer via electron-builder into `release/` (`--publish never`).
- `node scripts/compress-assets.mjs` — one-shot re-export of images from the gitignored `src/renderer/src/assets/source/` masters into checked-in WebP/PNG variants. Run only when source art changes.

Tagging a `v*` commit (or running the `Release` workflow_dispatch) triggers `.github/workflows/release.yml`, which builds the matrix on Windows/macOS/Linux and publishes a GitHub Release.

## Architecture

Standard Electron three-process split, with electron-vite building each into `out/{main,preload,renderer}`:

- **Main** (`src/main/`) — Node process. `index.ts` owns the BrowserWindow, tray, notifications, single-instance lock, and registers all `focusdo:*` IPC handlers. `todoStore.ts` is the entire data layer.
- **Preload** (`src/preload/index.ts`) — exposes a typed `window.focusDo` API over `contextBridge` (contextIsolation on, nodeIntegration off). Each method is a thin `ipcRenderer.invoke` of a `focusdo:*` channel. Built as CJS.
- **Renderer** (`src/renderer/src/`) — React app in `.jsx` files (no JSX build step beyond Vite's react plugin). Entry `focusdo-entry.jsx` → `focusdo-app.jsx`.
- **Shared** (`src/shared/todo.ts`) — the single source of truth for all IPC types: `FocusDoState`, the input types, and the `FocusDoApi` contract. Main, preload, and renderer all import from here. **Change a data shape here first**, then update the store, preload, and renderer together.

### IPC / state model — read this before touching data flow

Every mutating IPC handler returns the **complete fresh `FocusDoState`** (tasks + insights + settings + focusSessions), not a delta. The renderer calls `window.focusDo.X(...)` and replaces its whole state with the result (see the `applyState` pattern in `focusdo-app.jsx`). There is no incremental sync — don't add one without reason.

### Persistence (`todoStore.ts`)

- Storage is **sql.js** (SQLite compiled to WASM, fully in-memory) persisted by serializing the whole DB to `focusdo.sqlite` in Electron's `userData` dir on every mutation. Reads are synchronous (`queryRows`/`scalar`); writes go through `persistDb`.
- sql.js has no on-disk concurrency control. Two protections exist and must be preserved: (1) the single-instance lock in `index.ts` stops two processes racing the same file; (2) `writeChain`, a promise-chain mutex in the store, serializes async `writeFile`s so concurrent mutations can't interleave a truncate+write.
- The `migrate()` method runs `CREATE TABLE IF NOT EXISTS` on every open — it's the schema definition. There's a separate forward-migration concern: settings JSON is read defensively (`readSettings` merges over `DEFAULT_SETTINGS`, `migrateFocusScene` coerces dropped scene names). Follow that pattern when retiring a field rather than hard-failing on old data.
- **In-flight focus recovery**: the renderer persists a snapshot of the running pomodoro via `setInFlightFocus`; on next `load()`, `recoverInFlightFocus` turns an orphaned snapshot (from a crash/force-quit) into an `abandoned` focus_session, unless it's stale (>4h) or the clock jumped. `exportSnapshot` deliberately skips this recovery.
- Atomic counter updates (e.g. `incrementPomodoroCount`) are done as a single SQL `UPDATE ... = x + 1`, not read-modify-write, to avoid losing concurrent increments.

### Renderer structure & conventions

- `focusdo-app.jsx` (the `App` component) holds all state and the pomodoro timer engine, and owns every `window.focusDo` call. The other three modules are presentational and imported by it:
  - `fd-ui.jsx` — themes (`FD_THEMES`), icons, task list / focus / archive views, lottie + scene loading.
  - `fd-panels.jsx` — task detail panel + settings modal.
  - `fd-insights.jsx` — insights list and editor.
- **Styling is all inline `style={{}}` objects** driven by the active theme object — there is no CSS framework or stylesheet. Match this; pull colors from the passed `theme`.
- **Two settings vocabularies exist.** The backend (`FocusSettings` in `todo.ts`) uses `theme`/`focusMinutes`; the renderer uses `themeKey`/`focusMin`. `toUiState` maps backend→UI (with legacy-key fallbacks) and `settingsForBackend` maps UI→backend. Keep both sides and both mappers in sync when adding a setting.
- **Backend `Task.completed` ⇄ UI `task.done`**: `toUiTask` bridges this. `planDate` of today's key is normalized to the literal string `'today'` for the UI.
- Heavy assets are code-split deliberately: only the `forest` scene and non-confetti lottie are in the main bundle; other scenes (`import('./assets/scene-*.webp')`) and confetti load on demand. Preserve lazy-loading when adding large assets.
- `__APP_VERSION__` is a Vite `define` injected from `package.json` version.

## Conventions

- ESM throughout (`"type": "module"`); main/preload are TypeScript with `strict` on, renderer is plain JSX.
- Tags are a closed set defined in `DEFAULT_SETTINGS`; the store validates task/insight tags against the current settings tag list and cascades positional tag renames onto existing rows (`updateSettings`).
- Comments in this codebase explain *why* (race conditions, recovery edge cases, migration intent). When adding non-obvious logic, document the reasoning the same way.
