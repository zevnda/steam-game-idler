<!-- url: https://steamgameidler.com/docs/features/free-games -->
<!-- supersedes: https://steamgameidler.com/docs/features/free-games/what-counts-as-a-free-game, https://steamgameidler.com/docs/features/free-games/notifications, https://steamgameidler.com/docs/settings/free-games -->
# Free Games

Generated corpus content (see `.claude/skills/generate-ui-guide/SKILL.md`) — the single merged
source for the Free Games feature's UI, its Settings tab, and its cross-feature connections, built
from `src/features/free-games/`, `src/features/settings/components/FreeGamesSettingsTab.tsx`, the
`freeGamesStore`/`freeGameNotificationsStore` shared stores, `Sidebar.tsx`, and the feature's full
docs subtree. Regenerate via that skill when any of those change — don't hand-edit to patch small
drift.

## What counts as a free game

SGI only lists a game as "free" if it is an ordinary paid game **temporarily discounted to $0.00**
as a limited-time promotion or sale on the Steam store. This is different from a free-to-play
game, which has no price and is always free — free-to-play games are never shown in the Free Games
list. DLC and games the signed-in account already owns are also never shown. This is a deliberate,
permanent scope limitation, not a bug: the discovery scrape only ever surfaces temporarily-free
paid titles, never a genuine evergreen "Free on Demand" package (the kind Steam sometimes gives
away permanently) — those two are mechanically different on Steam's side and SGI's claim mechanism
is built specifically around the temporarily-free-promo case.

## Opening the Free Games page

Click **Free Games** (a gift-box icon, `TbGift`) in the sidebar's Games section, or navigate to
`/dashboard/free-games`. The page header shows the title "Free Games" and, beneath it, either "N
free games available" (pluralized) if any are currently listed, or "No free games right now" if
the list is empty. Two icon-only buttons sit at the top-right of the header:
- A refresh icon (`TbRefresh`, aria-label "Refresh") — manually re-runs the discovery check.
- A gear icon (`TbSettings`, aria-label "Settings") — opens the Settings modal directly to its
  Free Games tab (see "Settings — Free Games tab" below).

Below the header, the page shows one of four states:
- **Full-page loading skeleton** — a grid of 30 skeleton tiles. This only appears on the very
  first free-games fetch of the app session (before `freeGamesStore`'s `phase` has ever flipped to
  `'ready'`) — since the discovery list is already fetched by the time the dashboard shell mounts
  (see "How the list stays populated" below), a user navigating to this page after sign-in
  essentially never sees this skeleton in practice; it's only reachable if this page is opened
  during that first few seconds of app startup.
- **Error state** — a centered danger `Alert` titled "Couldn't load free games" with a
  code-specific description and a "Try again" button that re-runs the fetch. Error copy: a
  discovery-scrape failure reads "Couldn't check Steam for free games right now."; an unrecognized
  error code falls back to "Something went wrong loading free games. Please try again. ({{code}})".
- **Empty state** — a centered gift icon (40px `TbGift`), "No free games right now", and "Check
  back later — Steam periodically offers games for free."
- **Grid** — a responsive card grid (2 columns on small screens, up to 6 on 2xl) of free-game
  cards, one per currently-discovered, not-yet-owned game. There is no search bar or sort control
  on this page (unlike most other browse-style game grids in the app) — cards render in whatever
  order the backend's discovery scrape returned.

## Each free-game card

Each card (`FreeGameCard`) shows, top to bottom: the game's Steam header image (a shared
`GameThumbnail`, same hover-ring/fallback-logo behavior as every other game card in the app — an
inset accent ring on hover, a fallback logo tile if the header image 404s), then a row with the
game's name (truncated, tooltip via its own `title` attribute on hover) on the left and a button on
the right.

