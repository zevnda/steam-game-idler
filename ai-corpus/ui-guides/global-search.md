# Global Search

This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/shared/components/search/GlobalSearchBar.tsx`, `GlobalSearchModal.tsx`, `searchStore.ts`,
`src/shared/search/scopes.ts`/`fuzzySearch.ts`, `useGlobalSearchShortcut.ts`, and every consuming
page's own search wiring (`GamesPage.tsx`, `FavoritesPage.tsx`, `AutoIdlePage.tsx`,
`CardFarmingPage.tsx`, `AchievementUnlockerPage.tsx`). It is the single merged source for this
feature (there is no dedicated docs page for it — see the "Docs coverage" note below) and should be
regenerated via that skill whenever the search bar/modal, `searchStore`, or the set of registered
search scopes changes — not hand-patched for small drift.

## What global search is and where it lives

Global search is a titlebar affordance for filtering the currently-visible page's game grid by
name or App ID — it is not a separate search page or a cross-page/cross-library lookup. It's
rendered by `GlobalSearchBar` inside `Titlebar.tsx`, positioned centered in the titlebar's
drag-region strip (`left-1/2 -translate-x-1/2`), and its companion `GlobalSearchModal` is mounted
once in `DashboardShell.tsx` alongside the other permanent overlays (Settings, Achievement
Manager, etc.) — so the same modal instance serves every dashboard route rather than each page
having its own.

The bar/modal pair only exists in one place — there is no separate per-page "inline" search input
anywhere in the app. Every page that's filterable (see below) reads the exact same shared query
value the titlebar bar/modal writes to; the page itself renders no search box of its own, only the
already-filtered grid and (if the filtered result set is empty) its own empty state. Typing in the
titlebar search modal is the *only* way to filter any of these grids.

## Which pages show it, and which don't

The search bar/modal is not simply "hidden while signed out" — it's driven by a registry of
searchable route scopes plus a per-page "is my active tab actually searchable right now" flag, and
it renders nothing at all (not a disabled icon, a fully absent element) anywhere it doesn't apply.

`src/shared/search/scopes.ts` defines exactly five registered scopes, matched by exact route
pathname:

| Scope id | Route | Page |
|---|---|---|
| `games` | `/dashboard` | Games (the default post-sign-in landing page) |
| `favorites` | `/dashboard/favorites` | Favorites |
| `achievementUnlocker` | `/dashboard/achievement-unlocker` | Achievement Unlocker |
| `autoIdle` | `/dashboard/auto-idle` | Auto Idle |
| `cardFarming` | `/dashboard/card-farming` | Card Farming |

`useActiveSearchScope()` looks up the current route in this table and returns `null` if it doesn't
match — and `GlobalSearchBar` renders nothing at all when the scope is `null` (a hidden affordance
was a deliberate choice over a visibly-disabled one, per the component's own comment). Concretely,
this means the search bar is **completely absent** on:

- The sign-in landing page (`/`) and every sign-in sub-screen — no route match.
- **Idling** (`/dashboard/idling`) — no route match. This page has no search wiring anywhere in its
  source at all.
- **Free Games** (`/dashboard/free-games`) — no route match, no search wiring.
- **Inventory Manager** (`/dashboard/inventory-manager`) — no route match, no search wiring.

On top of the route match, `searchStore.isActiveTabSearchable` (default `true`) is a second gate
both `GlobalSearchBar` (hides the bar) and `useGlobalSearchShortcut` (disables the `/` key) read
through. A page with more than one internal tab, where only one tab's data is actually the
filterable grid, sets this to `false` while any other tab is active, and resets it back to `true`
on unmount so navigating away never leaves search hidden on the next page you land on:

- **Favorites** (`favorites` scope) — searchable only while its **"Browse"** tab is active, not its
  **"list"** (curated favorites) tab. The favorites list tab is deliberately left unfiltered:
  dragging to reorder replaces the *entire* persisted favorites order, so filtering it would risk
  silently dropping currently-hidden favorites from the saved order on the next drag.
- **Auto Idle** (`autoIdle` scope) — searchable only while its **"Browse"** tab is active, not its
  **"queue"** tab, for the identical reorder-data-loss reason as Favorites.
- **Achievement Unlocker** (`achievementUnlocker` scope) — searchable only while its **"Browse"**
  tab is active AND no unlock run is currently in progress AND the finished-run summary isn't
  showing. While a run is active or its summary is displayed, the tabs aren't even on screen (a
  progress view takes over), so search is hidden then too.
- **Card Farming** (`cardFarming` scope) — searchable only while its **"Browse"** tab is active AND
  a Steam Community cookie connection exists (`connected`) AND no farming cycle is currently
  running AND the finished-run summary isn't showing. Its other two tabs ("whitelist"/"blacklist")
  are never filterable.
- **Games** (`games` scope) — always searchable; it's a single-tab page, so it never touches
  `isActiveTabSearchable` at all and just uses the default `true`.

Global search is not tier-gated — every scope above is available at every subscription tier,
including Free.

## Opening it — the search bar and the `/` shortcut

**Clicking the titlebar bar**: at window widths ≥1024px (Tailwind's `lg` breakpoint), the bar
renders as a full 288px-wide rounded pill showing a magnifying-glass icon (`RiSearchLine`) and
either the placeholder text "Search" or the scope's current query (in `text-foreground` once a
query exists, muted otherwise). If a query is active, an "X" clear button (`TbX`) appears at the
pill's right edge — clicking it calls `clearQuery(scope.id)` directly, without opening the modal.
Clicking anywhere else on the pill opens `GlobalSearchModal` for the current scope. Below 1024px
(the window is too narrow for the pill to sit centered without colliding with the titlebar's
logo/sidebar-toggle group on the left or menu/window-control group on the right), the bar collapses
to a smaller auto-width pill with the same icon and truncated placeholder/query text, but **no
separate clear button** — clicking it still opens the same modal either way, so nothing about the
search flow itself changes between the two sizes.

**Pressing `/`**: `useGlobalSearchShortcut` (mounted once in `DashboardShell`, so it's live on any
`/dashboard/*` route) opens the modal for whatever scope is currently active. It fires only when:
the `/` key is pressed with no Ctrl/Cmd/Alt modifier held; a searchable scope is currently active
(same `useActiveSearchScope()`/`isActiveTabSearchable` gating as the bar's visibility — the
shortcut is silently inert everywhere the bar itself is hidden); and focus isn't currently inside
an `<input>`, `<textarea>`, or any `contentEditable` element (so typing a literal "/" character
into a text field never hijacks the keystroke). This exact shortcut is also listed for the user
under Settings → Keybinds (Navigation section, "Open Search" row showing the `/` key) — same
binding, just documented a second time there as part of the app's full keybind reference; nothing
about its behavior differs between the two.

## Using the search modal

`GlobalSearchModal` is one `Modal` (HeroUI), top-anchored (`placement='top'`), bound directly to
`searchStore.activeScope` (non-`null` = open) and the query for that scope — there's no separate
local input buffer to keep in sync, so the input's value is always exactly `queries[activeScope]`.

- **The input auto-focuses on open** and updates the store on every keystroke
  (`setQuery(activeScope, value)`) — the underlying page's grid, sitting behind the modal, is
  already filtering live as you type, before you commit anything (see "How this relates to what's
  filtered on the page" below). An "X" button appears in the input's suffix once there's text,
  clearing the query without closing the modal.
- **While the query is empty**, the body shows either a "Recent searches" list (up to 10 entries,
  most-recent-first, each with its own small "X" remove button) or, if there are none yet, a
  centered empty state: a search icon plus "No recent searches."
- **While the query is non-empty**, it fuzzy-searches (`fuse.js`, via `searchGames()`) the current
  scope's game list and shows up to 8 live-matching results, each a row with a small game thumbnail
  and the game's display name (or "Unknown Game (App ID)" fallback if the name is missing). All
  five scopes currently resolve to the same underlying owned-games array for this live preview —
  even Card Farming's own "Browse" tab, which actually renders a narrower "games with drops
  remaining" list elsewhere on the page, deliberately reuses the full owned-games list here rather
  than the narrower one, since this is only a name-suggestion preview, not the real filtered set.
  If nothing matches, the body instead shows a centered empty state: a search icon plus "No results
  found."
- **Keyboard navigation**: Up/Down arrow keys move a highlight through whichever list is currently
  on screen (live results or recent searches), wrapping around at either end, and auto-scroll the
  highlighted row into view if it's outside the modal's scrollable area. Enter commits the
  highlighted row if one is highlighted, or commits the raw typed text if nothing is highlighted
  but there's a non-empty query. Clicking a row (result or recent search) commits it directly.
  Escape, while there's text in the input, clears the text but does **not** close the modal
  (matches the app's established Escape-to-clear-first convention); Escape with an empty input
  falls through to the modal's normal dismiss-on-Escape behavior and closes it. Clicking the
  backdrop also closes it.
- **Committing** (Enter, or clicking a row) sets the scope's query to the committed value (a no-op
  if it was already that value from live typing), adds the trimmed value to the front of
  `recentSearches` (deduplicating any existing identical entry, capped at 10, persisted to
  `localStorage` under the key `sgi.search.recentQueries`), and closes the modal. Note the query
  itself was typically already applied to the filtered grid the whole time you were typing —
  committing mainly exists to record the recent-search entry and close the modal, not to "apply"
  the filter for the first time.
- **`recentSearches` is a single global list, not scoped per search scope or per Steam account** —
  a recent search made while filtering Favorites shows up in the same list when you later open
  search from Achievement Unlocker, and it survives switching or signing out of accounts (see
  "Multi-account behavior" below, which clears queries but never touches `recentSearches`).

## How this relates to what's filtered on the page

There is exactly one query value per scope, held in `searchStore.queries[scopeId]`, and both the
titlebar bar and the modal read/write that same value — they are not two independent search
mechanisms, and neither page nor modal keeps a separate copy that could drift. Concretely, on the
Games page (`GamesPage.tsx`), for example: `searchQuery` is read straight from
`useSearchStore(state => state.queries.games ?? '')`, run through the same `searchGames()`
fuzzy-match helper the modal's own live-preview uses, and the resulting filtered/sorted list is
what actually renders in the grid. Because `GlobalSearchModal`'s input updates the store on every
keystroke (not just on commit), the page's grid behind the modal is already re-filtering in real
time as you type — closing or committing the modal doesn't trigger the filtering, it was already
happening.

Each of the five pages defines its own empty state for "a query is active but zero games match"
(a search-icon illustration, title "No games match your search," description "Try a different
title or App ID" — the literal `common.search.noResultsTitle`/`noResultsDescription` strings),
distinct from the modal's own inline "No results found" message shown for the live-preview list.
If a page you're on shows no results for a search term you know should match, check that term
against the App ID too — the fuzzy index matches on both the display name and the numeric App ID
(as a string), weighted 0.7/0.3 respectively, with a loose-but-bounded typo tolerance
(`threshold: 0.35`, `ignoreLocation: true` so a mid-title word matches, not only a prefix).

## Multi-account behavior

A query is scoped to whatever account's data happens to be on screen (owned games, achievements,
queue entries) — it has no meaning once a different account becomes active. `AccountSwitcher.tsx`
calls `searchStore.getState().clearAllQueries()` (wiping every scope's query back to empty,
`queries: {}`) in exactly two places: right after a successful account switch, and after signing
out the account that was active at the time. This clears the *queries* only — `recentSearches`
(the persisted suggestion list) is untouched by either of these calls and stays shared across every
account, as noted above.

## Docs and architecture-guide coverage

There is no dedicated docs page for global search anywhere in `docs/app/(marketing)/docs/_content/`
— it isn't listed in the docs site's page tree, and no existing page describes the feature itself.
The only place it's mentioned in the live docs is `settings/keybinds.mdx`'s keybind reference
table, which lists the same "Open search | `/`" row this file also documents above — that page
isn't superseded by this one (this file only supersedes docs *content*, and that page's own scope
is the full keybind list, not search specifically). There is also no
`ai-corpus/architecture-guides/*.md` file covering global search's "how it works" — it's simple
enough (a `zustand` store plus `fuse.js`) that no separate architecture guide exists or is needed;
this file is the sole corpus source for the feature.
