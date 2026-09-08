<!-- url: https://steamgameidler.com/docs/features/card-farming -->
<!-- supersedes: https://steamgameidler.com/docs/features/card-farming/how-it-works, https://steamgameidler.com/docs/features/card-farming/blacklisting-games, https://steamgameidler.com/docs/features/card-farming/card-drop-times, https://steamgameidler.com/docs/settings/card-farming -->
# Card Farming

Generated corpus content (see `.claude/skills/generate-ui-guide/SKILL.md`). This file is the
single merged source for Card Farming — its own UI, the docs pages folded into it, and its
cross-feature connections. Regenerate via that skill whenever the components, its docs subtree, or
its cross-feature wiring change — don't hand-edit this file to patch small drift.

## What Card Farming is and where it lives

Card Farming (sidebar icon: a stack of cards, labeled "Card Farming") is a fully automatic Steam
trading-card farmer. It lives at its own route (`/dashboard/card-farming`, `CardFarmingPage`) and
runs as a real backend cycle (`card_farming::manager`) that survives navigating to a different
page — the cycle keeps running and its progress keeps updating even if you switch to Achievement
Unlocker or close the Card Farming page, because the sync that keeps its state current
(`useCardFarmingSync`) is mounted once in `DashboardShell`, not on the page itself.

