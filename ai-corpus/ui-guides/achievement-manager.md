<!-- url: https://steamgameidler.com/docs/features/achievement-manager -->
<!-- supersedes: https://steamgameidler.com/docs/features/achievement-manager/special-flags -->
# Achievement Manager

This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/features/achievement-manager/` component source, the `achievementManagerStore`/
`achievements/commands.rs` backend it drives, the shared context-menu code that opens it from other
pages, and the `features/achievement-manager/index.mdx` + `special-flags.mdx` docs pages. It is the
single merged source for this feature (UI + docs + cross-feature connections) and should be
regenerated via that skill whenever the overlay's UI, its backend commands, or its docs pages
change — not hand-patched for small drift. For the deeper "why" behind the global rarity percentage
sometimes appearing a moment late, see `ai-corpus/architecture-guides/achievement-rarity.md`
(not repeated in full here).

## What the Achievement Manager is

The Achievement Manager is a full-screen modal overlay (not a page/route of its own — nothing under
`/dashboard/*` renders it) for manually unlocking, locking, and viewing achievements for one game at
a time, plus editing that game's raw statistics. It's the manual, one-by-one counterpart to the
[Achievement Unlocker](/docs/features/achievement-unlocker), which automates unlocking across a
queue of games instead. It's opened for exactly one game (identified by its Steam AppID + display
name) and shows only that game's data — there's no "all games" view inside it.

It's implemented as `AchievementManagerOverlay` (`src/features/achievement-manager/components/
AchievementManagerOverlay.tsx`), mounted permanently inside `DashboardShell` (which itself is
mounted once in `_app.tsx` and never unmounted by route changes), gated by `useAchievementManagerStore`'s
`openGame: { appId: number; name: string } | null` field — the overlay renders `isOpen={openGame !== null}`.
Because this store isn't owned by any one route, and `DashboardShell` renders underneath every
`/dashboard/*` page, the overlay can be opened from literally any page that renders a game card — see
"Where and how to open it" below for the confirmed exact trigger points.

## Where and how to open it (cross-feature)

There are two distinct, confirmed trigger mechanisms, and which one is available depends on which
page you're on:

**1. A dedicated trophy icon button, directly on the card — games list and Idling page only.**
`src/features/games-list/components/GameCard.tsx` (the card used on the main Games page, `/dashboard`)
renders two icon buttons in its bottom-right row: an idle start/stop toggle, and a second icon-only
button (`TbTrophyFilled`, `aria-label="Open achievements for {game name}"`) whose `onPress` calls
`useAchievementManagerStore`'s `open(appId, displayName)` directly. The Idling page
(`src/features/idling/`) doesn't build its own card component — it imports and reuses this exact same
`GameCard` from `games-list` (a deliberate cross-feature reuse, confirmed by the import in
`IdlingSection.tsx`), so the same trophy button appears there too. No other page has this dedicated
button — Favorites, Auto Idle, Card Farming, and Achievement Unlocker each render their own distinct
card component (`FavoriteGameCard`/`FavoriteListCard`, `AutoIdleGameCard`/`AutoIdleListCard`,
`CardFarmingBrowseCard`/`CardFarmingWhitelistCard`/`CardFarmingBlacklistCard`/`CardFarmingActiveCard`,
`AchievementUnlockerGameCard`/`AchievementUnlockerListCard`), and none of them render a trophy button.

**2. Right-click "Manage Achievements" — every page with a game card.** A single document-level
`contextmenu` listener (`useContextMenu`, mounted once at the app root in `_app.tsx`) intercepts every
right-click in the app. Every game-card component across every feature — games list, Idling, Favorites,
Auto Idle, Card Farming, and Achievement Unlocker (12 total card components, confirmed by grep) —
tags its root element with `data-game-card-appid`/`data-game-card-name` (`gameCardContextAttrs()`,
`src/shared/utils/gameCardContext.ts`). When a right-click lands inside any element carrying those
attributes, the listener builds a native OS context menu via `buildGameCardMenu()`
(`src/shared/utils/buildGameCardMenu.ts`) and pops it up (`Menu.popup()`, from `@tauri-apps/api/menu`
— a real native menu, not an in-page dropdown). That menu's second item (after "Start Idling"/"Stop
Idling") is **"Manage Achievements"** (`common.gameCardMenu.manageAchievements`), whose action calls
the exact same `useAchievementManagerStore.getState().open(appId, name)`. The same native menu also
has "View on Steam" and an "Add To" submenu (Favorites / Card Farming / Achievement Unlocker /
Auto Idle) — right-clicking any game card anywhere in the app is the one universal way to reach
achievement management, regardless of which page you're on.

Right-clicking anywhere that *isn't* a tagged game card instead shows a plain Copy/Paste menu (or,
outside dev mode, blocks the browser's native "Reload" item) — that fallback has nothing to do with
achievement management.

## Overlay layout: header, hero art, and tabs

Once opened, `AchievementManagerOverlay` renders as a `Modal` sized `cover` (near-fullscreen). Its
structure, top to bottom:

- **A full-bleed hero background image** behind everything else, absolutely positioned against the
  modal's outer dialog (not inside the scrollable body, so it never scrolls away). Sourced from
  `heroImageUrl(appId, useFallback)` — Steam's `library_hero.jpg` wide crop first, falling back to
  the smaller `header.jpg` if that 404s, and if *both* fail the background is simply omitted (no
  broken-image placeholder). A dark gradient overlay sits on top of the image so header/list text
  stays readable regardless of the art's own colors.
- **A fixed header bar** (`AchievementManagerHeader`, never scrolls), containing left-to-right: a
  close button (an X icon, no label), the game's name (truncated with an ellipsis past ~260px,
  the full name still readable via the browser's native title-truncation tooltip), a Steam icon
  button (`aria-label` "View on Steam", opens `https://steamcommunity.com/stats/{appId}/achievements/`
  in the system browser), a SteamDB icon button (`aria-label` "View on SteamDB", opens
  `https://steamdb.info/app/{appId}/stats/`), and two tabs — **"Achievements"** and **"Statistics"**
  (exact labels, `dashboard.achievements.tabs.achievements`/`.statistics`). On the far right of the
  same header row sits a search input (placeholder "Search") that filters whichever tab is currently
  active; switching tabs clears the search query back to empty. This whole header carries Tauri's
  window-drag attribute (`data-tauri-drag-region`) — because the modal paints over the app's normal
  titlebar while open, this header doubles as the only draggable surface until you close the overlay.
- **A protected-items warning banner**, shown only if at least one achievement or stat for this game
  is flagged protected: a warning-colored `Alert` reading "Some items are protected" / "Achievements
  or statistics marked as protected are set by the game's server and can't be changed by clients."
  (see "Protected, Hidden, and IncrementOnly flags" below).
- **The active tab's content**, filling the remaining space below the header.

Closing the overlay (the X button, or clicking outside/pressing Escape on the modal) resets its local
state back to defaults — active tab back to "Achievements", the search query cleared, and the hero
image's fallback level reset — so reopening it (even for the same game) always starts from a clean
slate.

## Loading, error, and empty states

Data loads once per game, the moment the overlay opens for that `appId` (not route-synced, not
polled while open — nothing external changes it while the overlay is up). While loading, the body
shows 8 skeleton placeholder rows. If the load fails, the entire tab area is replaced by a centered
error `Alert` ("Couldn't load achievements") with the specific message and a "Try again" button that
retries the same fetch — a **load** failure blocks the whole view this way, deliberately different
from a mutation failure (toggling one achievement, saving stats, etc.), which only shows a toast and
leaves the rest of the view usable.

If the game genuinely has no achievements at all, the Achievements tab shows an empty state:
"No achievements" / "This game doesn't have any achievements." The Statistics tab has its own
equivalent empty state: "No statistics" / "This game doesn't have any statistics." If a search query
matches nothing in the currently active tab, both tabs show the same search-specific empty state
instead: "No results match your search" / "Try a different search term."

## Achievements tab — browsing and sorting

The Achievements tab (`AchievementsTab.tsx`) opens on a virtualized list (`AchievementsList.tsx`,
`react-window`) of every achievement for the game — built for games that ship hundreds of
achievements without any performance cliff. Above the list sits a header row with:

- **A trophy-cabinet-style completion readout** on the left: a trophy icon (turns amber once every
  unprotected achievement is unlocked), an "{{unlocked}} / {{total}} unlocked" count, and a thin
  progress bar beneath it (also turns amber at 100%).
- **A sort dropdown** on the right (`GameSortSelect`, `aria-label` "Sort achievements") with six
  options: "Global unlock %" (the default), "Name" (A-Z), "Unlocked first", "Locked first",
  "Unprotected first", "Protected first". This sort preference is saved to `localStorage` via the
  shared `sortPreferencesStore` (the same store every other sortable grid in the app uses), so it
  persists across sessions and app restarts — it's a personal UI-taste setting, not per-account or
  per-game. The default sort (global unlock %, descending) only shows meaningful ordering once
  `percent` is actually populated for every row — see "Achievement rarity" below.
- Search (typed into the header's search box) only narrows which rows *render* — it's applied after
  sorting, and none of the counts, the Unlock all/Lock all buttons, or the completion readout are
  affected by an active search filter; they always reflect the complete, unfiltered achievement list.

Each achievement row (`AchievementRow.tsx`) shows, left to right: a checkbox (see "Staging changes"
below), a 44x44 achievement icon (the unlocked icon if achieved, the locked/greyed icon otherwise,
sourced from `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/{appId}/{icon}`)
with a small corner badge — a green checkmark if unlocked, a grey lock icon if not — the achievement's
name and description (description shown in muted/smaller text; if the achievement is **Hidden** and
not yet achieved, the description is blurred until you hover over it, per Steam's own hidden-achievement
convention), and — if `percent` data is available — a small rarity pill next to the name reading
e.g. "42.5% • Common" (see "Achievement rarity" below). On the far right sits either an Unlock/Lock
button for that one achievement, or a disabled ban-icon button if the achievement is protected (see
"Protected, Hidden, and IncrementOnly flags").

## Achievements tab — unlocking or locking one achievement

The button on the far right of each unprotected achievement row toggles that single achievement:
if the achievement is currently locked, the button reads **"Unlock"** (a lock-open icon, primary/blue
style); if it's currently unlocked, the button reads **"Lock"** (a lock icon, **danger/red style** —
this is a real destructive-styled control, not just a visual accent). Clicking it fires immediately —
**there is no confirmation dialog for a single achievement's toggle**, unlike the bulk actions below.
While that specific row's request is in flight, its button shows a pending spinner and is the only row
disabled; every other row stays interactive.

Behind the scenes this calls the `set_achievement` Tauri command with `unlock: true`/`false` (the
frontend already knows the achievement's current state from the initial load, so it passes the
desired end state directly rather than a generic "toggle"). On success, the row updates in place (no
refetch) and a toast confirms it: `"{{name}}" unlocked` or `"{{name}}" locked`. On failure, a toast
shows the specific error (see "Errors" below) with a "Learn more" link where applicable; the row's
`achieved` state is left unchanged.

## Achievements tab — staging changes with checkboxes, then Apply changes

Every unprotected row's checkbox works as a **staging** mechanism, separate from the per-row
Unlock/Lock button: an already-unlocked achievement's checkbox starts **checked**, and unchecking it
stages a lock; an already-locked achievement's checkbox starts **unchecked**, and checking it stages
an unlock. You can stage any mix of achievements this way without anything actually changing yet.
Protected achievements' checkboxes are disabled and can't be staged at all.

Once at least one achievement is staged, a new button appears next to the sort dropdown:
**"Apply changes ({{count}})"** (`dashboard.achievements.actions.applyChangesCount` — note this is
the actual button text; it is **not** labeled "Save changes", which is the Statistics tab's separate
save button — see "Docs mismatch" note below if you're cross-referencing the docs site). Clicking it
opens a confirmation dialog titled **"Apply staged changes?"**, whose body text adapts to what's
staged: "This will unlock {{unlockCount}} and lock {{lockCount}} staged achievement(s)." if both are
present, or an unlock-only/lock-only variant of that sentence otherwise. The dialog has "Cancel"
(secondary) and "Apply changes" (primary) buttons.

Confirming replays `set_achievement` once per staged achievement (there's no single bulk command for
an arbitrary unlock+lock mix — that's exactly what Unlock all/Lock all below are for, when you want
literally everything). A single staged item failing doesn't abort the rest of the batch — each call
is wrapped individually, logged, and the loop continues. When it finishes: if at least one succeeded,
a success toast shows "{{count}} achievement(s) updated"; if fewer succeeded than were attempted, an
additional danger toast reads "Some staged achievements couldn't be updated. Please try again."
Toggling a single achievement directly via its own Unlock/Lock button (bypassing the staging flow
entirely) automatically clears that achievement from the staged set if it happened to be staged.

## Achievements tab — Unlock all / Lock all

Two buttons sit in the header row, always visible: **"Unlock all"** (a lock-open icon) and
**"Lock all"** (a lock icon, **danger/red style** — a real destructive control). "Unlock all" is
disabled whenever there's no unprotected locked achievement left to unlock; "Lock all" is disabled
whenever there's no unprotected unlocked achievement left to lock. Both ignore any active search
filter — they always act on literally every achievement for the game, not just the currently visible
subset.

Clicking either opens a confirmation dialog first: **"Unlock all achievements?"** ("This will unlock
every achievement for this game that isn't already unlocked or protected.") or **"Lock all
achievements?"** ("This will lock every achievement for this game that isn't already locked or
protected."), each with "Cancel" and a matching primary/danger "Unlock all"/"Lock all" confirm
button. Confirming calls `unlock_all_achievements` or `lock_all_achievements` — one backend command
that composes bulk semantics either C#-side (CLI/Legacy Sign-in, via `BulkAchievementSetter.cs`) or
Rust-side (Steam Sign-in/agent mode, since the daemon has no native bulk IPC verb), both returning the
same `{ succeeded, skipped, failed }` shape. Rows for every succeeded id flip locally without a
refetch. If nothing actually changed (everything was already in the requested state, or everything
was protected), a warning toast reads "Nothing to change - already in the requested state, or
protected." instead of a success toast; otherwise a success toast reads "{{count}} achievement(s)
unlocked/locked". Any per-item failures are logged (not toasted individually) — they don't block the
successes from applying.

## Statistics tab — editing values and saving

The Statistics tab (`StatisticsTab.tsx`) shows the same kind of virtualized list, one row per game
statistic (`StatisticsList.tsx`/`StatisticRow.tsx`). The header row shows an icon-prefixed count
("{{count}} statistic(s)") and, once at least one value has been changed, an "{{count}} edited" pill
next to it. Search here also only narrows visible rows — the edited count, Save, and Reset all always
apply to every stat that's actually been touched or exists, regardless of the current filter (a stat
you edited and then filtered out of view is still included when you save).

Each unprotected stat row shows a bar-chart icon (with a small trending-up corner badge and tooltip
"This statistic can only increase, never decrease." if the stat is flagged `incrementOnly`), the
stat's display name, its active flags in muted text ("Flags: {{flags}}"), and a number input on the
right (`NumberField` with visible +/- step buttons) pre-filled with its current value. Changing a
value marks that row visually (an "Edited" pill next to its name, an accent-tinted icon background)
and stages the new value locally — nothing is sent to the backend until you save. Setting a value back
to its original number automatically un-stages it.

The header's **"Save changes"** button (an upload icon) is disabled whenever nothing is staged, and
its label grows a count once something is: "Save changes ({{count}})". Unlike the Achievements tab's
bulk actions, saving stats has **no confirmation dialog** — clicking it immediately calls
`update_stats` with every staged `{ name, value }` pair (built from each edited stat's internal
`id`, never its display name — the backend looks the stat up by id and returns `stat_not_found` if
given the display name instead) and, on success, shows a toast "{{count}} statistic(s) updated" and
clears every staged edit. A refresh icon button next to Save re-fetches the game's full achievement
and stat data from scratch.

## Statistics tab — Reset all

A second button, **"Reset all"** (a counter-clockwise rotate icon, **danger/red style**), resets
every statistic for the game back to its default value — including ones you haven't touched, not just
staged edits. Clicking it opens a confirmation dialog: **"Reset all statistics?"** / "This will reset
every statistic for this game back to its default value. This can't be undone." with "Cancel" and a
danger-styled "Reset all" confirm button. Confirming calls `reset_all_stats`; unlike every other
mutation in this overlay, this is the one action that refetches the full data afterward (via the same
`load()` used on open) rather than patching state locally, since the backend doesn't report what the
new reset values actually are. On success it shows a toast "Statistics reset" and clears any pending
local edits.

## Protected, Hidden, and IncrementOnly flags

Steam lets a game's developer mark individual achievements/stats with restriction flags — these come
straight from Steam's schema for the game, not anything SGI controls, and are shown directly in the UI:

- **Protected** — settable only by the game's own official servers, never by any client (SGI
  included). A protected achievement's row shows a disabled ban-icon button in place of the normal
  Unlock/Lock button (with a tooltip: "Set by the game server and can't be changed by clients."), and
  its checkbox is disabled too, so it can't be staged either. A protected stat's row shows its current
  value inside a static warning-colored pill (ban icon + value) instead of an editable number field,
  with the same tooltip text. If *any* achievement or stat for the game is protected, the header-level
  warning banner described above appears.
- **IncrementOnly** — a counter-style statistic that can only go up (e.g. total enemies killed) —
  raisable from 5 to 6 but not lowerable from 5 to 4. Shown as a small trending-up icon badge on the
  stat's row icon, with a hover tooltip explaining the restriction. This flag is informational display
  only — the number field doesn't actually block you from typing a lower value client-side; Steam's
  own backend is what enforces the one-way constraint.
- **Hidden** — the achievement's description is blurred by default in the achievements list (Steam's
  own "don't spoil it" convention for secret achievements) and reveals on hover. This only applies
  while the achievement is still locked — once achieved, its description always shows normally.

## Achievement rarity (the "X% • Common/Rare/..." pill)

Each achievement row can show a small colored pill next to its name — a percentage (e.g. "42.5%")
followed by a rarity-tier label. The percentage is `AchievementDto.percent`, Steam's own public
global-unlock-rate figure for that achievement (the same number Steam's client shows on an
achievement's tooltip) — this is presentational, not something SGI computes. The five tier labels and
their thresholds (rough eyeballed bands over that percentage, purely a visual "loot rarity" cue with
no functional meaning) are: **Legendary** (below 1%), **Epic** (1–5%), **Rare** (5–15%),
**Uncommon** (15–50%), **Common** (50%+). If `percent` is missing for a given achievement (a rare
lookup miss/failure case), no pill renders for that row at all, and it sorts to the bottom under the
default "Global unlock %" sort.

Under Legacy Sign-in (CLI mode), this percentage comes back natively as part of the same local call
that loads achievement data. Under Steam Sign-in (agent mode), the backend awaits a separate Steam
Web API request and backfills the rarity percentages into the achievement list *before* returning
it to the app — so the whole list, rarity included, appears in one shot rather than the list showing
first and percentages popping in afterward. The only user-visible effect is that agent-mode
achievement loading can take a touch longer than CLI mode's. If that backfill request itself fails,
the achievement list still loads normally — the affected achievements just show no rarity pill at
all for that load, rather than retrying or showing an error. For the full "why" behind this
sign-in-mode difference, see `ai-corpus/architecture-guides/achievement-rarity.md`.

## Errors you can see, and what causes them

A **load** failure (fetching the game's achievement/stat data) replaces the whole tab area with a
blocking error `Alert` titled "Couldn't load achievements" plus a "Try again" button. A **mutation**
failure (toggling one achievement, applying staged changes, a bulk unlock/lock, saving stats) instead
shows a toast and leaves the rest of the view untouched. The specific message depends on the error
code the backend returned:

- **"This app doesn't have achievement data."** — the AppID has no achievement schema at all.
- **"That achievement couldn't be found."** / **"That statistic couldn't be found."** — the specific
  achievement/stat id wasn't recognized (a stat save always sends the stat's internal `id`, never its
  display name — sending the display name by mistake produces this exact error).
- **"That value is set by the game server and can't be changed."** — attempting to modify something
  actually protected (should be unreachable through the UI itself, since protected controls are
  disabled, but the backend enforces it regardless).
- **"This game isn't supported for achievements when signed in with Steam — use your local Steam
  client instead."** (Windows) or the Linux variant with no such fallback suggestion — a real,
  confirmed sign-in-mode capability gap: Steam Sign-in (agent mode/daemon) cannot manage achievements
  at all for Game Coordinator titles (Team Fortress 2 / AppID 440, Dota 2 / 570, Counter-Strike 2 /
  730, Left 4 Dead 2 / 550, Portal 2 / 620) — Legacy Sign-in (CLI mode, Windows-only, requires a real
  running local Steam client) has no such restriction and works normally for these five games. This
  message only appears for Steam Sign-in accounts trying to open/act on one of those five titles.
- A handful of generic session/connection errors (session not found, unknown Steam ID, request
  timeout, the SteamUtility helper process having exited, "Steam needs to be running") can also
  surface here, worded the same way they are anywhere else in the app.
- Any other/unrecognized error code falls back to: "Something went wrong loading achievements. Please
  try again. ({{code}})".

Aside from that one Game Coordinator restriction, every command this overlay uses
(`get_achievement_data`, `set_achievement`, `unlock_all_achievements`, `lock_all_achievements`,
`update_stats`, `reset_all_stats`) is a single command surface that branches internally on sign-in
mode — not a separate agent-only/CLI-only command pair — so day-to-day usage looks and behaves
identically regardless of which way you signed in. Legacy Sign-in (CLI mode) does require the local
Steam client to actually be running for every mutating action (toggling, bulk unlock/lock, stat
edits, stat reset) — if it isn't, those calls fail with a "Steam needs to be running" style error;
just loading/viewing achievement data has no such live-Steam-client requirement.

## No tier gating, no dedicated Settings tab

Nothing in the Achievement Manager overlay is gated by subscription tier — every control (toggling
one achievement, staging changes, Unlock all/Lock all, editing/saving/resetting stats) is available
identically on every tier, confirmed by reading every component and the hook (`useAchievementManager.ts`)
in this feature: none of them import or check `hasCasualAccess`/`hasGamerAccess`/`subscriptionStore`.
This feature also has no Settings-modal tab and no dedicated settings file of its own — nothing here
is persisted per-account beyond the achievement/stat data itself (which lives on Steam's own servers,
not locally). The only thing that persists locally at all is the achievements-tab sort preference,
which lives in the shared, cross-feature `sortPreferencesStore` (a `localStorage` blob also used by
every other sortable grid in the app), not anything owned by achievement-manager itself.

## Docs-vs-code mismatch: the Achievements tab's "Apply changes" button

The published docs page (`features/achievement-manager/index.mdx`) describes the checkbox-staging
flow as "Use the checkbox next to each achievement to toggle its state, then click **Save changes**
to apply the changes" — but the actual button the Achievements tab renders for this is **"Apply
changes"** (or "Apply changes ({{count}})" once something is staged), never "Save changes". "Save
changes" is the real label used on the separate **Statistics** tab's save button instead. This file
uses the real, current button text ("Apply changes") as ground truth per the component source; the
live docs page still says "Save changes" for the Achievements-tab case and needs a manual fix on the
docs site itself (out of scope for this generated corpus file).