- **Claim button** — reads "Claim". Clicking it calls the `claim_free_game` command for the
  currently active signed-in account and this game's app id. While the claim is in flight, the
  button shows its pending/spinner state. Once a claim resolves as granted, the button's label
  changes to "Claimed" and becomes a disabled, ghost-styled button — this is a genuine one-time
  technical state (a game can't be claimed twice), not a tier gate, so it's the one control on this
  page that's correctly a native disabled button rather than the app's usual gated-control pattern.
- **"You already own this game."** — shown in small muted text under the name/button row if the
  claim resolved as already-owned.
- **A red error line** — shown if the claim failed, or if the `claim_free_game` call itself threw
  (e.g. a session/network error). Critically, **the actual failure reason returned by Steam is
  never shown to the user** — a resolved `Failed` outcome always displays the fixed generic message
  "Couldn't claim this game. It may no longer be free, or you may already own it."; the real
  `reason` string only ever reaches the app's log file, not the UI. A thrown error (session
  timeout, missing SteamUtility, etc.) instead maps its error code to a specific message where one
  exists (e.g. "Couldn't sign in to the Steam Store. Please try again." for a store-login failure)
  or the same kind of generic fallback otherwise.

A successful claim (`granted`) immediately, optimistically removes the card from the grid (no
waiting for a full refetch) and triggers a refresh of the account's owned-games list in the
background, so the game's new ownership is reflected everywhere else in the app (games list,
idling) without the user needing to do anything else.

## How claiming actually works, and when a Steam sign-in window appears

Both sign-in modes claim through the exact same mechanism under the hood: a direct authenticated
request to Steam's own store checkout endpoint (the same one the store website's "Add to
Cart"/claim button drives) — not Steam's classic license-granting network call, which can't grant
this kind of temporarily-free promo at all. One command (`claim_free_game`) handles both modes; the
frontend never branches on sign-in mode itself.

- **Agent mode (Steam Sign-in)** — claiming needs no visible window at all, ever. The app already
  holds a live signed-in Steam connection for this account and derives the session cookies it needs
  for the claim directly from that connection.
- **CLI mode (Legacy Sign-in)** — claiming needs a real Steam Store web session, which the local
  Steam client doesn't provide on its own. The **first** time this account claims a free game (via
  either this page's Claim button or the Settings tab's auto-redeem sign-in step), a real, visible
  "Steam Store Sign-In" window opens and waits (up to 5 minutes) for you to sign in with username/
  password or by scanning a QR code. Every claim after that reuses the same persisted, per-account
  session silently — the app first tries to silently refresh that session in the background if it's
  gone stale, and only falls back to showing the visible sign-in window again if that silent
  refresh fails (e.g. the session has fully expired). So "does a login window pop up when I click
  Claim" is genuinely mode-dependent and session-state-dependent, not something that happens on
  every claim.

If a claim doesn't confirm ownership within a few seconds, the app keeps rechecking in the
background for up to about 45 more seconds. If that later confirms the game actually was granted
(despite the card having already shown a failure), a toast appears — "{{game name}} was actually
claimed successfully — the earlier failure notice was wrong." — and the account's owned-games list
is refreshed. This correction listener is mounted app-wide (in `DashboardShell`, not on this page),
so it fires and shows its toast even if you've since navigated away from the Free Games page, and
it matches corrections to the right account for every signed-in account, not just whichever one was
active when the original claim happened.

If you'd rather not sign in to Steam inside the app at all, you can instead visit the game's Steam
store page in your own browser and claim it there manually — SGI's claim flow is optional, not the
only way to get the game.

## Refreshing the list

The header's refresh button re-runs the same discovery check the automatic hourly poll uses. While
it's running, only the refresh icon shows a pending state — the page does **not** show the
full-page loading skeleton for a manual refresh (that skeleton is reserved for the very first,
app-session-opening fetch); the existing grid stays visible and simply updates once the refresh
completes. A manual refresh here does not by itself update the owned-games cache used to filter out
already-owned games — if you claimed a game outside the app (e.g. via a browser), use the Games
page's own "Refresh" button to keep that filter accurate; the free-games list is filtered against
whatever the owned-games cache currently has.

## How the list stays populated (discovery)

