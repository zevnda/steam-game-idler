<!-- url: https://steamgameidler.com/docs -->
# Games List

Generated corpus content (see `.claude/skills/generate-ui-guide/SKILL.md`) — the single merged
source for the Games List page's UI and its cross-feature connections. Verified against
`src/features/games-list/**`, `src-tauri/src/games/**`, `src/shared/utils/buildGameCardMenu.ts`,
`src/shared/hooks/useContextMenu.ts`, and every shared store/component it touches. There is no
dedicated docs page for this feature specifically (the site's `/docs` root `index.mdx` is a generic
card-link launcher to every other feature's docs, not games-list content of its own — see the
"Docs" section below) — the `url` above points at that generic root rather than a page that
actually documents this feature. Regenerate this file via that skill when any of the code it's
based on changes — don't hand-edit it to patch small drift.

## What the Games List is and where it lives

The Games List (internally `GamesPage.tsx`, routed at `src/pages/dashboard/index.tsx` — i.e. plain
`/dashboard`) is the default landing page shown immediately after signing in, reached any time by
clicking **Games** at the top of the sidebar's Games section. It renders every game the signed-in
Steam account owns as a card grid, and it is also where idling starts and stops from directly —
there is no separate "start idling" step anywhere else. The Idling page (`/dashboard/idling`) is
only a filtered, view-only list of whatever games this page's own idle toggles have started,
grouped by which feature claimed them; it has no idle-start controls of its own for a game that
isn't already idling. This page is a real persistent `DashboardShell` route, so switching to a
different page and back never re-fetches from scratch — see "Shared owned-games cache" below.

## Page header — title, count, sort, and refresh

The header (`GamesPageHeader.tsx`) shows the page title ("Games", `dashboard.sidebar.nav.games`),
a live game count directly beneath it ("{N} game"/"{N} games", `dashboard.games.count`), and on the
right: a sort dropdown and a refresh button.

