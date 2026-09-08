# Backend cross-feature architecture

A UI guide is about what the user clicks, but several backend mechanics directly shape what's
*possible* to click (what's enabled, what conflicts with what, what differs by sign-in mode) — this
file is the quick-reference for those. It's also directly useful input for the
`/generate-architecture-guide` skill's own work; this file isn't exclusive to UI guides.

If something here no longer matches the real code, fix this file as part of that run and say so in
your report — this is a snapshot, not a live source.

## Module inventory (`src-tauri/src/`)

One folder per feature area: `achievement_unlocker/` (queue + pacing + custom order/timings import),
`achievements/` (shared single-game achievement/stat primitives, used by both the achievement-manager
overlay and achievement_unlocker's automation), `auto_idle/`, `card_farming/` (two-phase
building-playtime/farming cycle), `customization/` (background image storage), `debug/`,
`favorites/`, `free_games/` (anonymous discovery scrape + authenticated claim), `games/` (owned-games
retrieval — the shared foundation nearly every other per-game feature consumes), `idling/` (core
start/stop mechanics + the claims registry, see below), `inventory/` (marketable-item fetch/market
actions, covers cards/backgrounds/emoticons/booster packs, not cards specifically), `local_steam/`
(CLI-mode sign-in — reads the local Steam client directly), `max_playtime/` (cross-cutting auto-stop
cap enforced by manual idling/auto-idle/achievement-unlocker/card-farming alike), `settings/`
(app-wide `Settings` struct), `steam_agent/` (agent-mode sign-in — spawns and IPC-talks to
`SteamUtility.exe agent`), `steam_community/` (shared Steam Community cookie/session plumbing,
extracted from card_farming once inventory needed the same thing).

Root cross-cutting files: `logging.rs`, `error.rs` (`AppError`), `credential_store.rs` (OS-keyring —
the one choke point for every bearer credential: refresh tokens, Web API key override, manually-saved
Community cookies), `platform.rs` (cache/log dir resolution, used almost everywhere), `subscription.rs`,
`updater.rs` (`kill_all_steam_utility_processes`), `tray.rs`, `zoom.rs`.

## Idle claims registry (`idling/claims.rs`)

Reconciles multiple independent "I want these games idling" callers into one announced idle set per
account, since neither backend understands "desired set *for this owner*" — only "the desired set."
Without it, whichever caller announced last would silently wipe out every other owner's games.
Owner constants: `manual`, `auto_idle`, `achievement_unlocker`, `card_farming` — same four values the
frontend's `IdleOwner` type mirrors (see `frontend-architecture.md`).

Real callers: `card_farming::manager` and `achievement_unlocker::manager` each call
`replace_owner_claim` whenever their target set changes, and clear their own claim on session end;
`auto_idle::commands::start_auto_idle_games` and `idling::commands::toggle_manual_idle` claim under
`auto_idle`/`manual` respectively; `idling::commands::stop_owner_idling`/`stop_all_idling` release;
`max_playtime::enforcement`'s poll loop sweeps `active_claims_for_owner` each tick for manual/auto-idle
timeouts; a "logged in elsewhere" kick (`steam_agent::process`) and pre-update/exit teardown
(`updater.rs`) both clear every claim for an account/the whole app respectively.

Known gap: CLI mode's poller can't drop an app id if its process is killed externally (e.g. Task
Manager) — worth knowing if a guide needs to explain "why is this game still showing as idling."

## Sign-in-mode branching (`GamesAccount` enum)

```rust
pub enum GamesAccount { Agent { username: String }, Local { steam_id: String } }
```
The convention across the whole backend is **one command surface per feature, branching internally**
on this enum — never a `steam_agent_*`-prefixed command plus a separate plain one. Real examples:
`games::commands::get_owned_games`, `idling::commands::apply_idle_targets`/`get_idle_state`,
`achievements::commands::get_achievement_data`/`set_achievement`/etc., `free_games::commands::
claim_free_game`. When a UI guide needs to note "this behaves differently by sign-in mode," this
enum is why — check the specific command's match arms rather than assuming a difference exists.

## IPC event routing (`steam_agent/`)

Every event from the spawned `SteamUtility.exe agent` daemon is emitted on one generic frontend
channel (`"steam-agent-event"`) carrying `{account, event, payload}` — there's no per-event-type
channel; the frontend filters by the `event`/`account` fields in the payload. A few event names get
extra backend-side handling before that generic emit: `refresh_token` persists to the credential
store, `status_changed` with a "logged in elsewhere" result stops that account's card-farming and
achievement-unlocker and clears its idle claims, and `idle_state` additionally re-emits on the
backend-agnostic `idling-state-changed` channel so the frontend's idling listener never needs to
branch on sign-in mode at all.

## Settings files

App-wide: `settings.json` (`Settings` struct, theme/font/tray/agent-accounts roster — not
per-account). Per-SteamID64 (one JSON file per feature, all self-healing to defaults on a parse
failure): `achievement_unlocker_settings.json`, `card_farming_settings.json`,
`inventory_settings.json`, `free_games_settings.json`, `idling_settings.json`,
`max_playtime_settings.json` (read by manual idling/auto-idle/achievement-unlocker — **not**
card-farming; see caveat below), `presence_settings.json` and `ownership_settings.json` (both
agent-mode only).

**Correction (2026-09-08 check)**: despite `idling::claims.rs`'s own doc comment and this file's
previous wording both claiming card-farming enforces the max-playtime cap on its own schedule
(mirroring achievement-unlocker's `poll_active`-style check), a full read of
`src-tauri/src/card_farming/manager.rs` and every other file in `src-tauri/src/card_farming/`
found zero references to `max_playtime` anywhere — no import, no settings read, no cap check.
Grepping the whole `src-tauri/src` tree for `max_playtime`/`MaxPlaytime` confirms `card_farming`
is not among the matching files (achievement_unlocker, idling, auto_idle, and max_playtime's own
module are). A max-playtime cap configured for a game currently does **not** stop a card-farming
cycle from continuing to farm/idle it. Re-verify against real code before trusting this claim
anywhere else it appears (root `CLAUDE.md`, `ai-corpus/architecture-guides/max-playtime.md`) —
both currently still assert the stale behavior and need a manual fix outside this skill's scope.
Separate from these, several features keep a per-account **cache** file that is NOT a settings file
(`favorites/cache.rs`, `auto_idle/cache.rs`, `games/cache.rs`, `inventory/cache.rs`,
`achievement_unlocker/cache.rs`) — deliberately not unified into one "custom list" abstraction.

## Cross-feature hubs

`games::` (owned-games list, `GamesAccount`) and `steam_agent::` (`AgentManager`) are each imported
by 20+ files — touched by nearly every per-account feature. `credential_store::` is the single
OS-keyring choke point for every bearer credential in the app. `steam_community::` (cookies/session)
is shared between card_farming and inventory. `idling::claims::IdleClaimsRegistry` is the clearest
reconciliation hub (card_farming, achievement_unlocker, auto_idle, idling itself, max_playtime,
steam_agent's session-supersede handling, and updater's teardown all touch it).
