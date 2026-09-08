# Frontend cross-feature architecture

Every mechanism through which one feature's UI touches another feature, or shared app chrome.
`src/features/<feature>/` alone is never the whole picture — a feature's page usually reads or
writes at least one store from this list, opens an overlay owned by another feature, or is reused
by another page outright. Check every section below against the feature you're covering; most
features touch several of these, not just one or two.

If something here no longer matches the real code, fix this file as part of that run and say so in
your report — this is a snapshot, not a live source.

## Shared stores (`src/shared/stores/`)

**Cross-feature (3+ features touch these):**

| Store | Holds | Who touches it |
|---|---|---|
| `sessionStore` | Multi-account session state: `accounts: Record<AccountKey, SignedInAccount>`, `activeAccountKey`, denormalized `account`. `AccountKey = "agent:<username>" \| "local:<steamId>"`. | Nearly every feature — the single most cross-cutting store in the app. |
| `settingsModalStore` | `isOpen`, `activeTab` (one of 11 tabs incl. `cardFarming`/`achievementUnlocker`/`inventoryManager`/`freeGames`/`gameSettings`), `open(tab?)`. | Any feature whose header has a settings gear jumps straight to its own tab, e.g. `openSettings('cardFarming')`. |
| `searchStore` | `queries` (one per searchable page scope), `activeScope` (doubles as the global search modal's open flag), `isActiveTabSearchable`, persisted `recentSearches`. | Every page with a search-filterable grid (browse tabs across achievement-unlocker/auto-idle/card-farming/favorites/games-list) plus the global search bar/modal. |
| `sortPreferencesStore` | One `localStorage` blob covering 7 sort styles (`games`, `favorites`, `achievementUnlocker`, `autoIdle`, `cardFarming`, `achievements`, `inventory`) — a UI taste, not account-scoped. | Every feature with a sortable grid. |
| `proModalStore` | `isOpen`, `requiredTier` (which tier `GoProModal` auto-scrolls/highlights). `open()` / `openWithTier(tier)`. | Every tier-gated control in the app reroutes to this instead of disabling — see "Tier-gating" below. |
| `platformStore` | `currentOs: 'windows' \| 'linux' \| null`, set once via `usePlatform()` at the app root. | Anything with Windows/Linux-specific UI (CLI-mode gating, resize handles, download links). |
| `subscriptionStore` | `isSubscribed`, `subscriptionTier`. | The single most-imported tier-data store — every tier-gated feature reads this directly or via `hasCasualAccess`/`hasGamerAccess`. |
| `accountSummaryStore` | Per-account Steam profile summary (persona name, avatar), keyed by `AccountKey`. | account-switcher, settings, titlebar, sign-out flow. |
| `steamCookiesStore` | Per-account resolved Steam Community cookies, keyed by `AccountKey`. | card-farming, inventory-manager (via the shared connect panel), settings' Steam Credentials tab. |
| `sidebarStore` | `collapsed`/`hydrated` (persisted), drives width/margin animation. | Sidebar, titlebar (mirrors the same animation), the dashboard Ctrl+W shortcut. |

**Feature-scoped stores** (all follow the same `entries: Record<AccountKey, T>` + `activeAccountKey`
+ denormalized single-entry view shape):

| Store | Owned by | Also read by |
|---|---|---|
| `cardFarmingStore` | card-farming | idling (merges `activeSince` into its own elapsed-time timer so a card-farming game's timer doesn't visibly reset on the manager's internal restart cycle), account-switcher (automation-running dot), Sidebar (pulse), sign-out flow |
| `idlingStore` | idling | account-switcher, auto-idle (writes directly on startup), Sidebar (pulse), games-list (context-menu "start/stop idling" label), sign-out flow |
| `achievementUnlockerStore` | achievement-unlocker | account-switcher, Sidebar (pulse), a global concurrency-guard hook, sign-out flow |
| `gamesListStore` | games-list | idling (shares the owned-games cache via the same `useGamesList()` hook — explicitly documented as shared), free-games, sign-out flow |
| `achievementManagerStore` | achievement-manager (overlay gate: `openGame: {appId,name} \| null`) | **Any page rendering a `GameCard`** can open it — games-list, idling, favorites, auto-idle, card-farming, achievement-unlocker all trigger it via the shared context-menu builder |
| `achievementOrderStore` | achievement-unlocker only (its order-editor overlay gate) | nothing outside achievement-unlocker |

Other single/dual-feature stores worth knowing exist (don't need deep coverage unless directly
relevant): `freeGamesStore`/`freeGameNotificationsStore`, `antiAwayStore`, `customBackgroundStore`,
`carouselSettingsStore`, `disableTooltipsStore`, `autoUpdateGamesListStore`, `agentReauthStore`,
`addAccountModalStore`, `reauthModalStore`, `steamWarningStore`, `aiChatStore`, `updateStore`.

## DashboardShell (`src/shared/components/dashboard/DashboardShell.tsx`)

Mounted once in `_app.tsx`, never unmounted by `/dashboard/*` route changes — this is why
long-running automation (card-farming, achievement-unlocker) survives navigating away and back.

**Overlays it renders**, and what gates each open:

| Overlay | Feature | Gate |
|---|---|---|
| `SettingsModal` | settings | `settingsModalStore.isOpen` |
| `AddAccountModal` | account-switcher | `addAccountModalStore` |
| `ReauthModal` | account-switcher | `reauthModalStore` |
| `AchievementManagerOverlay` | achievement-manager | `achievementManagerStore.openGame` — **openable from any feature's `GameCard`** |
| `AchievementOrderOverlay` | achievement-unlocker | `achievementOrderStore.openGame` — opened only from `AchievementUnlockerPage` |
| `GlobalSearchModal` | shared/search | `searchStore.activeScope` — triggerable from any page |
| `SteamWarning` | shared | `steamWarningStore` |
| `Banner` | shared | subscription-driven |

It also renders `Sidebar` and `CustomBackground` as permanent chrome.

**Root-mounted in `_app.tsx` instead** (still app-wide, still worth mentioning if a feature guide
touches them): `GoProModal`, `AiChatOverlay` (deliberately root-mounted so it's reachable
pre-sign-in), `ChangelogModal`, `Toast.Provider`, `FullscreenLoader`, `Titlebar`.

## Routes (`src/pages/dashboard/*.tsx`)

Every route file is a one-line wrapper with zero logic:

| Route | Feature |
|---|---|
| `index.tsx` | games-list (default landing page after sign-in) |
| `idling.tsx` | idling (manual idling / "Playtime Booster" in docs) |
| `favorites.tsx` | favorites |
| `free-games.tsx` | free-games |
| `card-farming.tsx` | card-farming |
| `achievement-unlocker.tsx` | achievement-unlocker (one route renders both the browse/queue config UI and the running-automation live view, switched internally) |
| `auto-idle.tsx` | auto-idle |
| `inventory-manager.tsx` | inventory-manager |

`achievement-manager`, `account-switcher`, and `settings` have **no route of their own** — all
three are pure overlay/chrome features.

## Shared UI components reused across 3+ features

`GameSortSelect`, `TierBadge`, `GameGridSkeleton`, `GameListTabPanel` (tabbed pages with a plain
CSS grid, not virtualized), `VirtualizedGameGrid` (large "browse all owned games" tabs), `GameThumbnail`,
`SteamCookiesConnectPanel` (card-farming/inventory-manager/settings), `ManualAddGameModal`,
`BackToTopButton`, `AppTooltip`. Also: idling's page reuses games-list's own `GameCard` component
directly rather than building its own — a concrete example of one feature folder importing another
feature folder's component, not just a shared one.

## Idle claims (frontend side)

`idlingStore` holds, per account, `appIds` (currently idling) and `claimsByOwner: Record<owner,
number[]>`. `IdleOwner = 'manual' | 'auto_idle' | 'achievement_unlocker' | 'card_farming'`, mirroring
the backend's `idling::claims` owner constants (see `backend-architecture.md`). `syncClaims()`
re-fetches `get_idle_claims` after every `appIds` change from three independent call sites (manual
idling, auto-idle startup, the idling sync listener) — keeping the per-owner breakdown consistent
without the raw idle-state event needing to carry owner info itself.

Card-farming and achievement-unlocker **never call idling commands directly from the frontend** —
their backend loops claim/release idle slots as a side effect of start/stop. Their "Stop" button on
the Idling page's per-owner group dispatches their *own* stop command (`stop_farming`,
`stop_achievement_unlocker`), not the generic `stop_owner_idling` — because either loop would just
re-claim the game on its next tick if only the claim were released. Manual idling and auto-idle,
which have no such loop, use the generic `stop_owner_idling` for their groups. A game claimed by
more than one owner is grouped under a fixed precedence (`manual > card_farming >
achievement_unlocker > auto_idle`) so it renders in exactly one section.

## Multi-account pattern (`src/features/account-switcher/`)

Every per-session store follows `entries: Record<AccountKey, T>` + `activeAccountKey` + a
denormalized single-entry view for read-only consumers. Concrete mechanics:

- The account-switcher's per-row automation dot reads other features' *entries* map directly (not
  the denormalized view), since a backgrounded account's automation state must stay observable
  without that account being active — e.g. `idlingStore.entries[accountKey]?.appIds.length`.
- Sign-out calls each per-session store's `clearEntry(key)` for exactly the signed-out account,
  leaving every other signed-in account's cached state untouched.
- A subscription downgrade below the agent-mode account cap falls back to switching the active
  account to whatever remains allowed — **never** a forced sign-out (the app never silently signs
  a user out over a cap; only an explicit sign-out action stops an account's automation).
- CLI mode's idle-state event carries no `account` field (only one CLI account can ever exist) — a
  listener resolves it by finding the sole `mode: 'local'` entry in `sessionStore.accounts`.

## Tier-gating pattern

`hasCasualAccess(tier)` / `hasGamerAccess(tier)` (gamer implies casual) gate features/settings
throughout the app. The gated-control pattern is always the same and is load-bearing for UI guides:
**never a native `isDisabled` control.** A gated toggle/button stays a real, normal-looking,
clickable element with a `TierBadge` next to its label; its `onChange`/`onPress` is rerouted to
`proModalStore`'s `openWithTier('casual' | 'gamer')` instead of performing the real action. This
exact pattern repeats verbatim across card-farming's settings tab, achievement-unlocker's settings
tab, the sidebar's upgrade CTA, and account-switcher's over-cap account row. When describing any
gated control in a UI guide, describe it this way — not as disabled/greyed-out.

## Sidebar registration

`Sidebar.tsx` has one data-driven `sections: SidebarSectionConfig[]` array — a feature "registers"
by having a literal object in this array (no dynamic/plugin mechanism). Three sections: Games
(Games/Idling/Favorites/Free Games), Automation (Card Farming/Achievement Unlocker/Auto Idle), Misc
(Inventory Manager). Each item can carry `pulseWhenIdling`/`pulseWhenFarming`/`pulseWhenUnlocking`
(read from the relevant feature-scoped store's denormalized/active-account view) and
`goldWhenClaimable` (free games). The Sidebar also embeds the account-switcher and a Settings gear
button as permanent chrome, not per-feature entries.

**Correction (2026-09-08 check)**: this file previously described that gear button as opening
"whatever tab was last active." A direct read of `settingsModalStore.ts` shows `close()`
unconditionally resets `activeTab` back to `'general'` (`close: () => set({ isOpen: false,
activeTab: 'general' })`), and the Sidebar's gear button calls `openSettings()` with no tab argument
(so `open`'s `tab ?? get().activeTab` falls through to whatever `activeTab` currently is). Net
effect: after any previous close, `activeTab` is already back to `'general'`, so this button opens
on **General** every time in practice — not literally "whichever tab you last had open." The tab
only stays wherever you left it if you navigate between tabs *without* closing the modal in
between (e.g. the modal is still open and you just click a different feature's own settings-gear
button, or `Ctrl`+`,` toggles it closed-then-reopened, which does go through `close()` and resets
it). See `ai-corpus/ui-guides/settings-general.md`'s "Opening the Settings modal" section for the
full write-up.