- **Sort dropdown** (`GameSortSelect`, the same shared sort-select component every other browsable
  grid in the app uses) offers, in this fixed order: Playtime (High to Low) — the default —
  Playtime (Low to High), Recently Played (Newest First), Recently Played (Oldest First), Name
  (A-Z), Name (Z-A). The choice is persisted across navigation, app restarts, and reload via
  `sortPreferencesStore`'s `games` slot (a `localStorage` blob shared with 6 other sortable grids'
  own slots — this page only ever reads/writes its own `games` entry). The two "Recently Played"
  options are hidden from the dropdown entirely (not shown disabled) for a CLI-mode (Legacy Sign-in)
  account that hasn't set its own Steam Web API key — see "Sign-in-mode differences" below for why,
  and it falls back to Playtime (High to Low) automatically if a previously-saved choice becomes
  one of the hidden options (e.g. right after switching to an account that can't produce that data).
- **Refresh button** (circular-arrows icon, `TbRefresh`) re-fetches the owned-games list from
  scratch. Unlike the silent background refreshes described below, clicking this one visibly
  replaces the whole page with a loading skeleton (30 placeholder tiles, `GameGridSkeleton`) while
  it runs, so the click has real, visible feedback — the Idling page's own instance of the same
  underlying refresh hook has its own separate loading flag, so triggering a refresh from one page
  never flashes the other page's skeleton.

## Privacy-warning banner (CLI mode / Legacy Sign-in only)

If the backend detects the account's Steam profile or game-details privacy setting is blocking
complete data (see "Sign-in-mode differences" below), a warning `Alert` appears just under the
header, above the grid: title "Some game data may be missing", body "Your Steam profile or game
details appear to be set to private, so playtime, recently played, and some games may be
incomplete. Make your profile public, or add your own Steam Web API key in Settings to fix this."
Two buttons sit on the right of the banner: **Change privacy settings** (opens
`steamcommunity.com/my/edit/settings` in the system browser) and **Add my own API key** (opens the
app-wide Settings modal directly on its General tab). This banner can never appear for a Steam
Sign-in (agent-mode) account — see below for why.

## Loading, error, and empty states

- **Loading**: the 30-tile `GameGridSkeleton` grid, shown while the games list is fetching for the
  first time this session, or during a manual refresh, or during a full agent-mode language-driven
  reload (see "Shared owned-games cache" below).
- **Error**: if the fetch itself failed, a centered danger `Alert` replaces the whole grid — title
  "Couldn't load games", with a specific description depending on the underlying error code:
  "Couldn't load playtime data from Steam right now" (Steam Web API request/response/key problems),
  "Couldn't read or write the games cache" (local cache I/O failure), or a generic fallback that
  still shows the raw error code for anything unrecognized (including agent-mode session/timeout
  codes forwarded as-is). A **Try Again** button underneath re-runs the same fetch.
- **Empty (no owned games at all)**: a controller-icon (`TbDeviceGamepad2`) empty state — "No games
  found" / "This account doesn't own any games yet."
- **Empty (search filtered everything out)**: a magnifying-glass icon (`RiSearchLine`) empty state —
  "No results found" / a generic "try a different search" description (`common.search.*`) — shown
  when the account does own games but the active search query matches none of them.

## Recommended and Recently Played carousels

Above the main grid, two optional horizontally-scrolling carousels can appear (`GameCarousel.tsx`,
a shared shell also usable by other card shapes, though today only this page uses it): **Recommended**
(`dashboard.games.carousels.recommended`) — every owned game with zero total playtime
(`playtimeForeverMinutes === 0`), capped at the first 20 — and **Recently Played**
(`dashboard.games.carousels.recent`) — every game with a nonzero last-played timestamp, sorted most
recent first, capped at 15. Each carousel renders the exact same `GameCard` as the main grid
(thumbnail, idle toggle, achievements button — see below), just at a fixed card width instead of the
grid's responsive column width (440px for Recommended, 192px for Recently Played). Recommended
auto-advances every 7 seconds and loops back to the start at the end; Recently Played is manual-only
(no auto-advance). Both carousels have left/right chevron buttons; clicking one during
auto-advance pauses it for 5 seconds before auto-advancing resumes. Either carousel disappears
entirely (not just hidden-empty) if it would have zero items to show, and independent of that, each
is gated by its own always-visible toggle in **Settings → Customization**: "Show Recommended
Carousel" and "Show Recently Played Carousel" (`showRecommendedCarousel`/`showRecentCarousel`,
default **on** for both). These two toggles are app-wide (stored in the main `settings.json`, not
per-Steam-account) and free for every user — unlike most of that same Customization tab (themes,
custom background, non-default fonts), the carousel toggles carry no tier gate at all. Neither
carousel's contents are affected by the page's own search bar or sort dropdown — they're always
computed straight from the full unfiltered/unsorted owned-games list, independent of what's
currently visible in the grid below them.

## The main game grid — a bespoke virtualized list, not the shared `VirtualizedGameGrid`

Below the carousels, a header line reads "All Games" (`common.tabs.allGames`), followed by every
owned game (search-filtered, then sorted per the header's controls) as a responsive card grid —
2 to 8 columns depending on measured container width (`useResponsiveColumnCount`, shared with every
other game grid in the app). Despite `VirtualizedGameGrid` (`src/shared/components/
VirtualizedGameGrid.tsx`) being the shared 2D-grid virtualization component idling/favorites/
card-farming/achievement-unlocker/auto-idle/inventory-manager's own large browse grids use, the
Games List page does **not** use it — `GamesList.tsx` builds its own virtualization directly on
react-window's 1D `List`, with one row per section (an optional Recommended-carousel row, an
optional Recently-Played-carousel row, the "All Games" header row, then chunked rows of real game
cards). This is deliberate: mixing full-width, differently-sized carousel rows into
`VirtualizedGameGrid`'s per-cell 2D virtualization isn't practical, so this page's own
heterogeneous-row `List` is what lets the carousels live in the same scrollable region as the grid
and scroll off-screen together, rather than sitting in a separate sticky area above it. A
**back-to-top** floating button appears once you've scrolled down and jumps back to the very top
(above the carousels) when clicked.

