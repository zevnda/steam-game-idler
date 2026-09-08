<!-- url: https://steamgameidler.com/docs/features/favorites -->
# Favorites

This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/features/favorites/components/` and `src/features/favorites/hooks/useFavorites.ts` source, the
backend `src-tauri/src/favorites/` module, its cross-feature wiring (the shared right-click game-card
context menu, `searchStore`, `sortPreferencesStore`), and the `features/favorites.mdx` docs page. It
is the single merged source for this feature (UI + docs + cross-feature connections) and should be
regenerated via that skill whenever Favorites' UI, stores, or docs page change — not hand-patched for
small drift.

## What Favorites is

Favorites is a purely organizational bookmark list — pinning specific owned games to their own page
for quick access, separate from the full games library. Favoriting a game does **not** start idling
it, farm cards for it, or unlock its achievements; nothing else in the app reads or derives behavior
from favorite status. It has its own sidebar entry (`TbHeart` icon, labeled "Favorites",
`/dashboard/favorites` route) with no automation-running pulse dot (unlike Idling/Card
Farming/Achievement Unlocker's sidebar items) since favoriting never starts a background process.

The page (`FavoritesPage.tsx`) has a header (`FavoritesPageHeader.tsx`) showing the "Favorites" title,
a live count line under it — "{count} favorite(s)" if you have any, otherwise "No favorites yet" — and
a single icon-only "+" button (`TbPlus`, `aria-label` "Add game manually") on the right that opens the
manual-add modal (see its own section below). Below the header sit two tabs: **All Games** and
**Favorites**.

## The "All Games" tab — adding/removing a favorite by toggle

The `all-games` tab (`t('common.tabs.allGames')` = "All Games") shows every game you own, via the
same shared `useGamesList()` hook/cache the main Games page uses (`gamesListStore`, shared with the
Idling feature). Each game renders as a `FavoriteGameCard` inside a `VirtualizedGameGrid` (react-window
based, since this is a potentially large "every owned game" list):

- A `GameThumbnail` (Steam CDN header image with a logo placeholder fallback on load failure, plus a
  hover ring around the image only).
- The game's display name below (its Steam name, or "Unknown Game (`{appId}`)" if the name is
  missing), truncated with a tooltip title if too long.
- A single icon-only button on the right: a plus icon (`TbPlus`) if the game is **not** currently
  favorited, or a checkmark icon (`TbCheck`) if it **is**. `aria-label` reads "Add `{name}` to
  favorites" or "Remove `{name}` from favorites" depending on state. Clicking it calls
  `toggleFavorite(appId, name)`, which adds it via `add_favorite` if not yet favorited, or removes it
  via `remove_favorite` if it is. While that request is in flight, the button shows a pending spinner
  (`isPending`) and is scoped per-game (`pendingAppIds`), so toggling one game doesn't disable any
  other card.
- This tab does **not** show a trophy/achievement-manager button on its own card — `FavoriteGameCard`
  has no achievement-manager wiring. (See "Opening Achievement Manager from a favorited game" below
  for how you still reach it from here.)

**Sorting** (top-right of the tab bar, only shown while on this tab): a `GameSortSelect` dropdown
(`aria-label` "Sort games", sort-descending icon) with the same six styles every "all games" browse
list shares — Most Played, Least Played, Recently Played, Least Recently Played, Name A-Z, Name Z-A.
The two "recently played" options are hidden for a Legacy Sign-in (CLI-mode) account that hasn't set
a custom Steam Web API key, since Valve's public API only returns real last-played timestamps for the
key's own account — with the app's shared embedded key, every game silently comes back with a
last-played time of 0, which would make that sort a no-op. Your chosen style is remembered per
device via `sortPreferencesStore`'s `favorites` slot (a `localStorage` blob, one of seven sort-style
slots the store holds), defaulting to "Most Played" (`playtimeDesc`) the first time.

**Search**: the global search bar/modal filters this tab's game list (search scope `favorites`,
registered at pathname `/dashboard/favorites`). Typing a query narrows the grid to matching games by
title or App ID; an empty-search-results state shows "No games match your search" / "Try a different
title or App ID." if nothing matches. **Search does not filter the "Favorites" tab** — see that tab's
own section below for why.

**States**: while the owned-games list is loading, this tab shows 12 skeleton card placeholders. If
loading the owned-games list fails, a danger `Alert` shows with a "Try Again" button that re-triggers
the fetch. If you own zero games at all, an empty state shows a game-controller icon with the games
list's own empty-state copy. If you own games but a search query matches none, the "No games match
your search" empty state (above) shows instead.

## The "Favorites" tab — viewing, reordering, and removing favorites

The `list` tab (labeled "Favorites") shows only your favorited games, as a plain CSS grid (not
virtualized — the favorites list is inherently small/bounded, and this tab also needs `@dnd-kit`'s
sortable drag-and-drop, which needs every item actually mounted, not virtualized). Each entry renders
as a `FavoriteListCard` wrapped in `SortableFavoriteListCard` (the drag-enabled shell):

- A `GameThumbnail` (same as the browse tab) plus the game's name below (stored alongside the App ID
  at favorite-time, so it renders correctly even if the game is transiently missing from the current
  owned-games response — see backend section).
- A single icon-only "X" button (`TbX`) on the right, `aria-label` "Remove `{name}` from favorites".
  Clicking it calls `removeFavorite(appId)` — no confirmation dialog for removing a single favorite.
  While removal is in flight, the button shows a pending spinner (per-game, via the same
  `pendingAppIds` set the browse tab uses).
- **The whole card is draggable** (`cursor-grab`) to reorder your favorites list. Dragging uses
  `@dnd-kit`'s `PointerSensor` with an 8px activation distance (so a plain click doesn't
  accidentally trigger a drag), shows a floating `DragOverlay` copy of the card while dragging, and
  on drop calls `reorder()` with the full list in its new order. The reorder is applied **optimistically**
  — the UI updates immediately, and the new order is persisted to the backend afterward with no
  rollback attempted if the save fails (there's no single "correct" previous order worth reverting to
  over what you just dragged).
- **A "Clear" button** appears in the tab bar's top-right (only while on this tab, and only if you
  have at least one favorite) — a red/danger-styled button. Clicking it opens a confirmation dialog:
  "Clear all favorites?" / "This will remove all `{count}` games from your favorites list.", with
  "Cancel" and a red "Clear" confirm button. Confirming calls `reorder([])` (an empty list), wiping
  every favorite for the active account in one call.

**Search does not filter this tab, by design.** The reorder handler (`onReorder`) replaces the
*entire* persisted favorites order via `set_favorites_order` — if a search filter were wired in here,
dragging while a search query was active would silently drop every currently-filtered-out favorite
from the saved order on the next reorder, a real data-loss bug. The global search bar/titlebar
affordance is hidden entirely while this tab is active (rather than being left visibly present but
inert) — it reappears automatically when you switch back to the "All Games" tab or navigate away.

**States**: while favorites are loading, this tab shows 6 skeleton placeholders. If you have zero
favorites, an empty state shows a heart icon with "No favorites yet" / "Add games from the All Games
tab to see them here."

## Adding a favorite from anywhere else — the game-card right-click menu

Favorites is not only manageable from its own page. **Every** `GameCard`-shaped component across the
app (games list, idling, achievement-unlocker, auto-idle, card-farming — anywhere a card carries
`gameCardContext.ts`'s data attributes, including Favorites' own two card components) responds to a
right-click with a shared context menu (`buildGameCardMenu.ts`, popped by a single app-root-mounted
`useContextMenu()` listener). That menu includes an "Add To" submenu with a "Favorites" entry
alongside "Card Farming", "Achievement Unlocker", and "Auto Idle" — clicking it calls `add_favorite`
directly for that game, **unconditionally**, regardless of whether the game is already favorited
(the backend command is idempotent — adding an already-favorited game is a silent no-op, not an
error, so the frontend doesn't check membership first before firing the call). This is an **add-only**
shortcut — there is no "Remove from Favorites" entry in this context menu; removing a favorite is only
possible from the Favorites page itself (its "Favorites" tab's X button, its "All Games" tab's toggle,
or the "Clear" bulk-remove button).

Because this context-menu add happens outside the Favorites page's own component tree, `useFavorites`
subscribes to a small cross-component event bus (`gameListsBus.ts`) so an already-mounted Favorites
page picks up the change immediately without needing a remount — the same mechanism the achievement-
unlocker queue, auto-idle list, and card-farming whitelist use for the same reason (their own "add to"
menu entries reaching a page that isn't the one that fired the add).

## Opening Achievement Manager from a favorited game

Favorites' own card components (`FavoriteGameCard.tsx`, `FavoriteListCard.tsx`) have **no dedicated
trophy/achievement button** — unlike the main Games page's `GameCard.tsx`, which has one directly on
the card (the one place in the app with a persistent achievement-manager button on the card itself,
since it's the one page guaranteed to list every owned game). However, because every game card
(Favorites' included) carries the same `gameCardContextAttrs` data attributes, **right-clicking a
favorited game anywhere on this page still opens the shared context menu**, which includes a "Manage
Achievements" entry — clicking it calls `useAchievementManagerStore.getState().open(appId, name)`,
opening the same `AchievementManagerOverlay` any other page's game card opens (rendered once by
`DashboardShell`, gated on `achievementManagerStore.openGame`). So Achievement Manager is reachable
from a favorited game, just via right-click rather than a visible button.

## Manually adding a game

The "+" button in the page header (`aria-label` "Add game manually") opens `ManualAddGameModal` — a
shared modal also used by Card Farming, Achievement Unlocker, and Auto Idle's own headers. It has two
fields: **Name** (free text, placeholder "e.g. K-On! The Movie") and **App ID** (a number input,
placeholder "e.g. 518440"). This exists to bookmark content the automatic owned-games import doesn't
surface at all (e.g. Steam movies/videos, filtered out by the curated real-games whitelist) — there is
deliberately no Steam lookup performed on the entered values; whatever name/App ID you type is saved
as-is. "Add" is disabled until both fields are non-empty and the App ID is a positive integer. If the
App ID you entered already exists in your favorites, submitting shows an inline error, "This App ID is
already in the list", instead of adding a duplicate. On success it calls the same `addFavorite` used
elsewhere on this page and closes itself.

## Errors

Any failure from `get_favorites`/`add_favorite`/`remove_favorite`/`set_favorites_order` shows a danger
`Alert` at the top of the page (below the header, above the tabs): title "Couldn't update favorites",
with a body message resolved from the backend's stable error code — "Couldn't read or write the
favorites cache." for a `favorites_cache_io_failed` code, the shared session/timeout/steam-ID-unknown
messages for `agent_session_not_found`/`agent_request_timeout`/`agent_steam_id_unknown`, or a generic
"Something went wrong updating favorites. Please try again. (`{code}`)" fallback for anything else.
This is separate from the "All Games" tab's own games-list-loading error state (a different Alert,
tied to `get_owned_games` failing rather than a favorites-command failing).

## Backend and persistence — how a favorite survives a restart

Favorites are stored per signed-in Steam account in a **cache file**, `favorites.json`, one per
account subdirectory under the app's cache directory (`platform::cache_dir`) — **not** part of the
app-wide `settings.json` and not a per-account *settings* file either; it's deliberately grouped with
the other per-account "cache" files (`games/cache.rs`, `auto_idle/cache.rs`,
`inventory/cache.rs`, `achievement_unlocker/cache.rs`), all written with the same atomic-write-JSON
helper. Each entry stores just `{appId, name}` — the name is persisted alongside the ID for the same
reason idling's targets do: it lets the page render correctly even before the owned-games list has
resolved, and survives a game transiently missing from the current owned-games response.

Because rapid add/remove clicks are real (unlike a once-per-refetch cache like the games list),
every mutation (`add`/`remove`/`set_order`) goes through a single process-wide async lock held for
the full read-modify-write cycle, so two near-simultaneous favorite/unfavorite clicks can't race and
silently drop one of them. `add`/`remove` are both idempotent — adding an already-favorited game or
removing a game that isn't favorited is a normal no-op, not an error, and either way the command
returns the resulting full list. `set_favorites_order` (used by drag-reorder and by "Clear", which
passes an empty list) bulk-replaces the whole stored list, preserving whatever order it's given.

Favorites are resolved by SteamID64 via the same `resolve_steam_id`/`GamesAccount` helper every other
per-account feature uses — **one command surface, branching internally between Steam Sign-in
(agent-mode) and Legacy Sign-in (CLI-mode)** rather than separate command sets; there is no observable
behavior difference between the two sign-in modes for Favorites specifically. Favorites has no
Settings-tab presence and no settings file of its own — nothing about this feature is configurable
beyond the list contents and their order.

## Cross-feature connections summary

- **`gamesListStore`** (via `useGamesList()`) backs the "All Games" tab's game list — shared with the
  Games page and Idling feature's own owned-games cache.
- **`searchStore`** filters only the "All Games" tab (scope id `favorites`, pathname
  `/dashboard/favorites`); the "Favorites" tab opts out via `setActiveTabSearchable(false)` while
  active, restored to searchable on tab switch or navigating away.
- **`sortPreferencesStore`**'s `favorites` slot persists the "All Games" tab's chosen sort style
  across restarts (default "Most Played" / `playtimeDesc`).
- **`achievementManagerStore`** is opened from a favorited game only via the shared right-click
  context menu's "Manage Achievements" entry — Favorites' own cards carry no dedicated
  achievement-manager button, unlike the main Games page's `GameCard`.
- **`gameListsBus`** is how an add triggered from the shared right-click "Add To → Favorites" menu
  entry (fired from any page's game card, not just this one) reaches an already-mounted Favorites
  page without a remount.
- **No idle-claims involvement** — favoriting a game never claims an idle slot; Favorites has no
  backend automation loop at all.
- **No tier-gating** — nothing in Favorites is Casual/Gamer-gated; it's fully available on every
  tier.
