# CLAUDE.md

Steam Game Idler (SGI) is a Windows desktop Steam automation tool — trading card farming,
achievement unlocking/management, playtime idling, free-game claiming, and inventory management —
built as a Tauri (Rust) + Next.js (React) app, with a companion C# helper (`libs/SteamUtility/`)
that talks to Steam. It's live and publicly used (~1,850 daily active users), so every change needs
to actually work in a public release, not just in a dev environment.

This file describes the architecture as it stands after a ground-up rewrite (developed on a
long-lived branch and squash-merged into `main` for the v6.0.0 release). The rewrite replaced a
messier predecessor; there is no separate "old" codebase to compare against anymore.

## Repo layout

- **`src-tauri/`** — Rust/Tauri backend. One module per feature area (`achievement_unlocker/`,
  `achievements/`, `auto_idle/`, `card_farming/`, `customization/`, `debug/`, `favorites/`,
  `free_games/`, `games/`, `idling/`, `inventory/`, `local_steam/`, `max_playtime/`, `settings/`,
  `steam_agent/`, `steam_community/`), plus cross-cutting root files (`logging.rs`, `error.rs`,
  `credential_store.rs`, `platform.rs`, `subscription.rs`, `updater.rs`, `tray.rs`, `zoom.rs`).
- **`src/`** — Next.js/React frontend (static export). `src/pages/dashboard/*` are real routed
  pages; `src/features/*` hold each feature's components/hooks; `src/shared/` holds cross-feature
  components, hooks, stores (zustand), theme system, and utils; `src/i18n/` holds translations.
- **`libs/SteamUtility/`** — a separate C# project (folded in from a former git submodule,
  relicensed MIT → Elastic 2.0) that talks to Steam on the app's behalf. See "Agent mode vs. CLI
  mode" below. Its `Core/Backends/Cli/Daemon` separation, typed exceptions, structured logging, and
  one consistent JSON envelope are the quality bar for the Rust/TS code that calls into it.
- **`docs/`** — an independent Next.js/Fumadocs marketing + documentation site, deployed
  separately to Vercel. See `docs/CLAUDE.md` for its own conventions; changes there don't affect
  the desktop app.

## Non-negotiable requirements (both Rust and Next.js sides)

- Idiomatic Rust/Tauri and React/Next.js — not generic patterns forced onto either.
- Clean, professional code — no spaghetti, no copy-pasted logic.
- Proper error handling and structured logging throughout.
- Easy to maintain and future-proof.

## Code comments (comment deliberately, this project relies on it)

This overrides the general default of minimal comments — for this project, comment deliberately.
Comments exist so contributors (and Claude) can understand the codebase without reconstructing
reasoning from scratch — not to restate what the code already says.

**Comment when:** it's the *why* not the *what*; something is deliberately left undone (so it
doesn't read as an oversight); a cross-file reference isn't obvious from name/import alone; a
non-obvious Steam-specific/platform-specific edge case is being handled; work is intentionally
deferred (use `TODO`/`FIXME`); or anywhere else it'd save real investigation time.

**Keep it disciplined:** don't comment the obvious, don't narrate every line, don't leave stale
comments. Wrap long comments across multiple lines rather than one long line.

**General working principle:** existing messy-looking code sometimes encodes hard-won edge-case
handling, not just sloppiness. Understand *why* code does what it does before rewriting it, and
verify replacements against real behavior rather than assuming cleaner-looking code is better.

## Logging & error resilience

One shared logging system on both sides — `src-tauri/src/logging.rs`'s `tracing` setup (`info`
level by default in **both** dev and release; override via `STEAM_GAME_IDLER_LOG=warn` or any
`EnvFilter` string) and `src/shared/utils/invoke.ts` + `frontendLogging.ts` on the frontend — so a
user's log file (Debug tab → reveal in Explorer) is actually useful for a GitHub issue report from
the live user base, not just useful in local dev.

