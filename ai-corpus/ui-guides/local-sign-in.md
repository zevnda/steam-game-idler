<!-- url: https://steamgameidler.com/docs/get-started/how-to-sign-in -->
# Legacy Sign-in (Local/CLI-Mode Sign-in)

This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/features/local-sign-in/` component/hook source, `src-tauri/src/local_steam/commands.rs` and
`vdf.rs`, and the "Legacy Sign-in" half of the `get-started/how-to-sign-in.mdx` docs page. It is
the single merged source for this feature (UI + docs + cross-feature connections) and should be
regenerated via that skill whenever this screen's UI, its backend commands, or that docs page
change — not hand-patched for small drift. The entry point one screen before this ("Steam Sign-in"
vs "Legacy Sign-in" landing choice) is covered by a separate guide for `sign-in-landing`; this file
only covers the screen reached after clicking "Legacy Sign-in".

## Windows-only — this entire flow does not exist on Linux

Legacy Sign-in (also called CLI mode / local Steam client mode in code comments) requires a real,
installed local Steam client and Steamworks.NET-backed `SteamUtility.exe` CLI dispatch, neither of
which exist as a concept on Linux. `src/features/sign-in-landing/components/SignInLanding.tsx`
reads `usePlatformStore(state => state.currentOs)` (from `src/shared/stores/platformStore.ts`,
populated once at app root via `usePlatform()`) and, when `currentOs === 'linux'`, hides the
"Legacy Sign-in" button entirely — not just disables it. `null` (not yet resolved) is treated as
"not Linux", so on a slow/failed platform check the button still renders for one frame rather than
flashing away — Linux users only ever see "Steam Sign-in". Every component and command described in
this guide (`LocalSignInScreen`, `AccountPicker`, `AccountOption`, `useLocalSignIn`, and every
Tauri command in `src-tauri/src/local_steam/commands.rs`) is therefore only ever reachable on
Windows. `local_steam/commands.rs` itself still compiles on Linux (a few sibling modules in that
folder, like `free_game_claim`, are genuinely shared with agent mode), but nothing in the Linux
frontend ever calls into the sign-in commands covered here.

## How you reach this screen

From the sign-in landing screen (`src/pages/index.tsx`, or `AddAccountModal` when adding an
additional account from inside the dashboard), clicking the "Legacy Sign-in" button
(`t('auth.landing.localButton')`) switches local screen state to this account-picker screen — no
route change, just a `useState` swap between `'landing'`/`'agent'`/`'local'` in the parent. This
screen is `LocalSignInScreen` (`src/features/local-sign-in/components/LocalSignInScreen.tsx`),
wrapped in the shared `AuthCard` (title "Choose an account", `t('auth.localSignIn.title')`) inside
`AuthLayout`'s two-pane shell (logo/glow on the left, hero panel on the right, language switch and
a "Need help?" link — which opens `https://steamgameidler.com/docs/get-started/how-to-sign-in` —
fixed bottom-left).

## What loads immediately — the account list fetch

As soon as the screen mounts, `useLocalSignIn` (`src/features/local-sign-in/hooks/useLocalSignIn.ts`)
starts fetching in `phase: 'loading'`:

1. Calls the `get_users` command, which locates the local Steam install via `steamlocate` and parses
   every account block out of `<steam>/config/loginusers.vdf` — every account that has ever signed
   into the local Steam client on this machine, not just the currently active one. An account
   doesn't need to be currently logged into Steam right now to appear here, only to have signed in
   at least once historically. If Steam simply isn't installed, this step needs nothing more than a
   readable `loginusers.vdf`, not a running Steam process.
2. If any accounts came back, it fetches persona name/avatar for them from the Steam Web API,
   preferring a local cache (`get_user_summary_cache`, reading `user_summaries.json`) and only
   hitting the live API (`get_user_summary`, with all uncached steam IDs joined into one
   comma-delimited request) for whichever accounts aren't already cached.
3. The two results are merged (`mergeAccounts.ts`): each account's persona name/avatar comes from
   the Steam Web API summary if one was found, otherwise falls back to the raw persona name already
   stored in `loginusers.vdf` with no avatar. Accounts are sorted with the most-recently-signed-in
   account first (`mostRecent` flag — see below), matching the local Steam client's own default
   ordering.
