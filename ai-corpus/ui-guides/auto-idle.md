<!-- url: https://steamgameidler.com/docs/features/auto-idle -->
# Automatic Idler (Auto Idle)

This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/features/auto-idle/` component/hook source, `src-tauri/src/auto_idle/` (commands, cache,
module doc comment), its cross-feature wiring (idle claims, `idlingStore`, the shared game-card
context menu, Achievement Unlocker's "next task" chaining, and the Game Settings tab's max-playtime/
max-idle-time caps), and the `features/auto-idle.mdx` docs page. It is the single merged source for
this feature (UI + docs + cross-feature connections) and should be regenerated via that skill
whenever Auto Idle's UI, commands, or docs page change — not hand-patched for small drift. For the
full mechanics of exactly which games get claimed and skipped on a trigger, see
`ai-corpus/architecture-guides/auto-idle-selection.md` (not duplicated here); for the max-playtime
cap in general, see `ai-corpus/architecture-guides/max-playtime.md`; for how idling is shared/
reconciled across features, see `ai-corpus/architecture-guides/shared-idling.md`.

## What Auto Idle is

Auto Idle (sidebar label "Automatic Idler", `TbHourglassLow` hourglass icon, in the sidebar's
"Automation" section alongside Card Farming and Achievement Unlocker) is a **manually curated
list of games**, not an automatic picker — despite the name, SGI never chooses games for you.
You build a list yourself, and whatever's left enabled in that list gets idled automatically every
time SGI launches, plus whenever you press "Start" yourself. It has its own route,
`/dashboard/auto-idle`, rendered by `AutoIdlePage`. It works identically regardless of sign-in mode
(Steam Sign-in/agent mode or Legacy Sign-in/CLI mode) and is not gated behind any Pro tier — there
is no `hasCasualAccess`/`hasGamerAccess`/`TierBadge`/`proModalStore` usage anywhere in this
feature's code, so every user on every tier gets full access.

## The page layout: header + two tabs

`AutoIdlePageHeader` sits above two tabs. On the left: the title "Automatic Idler" and, underneath
it, either "{{count}} games queued"/"{{count}} game queued" or "No games queued" depending on how
many games are currently in your list (regardless of their enabled/disabled state — this count is
the full queue size, not just the enabled ones). On the right: a primary "Start" button
(`TbPlayerPlayFilled` icon) and a plain icon-only "+" button (`TbPlus`, `aria-label` "Add game
manually").

- The **"Start" button** is disabled whenever zero games in your queue are currently enabled (even
  if the queue has entries, if all of them are toggled off the button stays disabled) and shows a
  loading/pending spinner while a start is in flight. Clicking it fires the exact same
  `start_auto_idle_games` trigger described below under "What actually happens when Auto Idle
  triggers."
- The **"+" button** opens the same shared `ManualAddGameModal` used by Favorites/Card
  Farming/Achievement Unlocker's headers — titled "Add game manually," with the description "Add a
  game by its Steam App ID if it isn't showing up automatically." It has a Name field and a numeric
  App ID field; submitting with an App ID already in your queue shows an inline error "This App ID
  is already in the list" instead of adding a duplicate. A game added this way is added with
  `enabled: true` by default, same as adding from the Browse tab.

Below the header, the two tabs are **"All Games"** and **"Queue"** (`common.tabs.allGames` /
`common.tabs.queue`). Switching tabs also changes what the app-wide search bar filters: only the
"All Games" tab is search-filterable (`setActiveTabSearchable(activeTab === 'browse')`) — searching
while on the "Queue" tab has no effect on what's shown there, matching Favorites' identical
behavior and for the identical reason: a reorder on the Queue tab replaces the *entire* persisted
order, so filtering that list while dragging would be dangerous/confusing.

While on the "All Games" tab, a sort dropdown (`GameSortSelect`) appears next to the tabs, backed by
`sortPreferencesStore`'s own `autoIdle` sort-style slot (persisted in `localStorage`, independent of
every other page's sort choice). While on the "Queue" tab, if the queue has at least one game, a
red "Clear" button appears there instead, opening a confirmation dialog ("Clear the automatic idler
queue?" / "This will remove all {{count}} games from the automatic idler queue.") with Cancel and a
red "Clear" action that wipes the entire queue at once (calls the same reorder/bulk-replace command
with an empty list).

## The "All Games" (Browse) tab — adding games to your queue

This tab lists every game the signed-in account owns, sourced from the same shared owned-games
cache `useGamesList()` also backs the main Games page and the Idling page with (per
`frontend-architecture.md`'s `gamesListStore`, explicitly shared, not a separate fetch) — sorted by
whatever sort style is selected and filtered by the current search query. Each game renders as an
`AutoIdleGameCard`: a thumbnail, the game's name (or "App {{appId}}" if the name hasn't resolved),
and a single icon-only toggle button on the right — a plain "+" (`TbPlus`) if the game isn't in
your queue yet, or a checkmark (`TbCheck`) if it already is. Clicking that button calls a single
convenience action that adds the game (`enabled: true`) if it wasn't queued, or removes it if it
already was — there's no separate confirmation step either way, and the button shows a pending
spinner while the request is in flight. This tab is rendered through `VirtualizedGameGrid` (a
react-window virtualized grid), since an owned-games library can realistically be very large.

States this tab can be in:
- **Loading** (games list still resolving): a skeleton grid of 12 placeholder cards.
- **Games-list error**: a red Alert ("Couldn't load games" title, plus a message specific to the
  error code — e.g. a Steam Web API playtime-data failure, a games-cache read/write failure, or a
  generic fallback naming the raw code) with a "Try again" button that re-triggers the games fetch.
- **No owned games at all**: an empty-state panel (`TbDeviceGamepad2` icon) — "No games found" /
  "This account doesn't own any games yet."
- **Search returns nothing**: a different empty-state panel (a magnifying-glass icon) — "No games
  match your search" / "Try a different title or App ID."
- Otherwise, the virtualized grid of `AutoIdleGameCard`s as described above.

## The "Queue" tab — managing what's actually saved

This tab shows only the games you've added, as `AutoIdleListCard`s in a drag-to-reorder grid
(`AutoIdleListGrid`, built on `@dnd-kit`, mirroring Favorites' identical list-grid shape). Each card
shows a thumbnail, the game's stored name, an enable/disable `Switch`, and a plain "X" remove
button (`TbX`, `aria-label` "Remove {{name}}"). A card whose entry is currently disabled renders the
entire card at 50% opacity (`opacity-50`) so a glance at the grid tells you which games are paused
without needing to read every switch individually.

- **Dragging**: the whole card is grabbnable (`cursor-grab`), with an 8-pixel pointer-movement
  threshold before a drag actually starts (so a plain click on the switch/remove button doesn't
  accidentally trigger a drag). Dropping a card in a new position calls a bulk reorder command that
  replaces the entire persisted order with the new one — this is why the Queue tab deliberately
  ignores the search filter (a filtered-out game reordered against a filtered list would corrupt the
  full order).
- **The enable/disable Switch** flips just that one entry's `enabled` flag; a disabled switch and
  the remove button are both disabled/pending while that specific game's request is in flight. A
  disabled entry stays in your queue and keeps its saved position — it's just skipped the next time
  Auto Idle actually triggers (startup, "Start," or Achievement Unlocker's chaining — see below).
- **The remove button** deletes that entry from the queue outright (not just disabling it).
- **Empty state** (nothing queued yet): a play-icon panel — "No games queued" / "Add games from the
  All Games tab to idle them automatically whenever the app starts."
- **Loading state**: a skeleton grid of 6 placeholder cards.

Every game card on this page (both tabs, plus the Idling page's reused `GameCard`) also supports the
app-wide right-click context menu — see "Adding a game from anywhere" below.

## What actually happens when Auto Idle triggers (startup, "Start," or chaining)

Auto Idle has **no background loop of its own** — there's no `auto_idle::manager` module; the
backend only has `cache.rs` (the persisted list) and `commands.rs` (one-shot CRUD plus the trigger
command). "Triggering" means calling the single `start_auto_idle_games` backend command, which
happens from exactly three places: automatically once per app launch, the page's own "Start"
button, and Achievement Unlocker's optional "next task" chaining (see its own section below). Each
trigger does the following, in order:

1. In Legacy Sign-in (CLI) mode only, it first checks that a real local Steam client is actually
   running — if not, the whole trigger fails immediately with the error code `steam_not_running`
   ("Steam isn't running. Please start Steam and try again."). Steam Sign-in (agent) mode skips this
   check entirely, since its daemon session doesn't need a local Steam client.
2. It reads your saved queue and keeps only the entries still marked enabled — disabled entries are
   dropped from this trigger (but stay in your queue for later).
3. Each remaining enabled game is checked against its configured max-playtime cap; a game already
   over its cap is skipped for this trigger (it stays in your queue, un-idled, until the cap
   changes) — see "Max Playtime cap" below for exactly where that cap is configured. The full
   selection/skip logic is covered in depth in `ai-corpus/architecture-guides/auto-idle-selection.md`,
   not repeated here.
4. Whatever's left is claimed for idling under the `auto_idle` owner in the shared idle-claims
   registry — this claim is *unioned* with whatever manual idling/Card Farming/Achievement Unlocker
   already have running, never a blind replace of the whole idling set (see "Sharing idling with
   other features" below).
5. Each newly-claimed game also gets its "max idle time" auto-stop timer scheduled or re-armed (see
   "Max Idle Time auto-stop" below — a different, easily-confused cap from step 3's max-playtime
   check).

There's no separate retry loop on the frontend or backend — a game that failed to start this time is
simply still "desired but not idling," so the very next trigger (next launch, next "Start" press, or
next chaining event) picks it back up naturally.

**The 32-concurrent-game cap still applies.** SGI can idle at most 32 games at once across every
feature combined — a real Steam client protocol limit (SteamKit2's `MaxConcurrentGames`), not
something Auto Idle enforces on its own. The union of every owner's claims (`cap_targets`, applied
inside the idle-claims registry's `replace_owner_claim`) is deduped by app id and silently truncated
to the first 32 if the combined total from every feature exceeds it — there's no error shown for
this. So if you already have, say, 20 games idling manually or via Card Farming, only 12 more of
your enabled Auto Idle queue entries can actually start on the next trigger, even though every
enabled entry was included in the claim. Full mechanics of this cap and how claims combine across
features: `ai-corpus/ui-guides/idling.md`.

## Starting automatically on app launch — and why CLI mode waits

A dedicated hook, `useAutoIdleStartup`, is mounted once inside `DashboardShell` (the persistent
shell that never unmounts across `/dashboard/*` navigation) and guarded by a ref so it genuinely
fires only once per app launch, not once per visit to any page:

- **Steam Sign-in (agent) mode**: fires the trigger (`start_auto_idle_games`) immediately once
  signed in — the daemon session is already live by the time the dashboard mounts, so there's
  nothing to wait for.
- **Legacy Sign-in (CLI) mode**: has no live session of its own to know Steam is ready, so it polls
  `is_steam_running` every 10 seconds for up to 5 minutes. If Steam never comes up in that window,
  it gives up silently (no error shown anywhere in the UI — Auto Idle simply never triggers that
  session). Once Steam is detected running, it waits a further 15-second settle delay before
  actually calling the trigger, since games launched immediately after Steam itself finishes
  starting tend to fail to register.

After the trigger resolves, this startup hook commits the returned game list directly into
`idlingStore` itself (rather than only waiting on the backend's own confirming event) — this is
the "writes directly to `idlingStore` on startup" behavior: a defensive direct-commit against a race
where the daemon's confirming `idling-state-changed` event could otherwise arrive before the
frontend's event listener has finished registering and get silently missed. This is the same
commit-then-refresh pattern manual idling's own toggle/stop actions already use, not a special
Auto-Idle-only code path.

## Pairing with Run At Startup and Start Minimized for a fully hands-off setup

Auto Idle's queue only starts idling on its own once SGI actually launches — it doesn't launch SGI
itself. The docs page for this feature explicitly recommends combining it with two Settings →
General options so the whole thing runs with no user interaction at all: **Run At Startup**
(registers SGI to launch automatically at login — a Windows startup-programs entry, or the
equivalent autostart mechanism on Linux) and **Start Minimized** (SGI opens silently in the
background rather than popping its window open, reachable afterward from its system-tray icon).
Paired together, a user logs into their machine and SGI launches in the background, signs in (if
credentials/session allow), and Auto Idle's startup trigger fires — all without the user ever
seeing or touching a window. Neither setting is configured from the Auto Idle page itself; both live
in the Settings modal's General tab, not Auto Idle's own UI (which, as noted above, has no Settings
tab of its own at all).

## Adding a game from anywhere via right-click

Every game card app-wide — on the Games page, the Idling page, Favorites, Card Farming, Achievement
Unlocker, and Auto Idle's own cards — supports a right-click context menu (`buildGameCardMenu.ts`).
Among its items is an "Add To" submenu with four entries: Favorites, Card Farming, Achievement
Unlocker, and **"Automatic Idler."** Choosing "Automatic Idler" from any game's context menu calls
the same `add_to_auto_idle_list` command the Browse tab's "+" button uses (adding the game with
`enabled: true`), letting you queue a game for Auto Idle without ever visiting the Auto Idle page.
This is idempotent — adding a game already in your queue is a harmless no-op, not a duplicate entry
or an error. If the Auto Idle page happens to be open in another tab-state at the time, its list
updates live via a small in-memory event bus (`gameListsBus`) that lets a mounted `useAutoIdleList`
hook hear about changes made from outside its own UI; if the page isn't open at all, the change is
simply reflected the next time you open it (a fresh fetch on mount).

The same context menu also offers "Start Idling"/"Stop Idling" (toggles that specific game's manual
idle claim directly), "Manage Achievements" (opens the Achievement Manager overlay for that game),
and "View on Steam" (opens the game's store page in your browser).

## Sharing idling with other features (idle claims)

Manual idling, Auto Idle, Card Farming, and Achievement Unlocker can all want the same game idling
at once — SGI tracks each feature's own "these are the games I want idling" list independently
(under owner keys `manual`, `auto_idle`, `card_farming`, `achievement_unlocker`) and idles the union
of all of them. A game only actually stops idling once *every* feature that wants it running has
stopped wanting it. Full mechanics: `ai-corpus/architecture-guides/shared-idling.md`.

Concretely for Auto Idle: claiming a game under `auto_idle` never displaces or interferes with a
claim any other feature already holds on that same game — a game you're also manually idling, or
that's mid-farm in Card Farming, keeps idling for those reasons even if you stop Auto Idle's own
claim on it.

## Where Auto Idle's games show up on the Idling page, and how to stop them

The Idling page (`/dashboard/idling`) groups every currently-idling game by whichever feature(s)
claimed it, reusing the same `GameCard` component the Games page uses. Auto Idle's section is
titled **"Automatic Idler"** (the identical sidebar label). If a game is claimed by more than one
owner at once (e.g. it's both manually idled and sitting enabled in your Auto Idle queue), it's
grouped under a fixed precedence — `manual` > `card_farming` > `achievement_unlocker` > `auto_idle`
— so it appears in exactly one section rather than twice; a dual-claimed game shows under "Manually
idled" even though Auto Idle still holds its own claim on it underneath.

Auto Idle's section has its own red "Stop" button. Clicking it calls the **generic**
`stop_owner_idling` command (passing `owner: 'auto_idle'`) directly — this is safe and sufficient
specifically *because* Auto Idle has no backend loop of its own that would re-claim the game on a
later tick (unlike Card Farming/Achievement Unlocker, whose own per-section "Stop" buttons instead
call their own `stop_farming`/`stop_achievement_unlocker` commands, since a bare claim release for
those two would just get reclaimed on their loop's next cycle). The page's global "Stop All" button
always clears every owner's claims at once regardless of this distinction, and is the only action
guaranteed to fully stop everything.

One more detail worth knowing: Auto Idle's own **sidebar item does not pulse** when its games are
idling (it has no `pulseWhenIdling` flag, unlike the Idling nav item, which does and reflects the
combined idling state across every owner including Auto Idle's own claims). So the visible
"something is idling" indicator for Auto Idle activity in the sidebar is the **Idling** nav item
pulsing, not the "Automatic Idler" nav item itself.

## Max Playtime cap — games skipped before they ever start

If a game has a max-playtime cap configured and its accumulated playtime has already reached that
cap, Auto Idle silently skips it every time it triggers (startup, "Start," or Achievement Unlocker
chaining) — the game stays in your queue exactly as-is, just not claimed for idling, until the cap
situation changes (you raise it, remove it, or the check no longer treats the game as over). This
cap is **not configured anywhere in Auto Idle's own UI** — Auto Idle has no tab of its own in the
Settings modal at all (`settingsModalStore`'s tab list has no `autoIdle` entry). It's set from
**Settings → Game Settings**, in that tab's "Max Playtime" section (a global default plus optional
per-game overrides), and the same cap is shared cross-feature — it's also enforced by manual idling,
Card Farming, and Achievement Unlocker, not owned by any single one of them. See
`ai-corpus/architecture-guides/max-playtime.md` for the full cross-feature mechanics.

## Max Idle Time auto-stop — a different, separate cap

Distinct from the Max Playtime cap above (easy to confuse — both live in the same Settings → Game
Settings screen, in a separate "Idling" section with its own global default + per-game override).
Max Idle Time is a **per-session duration timer**, not a total-hours-ever cap: every time Auto Idle
claims a game (on any trigger), if that game has an effective max idle time set, a timer starts (or
restarts) for that specific `(account, game, owner)` combination, and once it elapses that one claim
is automatically released — the game stops idling under that owner without you doing anything. This
mechanism is shared with manual idling only — it deliberately does **not** apply to Card Farming or
Achievement Unlocker, which each have their own separate, purpose-built auto-stop schemes untouched
by this timer. Because the timer is tracked per owner, a game that's simultaneously claimed by both
`manual` and `auto_idle` has two fully independent timers — stopping (or restarting) one has no
effect on the other's countdown.

## Achievement Unlocker's "next task" chaining into Auto Idle

Achievement Unlocker's own Settings tab has a "next task" option: a checkbox plus a choice between
"Card Farming" or "Automatic Idler," which fires once its own unlock queue genuinely empties. When
set to "Automatic Idler" (and the checkbox is on), Achievement Unlocker calls **the exact same**
`start_auto_idle_games` backend command described above under "What actually happens when Auto Idle
triggers" — same enabled-only filtering, same max-playtime skip, same idle-claims union behavior, no
special-cased chaining logic of its own. This setting lives entirely inside Achievement Unlocker's
Settings tab, not anywhere in Auto Idle's own UI — there is nothing to configure on the Auto Idle
page itself to enable or disable this chaining.

## Errors and where they surface

A failure from any of the Queue tab's own actions (add/remove/reorder/enable-toggle, or a failed
"Start") shows as a red Alert banner directly under the page header, titled "Couldn't update
automatic idler," with a message specific to the underlying error code where one is recognized:
- `agent_session_not_found` — "Your Steam session isn't active anymore. Please sign in again."
- `agent_steam_id_unknown` — "Your Steam ID hasn't been resolved yet. Please try again in a moment."
- `agent_request_timeout` — "Steam took too long to respond. Please try again."
- `agent_process_exited` — "The Steam agent process closed unexpectedly."
- `auto_idle_cache_io_failed` — "Couldn't read or write the automatic idler queue." (the persisted
  `auto_idle.json` cache file — a per-account cache file under the app's cache directory, keyed by
  resolved SteamID64, not a `settings.json`-style settings file — failed to read or write.)
- `steam_not_running` — "Steam isn't running. Please start Steam and try again." (only reachable in
  Legacy Sign-in/CLI mode, from the "Start" button or the startup trigger; Steam Sign-in/agent mode
  never returns this code from this command.)
- Any other/unrecognized code falls back to "Something went wrong updating automatic idler. Please
  try again. ({{code}})" with the raw code shown.

This banner is separate from the Browse ("All Games") tab's own error state, which is really the
shared games-list error (title "Couldn't load games," its own set of error-code messages, with a
"Try again" button that retries the games fetch specifically) — a failure loading your owned-games
library doesn't affect your already-saved Auto Idle queue at all, and vice versa.