- **Per-item/recoverable error inside a loop** (one game's fetch failing, one poll flaking) →
  `tracing::warn!` and continue the loop with the next item. Never let one recoverable failure
  abort a whole batch the user could otherwise finish. Reserve a hard abort for genuinely
  unrecoverable conditions (the SteamUtility connection dying, a required cache file unreadable).
- **Log real lifecycle events, not just errors** (`tracing::info!` / `logFrontendInfo`) — a game
  starting/finishing, an achievement unlocking, a claim's outcome — with concrete names/IDs in the
  message, matching every automation manager's existing convention
  (`achievement_unlocker::manager`, `card_farming::manager`, `idling::claims`, `auto_idle`,
  `local_steam::free_game_claim`, `free_games::commands`).
- **No command ships silent.** A command that mutates something real (writes a file, calls an
  external API, changes app state) gets `tracing::info!` on success and `warn!`/`error!` on
  failure by default; a pure getter doesn't need this. A frontend-driven flow with no backing Rust
  manager loop (a settings save, a sign-in, a one-shot user action) gets one
  `logFrontendInfo`/`logFrontendWarn` breadcrumb per action, not per field. Where a command already
  follows the one-command-surface branch-on-sign-in-mode pattern (see below), log once at that
  surface, not duplicated per mode — a per-item loop *inside* a mode-specific backend still gets
  its own per-item warning, since that's finer-grained detail the surface log doesn't carry.
- **A new `AppError` code representing a real, user-actionable failure** gets evaluated for a
  `src/shared/utils/errorDocsHref.ts` entry + `showErrorToast` at its toast call site (a "Learn
  more" link) — only with a real, already-published docs URL, never invented.
- **Redaction happens once, at the boundary**: `log_frontend_event` (`src-tauri/src/logging.rs`)
  redacts known-sensitive field names (password/cookies/`sid`/`sls`/`sma`/tokens/secrets/
  credentials) and masks the embedded Steam Web API key if it appears in free text. Don't add
  per-call-site masking elsewhere — backend `tracing::` call sites are developer-written and
  already don't log raw secrets; the boundary that needs guarding is arbitrary frontend data.

## Working with Claude Code

- **Never commit or push any files, and never offer to.** Committing is purely a user-done action
  in this project — end a task by stating what changed and leave it uncommitted, with no "let me
  know if you'd like me to commit this" or similar. Applies no matter how routine or low-risk the
  change looks; the user initiates commits themselves, always.
- **Never run `prettier --write .` or the `prettier` package.json script at all**, even with file
  args — the script is hardcoded to `prettier --write .` and pnpm/npm append extra args rather
  than replacing them, so scoping never actually happens. Use `pnpm exec prettier --write
  path/to/file.tsx` directly instead.
- **Never move the physical OS cursor to test a feature** (`SetCursorPos`/`mouse_event`, or a
  separate launched Playwright/Selenium browser).
- **No automated e2e testing.** There is no `e2e/` suite (a Playwright suite was tried and removed
  — too flaky: shared-app-window state bleeding between spec files, an unreliable dev-sandbox route
  to Steam's CM servers, dev-machine-specific assumptions like account count). Don't recreate
  `e2e/`, `scripts/run-e2e.ps1`, or reintroduce `@playwright/test`. For a UI-facing change, do the
  non-interactive checks yourself (`cargo check`, `pnpm typecheck`, `pnpm lint`, unit tests,
  devtools `invoke()`) plus a plain `pnpm tauri dev` launch to sanity-check the change renders and
  the obvious path works, then hand the user concrete manual verification steps rather than
  self-reporting a pass/fail. Give steps as a short numbered list of exact actions (which screen,
  which control, what to click, what the expected result is) — not a vague "please test this."
- **CDP-scripted `invoke()` testing (backend-only steps, no frontend yet): use `tauri.conf.json`'s
  `additionalBrowserArgs`, not the `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` env var** — the env var
  stopped reliably reaching the real WebView2 process. Add
  `"additionalBrowserArgs": "--remote-debugging-port=9222"` to `tauri.conf.json`'s one
  `app.windows[]` entry instead, which triggers a dev-server rebuild/relaunch with the flag
  actually wired in. **This edit must stay temporary and never be committed** — revert it (`git
  diff` to confirm) before calling a step done. Once `http://127.0.0.1:9222/json/version` responds,
  drive `Runtime.evaluate` over the `/json/list` websocket from **PowerShell**
  (`System.Net.WebSockets.ClientWebSocket`) — a plain curl-based readiness wait-loop from git-bash
  is fine, only the actual driving needs PowerShell.

## Known environment/tooling gotchas

- **A stale orphaned `next dev` process can silently block every subsequent `pnpm tauri dev`
  launch** (it's already holding port 3000) — symptom looks like "the dev server just won't
  start." Diagnose via `tasklist`, not by staring at build output.
- **Running `cargo check`/`cargo test` from a second terminal while `pnpm tauri dev`'s file-
  watcher is rebuilding the same `target/debug` corrupts the incremental compilation cache** →
  `LNK2019`/`LNK1120` unresolved-externals linker errors. Fix: targeted `cargo clean -p
  steam-game-idler`, not a full clean. Avoid a second `cargo` invocation against the same target
  dir while `tauri dev` is watching.
- **Running `cargo test`/`cargo check` while the built exe is actually running** can hit a Windows
  file lock (`os error 32`) on `SteamKit2.dll` specifically — avoid building while the exe is live
  (or use `cargo check` alone, which doesn't need the DLL copy).
- **`cargo check`/`cargo test --lib` do NOT relink the `steam-game-idler` bin target** (only the
  lib target) — testing exe-level behavior (a relaunch, single-instance enforcement, tray/startup
  behavior) against a stale exe gives false results indistinguishable from a real bug. Run `cargo
  build --bin steam-game-idler` first whenever a test depends on the actual binary's behavior.
- **A Tauri `#[tauri::command] async fn` whose body is pure synchronous `std::fs`/blocking I/O with
  no real `.await` point runs that blocking work straight through** on whatever tokio worker thread
  polls it, instead of going through Tauri's own blocking-pool dispatch (which a plain, non-async
  `fn` command gets automatically). Under enough concurrent load this can starve the async runtime
  and make unrelated commands hang. If a command's body has no real `.await`, don't mark it
  `async` at all.
- **The mirror-image trap: a plain (non-async) command that calls a bare `tokio::spawn` to kick off
  a background task crashes the whole app** — "there is no reactor running, must be called from
  the context of a Tokio 1.x runtime", a non-unwinding panic that takes down the entire WebView2
  process, not just the command. A plain `fn` command runs on Tauri's blocking-pool thread, which
  has no ambient Tokio runtime context for `tokio::spawn`'s `Handle::current()` to find. Use
  `tauri::async_runtime::spawn` instead, which holds its own stored runtime handle and explicitly
  enters it before spawning, so it works from any calling thread regardless of whether the caller
  is sync or async.
- **HeroUI's `Checkbox` silently renders as unclickable if you omit `Checkbox.Content`.**
  `<Checkbox><Checkbox.Control><Checkbox.Indicator/></Checkbox.Control></Checkbox>` compiles, passes
  lint, and looks visually correct — but `Checkbox.Control`/`Checkbox.Indicator` are purely
  decorative spans with no listener behind them. The actual clickable `<label><input/></label>`
  only exists inside `Checkbox.Content` (HeroUI's `CheckboxButton`). Always wrap:
  `<Checkbox.Content><Checkbox.Control><Checkbox.Indicator/></Checkbox.Control></Checkbox.Content>`.
- **A gated (Pro-tier-locked) control must stay a real, pressable element, never a native
  `isDisabled` `Button`/`Radio`.** A real (trusted) mouse click on a native-disabled form control
  never fires a `click` DOM event at all. Style it to look disabled (`opacity-50`/
  `cursor-not-allowed`) while leaving it a real element, and reroute its `onPress`/`onChange` to
  `openWithTier(tier)` instead of the real action when gated. HeroUI `Switch` doesn't have this
  problem (its disabled state isn't a native `disabled` attribute) but still shouldn't visually
  look disabled for a gated-not-broken control — drop `isDisabled` there too and reroute
  `onChange` the same way, matching every other gate's "stays enabled-looking" bar.
- Other recurring HeroUI v3 / react-aria-components traps: `Typography` can't nest inside
  `Radio`/`RadioField` (only publishes a "description" slot) — use a plain `<span>`. A
  `TextField`'s helper text must go through HeroUI's `Description` component — a bare `Typography`
  throws "A slot prop is required." `useDisclosure` and `Chip` (both real in HeroUI v2) don't exist
  in v3 — check `node_modules/@heroui/react/dist/index.d.ts` before assuming a v2 API carried over.
  A bare `Input` (not wrapped in `TextField`) doesn't support `size`/`isDisabled` — use `disabled`
  instead (`size` is the native HTML column-width attribute).

## Platform scope

**Windows-only** this release — use Windows-specific integration where it's the fastest/cleanest
path (Windows Credential Manager via `keyring`, `windows`/`winapi` crates). Keep the door open for
other OSes where it costs nothing (no hardcoded path separators, no gratuitous `cfg(windows)`) —
but don't spend design effort chasing cross-platform support this release doesn't need.

## Production readiness — this is a live public app

Steam Game Idler is real and publicly used. Every change needs to actually work in a public
release, not just in a dev environment.

- **Dev-environment parity is not enough.** Storage/file paths, settings persistence, encryption,
  env vars, CI/release workflows, and anything environment-sensitive must work in both dev *and*
  production (installed/portable builds) for users with no special local setup. File placement for
  settings/cache/logs/customization all route through `platform::cache_dir`/`logs_dir` (siblings,
  so cache-clearing can't race the open log handle) rather than `app_data_dir()` directly, so
  portable mode never leaks writes outside its own folder — mirror this for any new persisted file.
- **No implicit manual-install requirements.** If a feature needs something present on the user's
  machine, bundle/install it automatically (extend the NSIS installer) — never document it as a
  manual step.
- **The Steam Web API key is only obfuscated (compile-time embedded), not actually secure** — a
  deliberate, permanent decision. The real fix (a project-controlled proxy server) is a real infra
  commitment nobody's taken on; not revisiting unless the current approach proves insufficient
  (key extracted/abused).

## The updater — do not break the update path

The Tauri updater plugin's config (`tauri.conf.json`'s `plugins.updater.pubkey`, and the endpoint
`https://raw.githubusercontent.com/zevnda/steam-game-idler/main/latest.json`) is baked into every
previously-installed binary. **Never regenerate the minisign keypair or change the endpoint URL** —
doing so silently breaks updates for every existing user, since they can never verify a release
signed with a different key. `latest.json` (repo root) is CI-regenerated per release
(`.github/workflows/release.yml`): `{version, major, platforms.windows-x86_64: {signature, url}}`
— `url` must match whatever artifact name the Tauri bundler actually produces. `major` is a manual
`workflow_dispatch` input (not inferred from semver): `true` silently installs mid-session for
already-running instances; `false` just offers click-to-update via `UpdateButton`, except on an
app's very first check since launch, which always installs silently either way. Portable builds
skip update checks entirely (`platform::is_portable()`).

**Pre-install cleanup** (`updater.rs`'s `kill_all_steam_utility_processes`) must keep killing every
`SteamUtility.exe` process this app's process model can spawn (per-account agent sessions, plus any
per-game CLI-mode `idle` processes) — extend it if the process model grows a new spawn shape.
`src-tauri/installer-hooks.nsh`'s `NSIS_HOOK_PREINSTALL` explicitly deletes known orphaned files
from prior releases on upgrade (NSIS never deletes a file that existed in a prior install but isn't
part of the current one) — extend this list if a future release drops a previously-shipped file.

`src-tauri/src/legacy_migration.rs` (marker-gated, runs once at Rust `setup()` before the webview
loads) wipes the cache directory if it detects a pre-rewrite on-disk shape, since this app resolves
to the same cache directory and WebView2 profile as its predecessor and an old-shaped file can crash
a command expecting the new shape. `src/shared/hooks/useLegacyMigrationCleanup.ts` does the
matching one-time `localStorage`/`sessionStorage` clear (preserving `licenseKey`). Every settings
module's read/load also self-heals to defaults and rewrites the file if deserialization fails for
any reason (logged via `tracing::warn!`) rather than hard-erroring every read for that user — mirror
this self-heal pattern in any new settings module, and never repurpose an existing JSON key for a
new type/shape (add a new key instead; `#[serde(default)]` only rescues a *missing* key, not a
present-but-wrong-shape one).

**A Windows `pwsh`/`powershell` `run:` step in `release.yml` reports its own exit code, not
`$LASTEXITCODE`** — a failing native command (`dotnet`/`pnpm`/`cargo`) does not fail the step unless
you explicitly check `$LASTEXITCODE` afterward, and a failing cmdlet is non-terminating by default
unless `$ErrorActionPreference = 'Stop'` is set. Every `pwsh` step in `release.yml` sets
`$ErrorActionPreference = 'Stop'` and checks `$LASTEXITCODE` after each native call — keep doing
this for any new step added there; without it, a broken release step can report green while
publishing a `latest.json` that breaks auto-update for every existing user.

**Still open**: the full silent *auto-update* path (the updater plugin's signature-verified
download/install flow) hasn't been confirmed against a real signed release yet.

## The real SteamUtility contract

`libs/SteamUtility/Program.cs` dispatches on `args[0]`: `agent`/`--agent` → persistent daemon
(`Daemon/DaemonHost.cs`, SteamKit2-backed), `--help`/`-h` → usage, anything else → one-shot CLI
(`Cli/CliDispatcher.cs`, Steamworks.NET-backed, requires a real local running Steam client). Read
the actual C# source before implementing any new Rust command that talks to `SteamUtility.exe`
directly (CLI spawn or daemon IPC) — don't assume a command exists or a field is named a certain
way; several serde-side field-naming bugs have been found this way.

- **CLI commands**: `idle <app_id> [app_name]`, `get_achievement_data <app_id> [specific_id]`,
  `unlock_achievement`/`lock_achievement`/`toggle_achievement <app_id> <ach_id>`,
  `unlock_all_achievements`/`lock_all_achievements <app_id>`, `update_stats <app_id> <stats...>`,
  `reset_all_stats <app_id>`, `check_ownership [app_ids_json]`. Each prints exactly one JSON
  envelope line to stdout, except `idle`, which stays resident (one OS process per idling game — a
  hard Steamworks.NET constraint, not a code choice).
- **Daemon/IPC commands** (newline-delimited JSON over stdin/stdout, no local Steam client needed):
  `login`, `begin_qr_login`, `login_with_token`, `submit_guard_code`, `logout`, `idle_set` (single
  announcement, up to 32 games — no per-game PID concept), `get_owned_apps`, `achievements_get`,
  `achievement_set`, `achievement_set_bulk`, `stats_update`, `stats_reset_all`, `set_persona_state`.
  Emits async `status_changed`/`idle_state`/`auth_required` events in addition to responses.
- **Recurring Rust/serde gotcha**: `#[serde(rename_all = "camelCase", tag = "...")]` on an **enum**
  only renames the variant names, not fields *inside* a struct variant — add
  `rename_all_fields = "camelCase"` too, or a struct variant's own fields silently expect
  snake_case. Check this on every new tagged enum used for IPC/wire types.
- **`IpcMessage::classify()`** (`src-tauri/src/steam_agent/ipc.rs`) drops any event payload field
  named `error`/`result`/`ok` if a named struct field would shadow `#[serde(flatten)] extra` for
  that JSON key — already fixed once (silently broke `login_failed` error messages), watch for the
  same shape when adding a new IPC event field.

## Agent mode vs. CLI mode — sign-in methods, not just backends

- **Agent mode** (username/password or QR sign-in, SteamKit2/daemon-backed) is the **recommended**
  method. No local Steam client needed.
- **CLI mode** is the **fallback** for users who don't want to sign in with Steam credentials —
  requires a real local Steam client running and signed in.
- **Support both modes where possible.** Where a feature genuinely can't be (see capability
  differences below), the frontend must adapt gracefully per sign-in method rather than assume
  uniform capability.
- **One command surface per feature, branching internally on sign-in mode** (a tagged
  `GamesAccount` enum) — not a `steam_agent_*`-prefixed command plus a separate plain one with a
  frontend `isSteamAgentActive` branch. Apply this to every new feature.

### Known capability differences between the two backends

- **Game Coordinator titles** (TF2 440, Dota2 570, CS2 730, L4D2 550, Portal2 620) aren't supported
  via the daemon path at all. The CLI/local-client path has no such restriction.
- **Global achievement rarity percentage** is public, session-independent Steam Web API data
  (`GetGlobalAchievementPercentagesForApp`, unauthenticated, keyed only by appid) —
  `achievements::commands::backfill_global_percentages`
  (`src-tauri/src/achievements/web_api.rs`) fills it in for agent mode after the daemon returns
  achievements with `percent: null`. Not a real capability gap once this backfill exists.
- **Idling is architecturally different per backend** — one OS process per game locally (hard
  `SteamAPI_Init()` one-AppID-per-process constraint) vs. one `idle_set` announcement covering up
  to 32 games for the daemon. No "PID per game" concept in the daemon path.
- **Card farming's automatic cookie acquisition is architecturally different per backend** — agent
  mode's daemon already holds a live SteamKit2 connection and mints web-session cookies directly
  (`AuthFlow.cs::GetWebSessionAsync`), never showing a login prompt. CLI mode has no live session,
  so it needs `card_farming::session::acquire`'s hidden webview. Both produce the same
  `SteamCookies` shape, so the split is fully contained in `session.rs`.
- **Presence (persona state / custom idle status) only exists via the daemon path** — no CLI-mode
  equivalent; CLI mode keeps its separate `antiAway` mechanism instead (a local-client AFK poke,
  architecturally unrelated). A set persona state doesn't decay on its own for a SteamKit2 session
  (no local-client-style OS idle detection to counteract), so unlike `antiAway` it needs no
  periodic re-announce — see `PresenceManager.cs` and `steam_agent::presence_settings`. Custom idle
  status text only renders for friends when paired with a real, owned app id already being idled;
  a synthetic/unowned id is silently ignored.

## Pro/subscription tiers (`casual`/`gamer`) — real revenue behavior

A real, live subscription system (`src/shared/utils/subscriptionAccess.ts`:
`hasCasualAccess(tier)`/`hasGamerAccess(tier)`, gamer implies casual) checked against a live
external API (`useCheckSubscription.ts`, on mount + every 3 hours,
`https://apibase.vercel.app/api/subscriptions`), gating specific features — real revenue, not
something to drop or redesign freely. **There is no Rust-side tier enforcement anywhere in this
system** — gating is frontend-only scattered `if (hasGamerAccess(tier))`/`hasCasualAccess(tier)`
checks at each feature's call site; the frontend is solely responsible for correct enforcement.
**Before finalizing any new feature's scope, check whether it should carry a tier gate** — this is
a revenue-shaping decision, not a technical one, so raise it rather than guessing.

- **Casual** — ad-free (`AdSlot.tsx`), non-default themes + custom background image
  (`CustomizationSettingsTab.tsx`), non-default font picker, Discord role, live support
  (`HelpDesk.tsx`), up to 2 concurrent agent-mode accounts, auto games-list updates, and a 3-game
  concurrency step for achievement-unlocker's "multiple games at once" mode.
- **Gamer** (implies casual) — up to 10 (sanity-capped) concurrent agent-mode accounts, automated
  Steam Community cookie retrieval/revalidation (manual cookie paste stays free-tier), free-game
  auto-redemption (manual claim stays free-tier), automatic card farming, achievement-unlocker's
  full 32-game concurrency, inventory-manager "sell dupes", and presence's custom idle status
  message (agent-mode only). Presence's online status picker itself (`personaState`) is **not**
  tier-gated — free for every agent-mode account; only the custom message shown while idling
  (`customIdleStatus`) is Gamer-gated. `usePresenceProGuard` resets only `customIdleStatus` on a
  downgrade, leaving `personaState` untouched.

**Gating UI pattern**: a gated control stays a real, pressable element (see the HeroUI gotcha
above) with a `TierBadge` and its action rerouted to `proModalStore`'s `openWithTier(tier)` instead
of the real action when gated — never a native-disabled control for a monetization gate (native
`isDisabled` is still correct for a genuine technical ceiling, e.g. CLI mode's single-account
limit, which isn't a monetization gate).

**Any automation loop with a tier-gated cap must re-check the tier live on every pass**, not just
at session start — a long-running session must not keep exceeding a cap after a downgrade
mid-session (mirror `achievement_unlocker::manager`'s `AtomicU32` re-read pattern, and the
frontend's `useAchievementUnlockerConcurrencyGuard`/`usePresenceProGuard` shape for a live
re-push). Any UI surface offering the gated action a second time (e.g. a settings panel left open)
must also re-check at submit time, not only at initial render.

**Four marketing/comparison surfaces must be hand-kept in sync whenever a feature's tier, per-tier
value, or comparison-row position changes** (no shared package, no sync-check script — a
deliberate choice, since `docs/` is an independently deployed package): `src/shared/components/pro/
GoProModal/data.ts`'s `getComparisonRows` (canonical row order — edit this first) and
`getFeatureCards`; `GoProModal/index.tsx`'s two hardcoded `TierCard` `features=` arrays (easy to
miss, must independently match `getComparisonRows`' order); `docs/app/(marketing)/pro/
_components/data.ts`'s `allFeatures`/`comparisonRows`/`TierCardsSection.tsx`'s hand-mirrored
lists; and `docs/app/(marketing)/docs/_content/pro.mdx`'s plain markdown table. Grep the other
three for the same feature id/title before calling a tier change done.

## Multi-account support (agent mode)

Single-instance, multi-bot: one app window/process manages multiple concurrent agent-mode
(SteamKit2/daemon) sessions plus a frontend account switcher (`src/features/account-switcher/`).
`tauri-plugin-single-instance` is the first plugin in `lib.rs`'s builder chain. CLI mode stays
single-account by nature (a real local Steam client can only be logged into one account). Real
shape: at most one CLI-mode account, plus as many agent-mode accounts as the tier cap allows, all
live at once. **The app must never silently force-sign-out an existing session over the cap** — the
UI blocks/upsells instead; sign-out is the only thing that stops an account's automation.

**Every frontend store holding per-session state** (`sessionStore`, `gamesListStore`,
`idlingStore`, `cardFarmingStore`, `achievementUnlockerStore`) uses one shape:
`entries: Record<AccountKey, T>` + `activeAccountKey`, plus a denormalized single-entry view for
read-only consumers. Follow this shape for any new per-session store. Two backend event-routing
quirks any new account-scoped store must account for:
- `IDLE_STATE_EVENT` carries an `account` field in agent mode but not CLI mode (only one CLI
  account can ever exist) — resolve a CLI-mode event by finding the sole `mode: 'local'` entry in
  `sessionStore.accounts`, not by assuming "whichever account is active."
- `FARMING_STATE_EVENT`/`ACHIEVEMENT_UNLOCKER_STATE_EVENT` carry only a `steamId` (not username) —
  resolve it to an `AccountKey` via `resolve_account_steam_id`.

Sign-out always goes through a per-account command (`signOutAccount(key)` →
`agent_logout`/`stop_all_idling`) — never the blanket `kill_all_steam_utility_processes` while any
other account might still be signed in; that blanket kill only fires once no account remains
signed in at all. `idling::claims::IdleClaimsRegistry` is keyed by resolved SteamID64 — a global
(non-account-keyed) registry would let one account's claim union another account's games into its
own announce call.

## Idling — claim-based, not direct announcement

Every idle-consuming feature (manual idling, auto-idle, achievement-unlocker, card-farming) must
claim idle slots via `idling::claims::IdleClaimsRegistry` (account-+owner-keyed) rather than
announcing directly to the daemon/CLI — this is what stops features from clobbering each other's
idle set. Any new idle-consuming feature must integrate the same way. The Idling page
(`src/features/idling/`) groups currently-idling games by owning feature, each with its own "Stop"
(`get_idle_claims`/`stop_owner_idling` + `groupIdlingGames.ts`'s fixed precedence order for a game
claimed by more than one owner at once), alongside the global "Stop All".

## Settings: per-user vs. app-wide

A setting belongs in the top-level `settings.json` (`src-tauri/src/settings/mod.rs`'s `Settings`
struct) if it's a property of the app installation, independent of active Steam account (e.g. the
Steam Web API key override). A setting genuinely tied to a specific Steam account gets its own
steam-id-scoped file — its own file per feature (e.g. `achievement_unlocker_settings.json`), typed
whole-struct get/set, not a shared-blob/dot-path-mutated shape.

**A settings-consuming page that enforces values client-side (not just handing them to a Rust-side
loop) must refresh its own copy when the Settings modal closes.** The modal is an overlay (see
`useSettingsModalStore`'s doc comment), not a route change — a page already mounted underneath it
does *not* remount just because the modal opened/closed, so a separate "page's own copy of
settings" read goes stale after a save unless that page explicitly re-reads on the modal's close
transition (see inventory-manager's `useInventory.ts`'s `refreshSettings` +
`InventoryManagerPage.tsx`'s close-transition effect for the pattern).

**Forward-compat rules for every settings struct:** a brand-new field is safe on an existing user's
on-disk file *only* with `#[serde(default)]` (or `#[serde(default = "fn")]` for a non-zero
default) — always add it, every time. **Never repurpose an existing JSON key for a new type/shape**
(e.g. a bool becoming an enum under the same name) — add a new key instead and let the old one go
unused (unknown keys are always silently ignored — no settings struct uses `deny_unknown_fields`).

## Dashboard shell architecture

Real Next.js file-based routes under `src/pages/dashboard/*` (`index.tsx` games list,
`idling.tsx`, `favorites.tsx`, `free-games.tsx`, `card-farming.tsx`, `achievement-unlocker.tsx`,
`auto-idle.tsx`, `inventory-manager.tsx`) — not client-state page-switching. `/` is the sign-in
landing page. A persistent `DashboardShell` (`src/shared/components/dashboard/DashboardShell.tsx`),
mounted once in `_app.tsx` and never unmounted by route changes within `/dashboard/*`, is what lets
long-running features (card farming, achievement unlocker) survive navigation. "Which page is
active" is derived directly from `useRouter().pathname` — there is no separate navigation store.

Settings/single-game/achievement-order and other per-account overlay state render as overlays from
`DashboardShell` (own stores, e.g. `settingsModalStore`, `achievementManagerStore`,
`achievementOrderStore`), not routes — static export can't do dynamic server routes with
runtime-unknown params, so per-game drill-down views are overlays by necessity as well as by
design. Sidebar is a real `SidebarItem` component rendered from a data-driven sections array
(`{ header, items: SidebarItemConfig[] }[]`) — active state is `useRouter().pathname === item.href`.

## i18n

Only `en-US.json` is hand-maintained; the 7 other shipped locales (it-IT, ru-RU, fr-FR, zh-CN,
sl-SI, pt-BR, tr-TR) sync via Crowdin (`.github/workflows/crowdin.yml`) — don't hand-edit or
recreate them. `src/i18n/index.ts` types `i18next`'s resources from `en-US.json` and exports
`TranslationKey` (every valid dot-path key) for compile-time key checking on literal `t()` calls.

**Hard rules for all frontend work:**
- **Never hardcode a user-visible raw string** — every UI text goes through `useTranslation()`/
  `t()`. Exceptions only for structurally non-translatable text (brand names) or genuinely
  temporary/placeholder UI expected to be replaced soon.
- **Always reuse an existing key instead of duplicating one for the same text.** `pnpm i18n:check`
  (`scripts/check-i18n.mjs`, wired into lint-staged for `en-US.json`) fails on any exact-duplicate
  leaf string not in its `ALLOWLIST`, and separately on any leaf key with no reference anywhere in
  `src/` — remove a key once its last call site is gone. Before adding a new key, check whether a
  `common.*` key (or another feature's key, if the string is genuinely generic) already says the
  same thing. Only allowlist a duplicate when the two strings are the same English text today but a
  different UI role that could plausibly diverge in translation — genuinely generic status words
  never qualify.
- **A dynamically computed key needs to be typed as `TranslationKey` at its source, not `string`**
  — once resources are typed, i18next's `t()` overloads stop accepting a widened `string` for any
  call that also passes an options object. A `Record<string, string>` mapper becomes
  `Record<string, TranslationKey>` (see `sortOwnedGames.ts`'s `OWNED_GAME_SORT_LABEL_KEYS` for the
  pattern); a plain type annotation on the arrow function itself is banned project-wide by eslint's
  `no-restricted-syntax`.
- **Don't parameterize near-duplicate sentence templates across features** even though the checker
  won't flag them (their string values differ) — many languages need different word order/case/
  conjugation depending on the interpolated noun/verb, which string concatenation can't express.
  Only merge templates that are already byte-identical across call sites.
- **`aria-label`/`alt`/tooltip `title` stay translated** — genuine user-facing text for assistive
  tech, not overhead to strip. Only dedupe when a value is an exact duplicate of an
  already-translated sibling string.

**Locale-length resilience** — many languages run 30-100%+ longer than English (German/Finnish/
Russian are classic worst cases), and only `en-US` exists locally, so a feature can look fine in
English and still break later once Crowdin resyncs:
- Never assume a translated string is short or fits one line — size containers to content or let
  them wrap; prefer `min-w-*`/`w-fit`/flexible sizing over a hardcoded `w-*` sized for English.
- Let text wrap by default; reserve truncation for genuinely space-constrained UI (sidebar nav
  labels, dense table cells), pairing it with a `title` attribute or `Tooltip` so the full text is
  still recoverable.
- Icon-only controls stay icon-only across locales; any icon+text-label control needs room for the
  label to grow.
- When manually testing a feature's UI, do a quick pseudo-localization spot check: temporarily
  lengthen that feature's key strings ~30-60% and confirm the layout still holds, then revert
  before considering the feature done. Never commit pseudo-localized strings.

## Frontend conventions

- **Prefer a shared reusable component over near-duplicate ones** (e.g. `AuthCard` backs every
  sign-in form instead of each wrapping its own identical `Card` shell).
- **Use toasts for one-off action feedback, not persistent page state.** `Toast.Provider` is
  mounted once at root; call `toast.success`/`danger`/`warning`/`info` from anywhere. Not the right
  tool for a persistent "nothing to show" state or durable per-item state — those stay inline.
- **Virtualize a list/grid once it can realistically grow large** (an owned-games library, not a
  bounded settings tab). `src/shared/components/VirtualizedGameGrid.tsx` (react-window v2) backs
  every `OwnedGame[]` grid. Skip virtualizing genuinely small/bounded lists, or where it'd fight
  another library needing every item mounted (e.g. `@dnd-kit` sortable lists).
- **No framer-motion** (dropped project-wide, not a devDependency) — mount/ambient animations are
  plain CSS keyframes/transitions in `globals.css`/`theme.css` instead.

## UI/UX quality bar

- **Don't port an old interaction pattern by default — evaluate it on its own merits first.** The
  goal is the best experience for real users, not fidelity to how something used to work.
- **Favor one shared, consistent pattern over bespoke near-duplicates** — a shared `Tabs`
  convention, a shared empty-state, a shared bulk-action affordance, rather than a fifth ad hoc
  implementation of the same idea.
- **Navigation/selection state (active tab, active filter, scroll position) should be a deliberate
  persist-or-reset decision**, not an accident of where the state happened to get declared.
- **Group related pages/features in navigation** by the user's actual mental model.
- **Keep affordances self-explanatory** — if two similar-looking UI elements behave differently,
  that difference should be visible, not discovered by clicking around.
- See "Known environment/tooling gotchas" above for recurring HeroUI v3/react-aria-components
  traps.

## Multi-theme system

`src/shared/theme/` is a data-driven registry + runtime CSS-variable injection, not one stylesheet
per theme — adding a theme is a one-object change:
- `tokens.ts` — `ThemeTokens`, the token contract every theme supplies (the neutral-surface ladder:
  `background`, `fieldBackground`/`fieldBorder`, `surface`, `overlay`, `default`,
  `surfaceSecondary`, `separator`, `border`, `surfaceTertiary`, `scrollbarThumb`/`scrollbarTrack`).
  Accent/success/warning/danger/spacing/radius stay HeroUI's stock values regardless of theme.
- `presets.ts` — `THEME_PRESETS`, a `Record<ThemePreset, ThemeTokens>` for the non-default presets.
  `default` is not a registry entry — it's `theme.css`'s own stylesheet baseline, selected by
  *clearing* any inline override.
- `applyTheme.ts` — `applyTheme(tokens: ThemeTokens | null)` writes (or, for `null`, clears) each
  token as an inline custom property on `<html>`. Inline styles win over `theme.css` unconditionally.
- `themeInitScript.ts` — a pre-hydration `<script>` (embedded in `_document.tsx`) that applies the
  cached theme before React mounts, so first paint doesn't flash `default`.
- `useTheme.ts` — mounted once at the app root (`_app.tsx`, not `DashboardShell` — theme is a
  pre-dashboard-visible preference like zoom). Reconciles the provisional script-applied theme
  against the real `Settings.theme` + subscription tier once both are available.

**Adding a new theme preset**: add one `makeTokens(hue, chroma)` call (or a hand-written
`ThemeTokens` object) to `presets.ts` — no new file, no CSS selector, no changes to
`applyTheme.ts`/`useTheme.ts`/`_document.tsx`. All non-default presets are Casual-tier gated,
enforced consistently in both `useTheme.ts` and `CustomizationSettingsTab.tsx`.

The font picker (`src/shared/theme/font.ts`, `applyFont.ts`, `useFont.ts`, `fontInitScript.ts`)
mirrors this exact mechanism in parallel (`Settings.font` next to `Settings.theme`) — 10
pre-bundled `next/font/google` fonts, all declared on `<Html className>` in `_document.tsx` so none
needs a runtime download regardless of tier. `inter` is the free-tier default/sentinel key; every
other font (including Poppins) is a Casual-tier selectable override.

## Dependency notes

- **TypeScript and ESLint majors are deliberately deferred** — TS 7's Go-based compiler doesn't yet
  expose the Compiler API `typescript-eslint` depends on; ESLint 10 isn't yet supported by
  `eslint-plugin-react`'s published peer range. Re-check both once their respective upstream
  blockers clear (tracked: typescript-eslint/typescript-eslint#10940 for TS 7).
- **Cascading removal rule**: when a dep update/removal makes another dep unneeded, remove that one
  too in the same change — don't leave it as unused weight (e.g. dropping HeroUI v2 for v3 also
  meant removing `framer-motion`, a v2-only peer dependency).