## `GameCard` — the card itself, in full (reused directly by other features)

`GameCard.tsx` is games-list's own component, but it is the literal component the Idling page's
`IdlingSection` imports and renders directly for its own currently-idling groups — not a copy, the
same import — so everything below applies equally to a game card seen on the Idling page. It is
also the one card type in the whole app that renders a direct, one-click achievements button (see
below); every other feature's own card (favorites, card-farming, achievement-unlocker, auto-idle)
only reaches achievement-manager via the shared right-click menu described further down.

Each card is a vertical stack:
- **Thumbnail** (`GameThumbnail`, shared with every other game card in the app): the game's Steam
  header image (`cdn.cloudflare.steamstatic.com/steam/apps/{appId}/header.jpg`). If the image fails
  to load, a decorative placeholder (a soft radial glow, a faint diagonal hatch pattern, and the app
  logo mark) renders instead rather than a broken-image icon. Hovering anywhere on the card draws an
  accent-colored inset ring around just the thumbnail (not the name/buttons row below it).
- **If the game is currently idling**, an `IdleTimer` badge overlays the top-left corner of the
  thumbnail: a small dark pill with a play-icon and a running mm:ss (or h:mm:ss once past an hour)
  elapsed-time counter, ticking every second. This timer is frontend-only — it measures "since this
  session last observed this game idling," not true wall-clock time across app restarts, since
  neither backend reports an actual idle-start timestamp.
