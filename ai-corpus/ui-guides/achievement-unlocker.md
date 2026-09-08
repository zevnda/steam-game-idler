<!-- url: https://steamgameidler.com/docs/features/achievement-unlocker -->
<!-- supersedes: https://steamgameidler.com/docs/features/achievement-unlocker/custom-order-and-unlock-delay, https://steamgameidler.com/docs/features/achievement-unlocker/import-timings, https://steamgameidler.com/docs/settings/achievement-unlocker -->
# Achievement Unlocker

Generated corpus content (see `.claude/skills/generate-ui-guide/SKILL.md`) — the single merged
source for Achievement Unlocker's UI, its full docs subtree, and its cross-feature connections.
Verified against `src/features/achievement-unlocker/**`, `src-tauri/src/achievement_unlocker/**`,
and the docs pages listed above. Regenerate via that skill when any of those change — don't
hand-edit this file to patch small drift.

## What Achievement Unlocker does and where it lives

Achievement Unlocker is an automation feature that queues Steam games and unlocks their
achievements over time on its own, with configurable pacing/scheduling so the pattern doesn't look
instant or robotic. It's a real routed page at `/dashboard/achievement-unlocker`
(`AchievementUnlockerPage.tsx`), reached by clicking **Achievement Unlocker** in the sidebar's
Automation section (between Card Farming and Auto Idle). The page renders as one persistent
`DashboardShell` route, so a running session keeps unlocking and its live progress keeps updating
even while you navigate to a different page — it isn't paused or torn down by leaving the page.

## Browse tab — adding games to the queue

The page opens on two tabs: **Games** (labelled "All Games" internally, `common.tabs.allGames`)
and **Queue** (`common.tabs.queue`). The Games tab shows every owned game as a card (thumbnail,
name, and a single icon-only button in the bottom-right of each card): a plain **+** icon
(`TbPlus`) if the game isn't queued yet, or a checkmark icon (`TbCheck`) if it already is. Clicking
that button toggles queue membership for that one game — it optimistically disables itself
(spinner) while the add/remove request is in flight. The grid is virtualized
(`VirtualizedGameGrid`), sortable via the sort-select control next to the tab bar, and filterable
by the global search bar while this tab is active (search is deliberately disabled — the titlebar
search affordance hides — while the Queue tab is active, while a run is active, or while the
finished-summary is showing, since none of those views are the searchable browse grid).

Next to the sort control on the Games tab is an **"Add all to queue"** button (disabled/grayed if
every currently-visible — i.e. search-filtered and sorted — game is already queued). Clicking it
opens a confirmation dialog titled "Add all {N} games to the queue?" with body text "Each game
needs to be scanned for achievements, which can take a long time for a large library. Manually
adding games is recommended." Confirming adds every visible-but-not-yet-queued game to the queue in
one call (an append, not a replace).

