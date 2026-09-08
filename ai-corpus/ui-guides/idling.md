<!-- url: https://steamgameidler.com/docs/features/playtime-booster -->
# Idling (Playtime Booster)

This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/features/idling/` component/hook source, `src/features/games-list/components/GameCard.tsx`
(which this feature reuses directly), the backend `idling`/`max_playtime` modules, and the
`features/playtime-booster.mdx` docs page (the live docs page for this feature — despite the
component folder being named `idling`, the public docs and in-app copy call this "Playtime
Booster"). It is the single merged source for this feature (UI + docs + cross-feature connections)
and should be regenerated via that skill whenever the Idling page's UI, the idle-claims mechanics,
or the docs page change — not hand-patched for small drift.

## What "idling" means and the 32-game limit

Idling a game means telling Steam the game is "running" without actually launching it, so its
playtime hours accrue. This is useful for reaching the playtime thresholds trading cards need to
start dropping, padding profile stats, or just keeping a game "running" in the background. You can
idle a maximum of 32 games simultaneously, across every SGI feature combined (manual idling,
Auto-Idle, Achievement Unlocker's "idle while unlocking," and Card Farming) — this is a real Steam
client protocol limit (`idling::MAX_CONCURRENT_GAMES` in the backend, matching SteamKit2's
`MaxConcurrentGames`), not an app-imposed cap. If more than 32 games are ever requested at once
across every owner combined, the backend dedups by app id (first-seen wins) and silently truncates
to the first 32 — there's no error or warning shown for this; it's a hard ceiling.

## Starting and stopping a game — the actual click path

Idling itself does not start from the Idling page. It starts from a game's card wherever a
`GameCard` is rendered — most commonly the **Games** page (the default page after signing in,
reached via the sidebar's "Games" item). Each `GameCard` shows a small icon-only button on its
thumbnail: a filled play-triangle icon (`TbPlayerPlayFilled`) when the game isn't idling, or a
filled stop-square icon (`TbPlayerStopFilled`) when it is. Its `aria-label` is literally "Start
idling {game name}" or "Stop idling {game name}" depending on state. Clicking it calls the
`toggle_manual_idle` backend command for that one app id — there is no separate confirmation step.

- **Starting** a game that no game currently claims adds it to the `"manual"` owner's claim (see
  "Idle claims" below) and re-announces the updated idle set. If the account's max-playtime cap for
  that game has already been reached, the start is blocked outright with the error "This game has
  already reached its max playtime cap." rather than starting and immediately being force-stopped a
  tick later.
- **Stopping**: clicking the same button on an already-idling game's card releases that app id from
  **every** owner that currently claims it, not just `"manual"` — so clicking a game's own stop
  button correctly stops it even if it's idling because Auto-Idle, Achievement Unlocker, or Card
  Farming claimed it, rather than silently no-opping. As part of this, the backend also explicitly
  tells the Card Farming and Achievement Unlocker managers to drop that one game from their own
  internal active-game bookkeeping (`remove_active_game`) — this matters because those two features
  track their own active-game state independently of the claims registry and would otherwise
  silently re-add the game on their very next unrelated state change, undoing the stop. This
  per-game stop does **not** stop the rest of that owner's session — if Card Farming was farming
  five games and you stop one of them from its own card, the other four keep farming; only that one
  game is removed. (Contrast this with the Idling page's per-owner "Stop" button, covered below,
  which stops the *entire* session for that owner.)

While a toggle is in flight for a given app id, that card's button shows a pending/spinner state
(`isPending`) and is not clickable again until the request resolves.

**Legacy Sign-in (CLI mode) specific**: starting a game requires the local Steam client to actually
be running — if it isn't, the start is blocked with "Steam isn't running. Please start Steam and try
again." before any process is spawned. Steam Sign-in (agent mode) has no such requirement since it
doesn't depend on a local client at all.

## The Idling page — a filtered view of what's already idling, not where idling starts

Reached via the sidebar's "Idling" item (`/dashboard/idling`). This page does **not** have its own
"start idling" control — it is a read-only-except-for-stopping view of whatever is currently idling,
filtered down from the full owned-games list. Its header (`IdlingPageHeader`) shows the page title,
a game count ("{{count}} game idling" / "{{count}} games idling", pluralized), and, only when at
least one game is idling, a red "Stop all" button (`TbPlayerStopFilled` icon + text, top-right).

Below the header, the page renders one of three states:
- **Loading**: if there's already a nonzero idling count from a previous load, a skeleton grid with
  that many placeholder tiles is shown while game details (names/header images) are fetched.
- **Error**: if the owned-games fetch fails, a danger `Alert` with a "Try again" button.
- **Empty**: if nothing is currently idling, a centered empty state — a large play-icon
  (`TbPlayerPlay`), title "No games idling", description "Start idling a game from the Games tab to
  see it here."
- **Populated**: one section per originating feature (see "Grouping by owner" below), each
  containing a plain (non-virtualized) CSS grid of game cards. Never virtualized — the whole page is
  capped at 32 games total across every section combined, so no section can realistically grow large
  enough to need it.

The page reuses `src/features/games-list/components/GameCard.tsx` **directly** rather than building
its own card component — the same component the Games page itself uses. On the Idling page, every
card is rendered with `isIdling` forced to `true` (every game shown here is, by construction,
already idling) and additionally receives an elapsed-time badge overlay (see "Elapsed-time badge"
below) that the Games page's plain browse grid doesn't need. Clicking a card's stop button here goes
through the exact same `toggleIdle`/`toggle_manual_idle` path described above — it releases that one
game from every owner claiming it, the same as stopping it from the Games page would.

## Grouping currently-idling games by owning feature

The Idling page's central real behavior is grouping every currently-idling app id into a section per
originating feature, rather than showing one flat list. This is computed by
`src/features/idling/utils/groupIdlingGames.ts` from two pieces of state: the flat list of idling
app ids (`get_idle_state`) and a per-owner breakdown (`get_idle_claims`, returning
`{owner: [appIds]}` for owners `"manual"`, `"auto_idle"`, `"achievement_unlocker"`,
`"card_farming"`).

**Fixed precedence when a game is claimed by more than one owner at once** (e.g. a game manually
started while also sitting in the Auto-Idle queue): `manual > card_farming > achievement_unlocker >
auto_idle`. The grouping walks owners in that exact order, and once an app id is placed into a
group under one owner it's removed from consideration for every later owner — so a game always
renders under exactly one section, never duplicated. Section titles: "Manually idled" (manual, this
feature's own dedicated key), "Card Farming", "Achievement Unlocker", "Automatic Idler" — the latter
three reuse the same translation keys as their respective sidebar nav labels.

**A trailing "Other" section** catches any idling app id that's present in the flat idling list
(`get_idle_state`) but doesn't appear in *any* owner's claim record (`get_idle_claims`) — this isn't
a bug state to hide; it's an intentional fallback for the inherent small race between those two being
independent backend calls: a claim can change in the moment between the two fetches, leaving a
briefly-inconsistent snapshot. This is normally a single-tick visual blip that resolves itself on the
very next `syncClaims()` refresh, not a persistent state. (Note: the reverse mismatch — a stale claim
entry for a game whose process already died — does *not* land here; see "Known limitation" below for
what that actually produces.) The "Other" section has no per-section "Stop" button of its own
(there's no single owner to target) — only the page's global "Stop All" covers games in this bucket.
Groups with zero games are omitted entirely, so an owner with nothing currently idling shows no
section at all.

## Per-owner "Stop" — why some owners use a different command than others

Each section except "Other" gets its own small red "Stop" button (top-right of that section's
header, `TbPlayerStopFilled` icon + "Stop" text) alongside its game count. Unlike an individual
card's stop button (which releases just one game), this button stops **every** game in that entire
section/owner at once. Which command it dispatches depends on the owner:

- **`"card_farming"`** dispatches `stop_farming`, and **`"achievement_unlocker"`** dispatches
  `stop_achievement_unlocker` — each owner's own existing stop command, not the generic idle-release
  command. This is deliberate: Card Farming and Achievement Unlocker each run a persistent
  per-account backend loop that periodically re-announces its own claim from its own internal
  active-game state. If the Idling page only released their idle claim (without telling that loop to
  actually stop), the loop would simply re-claim the same games on its very next tick, making the
  "Stop" button appear to do nothing. Calling the feature's real stop command halts the loop itself,
  which releases the claim as a side effect of stopping — so the games actually stay stopped.
- **`"manual"`** and **`"auto_idle"`** dispatch the generic `stop_owner_idling` command instead
  (passing that owner's name) — because neither has a backend loop of its own that would re-claim
  anything. For these two owners, the idle-claims registry genuinely *is* the entire state; releasing
  the claim is the complete and correct stop.

Every per-section stop (and the global "Stop All") re-fetches `get_idle_state` once the command
resolves, rather than trusting the command's own return value, to stay consistent with whatever the
backend's real idle-state event may have already applied concurrently.

## Global "Stop All"

The "Stop all" button in the page header calls `stop_all_idling`, which is stronger than simply
clearing every owner's claim: it first explicitly stops the Card Farming and Achievement Unlocker
session loops for the account (each stop call is a safe no-op if that feature wasn't running), *then*
clears every owner's idle claim and announces an empty set. This mirrors the per-section stop's same
reasoning at the whole-account scope — without stopping those two loops first, they would otherwise
just re-claim their games on their next tick, leaving a "zombie" session that still shows as running
on its own page with nothing actually idling underneath it. "Stop All" only affects the
currently-viewed account; other signed-in accounts' idling is untouched. While in flight, the button
shows a pending spinner (`isStoppingAll`) via `isPending`.

## Idle claims — how one feature's idling can't clobber another's

Every idle-consuming feature (manual idling from this page/the Games page, Auto-Idle, Achievement
Unlocker's "idle while unlocking" setting, Card Farming) claims idle slots through the backend's
`idling::claims::IdleClaimsRegistry` rather than announcing directly to Steam — this is what stops
one feature's idle request from silently wiping out another feature's currently-idling games,
since neither backend (the CLI process manager or the agent daemon) understands "the desired set
*for this owner*," only "the desired set, period." Without this registry, whichever caller announced
most recently would win and erase everyone else's games.

Concretely: each owner (`manual`, `auto_idle`, `achievement_unlocker`, `card_farming`) holds its own
`{app_id: name}` claim, scoped per signed-in account (a resolved SteamID64) so one account's claims
can never leak into another's announce. Whenever any owner's claim changes, the registry computes the
**union** of every owner's current claim for that account and re-announces that full union to
whichever backend the account uses. The frontend's `idlingStore` is kept in sync with this by
`useIdlingSync` (`src/features/idling/hooks/useIdlingSync.ts`), mounted once from `DashboardShell`
so it keeps tracking regardless of which `/dashboard/*` route is showing — not from the Idling page
itself, so idling state and its elapsed-time timers survive navigating away and back.

`syncClaims()` (in `useIdlingSync.ts`) re-fetches `get_idle_claims` after every observed change to
the flat idling app-id list, from three independent call sites: manual idling's own action hook
(`useIdling.ts`, after every toggle/stop/stop-all/stop-section resolves), Auto-Idle's startup
trigger, and the idling sync listener's own event handler (whenever the backend's
`idling-state-changed` event fires). It's re-fetched rather than derived from the event payload
because neither backend's idle-state-changed emit site carries owner information at all — the claims
registry is the sole source of truth for "who owns what," so a fresh fetch right after any app-id
change is the only way to stay accurate.

## Cross-feature: reusing games-list's GameCard component directly

The Idling page's own components (`IdlingSection.tsx`) import and render
`src/features/games-list/components/GameCard.tsx` directly, rather than building a separate idling-
specific card — a concrete example of one feature folder importing another feature folder's
component outright, not just a shared `src/shared/` component. This is a deliberate architectural
choice mirrored in the component's own comments: idle *controls* live on the card itself (matching
the pre-rewrite app's layout) so the Idling page's whole job is reduced to "a filtered, view-only
list of whichever games those controls have started," rather than owning a second, parallel
start/stop implementation. Because `GameCard` is also the one place that opens the achievement-
manager overlay (its trophy-icon button, `TbTrophyFilled`, calls
`achievementManagerStore.open(appId, displayName)`), the Idling page inherits that behavior for
free — clicking the trophy icon on any card on the Idling page opens the same
`AchievementManagerOverlay` (rendered once by `DashboardShell`) that opening it from the Games page
would, for that same game.

## Elapsed-time badge and its card-farming interaction

Every idling `GameCard` on the Idling page additionally renders an `IdleTimer` overlay on its
thumbnail (top-left, a small dark pill with a play icon and a running `HH:MM:SS`/`MM:SS` clock) —
this only appears here, not on the Games page's browse grid, since it's passed in via the
`idleStartTime` prop only the Idling page supplies. The timer is a **frontend-only** measurement:
neither backend reports when idling actually started, only what's currently idling, so it can only
measure "since this session last observed the game idling" — it does not persist across an app
restart and does not reflect true wall-clock Steam-side idle duration.

For a game currently active in a Card Farming session specifically, the start time shown is
overridden by Card Farming's own `activeSince` timestamp (from `cardFarmingStore`) instead of
`idlingStore`'s own raw timestamp. This matters because Card Farming's automation deliberately stops
and restarts idling every few minutes as part of its internal restart cycle — without this override,
the elapsed-time badge would visibly reset to zero every restart-cycle tick for every card-farming
game, since `idlingStore` has no memory of "this is the same idle session, just blipped." Every other
game (idling via manual/auto-idle/achievement-unlocker, or a card-farming game merely queued rather
than actively farming) is unaffected and uses `idlingStore`'s own timestamp as normal.

## Auto-stop caps: Max Idle Time and Max Playtime (Game Settings tab)

Two independent, cross-cutting caps can auto-stop a manually-idled (or auto-idled) game — both
configured from Settings → Game Settings (`GameSettingsTab.tsx`), not from the Idling page itself,
and both apply to manual idling and Auto-Idle only, never to Achievement Unlocker or Card Farming
(each of those two runs its own separate, purpose-built cap check inside its own loop instead).

- **Max Idle Time** ("Max idle time (all games)" account-wide field, and a per-game "Max idle time"
  override that takes precedence over it when set — both under the "Idling" settings section, whose
  note reads "Only applies to manually and automatically idled games - achievement unlocker has its
  own separate cap below"). A value of `0` on either field means unlimited (shown as the "0 =
  unlimited" hint under each input). When set, the backend (`idling::auto_stop`) schedules a timer
  the moment a manual/auto-idle start succeeds; if that timer fires before being invalidated by a
  newer start or an explicit stop, the game is auto-released from that one owner specifically (not
  from every owner) — so a game claimed by both `"manual"` and `"auto_idle"` at once only actually
  stops once *both* owners' independent timers have either elapsed or been explicitly stopped.
- **Max Playtime** ("Max playtime (all games)" account-wide field, and a per-game "Max playtime"
  override — under the top "Playtime" settings section, whose note reads "Applies everywhere a game
  can be idled - manual and automatic idling, achievement unlocker, and card farming," i.e. this one
  cap genuinely is cross-cutting to every idle-consuming feature, unlike Max Idle Time). Backed by
  its own settings file (`max_playtime_settings.json`, one per signed-in Steam account, read by
  idling, Auto-Idle, Achievement Unlocker, and Card Farming alike — owned by no single feature).
  Manual idling's start button itself blocks a start outright if the game's cached playtime has
  already reached its effective cap, showing "This game has already reached its max playtime cap."
  For a game already idling, a background poll loop (`max_playtime::enforcement`, ticking every 60
  seconds) estimates each manually/auto-idled game's current playtime from its last-known cached
  playtime plus wall-clock elapsed time since observed idling, and force-releases it from its owner
  the moment the estimate crosses the effective cap — logged as "max playtime: auto-stopped (max
  playtime reached)". Both caps use the same precedence rule: a per-game override, when set to a
  nonzero value, always wins over the account-wide value; otherwise the account-wide value applies;
  `0` on both means fully uncapped.

Both settings-tab fields disable themselves appropriately: the account-wide field is disabled while
a specific game is selected in the tab's game list, and the per-game field is disabled until a game
is selected — enforced client-side in `GameSettingsTab.tsx`, not just described in copy.

## Known limitation: killing a CLI-mode idle process externally can make it silently restart later

If a game is idling under Legacy Sign-in (CLI mode) and its underlying `SteamUtility.exe idle`
process is killed externally — e.g. via Windows Task Manager, rather than through SGI's own stop
button — the CLI-mode background poller (`idling::manager::run_poller`, ticking every 2 seconds)
correctly detects the process exited and removes it from its own tracked set. Within a couple of
seconds this is reflected everywhere the user can see: the backend emits a fresh
`idling-state-changed` event with the reduced app-id list, `useIdlingSync` applies it to
`idlingStore`, and the game's card reverts to its non-idling "Start" state on both the Games page and
the Idling page (where it disappears from its section entirely, since a game only renders on the
Idling page while its app id is in the flat `get_idle_state` list) — **it does not stay stuck showing
as idling.**

The actual gap is invisible at the moment it happens: the idle-**claims** registry
(`idling::claims::IdleClaimsRegistry`) is never told the process died, since nothing in the poller's
detection path calls into it — only an explicit stop (a card's own toggle, a per-owner "Stop", or
"Stop All") clears a claim entry. So the dead game's app id quietly remains in whichever owner's
claim map it belonged to (almost always `"manual"`), even though nothing is actually running for it
anymore.

**The real symptom this produces**: the *next* time that same owner's claim changes for any
unrelated reason — starting or stopping a *different* manually-idled game, an auto-idle claim change,
anything that causes `IdleClaimsRegistry::replace_owner_claim` to recompute that owner's union — the
stale, still-claimed app id is included in the recomputed union and re-announced. For CLI mode,
`IdlingManager::set_games` sees that app id as "requested but not currently tracked" and spawns a
**brand-new** `SteamUtility.exe idle` process for it, silently resuming that game's idling without
the user asking for it. So the practical question this answers is closer to *"why did a game I killed
in Task Manager start idling again on its own"* than *"why does a game look permanently stuck
idling"* — the game disappears from every idling display almost immediately, then can unexpectedly
reappear later as a side effect of an unrelated action.

**A quieter related symptom**: clicking that specific game's own idle toggle again while its claim is
still stale (even though the card now correctly shows the "Start" icon) can look like a complete
no-op. `toggle_manual_idle` decides start-vs-stop by asking the claims registry `is_claimed`, not by
reading the displayed state — since the stale claim still says "claimed," the click is routed to the
*stop* path (`release_app_id`) instead of actually starting the game, and since the game was already
absent from the announced set, nothing visibly changes. This click is not wasted, though: it does
clear the stale entry, so the game will no longer be capable of the silent-resurrection behavior
above afterward.

**The fix, either way**: clicking that specific game's own idle-toggle button once (per the note
above), or a per-owner "Stop"/the global "Stop All" (which clear an entire owner's claim map or every
owner's claims respectively — though note "Stop All" only renders on the Idling page while at least
one game is currently idling, so it won't be visible to click if the killed game was the *only* one
idling), all explicitly remove the stale entry from the registry — any of these permanently resolves
it. This is a known, deliberately-unfixed gap documented directly in `idling::claims`'s own module doc
comment (rare enough in practice not to be worth hooking the poller into the claims registry), not a
bug to report.

Agent-mode (Steam Sign-in) accounts have no equivalent gap: the daemon itself is the single source of
truth for what's idling, so there is no separate local process that can fall out of sync with a
claims-registry entry the way a killed CLI-mode process can.

## Sign-in-mode differences (Steam Sign-in vs. Legacy Sign-in)

Idling's whole command surface (`toggle_manual_idle`, `stop_all_idling`, `stop_owner_idling`,
`get_idle_state`, `get_idle_claims`) is one shared set of Tauri commands that branches internally on
the `GamesAccount` enum (`Agent { username }` vs. `Local { steam_id }`) rather than exposing separate
mode-specific commands — the frontend never needs to know or care which mode the active account uses
to call any of them. The two backends genuinely differ in shape underneath that shared surface:

- **Steam Sign-in (agent mode)**: one `idle_set` announcement to the daemon covers up to all 32
  games at once — there's no concept of "one process per game." A start also best-effort attaches the
  account's saved custom idle-status text (if any) to the announcement; a failure to read that
  setting degrades to "no custom text" rather than failing the whole start. No local Steam client is
  required at all.
- **Legacy Sign-in (CLI mode)**: one separate OS process (`SteamUtility.exe idle <appId> <name>`) is
  spawned per currently-idling game — a hard Steamworks.NET/`SteamAPI_Init()` one-AppID-per-process
  constraint, not a code choice. Starting requires the local Steam client to actually be running
  (checked before spawning); if it isn't, the start fails immediately with "Steam isn't running.
  Please start Steam and try again." rather than attempting to spawn. The `name` argument passed to
  `toggle_manual_idle` only matters in this mode — it becomes that hidden process's window title;
  agent mode ignores it entirely. CLI mode's `IdleSetResult.failures` can report individual games
  that failed to spawn (e.g. a bad app id) without failing the whole call — agent mode's daemon has no
  equivalent per-game failure concept, so its `failures` list is always empty.

## Errors shown on the Idling page

Toggle/stop-all/stop-section failures surface as a danger toast (one-off feedback, not a persistent
banner) via `src/features/idling/utils/errorMessageKey.ts`, which maps a stable backend error code to
translated text:

- `idle_process_start_failed` → "Couldn't start idling this game." (CLI mode: the spawned process
  failed to start or reported failure)
- `max_playtime_cap_reached` → "This game has already reached its max playtime cap." (blocked start)
- `steam_not_running` → "Steam isn't running. Please start Steam and try again." (CLI mode only)
- `agent_session_not_found` → "Your Steam session isn't active anymore. Please sign in again."
- `agent_request_timeout` → "Steam took too long to respond. Please try again."
- `agent_process_exited` → "The Steam agent process closed unexpectedly."
- `steam_utility_exe_not_found` → "The Steam agent component is missing from this installation."
- `agent_process_spawn_failed` → "Couldn't start the Steam agent process."
- Any other/unrecognized code → the generic fallback, "Something went wrong updating idling. Please
  try again. ({{code}})", with the raw code interpolated in so it's still reportable.

The owned-games list itself (used to resolve idling app ids to names/thumbnails for display) can
separately fail to load — that surfaces as a full-page danger `Alert` with a "Try again" button
(distinct from the toast path above), using games-list's own error-message mapping rather than
idling's.

## Cross-feature: sidebar pulse and account-switcher automation dot

The sidebar's "Idling" nav item pulses (a `pulseWhenIdling` flag on its config entry) whenever the
active account currently has any games idling, read from `idlingStore`'s denormalized (active-
account) view. Independently, the account switcher's per-row automation indicator (a small filled
dot on that account's avatar) reads `idlingStore.entries[accountKey]?.appIds.length` directly — the
raw per-account `entries` map, not the denormalized view — specifically so a *backgrounded* signed-in
account's idling state stays visibly indicated in the switcher even while a different account is the
one currently displayed. Signing an account out calls that account's `clearEntry(key)` on
`idlingStore`, removing only that one account's cached idling state; every other signed-in account's
entry is left untouched.

## Settings ownership

Idling has no dedicated Settings-modal tab of its own (unlike Card Farming/Achievement Unlocker,
which each have a full settings tab). Its only persisted settings are the Game Settings tab's Max
Idle Time fields (own file, `idling_settings.json`, per signed-in SteamID64 — one global scalar plus
a per-game override map, self-healing to defaults if the file fails to parse) and its shared Max
Playtime cap (`max_playtime_settings.json`, likewise per-account, but not owned by idling alone —
also read by Auto-Idle, Achievement Unlocker, and Card Farming). Both settings files silently ignore
unknown/malformed keys rather than hard-failing a read, and both reset themselves to defaults
(logging a warning) rather than leaving an account permanently unable to load its settings if the
file is ever corrupted.