Discovery (checking Steam's storefront for currently-free promos) is a public, unauthenticated
scrape with no per-account concept — it's the same list for every signed-in account. It's driven by
a hook mounted once in `DashboardShell` (not by this page), so the discovery list is already
sitting in `freeGamesStore` — fetched during the app's normal post-sign-in startup window — by the
time a user ever navigates to the Free Games page. That background hook waits for the active
account's owned-games list to finish its own first load before it ever checks free games at all
(so ownership filtering is accurate from the very first check, not racing an empty owned-games
cache), then checks immediately and every hour after that for as long as the app stays open.
**SGI must be running for detection to happen at all** — it isn't a separate background service, so
a game that appears and gets claimed by someone else while the app is closed won't be caught until
the app reopens and runs a fresh check.

The grid you see on this page is always filtered against the currently active account's owned-games
cache (`gamesListStore`, the same shared cache the Games page and Idling page use) — a game the
active account already owns is never shown here, even if it's still on the raw discovery list.

## Free game notifications

A toggle in the Settings modal's Free Games tab, labeled "Free game notifications" — "Get a
notification when a new free game is available on Steam." This is an **app-wide** setting (stored
in the app's main `settings.json`, not scoped to any one Steam account), and it's read live from a
shared store (`freeGameNotificationsStore`) that's hydrated on app start and updated the instant the
toggle is saved — so flipping it takes effect on the very next hourly poll, not after a reload.

When enabled and the hourly background check finds a game that wasn't on the list last time it
checked, and the active account doesn't already own it, SGI shows a native OS notification titled
"Free Games Available!" — "{{name}} is free on Steam right now." for a single new game, or "{{N}}
new free games are available on Steam." for several at once. "New" here means new since the last
check that ran while the app was open (tracked in `localStorage`, app-wide, not per-account) — a
game isn't re-notified on every subsequent poll just because it's still listed, but it will be
treated as new again if it later rotates off the discovery list and back on. Note this dedup list
is completely separate from — and doesn't gate — automatic redemption below: auto-redeem keeps
retrying a still-listed, still-unowned game on every poll regardless of whether its notification was
already shown.

## Settings — Free Games tab

Reachable via **Settings → Free Games** (the gear icon in the Free Games page header, or the
"Free Games" entry in the Settings modal's own left-hand tab list). This tab is per-account for its
auto-redeem control (it loads/saves against whichever Steam account is currently active) but its
notifications toggle is app-wide, as described above — the tab visually presents both together as
one category even though they're backed by different settings files.

The tab has two rows:

1. **"Free game notifications"** — the same app-wide toggle described in the "Free game
   notifications" section above, saved via the `set_free_game_notifications` command.
2. **"Auto-redeem free games"** — "Automatically claim newly-discovered free games for this
   account." This is a **Gamer-tier** feature. If the active subscription doesn't have Gamer
   access, the switch still renders as a real, normal-looking, non-disabled toggle (never a
   native-disabled control) with a Gamer `TierBadge` next to its label; flipping it doesn't turn
   anything on — it instead opens the upgrade modal pre-scrolled to the Gamer tier. Once Gamer
   access is present, what renders instead depends on how this specific account is signed in:
   - **Agent mode (Steam Sign-in)** — a plain on/off switch. No separate session step is needed:
     agent mode already has a live Steam connection and can derive claim cookies from it on demand.
   - **CLI mode (Legacy Sign-in)** — instead of a switch, two buttons: "Sign in to Steam" (or
     "Reauthenticate" if a session was already established) and "Sign out" (disabled until
     auto-redeem is actually on). These double as the on/off control for this mode — clicking
     "Sign in to Steam" opens the same real, visible Steam Store sign-in window described above,
     establishes a persisted session for this account, and turns auto-redeem on; "Sign out" clears
     that persisted session and turns auto-redeem back off. A successful sign-in shows a "Signed in
     to the Steam Store" toast; sign-out shows "Signed out of the Steam Store". Turning auto-redeem
     on establishes/refreshes the session immediately, right when you flip it — deliberately not
     left to happen invisibly during a later background poll, so any real interactive sign-in
     always happens at a moment the user expects it.

A load failure on this tab shows the same danger-`Alert` + "Try again" pattern as the main page; a
save/action failure surfaces as a toast (e.g. "Couldn't sign in to the Steam Store. Please try
again." for a failed session establish, or a generic "Something went wrong updating your free-games
settings. Please try again. ({{code}})" fallback for anything else).

## Automatic redemption (Gamer tier)

Distinct from the manual Claim button on the page grid: automatic redemption runs entirely in the
background (the same `DashboardShell`-mounted hourly poll that drives discovery), independent of
whether the Free Games page is open or which account is active.

On every hourly poll, for **every currently signed-in account** (not just the active one) that both
has Gamer-tier access (a single, device-wide subscription check — the app has one subscription, not
one per Steam account) and has its own `autoRedeem` setting turned on, SGI attempts to claim every
game still on the discovery list that this specific account doesn't already own — every poll, not
just newly-discovered games, so a game that failed to claim earlier or an account that turned
auto-redeem on after a game first appeared still keeps getting retried for as long as that promo
stays live. A successful auto-claim shows a toast — "Auto-redeemed {{name}}" — and optimistically
drops the game from the Free Games page's grid immediately, the same way a manual claim does. A
failed auto-claim shows "Couldn't auto-redeem {{name}}"; an already-owned outcome produces no toast
at all. After any grants for a given account, that account's owned-games list is refreshed once
(not once per game claimed).

## Cross-feature connections

- **`gamesListStore` / `useGamesList`** — the Free Games page reuses the same shared owned-games
  cache the Games page and Idling page read, rather than fetching ownership itself, to filter out
  games the active account already owns. A stale owned-games cache (not yet refreshed since a claim
  made outside the app) can make an already-owned game appear here as still claimable until that
  cache is refreshed — via the Games page's own "Refresh" button, or automatically the next time a
  claim on this page succeeds.
- **Sidebar gold icon** — the sidebar's Free Games nav item's icon turns gold
  (`text-[#ffc700]`, driven by `Sidebar.tsx`'s `goldWhenClaimable` flag) whenever there's at least
  one currently-discovered, not-yet-owned free game for the active account — i.e. whenever this
  page's own grid would show at least one card. Only the icon changes color; the label text and the
  item's active/selected styling are untouched, and this doesn't compete with the pulse animation
  used by idling/farming/unlocking nav items (Free Games has no pulse state of its own). This is
  the app's own equivalent of a sidebar highlight rather than a separate notification badge.
- **`settingsModalStore`** — the page header's gear icon opens the Settings modal directly to its
  `freeGames` tab via `openSettings('freeGames')`, the same store every other feature's own
  settings-gear button uses.
- **`subscriptionStore` / `proModalStore`** — auto-redeem's tier gate reads the live subscription
  tier and, when ungated, reroutes to `proModalStore.openWithTier('gamer')` rather than disabling
  the control — see "Settings — Free Games tab" above for the exact rendered behavior.
- **No idle-claims involvement** — unlike card farming, achievement unlocker, manual idling, and
  auto-idle, Free Games never claims idle slots through `idling::claims::IdleClaimsRegistry`; it has
  no idling behavior of any kind, only ownership-granting.
- **No shared `GameCard`/context-menu/achievement-manager entry point** — `FreeGameCard` is its own
  component, not a reuse of the shared `GameCard` used by games-list/idling/favorites/auto-idle/
  card-farming/achievement-unlocker. There's no right-click context menu on a free-game card, and
  clicking one never opens the achievement-manager overlay the way those other features' cards do.
- **Multi-account scope difference** — the manual Claim button on this page only ever acts on the
  currently *active* signed-in account. Automatic redemption (above), by contrast, runs against
  *every* signed-in account each poll, each gated by that specific account's own saved `autoRedeem`
  setting — a backgrounded account can be auto-redeeming free games without ever being made active.