4. The most-recent account is pre-selected automatically (`selectedSteamId` defaults to whichever
   account has `mostRecent: true`, or the first account in the list if none does).

While this is in flight, `AccountPicker` shows only a centered large `Spinner` — no account grid,
no buttons.

## The account grid — what you're actually choosing between

Once loaded, this **is not** "pick which physical Steam install to use" — it's a plain radio-button
picker over every account that has ever signed into the *one* local Steam client already installed
on this machine (`AccountPicker`/`AccountOption`, wrapped in a HeroUI `RadioGroup`). Each account
renders as an `AccountOption`:

- A large, square-rounded avatar (`size-20` on small windows, `lg:size-32` once the window is wide
  enough) — not HeroUI's default small circle. If no avatar URL resolved for that account, it falls
  back to a single-letter avatar (the first character of the persona name, uppercased, or `?` if the
  persona name is empty/whitespace).
- The persona name centered underneath, truncated with an ellipsis if too long for the card.
- **Selection indicator**: there's no separate radio dot at all. The selected option's avatar gets a
  padded box behind it filled with a diagonal cyan→blue→violet gradient
  (`from-cyan-500 via-blue-500 to-violet-700`) — that gradient border is the only visual sign of
  which account is selected.

The whole grid sits in an independently scrollable container (`max-h-56` on small windows,
`lg:max-h-80` on wide ones — roughly two rows of avatars before it starts scrolling) so the
Continue/Refresh buttons below stay reachable regardless of how many accounts the local Steam
client has ever signed into.

If `get_users` came back with zero accounts (a fresh Steam install nobody has ever signed into),
the grid is replaced by an empty state: "No Steam accounts were found on this device. Sign into the
Steam client at least once, then refresh." (`t('auth.localSignIn.noAccounts')`).

## Selecting an account — happens immediately, not deferred to Continue

Clicking an avatar calls `selectAccount(steamId)` right away, and — if the account you just picked
is **not** the one already flagged `mostRecent` in `loginusers.vdf` — it immediately (in the
background, before you click Continue) calls the `prepare_steam_account_switch` command with that
steam ID. This command:

- Rewrites `loginusers.vdf` so the target account's `AllowAutoLogin`/`MostRecent`/`AutoLogin`
  keys (whichever the file actually uses — see below) are set to `1` and every other account's are
  cleared to `0`, and stamps a fresh `Timestamp` on the target account's block.
- Writes the target account's Steam `AccountName` (not persona name) to the
  `HKCU\Software\Valve\Steam\AutoLoginUser` registry value, so the local Steam client will
  auto-log into it on next launch.

**This call's failure is silently swallowed** — if it errors (e.g. a registry write failure,
`registry_update_failed`, or the VDF no longer containing that steam ID,
`steam_id_not_found`), the only trace is a `console.error`; nothing is shown on screen, no error
banner appears, and `selectedSteamId` still updates in the UI as if selection succeeded. If this
silently fails, then pressing Continue afterward (see below) will still restart the local Steam
client, but it may come back up on the *previous* account rather than the one you just clicked,
with no error surfaced at any point in the flow. This is worth knowing when troubleshooting "I
picked a different account but it signed into the wrong one."

Two on-disk `loginusers.vdf` schemas exist across real Steam client versions: an older
`MostRecent`/`AllowAutoLogin` pair, and a newer client that dropped both in favor of a single
`AutoLogin` key doing the same job. `prepare_steam_account_switch` only rewrites whichever of these
keys are actually present in a given account's block — it never inserts a key that wasn't already
there — so this works correctly against either schema without knowing in advance which one a given
user's Steam install uses.

## Continuing — what "Continue" actually does, and why it differs by account

The Continue button (`t('common.actions.continue')`) is disabled (native `isDisabled`) until an
account is selected, and shows a pending-spinner state (`isPending`) while `continueSignIn` is
running. What it does depends on whether the selected account was already the local Steam client's
active/most-recent account at the moment you opened this screen:

- **If you selected a *different* account than the one already active** (`selectAccount` already
  rewrote `loginusers.vdf`/the registry key for it, as above): Continue calls `switch_steam_account`.
  This force-kills `steam.exe` (`taskkill /F /IM steam.exe` — a non-zero exit here, e.g. because
  Steam wasn't actually running, is not treated as an error), polls up to 5 seconds for the process
  to actually exit, then relaunches `steam.exe` fresh. On relaunch, Steam reads the
  already-rewritten VDF/registry value and auto-logs into the newly selected account.
- **If you selected the account that was already active** (`mostRecent`): Continue just checks
  `is_steam_running`, and only calls `launch_steam` (a plain launch, no kill) if Steam isn't already
  running. If Steam is already running and already on that account, this step does essentially
  nothing beyond that one status check.

**You do not need Steam already running to reach or use this screen at all** — `get_users` only
needs a readable `loginusers.vdf` on disk, and Continue itself will launch Steam (or kill-and-
relaunch it) as needed depending on which branch above applies. The published docs page's warning
Callout ("You must have the Steam client installed, running, and signed in to at least one
account") is stricter than the actual code: installed and previously signed-in-at-least-once are
real requirements (no accounts would ever appear otherwise), but "already running" specifically is
not — the app starts/restarts Steam for you as part of Continue.

On success, `useLocalSignIn` calls `sessionStore.setAccount({ mode: 'local', steamId })` (marking
this as the app's one Legacy Sign-in / CLI-mode session), logs a `local sign-in completed`
frontend-info breadcrumb, and sets `phase: 'success'`. `LocalSignInScreen` reacts to `phase ===
'success'` by rendering nothing but a centered `Spinner` (no `AuthCard`, no back button) while a
`useEffect` pushes the router to `/dashboard`.

If any step throws (`prepare` was already fired-and-forgotten earlier, but `switch_steam_account`/
`is_steam_running`/`launch_steam` here can still fail — e.g. Steam's executable can't be spawned),
`actionErrorCode` is set and `phase` reverts to `'ready'`, surfacing a danger `Alert` above the
Continue/Refresh buttons: title "Something went wrong" (`common.errorBoundary.title`), with a
description mapped from the error code (see the error table below).

## The Back and Refresh controls

- **Back** (`BackButton`, fixed top-left, `TbArrowLeft` icon-only button): only rendered while
  `phase === 'ready'` — it's deliberately hidden during `'loading'` and `'continuing'` so backing
  out mid-request can't strand an in-flight account fetch or an in-flight Steam-switch/relaunch.
  Clicking it calls the `onBack` prop, which (from `src/pages/index.tsx`) just resets the parent's
  local screen state back to `'landing'` — pure client-side state, no navigation, no cleanup command
  is called.
- **Refresh** (icon-only secondary button next to Continue, `TbRefresh` icon, `aria-label`
  `t('common.actions.refresh')`): disabled while `isContinuing`. Clicking it calls
  `delete_user_summary_file` (clears the cached `user_summaries.json` — harmless even if that file
  doesn't exist) and then re-runs the whole `loadAccounts` sequence from scratch, including a fresh
  Steam Web API lookup for every account rather than trusting the cleared cache. Useful after
  signing into a new account on the local Steam client for the first time (so it shows up in the
  list) or after a stale/wrong cached avatar.
- The same `refresh` function also backs the "Try again" button shown under a fatal load error (see
  below) — it's the one recovery action for both cases.

## Error states — exactly what each one looks like

Three independent, differently-scoped error states exist, each surfaced as its own `Alert`:

- **`loadErrorCode`** (fatal to the whole screen) — set only when `get_users` itself throws. CLI
  mode can't work at all without a readable local Steam install, so this replaces the entire
  `AccountPicker` with a centered danger `Alert` (title "Something went wrong",
  `common.errorBoundary.title`) plus a "Try again" button (`common.actions.tryAgain`) that calls
  `refresh`.
- **`summaryErrorCode`** (degraded, not fatal) — set when the persona/avatar Steam Web API lookup
  fails after `get_users` already succeeded. The account grid still renders (steam ID + persona name
  straight from the VDF, fallback-letter avatars), with a warning-status `Alert` (no title, just a
  `Description`) shown above it. Note this warning alert's description doesn't pass an interpolation
  value for `{{code}}` the way the other two error banners do — harmless for every currently mapped
  code (none of their translated strings actually contain a `{{code}}` placeholder), but would leave
  a literal `{{code}}` in the text if an unmapped code ever reached this particular banner.
- **`actionErrorCode`** (scoped to the Continue action) — set when `continueSignIn` itself throws.
  Shown as a danger `Alert` (title + description, with `{{code}}` interpolation) directly above the
  Continue/Refresh button row, without replacing the account grid — you can immediately try a
  different account or press Continue again.

Every code below is mapped via `src/features/local-sign-in/utils/errorMessageKey.ts` (an unmapped
code falls back to `common.errors.generic`, "Something went wrong. Please try again. ({{code}})"):

| Error code | Shown message | Which state | When it actually happens |
|---|---|---|---|
| `steam_not_found` | "Couldn't find a local Steam installation." | `loadErrorCode` | `get_users` — the local Steam install can't be located at all (steamlocate failure) |
| `login_vdf_io_failed` | "Couldn't read this device's saved Steam accounts." | `loadErrorCode` | `get_users` — `loginusers.vdf` exists but can't be read (permissions, in-use, etc.) |
| `login_vdf_parse_failed` | "Couldn't read this device's saved Steam accounts." | `loadErrorCode` | `get_users` — the VDF's regex-based parse itself fails |
| `steam_id_not_found` | "That account could no longer be found." | would be `actionErrorCode`, but see note above — actually only ever thrown by `prepare_steam_account_switch`, whose rejection is swallowed to `console.error` and never reaches the UI | the selected steam ID's block wasn't found while rewriting the VDF |
| `registry_update_failed` | "Couldn't switch Steam accounts." | same swallowed-error caveat as above | the `reg add ... AutoLoginUser` command failed |
| `local_process_spawn_failed` | "Couldn't start the Steam client." | `actionErrorCode` | `launch_steam`/`switch_steam_account`'s relaunch step couldn't spawn `steam.exe` |
| `steam_api_key_missing` | "Couldn't load account details right now." | `summaryErrorCode` | the app's built-in Steam Web API key couldn't be resolved |
| `steam_api_request_failed` | "Couldn't load account details right now." | `summaryErrorCode` | the Steam Web API HTTP request itself failed |
| `steam_api_response_invalid` | "Couldn't load account details right now." | `summaryErrorCode` | the Steam Web API response didn't parse as expected JSON |
| `user_summary_cache_io_failed` | "Couldn't load account details right now." | `summaryErrorCode` | `user_summaries.json` couldn't be read/written |

## The single-account ceiling — a real technical limit, not a monetization gate

Legacy Sign-in can only ever have **one** signed-in account at a time, because it works through a
single real local Steam client process, and a Steam client itself can only be logged into one
account at once — this is a hard ceiling, not something SGI's UI imposes. This shows up specifically
in `AddAccountModal` (the account-switcher's "Add another account" flow,
`src/features/account-switcher/components/AddAccountModal.tsx`), reusing the exact same
`SignInLanding`/`AccountPicker`/`useLocalSignIn` building blocks described in this guide:

- `AddAccountModal` computes `hasLocalAccount` from `sessionStore` (`Object.values(state.accounts)
  .some(account => account.mode === 'local')`) and passes it as `SignInLanding`'s `localDisabled`
  prop.
- If a Legacy Sign-in account is already signed in, the "Legacy Sign-in" button in that modal
  becomes a genuine **native `isDisabled` `Button`** (unlike every Pro-tier gate elsewhere in this
  app, which always stays a real, clickable element with a `TierBadge` rerouted to the upgrade
  modal) — because a native-disabled control correctly and permanently blocks the one thing that
  really can't happen (a second local session), rather than something a subscription upgrade could
  ever unlock. Muted helper text underneath reads: "A local Steam client account is already signed
  in — only one can be signed in at a time." (`t('auth.landing.localAlreadySignedIn')`).
- This ceiling is completely independent of subscription tier and of the concurrent Steam Sign-in
  (agent-mode) account cap — you can always have one Legacy Sign-in account signed in *alongside*
  as many Steam Sign-in accounts as your tier allows; Legacy Sign-in never counts against that cap
  at all, and no amount of subscription upgrade changes the one-account ceiling.
- The initial sign-in landing page (`src/pages/index.tsx`, before any account is signed in yet)
  never needs to compute or pass `localDisabled` at all, since there's by definition no existing
  Legacy Sign-in session yet at that point — the disabled state is only ever reachable through
  `AddAccountModal`.

## One real capability Legacy Sign-in has that Steam Sign-in doesn't: playing games while idling

The published docs page's "What's different between the two" comparison table states this as a
plain fact (not something derivable from this screen's own component code, so it's carried over
faithfully rather than paraphrased): with Legacy Sign-in, you **can** play a game normally while it
is also being idled by SGI; with Steam Sign-in (agent mode), you **cannot**. Every other row in
that same table (Steam client required, sign-in method, multiple-accounts-at-once) is already
covered by its own section above — this is the one row this guide hadn't yet folded in. The likely
mechanical reason, per `backend-architecture.md`'s note that "idling is architecturally different
per backend": Legacy Sign-in's idling runs one real Steamworks.NET-backed OS process per idled
game (the same kind of process a running game normally has), so a real game launch alongside it is
just a second, independent process the local Steam client is already used to seeing — whereas
agent mode's idling is a single `idle_set` announcement over an existing SteamKit2 connection, with
no real per-game process backing it at all, so Steam has nothing to reconcile a simultaneous real
launch against. This isn't confirmed by reading agent-mode's own launch-blocking behavior in this
session, so treat the "likely reason" clause as explanatory context, not an independently verified
mechanism — the row itself (yes/no) is the verified, load-bearing fact.

## Cross-feature connections

- **`sessionStore`**: `continueSignIn`'s success path is this feature's only interaction with
  `sessionStore` — it calls `setAccount({ mode: 'local', steamId })`, which becomes this session's
  `AccountKey` of `local:<steamId>` throughout the rest of the app (account switcher, per-feature
  per-account stores, sign-out flow, etc.). This screen itself doesn't read any other shared store.
- **`platformStore`**: read one level up, by `SignInLanding`, to decide whether the "Legacy Sign-in"
  button exists at all (see the Windows-only section above) — `LocalSignInScreen` itself is never
  reached in the first place on Linux, so it has no platform-check of its own.
- **`AddAccountModal`** (account-switcher feature) reuses this screen's `AccountPicker` and
  `useLocalSignIn` hook directly, unmodified, when adding a Legacy Sign-in account from inside the
  dashboard — see the single-account-ceiling section above for the one behavioral difference that
  context adds (the native-disabled button state).
- **Post-sign-in Steam-running monitoring is out of scope for this screen, but directly related**:
  once a Legacy Sign-in account is active, `useSteamMonitor` (`src/shared/hooks/useSteamMonitor.ts`,
  mounted once in `DashboardShell`) starts a backend poll (`start_steam_status_monitor`, emitting
  `steam-status-changed` events) and reacts to the local Steam client closing mid-session by
  stopping that account's idling/card-farming/achievement-unlocking and raising the blocking,
  undismissable `SteamWarning` modal ("Steam is closed. Please relaunch Steam to continue.", with a
  "Continue" button that calls `launch_steam` — the same command this sign-in screen itself uses).
  This modal only exists inside the dashboard shell, never on this sign-in screen.
- **Sign-in-mode branching in feature commands**: many per-game feature commands
  (`achievements::commands`, `auto_idle::commands`, `card_farming::commands`,
  `achievement_unlocker::commands`, `idling::commands`) call
  `local_steam::commands::require_steam_running()` as a pre-flight gate before doing real work when
  the active account is in Legacy Sign-in mode — rejecting upfront with the same
  `steam_not_running` error identity `SteamUtility.exe`'s own CLI dispatch would report, rather than
  failing deep inside a spawn/loop. None of those gates apply to the sign-in screen itself, which
  never calls `require_steam_running` — only `continueSignIn`'s own `is_steam_running` check (not
  the hard-reject gate) is relevant here.
- **Settings**: this screen and `useLocalSignIn` don't read or write any settings file — the only
  on-disk state involved is `loginusers.vdf` (owned by the local Steam client itself, not SGI) and
  SGI's own `user_summaries.json` cache (a cache file, not a settings file, cleared by
  `delete_user_summary_file`).

## Docs vs. code note

The published docs page (`get-started/how-to-sign-in.mdx`, "Legacy Sign-in" section) states a
warning Callout that Steam must be "installed, running, and signed in to at least one account." The
"installed" and "signed in to at least one account" parts are accurate and load-bearing (there is
genuinely no account to pick otherwise), but "running" is stricter than the real code: this screen's
account list loads fine with Steam closed, and Continue itself launches or restarts Steam as needed
(see "Continuing" above) — you never have to manually start Steam yourself first. This guide
reflects the actual code behavior; the live docs page's wording is not changed by this guide and
would need a separate manual edit if this is worth tightening up.
