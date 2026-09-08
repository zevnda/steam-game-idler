<!-- url: https://steamgameidler.com/docs/settings/debug -->
# Settings: Debug

Generated corpus content (see `.claude/skills/generate-ui-guide/SKILL.md`) — the merged source for
the Settings modal's Debug tab (UI behavior + the docs page's content + its cross-feature
connections), verified against `src/features/settings/components/DebugSettingsTab.tsx`,
`src/features/settings/hooks/useDebugSettings.ts`, `src/features/settings/types.ts`,
`src-tauri/src/debug/commands.rs`, and the individual settings modules `reset_settings` calls into
(`settings/mod.rs`, `achievement_unlocker/settings.rs`, `card_farming/settings.rs`,
`idling/settings.rs`, `max_playtime/settings.rs`, `inventory/settings.rs`,
`free_games/settings.rs`, `steam_agent/ownership_settings.rs`). Regenerate via that skill if any of
those change — don't hand-edit this file to patch small drift.

## Opening the Debug tab

Open the Settings modal (Sidebar's gear-icon button, which in practice always opens on the
**General** tab — see `ai-corpus/ui-guides/settings-general.md` — or the `Ctrl+,` keybind), then
click **"Debug"** at the bottom of the left-hand vertical tab list. Unlike every other tab, Debug's
panel uses a `fill` layout (`SettingsPanel fill id='debug'` in `SettingsModal.tsx`): instead of the
usual "content grows to its natural height, the whole modal body scrolls" shape, Debug's column
stretches to the modal's full available height and only its inner log viewer scrolls — this exists
solely so the log viewer (see below) can show many lines at once without the action buttons above
it scrolling out of view.

Log lines and system info (version, OS, portable/installed) only start loading once this tab is
actually the active one (`isOpen && activeTab === 'debug'`) — switching to another tab stops the
log poll; switching back to Debug restarts it and re-fetches system info fresh.

## What's shown at the top: version and system info