Card Farming needs a live Steam Community web session (separate from being signed in to SGI
itself) to detect which games have card drops remaining and to farm them. Getting and maintaining
that session is covered in its own dedicated section below ("The Connect panel — the mandatory
first step") and in the architecture guide `ai-corpus/architecture-guides/card-farming-cookies.md`
(refer users there for the deeper mechanics of how cookies get acquired/refreshed — this guide
focuses on what you actually click and see).

## The Connect panel — the mandatory first step (verified gating behavior)

**You cannot start farming, and you cannot even see a Start button, until you connect a Steam
Community session.** This is enforced by the actual component structure, not just a UI suggestion:

`CardFarmingPage.tsx` renders its whole body as one of several mutually exclusive branches. Before
a session is connected (`connected` is `false`), the entire page area (below the header) renders
only `CardFarmingStartPanel` — there are no tabs, no browse grid, nothing else. The header
(`CardFarmingPageHeader`) itself only renders its Start/Stop/Settings button row at all when
`connected || isFarming` is true; while disconnected and not farming, that whole button row is
absent from the page — there is no disabled Start button sitting there either, it simply doesn't
exist in the DOM yet.

`CardFarmingStartPanel` wraps the shared `SteamCookiesConnectPanel` component (also used by
Inventory Manager's connect prompt and Settings' Steam Credentials tab — see that component's own
doc comment and `ai-corpus/ui-guides/settings-steam-credentials.md` for its full shared mechanics).
Within Card Farming specifically:

- It shows two tabs: an **Automatic** tab (label pulled from `common.connect.automaticTab`) whose
  description reads "Signs in to Steam Community automatically to check for drops," and a
  **Manual** tab (`common.connect.manualTab`) with a form for pasting cookies by hand.
  - The Automatic tab stays a real, clickable tab even for a non-Gamer account — it's never
    disabled — but selecting it or submitting from it when the account doesn't have Gamer access
    reroutes to `proModalStore.openWithTier('gamer')` (the upsell modal) instead of attempting the
    connection. A `TierBadge` reading "Gamer" sits next to the Automatic tab's label whenever the
    account doesn't qualify.
  - The Manual tab's form (`sls`/`sma` cookie fields) is available to every tier, free included.
  - The submit button reads "Sign In" while Automatic is selected, or "Save" while Manual is
    selected (`common.actions.signIn` / `common.actions.save`).
  - A "Clear" button (`showClear`) appears once a previously-saved cookie set exists, letting you
    wipe it and start over.
  - The panel's title is "Steam Credentials" (reusing `dashboard.settings.steamCredentials.title`)
    with a "Learn more" link (`common.learnMore`) pointing at the Steam Credentials docs page.
  - Any connect failure (a bad manual paste, a failed automatic attempt, Family View blocking
    access) renders as a danger `Alert` directly inside this panel, right above the tabs.

**Connecting does NOT start a farming cycle by itself.** `connect` (the action wired to this
panel's `onConnect`) only validates the supplied/derived cookies and populates the "Games With
Drops" browse tab's data — it never calls `start_farming`. Starting an actual cycle is a fully
separate, explicit action from the page header once you're connected (see "Starting and stopping a
cycle" below).

**Auto-connect can skip this screen entirely, but only after checking first.** Before showing the
connect panel, `useAutoConnectSteamCookies` checks two cases once per account: (1) a Gamer-tier
agent-mode (Steam Sign-in) account, whose daemon session mints cookies silently with no prompt at
all, or (2) any account (either sign-in mode, any tier) with a previously-saved manual cookie set
already on file. If either applies, `connect` fires automatically and, if it succeeds, the connect
panel is skipped and you land directly on the tabbed browse view. While this check (and any
auto-connect attempt it triggers) is still in flight, the page shows a neutral loading skeleton
(`GameGridSkeleton`) instead of flashing the connect panel first. If the auto-connect attempt
fails, the connect panel appears for you to retry manually — it is not retried again automatically
for that account this session.

**A session that dies mid-farm also drops you back to this same panel.** If the backend detects a
confirmed Steam Community session expiry while a cycle is actively running
(`state.sessionExpired`), the page automatically flips `connected` back to `false` and shows an
error explaining the session expired, please reconnect — you land back on exactly this same
Connect panel, not a separate error screen.

## Starting and stopping a cycle — the real "Start" button

Once connected, `CardFarmingPageHeader` shows the title "Card Farming," a status line reading
either "Not farming" or "Farming {n} game(s)" (`dashboard.cardFarming.status.idle` /
`.farming`), and — this is the ground-truth answer to what the actual button says — a button
reading **"Start"** (`common.actions.start`, a filled play-triangle icon `TbPlayerPlayFilled`)
that calls `start_farming` for the account. This matches the `card-farming-action` MockButton
type used in the docs (`▶ "Start"`) — **not** any heading text like "Farm All Games With Drops
Remaining" that surrounds it on the docs page; that's prose framing the button's *effect*, not the
button's actual label.

- The Start button is disabled only while the "Games With Drops" browse list is still loading or
  genuinely empty (`hasEligibleGames` false) — i.e., there's nothing eligible to farm right now.
  It shows a pending spinner while the start request is in flight (`isPending={isStarting}`).
- Once farming, the button is replaced by a red **"Stop farming"** button
  (`dashboard.cardFarming.actions.stop`, a filled stop-square icon `TbPlayerStopFilled`) that calls
  `stop_farming`.
- A gear icon-only button (`TbSettings`, aria-label "Settings") always sits at the end of this row
  once shown, opening the Settings modal directly on the Card Farming tab
  (`openSettings('cardFarming')`).
- Clicking Start does not require picking games or building a queue first — `start_farming` fully
  self-resolves everything server-side every outer-loop iteration (whitelist scope, skip
  filters, which phase to run). There is no queue-building step in the UI at all.
- Calling Start while a cycle is already running for the account is a no-op that just returns the
  current state rather than starting a second cycle (`CardFarmingManager::start` is idempotent).

## How a farming cycle actually behaves (the two-phase system)

This behavioral detail exists nowhere else in the corpus and is genuinely load-bearing for "why
isn't my game farming yet" questions — folded in here from the docs' `how-it-works.mdx` and
verified against `card_farming::manager`'s real logic.

Every outer-loop iteration, the cycle re-scrapes the account's games-with-drops list and puts each
eligible game into exactly one of two phases — **never both at once**, because idling anything
else alongside a drops-eligible game measurably collapses its own drop rate:

- **Building playtime (`bulkIdle` phase)**: some Steam accounts have a restriction where a game
  must clear a minimum playtime threshold before it starts dropping cards at all; others can drop
  immediately with no wait. This restriction isn't permanent — it can change over time (e.g.
  refunding a game can turn a previously unrestricted account into a restricted one). Games that
  haven't cleared the configured "Hours until farmable" threshold yet (Settings → Card Farming,
  default `3` hours) are idled together in batches (up to 32 concurrently) purely to accrue
  playtime toward that threshold — no card farming happens during this phase for those games.
