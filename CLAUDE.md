# CLAUDE.md

Steam Game Idler (SGI) is a desktop Steam automation tool: trading card farming, achievement
unlocking/management, playtime idling, free-game claiming and inventory management. It's live and
publicly used, so every change has to work in a real installed/portable release, not just in dev.

## Strict rule

Coding agents must **never act on the original repository (`zevnda/steam-game-idler`) on
GitHub** - no commits, pushes, branches, pull requests, reviews, issues, discussions, comments,
reactions, labels, releases or workflow runs. Any code written by a coding agent must be reviewed
by a human before it is committed or merged.

## Stack and layout

- `src-tauri/` - Rust/Tauri backend, one module per feature area plus cross-cutting root files
  (`logging.rs`, `error.rs`, `platform.rs`, `updater.rs`, ...).
- `src/` - Next.js/React frontend (static export, HeroUI v3, zustand). `src/pages/dashboard/*` are
  routed pages, `src/features/*` hold per-feature components/hooks, `src/shared/` holds
  cross-feature code, `src/i18n/` holds translations.
- `libs/SteamUtility/` - C# helper that talks to Steam: one-shot CLI mode (Steamworks.NET, needs a
  local Steam client, Windows-only) and a persistent agent daemon (SteamKit2, no client needed).
- `docs/` - separate Next.js/Fumadocs docs + marketing site, deployed independently to Vercel.

Platforms: Windows (CLI + agent sign-in) and Linux (agent mode only).

## Commands

- `pnpm td` - run the app (`tauri dev`, builds SteamUtility first if needed)
- `pnpm typecheck`, `pnpm lint`, `pnpm i18n:check` - frontend checks
- In `src-tauri/`: `cargo fmt`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`

**Read `CONTRIBUTING.md`** - the project's contribution guidelines (commit message format,
types/scopes, versioning) apply to agent-written changes as well.

@.claude/PROJECT_OUTLINE.md