Directly under the "Debug" heading, once loaded, one muted line reads: `Steam Game Idler v{version}
· {osVersion} ({arch}) · Portable build` (or `Installed build`) — e.g. "Steam Game Idler v6.2.6 ·
Windows 11 Pro (x86_64) · Installed build". `osVersion` comes from `sysinfo::System::
long_os_version()` and `arch` from `std::env::consts::ARCH`, both read fresh via `get_system_info`
each time the tab activates. This line is blank/absent until all three pieces (system info, app
version, portable-vs-installed) have resolved.

## View log file

A "View log file" button (secondary-style, shows a pending spinner while running) calls
`get_log_file_path` then `revealItemInDir` (from `@tauri-apps/plugin-opener`) to open the current
log file selected in the OS file explorer — this is the concrete meaning behind root CLAUDE.md's
"Debug tab → reveal in Explorer" reference for grabbing a log file to attach to a GitHub issue.

"Current" log file specifically means: `tracing_appender::rolling::daily` names log files by a
prefix plus a rotation date, so there's no single fixed filename — the backend picks whichever file
in the log directory has the most recent modified-time, not a computed "today's date" filename. In
practice this is always today's file unless something unusual happened, but the lookup is by mtime,
not by constructing today's date string.

Log files live in a `logs` folder that is a **sibling** of the cache directory, not nested inside
it (`platform::logs_dir` vs `platform::cache_dir`) — this is deliberate so that "Clear data" (which
wipes the whole cache directory) can never race the logger's permanently-open file handle. Per the
docs page: `<install folder>/logs/` for the Windows portable build, or the OS app-data location
otherwise (`%appdata%\com.zevnda.steam-game-idler\logs\` on Windows,
`~/.local/share/com.zevnda.steam-game-idler/logs/` on Linux). You never need to know this path
yourself — "View log file" always resolves and opens the right one.

If this fails (e.g. no log file exists yet, or an I/O error), a red toast reads "Couldn't read or
write the log file." (the one specific message the Debug tab's own error-code map
(`debugErrorMessageKey`) provides for `log_io_failed`; any other code falls back to the generic
"Something went wrong. Please try again. ({{code}})").

## The log viewer panel

Below the action-button row, a bordered card shows: a muted caption ("The app's most recent log
lines, refreshed automatically.") over a scrollable list of the current log file's most recent
lines — up to 500 (`LOG_LINES_LIMIT`), **newest line first**, refetched via `get_log_lines` every
1 second while this tab is active. Each line is the raw `tracing`-formatted line exactly as written
to the file (not re-parsed into a timestamp/message split) — this is a live, growing feed of real
lifecycle events, not just errors: game start/stop, achievement unlocks, claim outcomes, and
warnings/errors from every automation manager, per root CLAUDE.md's logging conventions.

- A line containing the whole word `ERROR` renders in the danger/red color with monospace font; any
  other line renders muted/grey monospace. Text in this panel is selectable (`select-text`) so you
  can copy specific lines directly.
- If the log file can't be read at all, the error code string itself is shown centered in the panel
  in place of any lines.
- If the file exists but currently has zero lines (e.g. right after "Clear logs"), the panel shows
  a centered "No log entries yet" message instead.
- React key stability: since raw tracing lines carry no id and can legitimately repeat verbatim
  (e.g. the same warning logged twice in a row), the component keeps a running per-line occurrence
  counter to build a unique key rather than using the array index — purely an implementation detail,
  invisible to the user, but the reason duplicate consecutive lines don't cause React key warnings.

## Open settings file

An "Open settings file" button (secondary style, pending spinner) calls `get_settings_file_path`
then `revealItemInDir` to select `settings.json` in the OS file explorer — useful for manually
inspecting the file or pasting in a previously exported settings backup to restore a configuration
(per the docs page). If `settings.json` doesn't exist yet (a fresh install that never wrote one),
the backend creates it with defaults first so there's always something to select. On failure, the
toast uses the General/Customization tabs' shared error map (`errorMessageKey`, not the Debug-tab
one) — a `settings_io_failed` code shows "Couldn't read or write your settings file."; any other
code falls back to "Something went wrong updating settings. Please try again. ({{code}})".

## Clear logs

A "Clear logs" button (danger/red style, pending spinner, no confirmation dialog — this one is not
gated behind an AlertDialog the way Reset Settings/Clear Data are) calls `clear_log_file`, which
truncates the current log file to zero bytes in place. This is safe to do while the app's own
logger keeps writing: the logger's file handle is opened in append mode, so once logging resumes it
writes to the (now empty) end of the file rather than leaving a gap of null bytes at a stale cursor
offset. On success, the log viewer immediately re-fetches (now showing "No log entries yet" until
new lines are written) and a green toast reads "Logs cleared". On failure, the same
`debugErrorMessageKey`-mapped toast as "View log file" appears.

**This only affects the current day's log file's contents — it does not delete the file, does not
touch any previous day's rotated log file, and has no effect on `settings.json`, cache, or anything
else.**

## Export settings

An "Export settings" button (secondary style, pending spinner) builds a JSON snapshot and copies it
directly to the clipboard (`navigator.clipboard.writeText`) — there is no file-save dialog, just a
clipboard copy, matching the docs page's guidance to use this for backing up a configuration,
transferring to another machine, or attaching to a GitHub bug report. On success, a green toast
reads "Settings copied to clipboard"; on failure, "Couldn't export settings" (a fixed message, not
an error-code-driven one).

The exported JSON's top-level shape is:
- `version` — the app version string (`getVersion()`).
- `system` — `{ osVersion, arch, isPortable }`.
- `settings` — the full app-wide `Settings` object (`get_settings`), **except** `steamWebApiKey` is
  replaced with the literal string `"<redacted>"` if one is set, or `null` if not — only whether a
  key is configured is exported, never the key value itself.
- `achievementUnlockerSettings`, `inventorySettings`, `cardFarmingSettings`, `freeGamesSettings` —
  each `null` if no account is currently signed in, otherwise the currently **active** account's
  settings for that feature (fetched fresh via `get_achievement_unlocker_settings`/
  `get_inventory_settings`/`get_card_farming_settings`/`get_free_games_settings`). **Only the active
  account's settings are exported** — if you have multiple agent-mode accounts signed in, a
  backgrounded (non-active) account's per-feature settings are not included in this export.
- `localStorage` — every `localStorage` key/value on this device, JSON-parsed where possible,
  **except** four deliberately excluded keys: `sgi.session.accounts`, `sgi.session.account`,
  `licenseKey`, and `cachedSubscription` — excluded because they're session/identity-adjacent data
  (login state, license key, subscription cache), not "settings" in the sense this export is for,
  and because including them would leak account-identifying data into what's meant to be a
  shareable bug-report paste.

Note what this export does **not** include at all: idling's max-idle-time settings
(`idling_settings.json`), max-playtime settings (`max_playtime_settings.json`), or ownership
settings (`ownership_settings.json`, agent-mode only) — none of these three files have a dedicated
field in the exported JSON, even though (see "Reset settings" below) all three genuinely exist and
are genuinely reset by that separate action. If a user is troubleshooting a Game-Settings-tab cap
(max playtime/max idle time) or an ownership-mode issue, this export alone won't show it.

## Reset settings

A "Reset settings" button (danger/red style) opens a confirmation `AlertDialog` rather than acting
immediately — titled "Reset settings to defaults?" with body text: *"Resets your Steam Web API key
override and, if you're signed in, this account's achievement unlocker, inventory manager, card
farming, and free games settings back to their defaults. Your signed-in accounts stay signed in."*
The dialog has a secondary "Cancel" button and a danger "Reset settings" confirm button (pending
spinner while running); canceling or clicking outside just closes the dialog with no effect.

**What this actually resets, verified directly against `debug::commands::reset_settings` (the
backend command) — this is measurably broader than the in-app dialog's own copy states:**

1. **Always, regardless of whether anyone is signed in:**
   - The app-wide `settings.json` (`Settings` struct) is fully reset to defaults — theme, font,
     tray/close-to-tray/start-minimized, anti-away, auto-update-games-list, free-game-notifications,
     tooltips-disabled, carousel-visibility toggles, custom-background filename — **except
     `agentAccounts` (the roster of which usernames have a saved agent-mode session), which is
     deliberately preserved** so a reset can never itself sign anyone out. This is also why the
     confirm dialog explicitly promises "Your signed-in accounts stay signed in."
   - The Steam Web API key override is deleted from the OS credential store
     (`credential_store::delete_web_api_key`) — after this, the app falls back to its own bundled
     key (see `steam_web_api::resolve_api_key`).
   - The custom background image file itself is deleted from disk (best-effort — a failure here is
     only logged as a warning, since `settings::reset` already zeroes the filename regardless, so a
     leftover orphaned image file is the only consequence of that specific failure).
2. **Only if an account is currently signed in (the frontend passes the *active* account, not every
   signed-in account — see the multi-account note below):**
   - That account's achievement-unlocker settings **and every per-game "max achievement unlocks"
     override** are wiped (`achievement_unlocker::settings::reset`, not the same code path as a
     normal settings save — a normal save only touches the settings struct itself and deliberately
     leaves per-game overrides alone; a full reset needs this separate wipe entry point specifically
     so those overrides don't silently survive).
   - That account's inventory-manager settings reset to defaults (`inventory::settings::set` with
     `InventorySettings::default()` — inventory has no per-game override map, so a plain whole-struct
     write already is a full reset).
   - That account's card-farming settings reset to defaults (`card_farming::settings::reset` —
     card-farming also has no per-game override map or auto-stop caps of any kind; see
     `ai-corpus/ui-guides/settings-game-settings.md` for why card farming has no Game-Settings-tab
     section at all).
   - That account's free-games settings (including the auto-redeem toggle) reset to defaults
     (`free_games::settings::set` with `FreeGamesSettings::default()`).
   - **That account's idling max-idle-time settings are wiped — both the account-wide "Max idle
     time (all games)" value AND every per-game "Max idle time" override**
     (`idling::settings::reset`). This file/UI is owned by the Game Settings tab, not this one — see
     below for why the Debug tab's own confirm-dialog text never mentions it.
   - **That account's max-playtime settings are wiped — both the account-wide "Max playtime (all
     games)" value AND every per-game "Max playtime" override** (`max_playtime::settings::reset`).
     Same Game-Settings-tab ownership note as idling above.
   - Agent-mode accounts only: ownership settings (`gamesOnly`) reset to its default
     (`steam_agent::ownership_settings::set` with the default value) — a CLI-mode (local Steam
     client) account has no `ownership_settings.json` at all, so this step is skipped entirely for
     one (returns `null`, not an error). Because this setting changes what `get_owned_games` itself
     returns (not just a cosmetic preference), the frontend also triggers a fresh games-list refetch
     for agent-mode accounts specifically after a reset, on top of just refreshing the settings
     tab's own displayed value.

**The confirm dialog's own text ("this account's achievement unlocker, inventory manager, card
farming, and free games settings") is genuinely incomplete** — it does not mention that idling's
max-idle-time settings, max-playtime settings, or ownership settings are also wiped. This isn't a
guide error; it's a real gap between the dialog's copy and the backend's actual behavior, confirmed
by reading `reset_settings` directly (which calls `idling::settings::reset` and
`max_playtime::settings::reset` in the same pass, and conditionally `ownership_settings::set` for
agent-mode). If a user asks "why did my max playtime/max idle time caps on the Game Settings tab
disappear after I used Reset Settings on the Debug tab," this is the accurate, verified answer —
Reset Settings does wipe them, the in-app dialog just doesn't say so.

**What this does NOT reset:** keybinds (there's nothing to reset — the Keybinds tab is a static
reference, not a persisted setting); the signed-in account roster / any account's saved credentials
(agent-mode refresh tokens, CLI-mode local-client link) — no account is ever signed out by this
action; any per-account **cache** file (owned-games cache, achievements cache, favorites cache,
auto-idle cache, inventory cache, card-farming queue/blacklist cache) — these are a distinct concept
from settings files and are untouched here (only "Clear data," below, wipes those); a CLI-mode
account's persisted free-games store-webview session/cookie jar (that's a separate sign-in concern
from the `auto_redeem` preference this action resets, with its own explicit "Sign out" action inside
the Free Games settings tab).

**Multi-account scoping — a real, easy-to-miss detail:** the achievement-unlocker/inventory/
card-farming/free-games/idling/max-playtime/ownership portion of this reset is scoped to whichever
account is currently **active** in the app (`useSessionStore`'s denormalized `account`, not the full
`accounts` map) — **not** every signed-in account. If you have two agent-mode accounts signed in and
click Reset Settings while Account A is active, only Account A's per-feature settings are wiped;
Account B's own achievement-unlocker/inventory/card-farming/free-games/idling/max-playtime settings
are completely untouched. Only the app-wide portion (theme, font, tray behavior, API key override,
etc.) affects every account, since there's only one `settings.json` shared by the whole
installation.

## Cross-feature effect: other open Settings tabs update live, without their own reset button

`DebugSettingsTab` receives six separate re-fetch callbacks from its parent (`SettingsModal.tsx`):
`refreshGeneralSettings`, `refreshAchievementUnlockerSettings`, `refreshInventorySettings`,
`refreshCardFarmingSettings`, `refreshFreeGamesSettings`, `refreshOwnershipSettings` — this exists
specifically because every Settings-modal tab stays mounted underneath whichever tab is currently
selected (switching tabs is not a route change), so a reset needs to explicitly tell each
already-mounted tab's own hook to re-fetch, or that tab would keep showing its pre-reset values
until the whole modal was closed and reopened. Concretely, after clicking Reset Settings and
confirming: if you then click over to the General, Achievement Unlocker, Inventory Manager, Card
Farming, or Free Games tab within the same still-open modal, you'll see that tab's fields already
showing the freshly-reset defaults — not stale pre-reset values requiring a manual refresh.

**Two tabs are deliberately excluded from this callback list and handle it differently, not
because they're unaffected:** the Game Settings tab (which genuinely does have data wiped by this
same reset — see "Reset settings" above) and the Keybinds tab (which has nothing to reset in the
first place). Rather than adding a seventh/eighth prop to `DebugSettingsTab`, the Game Settings
tab's own hook (`useGameSettings`) gates its data-loading effects on itself actually being the
active tab (`isOpen && activeTab === 'gameSettings'`) — so simply switching to the Game Settings tab
after a reset (even one performed while parked on a different tab) triggers its own fresh re-fetch
automatically, with no separate manual refresh action needed or available. If the Game Settings tab
looks like it's showing stale values immediately after a reset, just opening/switching to that tab
resolves it.

Beyond this modal's own tabs, several app-wide **live-sync stores** are explicitly re-applied by
`resetSettings` itself (not by any of the six refresh callbacks, which only update each tab's own
local snapshot): theme resets to the `default` preset, font resets to `inter`, tooltips re-enabled,
both the "recommended" and "recent" game carousels re-shown, the custom background cleared, the
anti-away toggle turned off, and the auto-update-games-list toggle (plus its "has a custom API key"
flag) turned off — all applied live immediately so the running app actually reflects the reset
instantly, rather than silently persisting defaults to disk while the visible UI kept using
pre-reset values until the next relaunch.

On success, a green toast reads "Settings reset to defaults". On failure, the same
`debugErrorMessageKey`-mapped toast as the log actions appears (falls through to the generic
"Something went wrong. Please try again. ({{code}})" message, since reset has no dedicated error
code of its own registered).

## Clear data

A "Clear data" button (danger/red style) opens its own confirmation `AlertDialog` — titled "Clear
all local data?" with body text: *"Signs every account out, stops any running automation, clears
logs, and clears locally-stored app data on this device (recent searches, inventory locks, etc.).
This can't be undone."* Secondary "Cancel" and danger "Clear data" (pending spinner) buttons.

**This is a fundamentally different, much broader action than Reset Settings — not a bigger version
of the same thing.** Verified directly against `useDebugSettings.ts`'s `clearData` and
`debug::commands::clear_all_cache_files`:

1. **Every currently signed-in account is individually signed out** — the frontend loops over every
   key in `sessionStore`'s `accounts` map and calls the shared `signOutAccount(key)` for each one
   (the same sign-out path the account switcher itself uses), not just the active one. Per account,
   this: stops that account's card farming and achievement unlocker (`stop_farming`/
   `stop_achievement_unlocker`, run concurrently, one failing doesn't block the other), then signs
   the session off — `agent_logout` for an agent-mode account (ends the live SteamKit2 session, kills
   its `SteamUtility.exe` process) or `stop_all_idling` for a CLI-mode/local account — and clears
   that account's entry from every per-session frontend store (idling, games-list, card-farming,
   achievement-unlocker, account-summary, session).
   - **Non-obvious and worth calling out precisely: `agent_logout` does NOT forget the account's
     saved refresh token.** Its own doc comment states this explicitly — it only ends the live
     session and stops the process. There is no command anywhere in the backend that deletes a
     saved agent-mode refresh token from the OS credential store. So even after "Clear data" signs
     every account out, each account's actual bearer credential physically remains in the OS's
     credential vault (Windows Credential Manager, or the Linux equivalent), orphaned and unused by
     the app going forward — the app itself just no longer has any record of it once `settings.json`
     is gone (see the next point), so it won't offer a one-click "continue as" option for that
     username anymore. Removing the credential from the OS vault directly (outside the app) is the
     only way to fully remove it.
   - Once the last signed-in account is gone, the subscription tier resets to "unknown"
     (`resetSubscription()`) and the blanket `kill_all_steam_utility_processes` command runs as a
     last-resort cleanup — this blanket kill is deliberately only called here, once nothing remains
     signed in, never per-account (a per-account sign-out uses the scoped stop commands above
     instead, since the blanket kill would otherwise take down every *other* still-signed-in
     account's process too).
2. **Logs are cleared** — the same `clear_log_file` truncation "Clear logs" performs, called
   best-effort (a failure here is only logged to the console, doesn't abort the rest of the action).
3. **The entire on-disk cache directory is deleted** (`clear_all_cache_files` → `fs::
   remove_dir_all(platform::cache_dir(...))`) — a not-yet-existing directory (fresh install, or
   already cleared) is not treated as an error. This is the single most important distinction from
   Reset Settings: **`settings.json` itself lives inside this cache directory**
   (`settings::settings_path` = `cache_dir().join("settings.json")`), so Clear Data doesn't just
   reset app-wide settings to defaults the way Reset Settings does — it **deletes the settings file
   entirely**, along with every per-account cache/settings file nested under it: every account's
   cached owned-games list, achievements cache, inventory cache, card-farming queue/blacklist,
   favorites cache, auto-idle cache, **and every per-account settings file this app has** (
   achievement-unlocker, inventory, card-farming, free-games, idling, max-playtime, presence, and
   ownership settings — for every account that was ever signed in on this device, not just the
   currently active one). Functionally the app behaves the same as a freshly-installed app on next
   load (every settings loader self-heals to defaults when its file is missing), but the mechanism is
   deletion, not a field-by-field reset — and unlike Reset Settings, this step is never scoped to
   "the active account only," since the whole directory (all accounts' subfolders) is removed in one
   shot.
4. **`localStorage`/`sessionStorage` are cleared**, preserving a small allowlist
   (`preserveKeysAndClearData`'s `KEYS_TO_PRESERVE`): the current theme key (`sgi-theme`), whether
   the close-to-tray notice was already shown, seen-notifications state, dismissed-banners state,
   and the `hasUpdated` flag — the same allowlist a major app-version update's own relaunch flow
   preserves. **`licenseKey` is explicitly NOT in this allowlist** (contrast the separate, one-time
   legacy-migration cleanup path, which does preserve `licenseKey` specifically) — Clear Data wipes
   your locally-stored Pro license key from this device along with everything else. Re-entering/
   reactivating a license after using Clear Data is expected, not a bug.
5. The Settings modal closes and the app navigates to `/` (the sign-in landing page) — since every
   account is now signed out, this is the only page that still makes sense to show.

On failure partway through, a red toast appears using the same `debugErrorMessageKey` mapping as
every other Debug-tab action (generic fallback, since Clear Data has no dedicated error code).
Because several steps are individually try/caught (per-account sign-out, log clearing, cache
clearing), a partial failure in one step doesn't necessarily stop the rest from completing — the
final `preserveKeysAndClearData()`/navigate-to-`/` steps still run even if, say, `clear_log_file`
failed for one account's cleanup pass.

## Docs-page comparison (folded in, not separately worth reading)

The live docs page (`docs/settings/debug.mdx`) is accurate on the surface mechanics — its Logs
section, log-file-location Callout, and MockButton usages (`view-log-file`, `clear-logs`,
`reset-settings`, `clear-data`, `export-settings`, `open-settings-file`) all match the real
component and this file's descriptions above. It is, however, **far vaguer than the real behavior**
on the two destructive actions: it describes Reset Settings only as "reset all of SGI's settings
back to default" (no mention of the active-account-only scoping, or that it reaches idling/
max-playtime/ownership settings on top of the four features it does name in the in-app dialog), and
describes Clear Data's scope as "settings, feature queues, logs, recent searches, inventory locks,
etc." without explaining that this specifically works by deleting the entire cache directory
(which happens to be where `settings.json` lives) rather than a bespoke per-file wipe. Both destructive actions carry a `Callout type="warn"` marking them irreversible, matching their in-app
AlertDialog confirmations.