- **Farming (`readyFarm` phase)**: once a game crosses the threshold, the cycle switches to
  actually farming it — solo (one game at a time, fewest drops remaining first) by default, or
  multiple at once if "Farm multiple games at once" is turned on in Settings (see below) — until
  its remaining drops hit zero, then moves to the next ready game. If nothing is ready, it falls
  back to building playtime again.

Whichever phase is active, the cycle periodically starts and stops the target game(s) internally
(a "restart cycle": idle for ~5 minutes, stop, a short pause, then a rapid individual sweep of each
target for a few seconds each) to make sure Steam registers playtime correctly and to help promote
drops. This is why `SteamUtility` processes can be seen starting and stopping repeatedly in Task
Manager while farming — that's expected, not a bug. It's recommended to set your Steam status to
"Offline" or "Invisible" while farming to avoid spamming friends with repeated status-change
notifications from this start/stop cycle.

**How to tell if your account is restricted**: there's no way to look this up directly. The
reliable test is: whitelist 3-5 owned games with real card drops remaining and zero recorded
playtime, temporarily set "Hours until farmable" to `0` and turn off "Farm multiple games at
once," start farming, and watch for ~30-60 minutes. If any of them drop a card in that window, the
account isn't restricted and `0` can stay. If none drop anything for several hours, the account is
likely restricted — set "Hours until farmable" to roughly how long the first drop took (`3` hours
is a reasonable default if skipping the test). This isn't a one-time answer — restriction status
can change (a refund is a common trigger), so it's worth re-testing occasionally.

## The "Games With Drops" tab (browse)

The default/first tab (label: "Games With Drops," `dashboard.cardFarming.tabs.gamesWithDrops`)
lists every owned game the account's Steam Community session reports has at least one card drop
remaining, fed by `get_games_with_drops` (which already excludes blacklisted games server-side).

Each card (`CardFarmingBrowseCard`) shows the game's thumbnail, name, and a "{n} drop(s)
remaining" count, plus two icon-only action buttons on hover:
- A ban icon (`TbBan`, aria-label "Blacklist {name}") — adds the game to the blacklist. Since a
  blacklisted game is filtered out server-side, this button only ever *adds*; un-blacklisting only
  happens from the Blacklisted tab (see below).
