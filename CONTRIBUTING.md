# Contribution Guidelines

## Commit Message Format

```
<type>(<scope>): <short summary>
  │       │             │
  │       │             └─⫸ Summary in present tense, not capitalized, no period at the end
  │       │
  │       └─⫸ Commit Scope: tauri|steam-agent|steam-utility|games-list|card-farming|
  │                          achievement-unlocker|achievement-manager|inventory-manager|
  │                          auto-idle|free-games|idling|favorites|account-switcher|sign-in|
  │                          settings|customization|pro|automation|dashboard|states|
  │                          components|hooks|ui|utils|types|cache|updater|i18n|deps|docs|readme
  │
  └─⫸ Commit Type: fix|feat|chore|refactor|libs|docs|ci|config|build|perf
```
The `type` and `summary` fields are mandatory, the `scope` field is optional

### Type
Must be one of the following:

| Type         | Description                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| **fix**      | A bug fix                                                                                                       |
| **feat**     | A new feature                                                                                                   |
| **chore**    | Grunt tasks, no production code change (e.g.: formatting fixes, commenting code)                                |
| **refactor** | A code change that neither fixes a bug nor adds a feature                                                       |
| **libs**     | Changes to `/libs/SteamUtility` (the C# helper that talks to Steam)                                             |
| **docs**     | Documentation only changes (e.g.: changes to `/docs` .mdx files, README.md, CONTRIBUTING.md, changelog entries) |
| **ci**       | Changes to our CI configuration files and scripts such as GitHub Actions                                        |
| **config**   | Changes to configuration files (e.g.: tauri.conf.json, next.config.js, tsconfig.json)                           |
| **build**    | Changes that affect the build system or external dependencies                                                   |
| **perf**     | A code change that improves performance                                                                         |

### Scope
Common scopes for this project include:

| Scope                    | Description                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **tauri**                | Cross-cutting Rust/Tauri backend changes (e.g.: `logging.rs`, `error.rs`, `platform.rs`, `credential_store.rs`) |
| **steam-agent**          | Changes to `src-tauri/src/steam_agent` - the daemon/IPC layer for agent-mode sign-in                            |
| **steam-utility**        | Changes to `libs/SteamUtility` internals themselves, as opposed to how the Rust side calls into it              |
| **games-list**           | Changes to `src/features/games-list` and `src-tauri/src/games`                                                  |
| **card-farming**         | Changes to `src/features/card-farming` and `src-tauri/src/card_farming`                                         |
| **achievement-unlocker** | Changes to `src/features/achievement-unlocker` and `src-tauri/src/achievement_unlocker`                         |
| **achievement-manager**  | Changes to `src/features/achievement-manager` and `src-tauri/src/achievements`                                  |
| **inventory-manager**    | Changes to `src/features/inventory-manager` and `src-tauri/src/inventory`                                       |
| **auto-idle**            | Changes to `src/features/auto-idle` and `src-tauri/src/auto_idle`                                               |
| **free-games**           | Changes to `src/features/free-games` and `src-tauri/src/free_games`                                             |
| **idling**               | Changes to `src/features/idling` and `src-tauri/src/idling` (including the `IdleClaimsRegistry`)                |
| **favorites**            | Changes to `src/features/favorites` and `src-tauri/src/favorites`                                               |
| **account-switcher**     | Changes to `src/features/account-switcher` and multi-account session/store logic                                |
| **sign-in**              | Changes to `src/features/agent-sign-in`, `local-sign-in`, `sign-in-landing`, or `src-tauri/src/local_steam`     |
| **automation**           | Changes that affect multiple automation features at once (e.g.: idling claims, shared concurrency logic)        |
| **settings**             | Changes to `src/features/settings` and `src-tauri/src/settings`                                                 |
| **customization**        | Changes to themes, fonts, or `src-tauri/src/customization`                                                      |
| **pro**                  | Changes to subscription/tier gating, `GoProModal`, or `src-tauri/src/subscription`                              |
| **dashboard**            | Changes to `DashboardShell`, sidebar, or dashboard routing shell                                                |
| **states**               | Changes to Next.js frontend global state (`src/shared/stores`, zustand stores)                                  |
| **components**           | Changes to other components in `src/shared/components` that are not already listed                              |
| **hooks**                | Changes to other hooks in `src/shared/hooks` that are not already listed                                        |
| **ui**                   | Non-specific user interface changes (e.g.: tailwind classes, button labels)                                     |
| **utils**                | Utility functions and helper methods (`src/shared/utils`, `fs_utils.rs`, `async_utils.rs`)                      |
| **types**                | TypeScript/Rust type definitions and interfaces                                                                 |
| **cache**                | Application data storage (cache dir, settings persistence, `legacy_migration.rs`)                               |
| **updater**              | Changes to the auto-update path (`updater.rs`, `tauri.conf.json` updater config, release signing)               |
| **i18n**                 | Internationalization and localization changes (`en-US.json`, `src/i18n`)                                        |
| **deps**                 | Updates to dependencies (Rust, Tauri, pnpm, .NET)                                                               |
| **docs**                 | Changes scoped to the `/docs` marketing + documentation site                                                    |
| **readme**               | Updates to the README file                                                                                      |

### Examples
```
fix(steam-agent): resolve QR login session timeout

fix(games-list): resolve issue with game thumbnails not loading

feat(account-switcher): add support for up to 10 concurrent agent-mode accounts

feat(ui): implement dark mode support

perf(achievement-manager): optimize loading of achievement data

docs: update installation instructions

build(deps): update tauri shell plugin to latest

libs(steam-utility): fix daemon reconnect handling
```

## Versioning
When to bump version numbers:

| Type  | Description                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------ |
| Major | Breaking changes (steam API changes, UI overhauls, removed functionality)                        |
| Minor | New major features or functionality added or removed in a backwards compatible manner            |
| Patch | Backwards compatible bug fixes, performance improvements, UI adjustments, and new minor features |