- **Name row**, below the thumbnail: the game's display name (truncated with a native title
  tooltip if it overflows; falls back to "App {appId}" via `dashboard.games.unknownName` if neither
  backend could resolve a name), and two icon-only buttons on the right:
  - A **play/stop button** (`TbPlayerPlayFilled` when not idling, `TbPlayerStopFilled` red-tinted
    when idling; `aria-label` "Start idling {name}" / "Stop idling {name}") — toggles manual idling
    for that one game via the backend's `toggle_manual_idle` command. It shows its own pending
    spinner while the toggle request is in flight (this card's own `isIdlePending`, keyed per app
    id, not a page-wide loading state — clicking one card's toggle never disables any other card).
  - A **trophy button** (`TbTrophyFilled`, `aria-label` "Open achievements for {name}") — opens the
    achievement-manager overlay for that exact game via `useAchievementManagerStore`'s `open(appId,
    name)`, letting you view/unlock/lock individual achievements by hand, entirely independent of
    any automation.

## Idle toggle mechanics — what actually happens on click

Clicking a card's play/stop button calls `toggle_manual_idle` with the account, app id, and name
(the name is needed for CLI mode's hidden idle-process window title). On success, if the backend
reports any per-game failure in the result, a danger toast surfaces a specific message (session-
not-found, timeout, process-exited, "SteamUtility.exe not found," process-spawn-failed, "Steam
isn't running," or a max-playtime-cap-reached message) rather than silently no-op'ing; on an
unexpected error, the raw error is toasted too. Either way, the hook then does a fresh
`get_idle_state` read (not the toggle command's own return value) to update what's shown — this
closes a real race where the daemon's own push event for the change could otherwise arrive and get
applied before this command's promise even resolves, which would make a stale echo of the toggle
overwrite a more current state.

Behind the scenes, this toggle claims (or releases) that one game under the **`manual`** owner key
in `idling::claims::IdleClaimsRegistry` — the same claims registry every idle-consuming feature
(auto-idle, card-farming, achievement-unlocker) must go through, so features never clobber each
other's idle set. Manual idling has no backend loop that re-claims games on a tick the way
card-farming/achievement-unlocker do, so on the Idling page, a game started this way is stopped by
the plain, generic `stop_owner_idling` command — unlike card-farming/achievement-unlocker's own
per-owner "Stop," which must call their own dedicated stop command instead (see
`ai-corpus/architecture-guides/shared-idling.md` for the full cross-feature reconciliation
mechanics, including what "Stop All" does and why a game claimed by two owners at once only shows
in one section).

`idlingStore` (the store backing "is this app id idling," refreshed by `useIdlingSync`, mounted
once in `DashboardShell` so it survives navigation) is what both this page and the Idling page read
for `isIdling`/idle-start-time — neither page keeps its own separate copy.

## Right-click context menu — the full item list

Right-clicking any game card anywhere in the app (this page's cards carry the same
`data-game-card-appid`/`data-game-card-name` attributes every other feature's cards do) pops the
app's native Tauri-driven context menu (`useContextMenu`, mounted once at the app root) instead of
the browser's default menu or the app's own window-wide Copy/Paste fallback. Built by
`buildGameCardMenu.ts`, its items in order are:

1. **Start Idling** / **Stop Idling** (`common.gameCardMenu.startIdling`/`stopIdling`) — toggles
   manual idling for that one game via the exact same `toggle_manual_idle` command the card's own
   play/stop button uses; a failure surfaces the same danger toast.
2. **Manage Achievements** (`common.gameCardMenu.manageAchievements`) — opens the achievement-manager
   overlay for that game. On this page it's functionally redundant with the card's own trophy
   button (both call the same `open(appId, name)`), but it's the *only* way to reach
   achievement-manager from a card on every other feature's own list (favorites, card-farming,
   achievement-unlocker, auto-idle), since none of those build their own trophy button into their
   cards.
3. A separator.
4. **View on Steam** (`common.gameCardMenu.viewOnSteam`) — opens
   `store.steampowered.com/app/{appId}` in the system browser.
5. A separator.
6. **Add To** (`common.gameCardMenu.addTo`) — a submenu with one entry each for **Favorites**,
   **Card Farming**, **Achievement Unlocker**, and **Auto Idle**. Each entry calls that feature's own
   add command (`add_favorite`, `add_to_card_farming_whitelist`,
   `add_to_achievement_unlocker_queue`, `add_to_auto_idle_list`) with just the app id and name, and
   is safe to click even if the game is already on that list — every one of those backend commands
   dedupes by app id on its own side, so there's no need to check membership before showing the
   item.

This is the one and only way to add a games-list game directly to another feature's list without
navigating to that feature's own page first.

## Sort — `sortPreferencesStore`'s `games` slot

The sort dropdown's selected value is one field (`games`) inside `sortPreferencesStore`, a single
`localStorage`-persisted blob shared across 7 different sortable grids in the app (this page,
favorites, achievement-unlocker, auto-idle, card-farming, achievement-list, inventory) — each grid
only ever reads/writes its own named slot, so changing this page's sort order has no effect on any
other page's remembered sort choice. It's hydrated once at app start (`useSortPreferencesSync` in
`DashboardShell`) and survives navigation, reload, and app restart. The six sort styles themselves
(`sortOwnedGames.ts`) are shared verbatim with achievement-unlocker's and auto-idle's own "all
games" browse tabs, since all three want identical comparator behavior for a plain `OwnedGame[]`
(card-farming's own browse tab sorts a different `GameWithDrops` shape via its own separate util).

## Search — no inline search bar on this page; the titlebar owns it

This page renders no search input of its own anywhere in its own component tree. Filtering is
driven entirely by `searchStore.queries.games` — a query set by the shared titlebar/global-search
affordance mounted at the app root, keyed to this page by its registered `SearchScopeId` ('games',
mapped to the exact pathname `/dashboard` in `src/shared/search/scopes.ts`). Typing a query there
fuzzy-filters (`Fuse.js`, matching on name and app-id-as-string, tolerant of small typos) the grid
shown below the carousels in real time — the carousels themselves are never affected by search, by
design (they're a discovery surface, not the searched list). Since this page has only one tab (no
Browse/Queue-style split the way achievement-unlocker or favorites have), it never needs to
self-report "my current tab isn't searchable" the way those pages do — the search affordance is
always available here.

## Shared owned-games cache — what "shared" concretely means

`gamesListStore` is owned by this feature but is explicitly a shared cache: `idling`'s own page and
`free-games` both read the exact same fetched list via the same `useGamesList()` hook this page
uses (idling needs every owned game's name to build its own idle-target requests; games-list itself
is the one page guaranteed to enumerate every owned game, since idling/favorites are always subsets
of it). Concretely, for the user, this means:

- **Switching away from `/dashboard` and back does not refetch** — `useGamesListSync` is mounted
  once in `DashboardShell` (never torn down by route changes within `/dashboard/*`), so the fetched
  list simply keeps existing in memory regardless of which page is currently showing.
- **Switching between two already-loaded accounts also skips a refetch**, unless that account's
  cached copy has gone stale — a flat 5-minute staleness window (`STALE_AFTER_MS`), the same for
  both sign-in modes, since `get_owned_games` calls the Steam Web API for playtime enrichment in
  both modes today. Only past that window does switching back to an account trigger a fresh
  background fetch automatically.
- **A CLI-mode (local) account paints instantly from an on-disk cache** the very first time it
  becomes active this session, via `get_owned_games_cache` (a plain last-cached-copy read, no
  network call), before the real fetch resolves — because a CLI-mode account already has a resolved
  SteamID64 to key that cache read by from the moment it signs in. An agent-mode account has no such
  key until its live daemon session resolves one internally as a side effect of the fetch itself, so
  it always starts from the loading skeleton instead, with nothing to instantly paint from.
- **A manual refresh, an account switch, and a background silent refresh are three different code
  paths that share one fetch function** (`fetchGamesList`) but differ in visible feedback: manual
  refresh and a first-time/stale account switch both show the full-page loading skeleton; a
  background "Automatically Update Games List" tick (see below) or an agent-mode language-switch
  reload are silent to the eye except that the latter does briefly show the skeleton too (every
  name in the list is about to change, so it's treated as a visible reload, not a quiet one).
- **Switching the app's display language** only ever triggers a refetch for an **agent-mode**
  account — agent-mode names are resolved server-side using this app's own locale
  (`achievements::steam_language::steam_language_for_locale`), so a language switch genuinely
  changes what should be shown. A CLI-mode account's names track the local Steam client's own
  configured language entirely independently of this app's UI language, so switching this app's
  language never has anything to refetch for it.

## Automatic background refresh — "Automatically Update Games List" (Settings → General, Casual tier)

Independent of the staleness window above, a Casual-tier-gated toggle in **Settings → General**
("Automatically Update Games List") silently re-fetches this exact page's list on a timer while
it's enabled — every 5 minutes normally, or every 1 minute if the account has its own Steam Web API
key set (the shared built-in key backs off further to stay within Steam's own rate limits across
every one of the app's ~1,850 daily users). This refresh is fully silent: it never flips the header
refresh button's spinner and never shows the loading skeleton, since it would otherwise interrupt
whatever you're doing on the page for a background poll. It re-checks Casual-tier access live on
every enable/disable and subscription-tier change (mounted once in `DashboardShell`), so a
subscription lapsing mid-session stops the interval without needing anything to be clicked.

## Sign-in-mode differences — what's actually different by mode here

`get_owned_games` (`src-tauri/src/games/commands.rs`) is one command surface branching internally
on the `GamesAccount` enum (`Agent { username }` / `Local { steam_id }`), not two separate commands
— and reading its real match arms surfaces several concrete differences a Games List user can
notice:

- **The privacy-warning banner can only ever appear for a Legacy Sign-in (CLI-mode) account.**
  Agent mode's ownership check (SteamKit2's own PICS-based lookup) already comes back fully
  enriched with playtime from the daemon's live authenticated session and never touches the public
  Steam Web API at all, so it's never subject to a private-profile block. CLI mode's ownership
  check has no playtime of its own and must merge in the Steam Web API's `GetOwnedGames` response —
  which Valve silently omits a `game_count` field from if the queried profile's privacy settings
  block it (unless the request uses that account's own API key) — that specific signal is what
  drives `possiblyPrivate`.
- **"Show Games Only" (Settings → General) only exists for agent-mode accounts** — it's entirely
  absent from the Settings UI for a CLI-mode account. When on (the default), only real
  games/family-shared titles are counted, filtering out DLC/soundtracks/videos/tools from what
  `get_owned_games` returns; toggling it triggers an immediate re-fetch so the change is visible
  right away. CLI mode has no equivalent toggle because its ownership check is bound to a curated,
  already-games-only candidate whitelist by construction — there's no broader "everything" scope
  to filter down from in the first place.
- **"Recently Played" sort needs `rtime_last_played`, which the CLI-mode backend can only source
  from the Steam Web API — and Valve only actually populates that field when the API key used
  belongs to the queried account itself.** Every CLI-mode account riding the app's shared built-in
  key (i.e. every one that hasn't set its own key in Settings → General) silently gets `0` back for
  every game, which would make that sort degrade to a no-op alphabetical order rather than error —
  so both "Recently Played" options are hidden from the sort dropdown entirely for that account
  rather than left clickable-but-broken. An agent-mode account is never affected by this, regardless
  of whether the app is using the shared key elsewhere, since its `rtime_last_played` comes from
  SteamKit2's own authenticated session, not the public Web API.
- **Manual-add is not available on this page at all, for either sign-in mode** — unlike Favorites,
  Card Farming, Achievement Unlocker, and Auto-Idle, which each have their own header "+" button
  opening the shared `ManualAddGameModal` for adding a game by raw App ID/name (e.g. for Steam
  content the owned-games import doesn't surface, like movies/videos). The Games List page has no
  such button; it always shows the full backend-resolved owned-games list only.

## Backend: the `games::` module and its cache

`src-tauri/src/games/` is the shared foundation nearly every other per-game feature ultimately
consumes (owned-games retrieval), not something unique to this page. `get_owned_games` resolves the
account's SteamID64 first (agent mode: from the live daemon session, once known; CLI mode: already
known from sign-in), then either calls `steam_agent::AgentManager::get_owned_apps` (agent mode,
already playtime-enriched, optionally scoped by `games_only`) or
`local_steam::ownership::check_ownership` (CLI mode, no playtime, merged afterward with a Steam Web
API `GetOwnedGames` call using the OS-credential-store-resolved API key override if one exists).
The merged result — `appId`, nullable `name`, `playtimeForeverMinutes`, `rtimeLastPlayed`, and an
internal `lastRefundEligiblePurchaseUnixSeconds` field card-farming's own refund-window check reads
(always `null`/absent for CLI-mode games, which has no license-grant-time API surface at all) — is
written to a per-SteamID64 on-disk cache (`games::cache`) as a side effect of every successful
fetch, which is exactly what backs `get_owned_games_cache`'s instant-paint read described above.

## Docs

There is no dedicated docs page for the Games List specifically. The site's `/docs` root
(`index.mdx`) is a plain card-link launcher out to every other feature's own docs page — it carries
no Games-List-specific content of its own to fold in here, which is why this file's header `url`
points at that generic root rather than a real feature page. The closest real, load-bearing content
that does exist is a single troubleshooting entry worth knowing about: **"Signed in, but my games
list is empty or incomplete"** (`troubleshooting.mdx`) advises checking that the Steam profile's
**game details** privacy setting is Public, trying the header **Refresh** button described above,
and — as a last resort — **Settings → Debug → Clear Data** (which signs out every account and wipes
all local data, not something to suggest lightly). That single entry is the only games-list-specific
fact folded in from that page; the rest of `troubleshooting.mdx` covers unrelated features and isn't
superseded by this file.
