# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working with Claude Code

- **Never stage or commit git changes** — only the user does that. Do not run `git add`, `git mv` (for staging), or `git commit`.

## Monorepo structure

This is a pnpm workspace with two packages:
- **Root** (`package.json`) — the Tauri desktop app
- **`docs/`** (`steam-game-idler-docs`) — a separate Fumadocs/Next.js documentation site deployed to Vercel; not bundled into the desktop app

The two packages are independent — changes to `src/` have no effect on `docs/` and vice versa. Run commands for the docs workspace with `pnpm --filter steam-game-idler-docs <cmd>` or use the root aliases below.

## Commands

```bash
# Desktop app — development
pnpm td              # Tauri dev (starts Next.js + Rust + hot reload)
pnpm dev             # Next.js dev server only (http://localhost:3000)

# Desktop app — build
pnpm tb              # Full Tauri build (runs `pnpm build` then Rust compile)
pnpm build           # Next.js static export to out/

# Desktop app — code quality
pnpm lint            # ESLint (zero warnings allowed — --max-warnings=0)
pnpm prettier        # Prettier format all files
pnpm typecheck       # tsc --noEmit

# Rust backend (run from src-tauri/)
cargo build
cargo check          # fast type-check without linking

# Docs site
pnpm dd              # docs dev server
pnpm build:docs      # docs production build (also runs next-sitemap postbuild)
pnpm lint:docs       # docs ESLint
```

There is **no test framework** — the project has no jest/vitest setup.

## Architecture

This is a **Tauri 2 desktop app** with a tri-layer architecture:

1. **Next.js frontend** (`src/`) — React 19 + TypeScript, compiled to a static export (`out/`). Communicates with Rust via `invoke()` from `@tauri-apps/api`.
2. **Rust backend** (`src-tauri/src/`) — ~50 Tauri commands. Handles process management, Steam API calls, settings persistence, encryption, and Discord RPC.
3. **C# SteamUtility** (`libs/`) — A compiled binary that the Rust layer spawns as a child process for Steam-specific operations (game idling window, Steam API interactions). Bundled into the Tauri app as an external binary resource.

### Frontend structure

```
src/
  features/          # One directory per feature (see below)
  pages/
    _app.tsx         # Root: wraps in ErrorBoundary → I18n → Theme → HeroUI providers
    index.tsx        # Single page app — all navigation is in-component state
  shared/
    components/      # Reusable UI (titlebar, sidebar, modals, etc.)
    hooks/           # Cross-feature hooks (init, settings, updates, Steam monitor, etc.)
    providers/       # ErrorBoundaryProvider, I18nProvider, ThemeProvider
    stores/          # Zustand stores (see below)
    types/           # TypeScript interfaces
    utils/           # Orchestration utilities (handle*.ts pattern)
  i18n/
    i18n.ts          # i18next config, 14 locales, fallback: en-US
    locales/         # JSON translation files per language
  styles/
```

**Features** (`src/features/`): `achievement-manager`, `achievement-unlocker`, `card-farming`, `custom-lists`, `games-list`, `inventory-manager`, `settings`. Each has `components/`, `hooks/`, `utils/`, and `index.ts`.

### State management

Zustand stores in `src/shared/stores/`:
- `stateStore` — general app state (active page, selected game, etc.)
- `userStore` — Steam user account data
- `idleStore` — which games are currently being idled
- `navigationStore` — UI navigation state
- `searchStore` — search input state
- `loaderStore` — loading indicators
- `updateStore` — app update state

### Tauri command pattern

Frontend calls are always via `invoke()`:
```ts
import { invoke } from '@tauri-apps/api/core'
const result = await invoke<ReturnType>('command_name', { arg1, arg2 })
```

All ~50 commands are registered in `src-tauri/src/lib.rs` via `.invoke_handler(tauri::generate_handler![...])`. Each command is implemented in a dedicated module (`idling.rs`, `achievement_manager.rs`, `trading_cards.rs`, etc.).

### Key Rust modules

| File | Responsibility |
|------|---------------|
| `lib.rs` | Command registration, plugin setup, app initialization |
| `idling.rs` | Spawns/kills SteamUtility processes, tracks PIDs |
| `trading_cards.rs` | Steam inventory scraping (cookie-based auth: sid, sls, sma) |
| `achievement_manager.rs` | Lock/unlock/toggle individual achievements |
| `settings.rs` | JSON-persisted user settings with typed defaults |
| `automation.rs` | Task scheduling (card farming → achievement unlock chains) |
| `process_handler.rs` | Process lifecycle, cleanup on app close |
| `crypto.rs` | API key encryption using the `KEY` env var |
| `game_data.rs` | Steam API calls for game metadata and stats |
| `user_data.rs` | Steam profile and library data |

### Styling

Tailwind CSS 4 with **6 themes**: `dark`, `blue`, `red`, `purple`, `gold`, `black`. Themes are CSS variable sets defined in `tailwind.config.mjs` and applied via `next-themes`. UI components come from **HeroUI** (`@heroui/react`).

### Path alias

`@/*` resolves to `src/*` — use `@/features/...`, `@/shared/...` etc.

### i18n

All user-visible strings must use `useTranslation()` from `react-i18next`. Translation keys live in `src/i18n/locales/en-US/translation.json`. Other locales are synced via Crowdin (`.github/workflows/crowdin.yml`). Do not add new keys to non-English locale files manually.

### Environment variables

Three env files: `.env` (shared), `.env.dev` (dev overrides), `.env.prod` (prod overrides). Key vars:
- `KEY` — AES encryption key used by `crypto.rs`
- `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER` — Pusher real-time integration
- `NEXT_PUBLIC_REMOTE_ENDPOINT` — remote auth endpoint
- `NEXT_PUBLIC_DEV_ACCOUNTS` — Steam IDs with dev-only features enabled

### Docs site (`docs/`)

See [`docs/CLAUDE.md`](docs/CLAUDE.md) for the full docs-site architecture, routing, content schema, design system, and component reference.

In brief: Fumadocs + Next.js 16 static export, content in `content/docs/` (MDX) and `content/changelog/` (MDX). Deployed to Vercel (`docs/vercel.json`). The docs site has its own `tailwind.config.mjs`, `tsconfig.json`, and `next.config.ts` — separate from the root app config.

## Commit messages

Follow conventional commits — `type(scope): summary` (present tense, lowercase, no period):

```
fix(tauri-idling): resolve process cleanup on game close
feat(card-farming): add per-game delay configuration
refactor(games-list): simplify thumbnail loading logic
```

**Types**: `fix` | `feat` | `chore` | `refactor` | `libs` | `docs` | `ci` | `config` | `build` | `perf`

**Common scopes**: `tauri-<module>` for Rust files, or the feature name (`card-farming`, `achievement-unlocker`, `inventory-manager`, `games-list`, `settings`, `ui`, `i18n`, `deps`, `components`, `hooks`, `utils`, `types`, `states`)