- A toggle icon (`TbPlus`/`TbCheck`, aria-label "Add {name} to whitelist" / "Remove {name} from
  whitelist") — adds or removes the game from the whitelist. This one toggles both ways from here.

The tab has its own sort control (`GameSortSelect`) with six styles: Drops Remaining (High to
Low/Low to High — the default is High to Low), Playtime (High to Low/Low to High), and Title
(A-Z/Z-A). It's also the one tab wired into the app's global search — searching while on this tab
filters `browseGames` by name; switching to Whitelist/Blacklist hides the search affordance
entirely (it isn't shown disabled, it's just not offered on those tabs).

Empty states: if there are genuinely no games with drops, it shows a cards icon with "No card
drops remaining" / "Every owned game's card drops are either fully farmed or none are available
right now." If a search filters everything out, it shows a magnifying-glass icon with the generic
"no results" copy instead.

## The Whitelist tab — restricting scope, not ordering

Label: "Whitelisted" (`dashboard.cardFarming.tabs.whitelisted`). This is a **scope list, not a
queue** — it has no ordering concept of its own. Its actual effect, verified against
`card_farming::whitelist`'s doc comment and `manager::resolve_candidates`: while the whitelist has
one or more members, farming only ever considers those specific games — every other owned game
with drops is ignored entirely, no matter how many drops it has left. The phase/tie-break rules
(fewest-drops-first while farming, closest-to-threshold-first while building playtime) still apply
*within* the whitelisted set exactly as they would across the full library. Leave the whitelist
empty to farm every eligible owned game.

Each card (`CardFarmingWhitelistCard`) shows the thumbnail, name, and a single "Remove {name} from
whitelist" icon-only button (`TbX`) — no drag-to-reorder handle, since there's no order to change.
A "Clear" button (danger-styled, top-right of the tab bar, only shown when the list is non-empty)
opens a confirmation dialog ("Clear the card farming whitelist? This will remove all {n} games
from the card farming whitelist. Farming will go back to considering every owned game with
drops.") before wiping the whole list via `clear_card_farming_whitelist`.

**The app prunes this list automatically, not just on request.** Every outer-loop iteration,
`manager::resolve_candidates` removes any whitelist member that's become ineligible for any
reason — its drops are exhausted, it got blacklisted, it no longer passes a skip-filter (see
Settings below), or it's now inside Steam's refund window — and reports the removal with a precise
reason in the session's "Completed" list once the cycle is running (see the Progress view section
below: "Nothing left to farm," "Removed from whitelist: has no recorded playtime," "Removed from
whitelist: already has playtime," or "Still inside the refund window (farmable again {date})").
You only ever *add* to the whitelist yourself (from the browse tab's toggle button, or via the
game-card context menu on other pages); removal-by-ineligibility happens on its own.

An empty-state (cards icon) reads "No games whitelisted" / "Add games from the Games With Drops
tab to restrict farming to just those games. Leave it empty to farm all game with drops" when
nothing is whitelisted yet.

## The Blacklist tab — permanent exclusion, not a toggle

Label: "Blacklisted" (`dashboard.cardFarming.tabs.blacklisted`). This is the opposite kind of
control from the whitelist: a blacklisted game is **permanently excluded** from ever being
farmed or even shown in the Games With Drops tab, regardless of whitelist membership or how many
drops it has remaining. Enforced in two places per the actual Rust code
(`card_farming::blacklist`'s doc comment): `get_games_with_drops` filters blacklisted IDs out of
the browse list server-side, and `manager::resolve_candidates` filters them out of every
outer-loop iteration's eligible pool — so a blacklisted game cannot slip through even if a setting
changes mid-session. Blacklisting a game also automatically removes it from the whitelist if it
happened to be a member (both server-side, defensively, and client-side immediately in
`CardFarmingPage`'s `handleBlacklist`).

**A game only ever enters the blacklist from the browse tab's ban button — this tab is
remove-only.** Each card (`CardFarmingBlacklistCard`) shows the thumbnail, name, and a single
"Remove {name} from blacklist" icon-only button (`TbX`); un-blacklisting a game re-runs a full
`get_games_with_drops` fetch (rather than an optimistic local add) since a blacklist entry doesn't
carry the `remaining`/`playtimeHours` fields a browse card needs to render immediately. A "Clear"
button (danger-styled, shown only when non-empty) opens a confirmation dialog ("Clear the card
farming blacklist? This will remove all {n} games from the card farming blacklist.") before
wiping the whole list.

An empty-state (ban icon `TbBan`) reads "No blacklisted games" / "Games you blacklist from the
Games With Drops tab will never be farmed and appear here" when nothing is blacklisted.

## The running-cycle Progress view

While a cycle is farming (or has just finished and the summary hasn't been dismissed yet — see
below), the tabs disappear entirely and `CardFarmingProgressView` takes over the whole page body.
It renders up to three sections, each only shown if it has entries:

- **Active** — a card grid (`CardFarmingActiveCard`), one per currently-targeted game, heading
  either "Farming ({n})" or "Building playtime ({n})" depending on which phase produced it. Each
  card shows the thumbnail, name, and a progress bar whose *meaning* changes with the phase: while
  building playtime, the bar tracks hours accrued toward the "Hours until farmable" threshold
  ("{hours}h / {threshold}h until farmable"); while actually farming, it reverts to the familiar
  drops-remaining bar ("{n} drop(s) remaining"). This distinction matters because a
  drops-remaining bar during the building-playtime phase would be actively misleading — nothing is
  being farmed for cards yet during that phase. These values refresh once per outer-loop iteration
  (roughly every 5-8 minutes depending on batch size) — deliberately not ticked forward faster than
  that between updates.
- **Up next** — a plain list (`CardFarmingGameRow`, `variant='queued'`) of every other
  currently-eligible game not selected as this iteration's target, heading "Up next ({n})". Each
  row shows an hourglass icon and either "{hours}h / {threshold}h until farmable" (still
  accumulating) or "Waiting its turn" (already farmable, just not picked this iteration).
- **Completed this session** — a plain list (`CardFarmingGameRow`, `variant='completed'`) of every
  game that stopped being tracked this session, heading "{n} completed this session." A genuine
  finish (drops hit zero while actively being farmed) shows just a green checkmark. Every other
  reason shows a neutral info icon plus explanatory text: "Nothing left to farm" (never had real
  drops — only reachable for a whitelist member), "Still inside the refund window (farmable again
  {date})," "Removed from whitelist: has no recorded playtime," or "Removed from whitelist:
  already has playtime." Unlike the other three, the refund-window reason can clear itself once the
  named date passes, without you needing to do anything — though whitelist membership itself, if
  any, still needs re-adding manually.

**The progress view deliberately stays visible after farming stops**, as long as the just-ended
cycle left a non-empty "Completed" summary worth showing — it does not vanish the instant the
cycle ends, so real results (cards farmed, games that maxed out) don't flash by unseen. A "Done"
button appears at the bottom of the summary in this state; clicking it (or starting a brand-new
cycle) is what actually dismisses it and returns you to the browse/whitelist/blacklist tabs.

**A per-game "Stop" from the Idling page can pull one specific game out of an active cycle without
stopping the whole cycle.** This calls `CardFarmingManager::remove_active_game`, which permanently
excludes that one app id from the current session (session-scoped only, not persisted, and it
does *not* touch the whitelist/blacklist) and removes it from `active`/`queue` immediately — no
"Completed" entry is added for this, since a manual per-game stop is a deliberate user action, not
something that needs an explanatory reason.

## Settings tab (in the app-wide Settings modal)

Opened via the gear icon in the Card Farming header, or `Settings → Card Farming` from anywhere —
`CardFarmingSettingsTab` backs the "cardFarming" tab of the shared `SettingsModal`. Every field
here auto-saves immediately on change (no separate "Save" button) via `set_card_farming_settings`,
optimistically updating and reverting with a toast on failure — mirrors Achievement Unlocker's
Settings tab pattern exactly.

- **Hours until farmable** (numeric input, 0-24) — how many hours of playtime a game needs before
  its card drops are considered reachable (the building-playtime → farming threshold described
  above). Set to `0` to skip the building-playtime phase entirely for every game. Has a "Learn
  more" link to the How It Works docs page. Default: `3`.
- **Farm multiple games at once** (toggle, carries a "Beta" badge) — farms up to 32 games
  concurrently instead of solo-targeting just the one with the fewest drops remaining. Off by
  default. The very first time you turn this on for an account, a confirmation modal ("Farming
  multiple games at once?") appears first: "Farming multiple games at the same time can slow down
  how quickly cards drop per game. If you don't see any cards drop for a while, try turning this
  back off." Only the explicit "Continue" button in that modal actually turns the setting on;
  dismissing it any other way (backdrop click, Escape, close button) marks the one-time notice as
  seen without enabling the toggle, so an accidental dismiss can't silently opt you into
  simultaneous multi-game farming.
- **Automatically farm cards** (toggle) — Gamer-tier gated. "Periodically check for owned games
  with card drops remaining and automatically start farming them." When ungated for a non-Gamer
  account, this stays a real, normal-looking Switch (never `isDisabled`) with a "Gamer" `TierBadge`
  next to its label; toggling it opens the upgrade modal (`openWithTier('gamer')`) instead of
  saving. The actual periodic check runs from `useAutoFarmCards` (mounted in `DashboardShell`,
  polling every 15 minutes) — see the dedicated section below for exactly how it behaves per
  sign-in mode.
- **Skip refundable games** (toggle, "Beta" badge) — **only shown at all for agent-mode (Steam
  Sign-in) accounts**; the whole settings row is conditionally rendered away for CLI-mode (Legacy
  Sign-in) accounts rather than shown disabled, because CLI mode has no purchase-date data to check
  against at all. "Don't farm a game while it's still inside Steam's refund window (bought within
  the last 14 days with under 2 hours of playtime)."
- **Skip unplayed games** (toggle) — "Don't farm games that have zero recorded playtime." Mutually
  exclusive with the next toggle: turning this on turns "Unplayed games only" off.
- **Unplayed games only** (toggle) — "Only farm games that have zero recorded playtime." Mutually
  exclusive with the previous toggle, same way.
- **Start another task when done** (toggle) — once nothing is left eligible to farm at all (a
  genuine "queue empty" finish, not a manual stop or an error), automatically starts either
  Achievement Unlocker or Auto-Idle next. Turning this on reveals two buttons ("Achievement
  Unlocker" / "Auto Idle," reusing the sidebar's own nav-label translations) to pick which one.
  This chain starts Achievement Unlocker with a concurrency of exactly 1 game regardless of the
  account's actual tier-based concurrency cap, since the automatic chain has no way to check the
  live tier at that point.

**There is no ordering/queue-mode setting anywhere in this tab.** Ordering is always fully
automatic (fewest drops remaining first while farming, closest to the playtime threshold first
while accumulating) and not user-configurable — a deliberate simplification from an earlier
version of this feature that did expose ordering controls.

## Automatic farming (Gamer-tier `autoFarmCards`)

`useAutoFarmCards` (mounted once in `DashboardShell`) checks immediately on load and then every 15
minutes whether farming should auto-start for whichever account is currently active — deliberately
coarse polling, since this is only scanning for whether to *start* a cycle, not tracking a running
one's progress. Every condition (signed-in account, subscription tier, whether a cycle is already
running, the `autoFarmCards` setting) is re-read fresh on every tick, so a tier lapse, sign-out, or
account switch is honored on the very next check — there's no stale cached decision.

**Which cookies this loop uses differs by sign-in mode — verified in the actual hook, not
assumed**: for a Steam Sign-in (agent-mode) account, cookies are always resolved silently from the
daemon's live SteamKit2 session; there's no UI path involved at all. For a Legacy Sign-in (CLI-mode)
account, this loop **only ever reuses cookies already saved** in `steamCookiesStore` — it never
falls back to the automatic-acquisition hidden webview the way a fresh manual connect might. A
CLI-mode account that has never connected once from the Card Farming page itself simply isn't
auto-farmed at all until you do that once. There's no cooldown after a manual "Stop" either — the
very next 15-minute tick just sees `isFarming: false` again and restarts if the setting is still
on.

If a CLI-mode account's saved cookies turn out to be dead (a confirmed session expiry, or an
inconclusive validation failure), this loop clears the cached cookie set the same way the page's
own connect flow does, so it stops silently retrying the same dead credentials every 15 minutes
until you reconnect manually.

## Cross-feature connections

**Idle claims (`OWNER_CARD_FARMING`)**: Card Farming never calls idling commands directly. Its
backend cycle claims idle slots as a side effect of running — every time its target set changes
(entering/leaving the building-playtime or farming phase, or the internal restart-cycle's own
stop/pause/restart choreography), it calls `idling::claims::IdleClaimsRegistry::replace_owner_claim`
under the owner constant `"card_farming"`. This is why the Idling page's per-owner "Stop" button
for the Card Farming group dispatches Card Farming's own `stop_farming` command specifically
(confirmed in `useIdling.ts`'s `stopOwnerCommand` switch) rather than the generic
`stop_owner_idling` — releasing just the claim without stopping the actual cycle loop would let it
simply re-claim the same games on its very next iteration. A game claimed by more than one
feature at once (e.g. also manually idled) is grouped under a fixed precedence — `manual >
card_farming > achievement_unlocker > auto_idle` — so it renders in exactly one section of the
Idling page, never duplicated across sections. The Idling page's global "Stop All" still clears
every owner's claim at once regardless of this precedence, and is the only action guaranteed to
stop everything.

**The Idling page's on-card timer doesn't visibly reset during a farming restart-cycle.** Card
Farming's restart-cycle deliberately stops and restarts idling every few minutes as part of normal
operation (see "How a farming cycle actually behaves" above). The generic idling state has no
backend timestamp of its own and would normally reset an app id's elapsed-time clock the instant
any single poll briefly shows it absent — so `useIdling.ts` (the hook backing the Idling page,
verified directly) merges `cardFarmingStore`'s own `FarmingProgress.activeSince` timestamp on top
of the generic value for any app id currently in Card Farming's `active` list. The practical effect
you'd observe: a card-farming game's "idling for Xh Ym" timer on the Idling page keeps counting up
smoothly through the feature's own internal stop/restart blips, instead of visibly jumping back to
zero every few minutes.

**`steamCookiesStore`**: holds the per-account resolved Steam Community cookies (keyed by account)
shared across Card Farming, Inventory Manager, and Settings' Steam Credentials tab — connecting or
clearing cookies on any one of these three surfaces is immediately reflected on the other two,
since they all read/write the same store via the same `SteamCookiesConnectPanel`/
`useSavedSteamCookies` plumbing.

**Gamer-tier automatic cookie acquisition vs. free/Casual manual paste**: gated by
`subscriptionAccess.ts`'s `canResolveCookiesAutomatically`, re-checked live in three places rather
than decided once: (1) `useAutoConnectSteamCookies`'s mount-time auto-connect decision, (2)
`SteamCookiesConnectPanel`'s own submit handler (which re-checks live, since a panel left open with
"Automatic" already selected across a downgrade could otherwise still submit that path once), and
(3) `useCardFarming`'s `enforceCookieGate` — every `connect`/`start`/`refreshBrowse` call re-checks
`canResolveCookiesAutomatically` before reusing a cached "no manual override" state, clearing it
and dropping back to the connect panel if the account no longer qualifies. Practically: a Gamer
Steam Sign-in account never sees a login prompt at all — its daemon mints cookies silently; a
Legacy Sign-in (CLI mode) account always needs the one-time hidden-webview acquisition regardless
of tier (see `ai-corpus/architecture-guides/card-farming-cookies.md` for why); any account on a
lower tier, or on CLI mode, can still use Card Farming fully via the manual cookie-paste tab, which
stays available regardless of tier.

**Settings modal re-read on close, not just on open.** The Settings modal is an overlay, not a
route change — `CardFarmingPage` never remounts while it's open. Because the page enforces the
"Hours until farmable" value client-side (to label the Progress view's queue rows), it explicitly
re-reads that setting on the modal's closing transition (`isSettingsModalOpen` flipping from true
to false), not just once at initial page load — so a threshold changed from the Settings modal is
reflected in the queue labels immediately after closing it, without needing a page refresh.

**Sign-in-mode branching**: `start_farming`/`get_games_with_drops`/`stop_farming`/
`get_farming_state` all take a single `GamesAccount` (the one-command-surface-per-feature
convention) and resolve a SteamID64 internally via `resolve_steam_id` — both Steam Sign-in (agent)
and Legacy Sign-in (CLI/local) accounts farm identically once that ID is resolved, since card
drops are detected via cookie-authenticated Steam Community scraping, entirely unrelated to either
sign-in backend's own session. The one CLI-mode-only check is `start_farming` calling
`require_steam_running()` before starting — a CLI-mode account needs a real local Steam client
actually running to start a cycle; Steam Sign-in accounts have no such requirement since they have
no local-client dependency at all.

**Not applicable to Card Farming (verified, not assumed)**: the Game Coordinator title restriction
that blocks TF2/Dota2/CS2/L4D2/Portal2 achievement data via the daemon path
(`unsupported_game_coordinator`) is specific to `achievements_get` — Card Farming never fetches
achievement data and has no equivalent restriction; every owned game with real card drops can be
farmed regardless of sign-in mode.

**A genuine, verified code/docs mismatch found this run**: root `CLAUDE.md` and
`ai-corpus/architecture-guides/max-playtime.md` both state that Card Farming enforces the
cross-cutting max-playtime cap "on its own schedule," mirroring Achievement Unlocker. A full read
of every file in `src-tauri/src/card_farming/` (including `manager.rs`'s complete cycle logic) and
a repo-wide grep for `max_playtime`/`MaxPlaytime` across all of `src-tauri/src` found **zero**
references inside `card_farming` at all. **A max-playtime cap set for a game currently does not
stop a Card Farming cycle from continuing to idle/farm it.** This guide's own reference file
(`backend-architecture.md`) has been corrected to reflect this; the root `CLAUDE.md` and the
`max-playtime.md` architecture guide still assert the stale claim and need a separate manual fix
outside this skill's scope.