A **+** icon-only button (`TbPlus`, `aria-label` "Manual add") sits in the page header, to the left
of the settings gear — it opens the shared `ManualAddGameModal` for adding a game by App ID/name
directly (for a game not in your owned-games list, e.g. a free-to-play title you haven't launched).

## Queue tab — reviewing and starting the run

The Queue tab lists every currently-queued game as a card: thumbnail, name, an "edit order" icon
button (`TbArrowsSort` — three horizontal lines with arrows, i.e. a sort icon, `aria-label`
"Edit unlock order for {name}"), and a remove button (`TbX`, `aria-label` "Remove {name}"). Every
card is drag-and-drop reorderable (grab anywhere on the card; a `cursor-grab`/`cursor-grabbing`
cue) — dragging changes the persisted queue order used when the run starts (this is what "custom
queue order" means at the page level, separate from the per-game achievement order described
below). This grid is also virtualized, since "Add all to queue" can push it into the hundreds or
thousands of games.

While on the Queue tab (and only while it has at least one game), a **Clear** button (red/danger
variant) appears next to the tab bar. Clicking it opens a confirm dialog ("Clear the achievement
unlocker queue? This will remove all {N} games from the achievement unlocker queue.") — confirming
empties the whole queue in one call.

If the queue is empty, the Queue tab shows an empty state (trophy/award icon, `TbAward`) with the
title "No games queued" and description "Add games from the All Games tab to queue them for
automatic achievement unlocking."

## Starting and stopping a run

The page header (`AchievementUnlockerPageHeader.tsx`) shows the feature title, a status line (
"No games queued" / "{N} games queued" / while running, "Unlocking {N} game(s)" where N is the
number of currently-active games), and on the right: a **Start** button (green/primary, play icon
`TbPlayerPlayFilled`, disabled while the queue is empty) that becomes a **Stop** button (red/danger,
stop icon `TbPlayerStopFilled`) once a session is running, plus the manual-add (+) and settings
(gear) icon buttons described above. The settings gear opens the app-wide Settings modal
pre-scrolled to its **Achievement Unlocker** tab.

Clicking Start resolves the actual worker/concurrency count on the frontend (see "Concurrency
tiers" below) from the currently-loaded settings and the account's subscription tier, then starts
the backend session. Clicking Stop asks the running session to stop; it finishes whatever it's
mid-unlocking for the current achievement pass before actually ending (a stop is not instant —
see the timing architecture guide referenced below for exactly what "in progress" means).

If either the queue actions or the run actions fail, a red `Alert` banner appears just under the
header with the title "Couldn't update the achievement unlocker" and a specific description keyed
off the error code (session-not-found, Steam-ID-unknown, timeout, process-exited, "couldn't read or
write the achievement unlocker queue/settings", or Steam-not-running).

## What happens while a run is active — the live progress view

Once running, the browse/queue tabs disappear entirely and the page switches to
`AchievementUnlockerProgressView`. This view has a full-bleed hero background image (the first
active game's cover art) behind:

- **A scan-progress card** (only visible during the scan phase of each pass, before any game moves
  into the active list): a bordered card titled "Checking queued games for achievements to unlock"
  with a linear progress bar and a "{checked} of {total} checked" caption.
- **One row per currently-active game** (`AchievementUnlockerActiveRow`), stacked vertically if more
  than one game is unlocking at once. Each row is two side-by-side panels:
  - **Left panel** (`AchievementUnlockerCurrentGamePanel`, fixed `h-96`): shows one of three states
    — "Waiting for the scheduled unlock window" (clock icon, shown when a schedule is configured
    and the current time is outside it); "Starting…" with a circular countdown ring and a digital
    mm:ss (or h:mm:ss) timer counting down the fixed ~10-second grace period before the game's
    first unlock; or, once past both, the game's cover thumbnail, its name, and "{N} achievements
    remaining" in accent color.
  - **Right panel** (`AchievementUnlockerUpcomingPanel`, fixed `h-96 sm:w-80`, hidden entirely if
    there's nothing upcoming): a scrollable "Up next" list of up to 5 upcoming achievements, each
    with its locked-icon thumbnail, name, its Steam-wide rarity percentage (e.g. "12.3%") if known,
    and its own live "in Xm Ys" countdown to when it will unlock. The soonest one is visually
    highlighted (accent-tinted border/background) versus the plain-bordered ones behind it.
- **A "Completed this session" list**, once at least one game has finished this run: each row shows
  the game name and a status line that depends on why it left the queue — a green checkmark with
  "{unlocked}/{total} unlocked" for a genuinely finished game; a neutral info icon with
  "{unlocked}/{total} unlocked (max unlocks reached)" if it hit its per-game max-unlocks override;
  "{unlocked}/{total} unlocked (max playtime reached)" or, if it never got that far, just "Max
  playtime reached" if it hit the account's max-playtime cap for that game; or "Nothing left to
  unlock" if the very first scan pass found nothing eligible (already-unlocked, hidden-and-skipped,
  or a Steam-protected-achievements game — see "Games that can't be automated" below).

Once the session stops (either it ran out of queue, or you clicked Stop), this same progress view
stays showing as a dismissible "session finished" summary — the active rows disappear but the
completed list stays, with a **Done** button centered below it. Clicking Done returns you to the
browse/queue tabs. This summary is per-account state (stored in `achievementUnlockerStore`, not
page-local), so switching to a different page and back still shows it until you explicitly dismiss
it or a new run starts (which immediately re-arms it for that new run's own eventual result).

## Custom order, skip, and per-achievement delay — the order editor overlay

Clicking the sort-icon button on any card in the Queue tab opens the **Achievement Order** overlay
(`AchievementOrderOverlay.tsx`) — a full-cover modal, not a route (this is a static-export app, so
a per-game drill-down has to be an overlay). Its header shows a close (X) button, the game's name,
a red **Reset** button, and an **Import Timings** button (see below) — all pinned above a scrolling
list of that game's still-locked achievements.

Each achievement is its own card: a checkbox (checked = will be unlocked, unchecked = skipped —
click it to toggle), the achievement's locked icon, its name, a "Skipped" pill if unchecked, its
rarity badge (percentage + tier label, reusing the same rarity styling as the achievement-manager
overlay), a description line (blurred until hovered if the achievement is itself marked hidden by
Steam), and a drag handle (`GoGrabber` from `react-icons/go` — six dots arranged in two rows/three
columns, the universal "grab to reorder" icon) on the far right. Dragging a card by that handle
reorders the unlock sequence; a dashed vertical connecting line runs through the gap between two
adjacent cards, and that gap holds a **"Delay until next unlock"** numeric input (minutes, 2-decimal
precision) — this is the wait time after unlocking the achievement above before unlocking the one
below. The very first row (above every achievement card, in a dashed-border box so it visually
reads as a setting rather than a 6th achievement) is **"Delay before first unlock"** — how long, in
minutes, the unlocker waits after this game becomes active before unlocking anything at all.

Any achievement you haven't manually dragged/placed falls to the end of the list, sorted by rarity
(least common first) — matching what happens with no custom order at all. Per-achievement delays
you set here override the global Unlock Interval setting for that specific achievement only; an
achievement with no custom delay uses a fresh random draw from the Unlock Interval range every
time it's about to unlock.

Clicking **Reset** re-sorts every achievement back to rarity order, clears every skip flag, clears
every per-achievement delay, and clears "Delay before first unlock" back to empty — it does not
close the overlay or discard your session, you still need to click **Save** (bottom-right footer
button) to persist it. Nothing here is auto-saved field-by-field the way the Settings tab is;
Save writes the whole order in one call and shows a "Achievement order saved" success toast, or an
error toast on failure.

If the game has no remaining (locked) achievements at all, the overlay shows an empty state:
"Nothing left to order" / "This game has no remaining achievements to unlock."

## Import Timings — copying another player's real unlock pacing (Gamer tier)

The **Import Timings** button in the order-editor header opens a small modal (title "Import
Timings") with a single text input (placeholder "SteamID64, profile URL, or vanity URL") and an
**Import** button. It fetches a target Steam profile's real, public achievement-unlock timestamps
for this specific game and uses the gaps between them to re-derive realistic per-achievement
delays: achievements get reordered to match that profile's actual unlock sequence, and each gets a
"Delay until next unlock" computed from the real elapsed time between consecutive unlocks (rounded
to one decimal minute). Any achievement in your list that the target profile never unlocked gets
marked skipped and moved to the end, since there's no real timing to place it by. You can still
freely adjust the imported order/delays by hand afterward — importing doesn't lock anything, and
none of it is saved until you click Save in the order editor itself.

The target profile (and that specific game's details) must be set to public on Steam — verify by
viewing their games list in an incognito browser window. On failure the modal surfaces a specific
reason: "That profile is private or has no public achievement data," "That player has no
achievements with unlock timestamps for this game," "Couldn't resolve that profile," or a generic
retry message for an underlying Steam Web API failure.

**This entire button is Gamer-tier gated**, and it follows this app's real gated-control pattern —
it is never a native disabled button. Without Gamer access, the header still renders a real,
pressable button (just visually dimmed via `opacity-50`, not HTML `disabled`) reading "Import
Timings" with a small Gamer `TierBadge` next to the label; clicking it opens the upgrade modal
(`proModalStore.openWithTier('gamer')`) instead of the real import modal. The Reset button and the
in-list delay-before-first-unlock/skip/reorder controls are not tier-gated at all — only Import
Timings requires Gamer.

## Settings tab

The gear icon in the page header opens the app-wide Settings modal on its **Achievement Unlocker**
category (same destination as opening Settings and clicking that tab manually). Every field here
auto-saves on change/blur — there's no separate Save button for this tab.

- **Idle while unlocking** (toggle, default **on**) — "Idles the game while its achievements are
  being unlocked." Idling starts as soon as a queued game becomes *active* (not only once it
  actually starts unlocking), so a long "delay before first unlock" doesn't leave the game doing
  nothing the whole time it's waiting.
- **Run multiple games at once** (toggle) — "Work through up to {N} queued games concurrently
  instead of one at a time." See "Concurrency tiers" below for the exact numbers and gating
  behavior — this row shows a Casual `TierBadge` and reroutes to the upgrade modal instead of
  toggling when you don't have at least Casual access.
- **Skip hidden achievements** (toggle, default **off**) — "Don't unlock achievements Steam has
  flagged as hidden."
- **Unlock interval** (two number inputs, "min" to "max", in minutes; default **30 to 130**) — "Wait
  a random delay between {min} and {max} minutes between unlocks." Minimum allowed value is 1;
  maximum allowed value is 2880 (48 hours). This is the fallback used for any achievement that
  doesn't have its own per-achievement delay set in the order editor.
- **Only unlock during a schedule** (toggle, default **off**; default window when enabled is
  **08:30 to 23:00**) — "Only unlock achievements between the times below." When on, two 24-hour
  time-field inputs appear ("from" / "to"). Outside that window, the unlocker keeps running (and
  keeps idling the game unless you also have idling on and the window is closed — idling pauses
  too whenever the window is closed) but pauses actually unlocking anything until the window
  reopens; it resumes automatically, it doesn't lose its place in the queue.
- **Start another task when done** (toggle, default **off**) — "Once the queue is empty,
  automatically start another automation." When on, two buttons appear to pick which:
  **Card Farming** or **Auto Idle** (`dashboard.sidebar.nav.cardFarming`/`autoIdle` labels) — this
  only fires when the queue empties out genuinely (every queued game finished or was
  removed/excluded), never on a manual Stop or a hard read error.

For the exact per-pass timing mechanics behind all of this (why unlocks aren't instant, how the
scan-then-unlock two-phase pass works, what happens with multiple concurrent games, retry
behavior, and exactly when idling starts/stops), see the architecture guide
`ai-corpus/architecture-guides/achievement-unlocker-timing.md` — it's comprehensive for that "how
it works" angle and isn't duplicated here.

## Concurrency tiers — exact numbers

"Run multiple games at once" and its worker-count cap follow this ladder based on your subscription
tier:

- Free tier, or the toggle off: **1** game unlocking at a time, regardless of queue size.
- **Casual** tier with the toggle on: up to **3** games concurrently.
- **Gamer** tier (implies Casual) with the toggle on: up to **32** games concurrently, the app's
  overall ceiling for concurrent achievement-unlocker games.

This is resolved fresh every time you click Start (a fresh settings read combined with your
current subscription tier), not hardcoded per tier at session start only. **A long-running session
also gets live-corrected**: `useAchievementUnlockerConcurrencyGuard` (mounted once in
`DashboardShell`, alongside the same mechanism `usePresenceProGuard` uses) watches your
subscription tier and, for every account with an active run, pushes a corrected worker count via
`update_achievement_unlocker_concurrency` whenever the tier changes in either direction — a
downgrade mid-session drops back to the lower cap on the session's *next* pass (never interrupting
whichever game is mid-unlock right then); a restored/upgraded subscription is honored the same
way. Running single-game mode (worker count 1) still adds a short pause between finishing one game
and starting the next, unless the next game already has its own "delay before first unlock"
configured — running multiple games at once skips that inter-game pause entirely, since those
games are already overlapping in time.

## Idle claims — Stop on the Idling page dispatches this feature's own stop command

Achievement Unlocker idles games as a side effect of running (only when the "Idle while unlocking"
setting is on), by claiming idle slots under the owner key `achievement_unlocker` in
`idling::claims::IdleClaimsRegistry` — never by announcing directly to the daemon/local-client
idling mechanism. Its backend manager re-announces its *entire* current active-idling set every
time that set changes (a game becoming active, finishing, hitting a schedule pause, or getting
excluded), which means a plain "release this claim" isn't enough to actually stop the game from
idling — the manager would just re-claim it on its next change.

Concretely: the Idling page groups currently-idling games by whichever feature(s) started them.
That page's **per-game "Stop"** button always stops the game outright regardless of which
feature(s) claimed it. But **Achievement Unlocker's own group-level "Stop"** on that page
dispatches `stop_achievement_unlocker` (the same command the achievement-unlocker page's own Stop
button uses) rather than the generic `stop_owner_idling` — because the generic command would just
release the claim, and the still-running unlocker session would silently re-claim the same game on
its very next internal state change. Manual idling and Auto Idle, which have no such active
backend loop, use the generic command instead for their own groups.

Separately, if you stop a specific game's idling from the Idling page's per-game control while
Achievement Unlocker is still actively unlocking it, the achievement-unlocker session notices (via
`remove_active_game`) and permanently excludes that one game from being re-idled for the rest of
that session — it keeps unlocking its achievements, just without idling it any further, even
across a later schedule-wait pause/resume for that same game. This exclusion only affects idling;
it never abandons the game's in-progress unlock queue entry.

For how idling reconciles across every feature in general (why stopping Card Farming doesn't
necessarily stop a game Achievement Unlocker also wants idling, what "Stop All" does, and how this
is scoped per Steam account), see `ai-corpus/architecture-guides/shared-idling.md`.

## Max playtime cap — checked twice, before queueing and mid-run

If a queued game has a maximum-playtime cap configured (Game Settings, cross-cutting across every
automation feature — see the "max playtime" architecture guide below), Achievement Unlocker checks
it at two separate points:

1. **During each pass's scan phase** — a game already over its cap is dropped from the queue before
   it's even considered, and immediately recorded as completed with reason "Max playtime reached"
   (no achievements were ever fetched for it, so its completed row shows just that reason with no
   unlock count).
2. **While actively unlocking it** — before attempting each individual achievement, the worker
   estimates the game's current playtime (its last-known baseline plus how long this unlock session
   has been running) and checks it against the cap again. Crossing it mid-run stops idling that
   game (if it was being idled), permanently removes it from the queue for this session, and
   records it as completed with reason "Max playtime reached" — showing whatever partial
   unlocked/total count it reached first, if any achievements were unlocked before the cap hit.

See `ai-corpus/architecture-guides/max-playtime.md` for the general cross-feature mechanics (which
other features enforce this the same way, and the roughly-once-a-minute vs. own-schedule
distinction between idling-based features and this one).

## Achievement rarity percentages

Achievement rarity badges shown in the order editor and the "Up next" panel of a running session
("12.3%", etc.) are Steam's own public per-game data — the same figure Steam's own client shows on
an achievement's tooltip, unrelated to your own account. See
`ai-corpus/architecture-guides/achievement-rarity.md` for why this can briefly show as missing/settle
in a moment after achievements first load specifically under Steam Sign-in (agent mode) — that
guide is comprehensive for this angle and isn't duplicated here.

## Games that can't be automated at all under Steam Sign-in (Game Coordinator titles)

Five specific titles — Team Fortress 2 (440), Dota 2 (570), Counter-Strike 2 (730), Left 4 Dead 2
(550), and Portal 2 (620) — use Steam's Game Coordinator system, which Steam Sign-in's daemon
connection cannot query achievement data for at all (`unsupported_game_coordinator`, a daemon-only
restriction Legacy Sign-in/CLI mode does not share, since CLI mode talks to a real local Steam
client instead).

This surfaces differently depending on where you hit it:

- **Queueing and running one of these games under Steam Sign-in**: the backend's per-game scan
  silently treats the failed data fetch as "nothing to unlock" and drops it from the queue — it
  shows up in the session's completed list as "Nothing left to unlock," not as a visible error.
- **Opening the order editor directly on one of these games** (before ever starting a run): the
  overlay's own `get_achievement_data` call surfaces the failure as a real, visible error banner —
  "This game isn't supported for achievements when signed in with Steam - use your local Steam
  client instead" (on Windows; the Linux copy omits the CLI-mode fallback mention entirely, since
  Linux has no CLI/Legacy Sign-in mode at all).

Under Legacy Sign-in (CLI mode, Windows-only, requires a real running local Steam client), none of
these five titles have this restriction.

## Cross-feature: the game-card right-click menu (not achievement-manager on click)

Unlike a plain click, **right-clicking any game card in either Achievement Unlocker tab** (both
the Games-tab toggle cards and the Queue-tab list cards carry the same `data-game-card-appid`/
`data-game-card-name` attributes every other feature's game cards do) pops the app's native,
Tauri-driven context menu (`useContextMenu`, mounted once at the app root) rather than a plain
browser menu. Its items, in order: **Start Idling / Stop Idling** (toggles manual idling for that
one game directly, independent of the achievement-unlocker queue); **Manage achievements** — this
is the one item that opens the achievement-manager overlay (`useAchievementManagerStore`'s
`open(appId, name)`) for that game, letting you unlock/lock individual achievements by hand outside
of the automation entirely; a separator; **View on Steam** (opens the store page in your browser);
a separator; and an **"Add to"** submenu with one entry each for Favorites, Card Farming,
Achievement Unlocker, and Auto Idle — clicking "Achievement Unlocker" there adds the game to this
feature's queue exactly the same way the Games-tab **+** button does. Achievement Unlocker's own
game cards don't open achievement-manager from a plain left-click anywhere — only this right-click
menu's "Manage achievements" item does.

## Cross-feature: sidebar and account-switcher indicators

While a run is active for the currently-active account, the **Achievement Unlocker** entry in the
sidebar's Automation section shows a pulsing indicator (driven by
`achievementUnlockerStore`'s `state.isRunning` for the active account) — the same pulse mechanism
Card Farming's and manual/Auto Idle's own sidebar entries use for their own running states.
Separately, the account-switcher's per-row automation dot for a *backgrounded* (not currently
active) account reads that account's own entry directly out of `achievementUnlockerStore.entries`
rather than the denormalized single-account view, so a second signed-in account's unlock run stays
visibly indicated even while you're looking at a different account's pages.

## Settings scope note

Achievement Unlocker's settings (`achievement_unlocker_settings.json`) and its per-game order files
(`achievement_order/<app_id>.json`) are both per-Steam-account, not app-wide — they live in the
account's own cache directory, keyed by resolved SteamID64 for both sign-in modes uniformly. A
per-game **max-unlocks override** (settable from the Game Settings tab, not from anywhere in this
feature's own UI) is also stored per-account, separately from the order file — it caps how many
achievements a single run will unlock for that one game regardless of how many are actually
eligible, and is what produces a completed row's "(max unlocks reached)" outcome.
