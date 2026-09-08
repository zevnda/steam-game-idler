# Sidebar

This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/shared/components/dashboard/Sidebar.tsx`, `SidebarItem.tsx`, and `Logo.tsx` source, the
`sidebarStore`/`idlingStore`/`cardFarmingStore`/`achievementUnlockerStore`/`freeGamesStore`-backed
hooks it reads, and its cross-feature entry points (`settingsModalStore`, `proModalStore`,
`useDashboardShortcuts`, the embedded `AccountSwitcher`). It is the single merged source for the
sidebar's own UI and its cross-feature connections, and should be regenerated via that skill
whenever the sidebar's section layout, item order, icons, pulse/gold conditions, or embedded chrome
change — not hand-patched for small drift. There is no dedicated docs page for the sidebar itself
(it's app chrome, not a feature with its own docs subtree), so this file has no docs source to
merge in and no `supersedes` list.

**Scope note**: the sidebar embeds two other features as permanent chrome — the account switcher
and the Settings gear button. The account switcher's own popover, account rows, sign-in-mode
labels, add-account flow, and sign-out confirmation are covered in full in `account-switcher.md`;
this file only describes where it sits and that it never goes away. The Settings modal's own tabs
are covered in the `settings-*.md` guides; this file only describes the gear button that opens it.
The upgrade/tier-comparison modal itself is covered in `go-pro-modal.md`; this file only describes
the sidebar's "Plan" row that triggers it.

## Where the sidebar is and what it looks like at a glance

The sidebar is permanent app chrome rendered once by `DashboardShell` (mounted in `_app.tsx`) — it
never unmounts when you navigate between dashboard pages, so its state (collapsed/expanded, which
item is highlighted, pulse indicators) never resets on navigation. It's a vertical `<nav>` panel on
the left edge of the window, full window height, with a right-hand border separating it from the
page content, and the app's plain background color (no distinct panel color from the rest of the
window). It has three fixed vertical zones, top to bottom:

1. A top spacer (matching the global titlebar's drag-region height) so the nav list starts clear of
   the window's draggable title bar.
2. The scrollable nav list — three labeled sections of clickable page links.
3. A fixed footer — an ad slot (production builds, free tier only — see below), a "Plan" row
   (subscription tier indicator / upgrade trigger), and a bottom bar holding the account switcher
   and the Settings gear button.

The sidebar is **256px wide** when expanded and **64px wide** (an icon-only rail) when collapsed —
see "Collapsing the sidebar" below. Note: the app's logo/brand mark (`Logo.tsx`, a plain inline
SVG) is **not** rendered inside the sidebar at all — it's rendered by the global `Titlebar`
component instead, sitting in the titlebar's drag region directly above the sidebar. Don't expect
to find a logo by looking at the sidebar itself.

## The three sections and their items, in exact order

The sidebar renders three sections top to bottom, each with an uppercase section header (hidden
entirely while collapsed) and its items in this fixed order — this list is a literal array in
`Sidebar.tsx`, not dynamically ordered by anything:

**"Games"** (section header text is literally "Games" — it reuses the same translation key as the
first item inside it, so the section header and the first nav item's label read identically):
1. **Games** — `TbDeviceGamepad2` (a game-controller icon), links to `/dashboard` (the games-list
   page, the default landing page after sign-in).
2. **Idling** — `TbPlayerPlay` (a play/triangle icon), links to `/dashboard/idling`. Pulses
   whenever the active account has any games currently idling — see "Pulse indicators" below.
3. **Favorites** — `TbHeart` (a heart icon), links to `/dashboard/favorites`.
4. **Free Games** — `TbGift` (a gift-box icon), links to `/dashboard/free-games`. Its icon turns
   gold whenever there's a claimable free game — see "Free Games gold icon" below.

**"Automation"**:
5. **Card Farming** — `TbCards` (a playing-cards icon), links to `/dashboard/card-farming`. Pulses
   while a farming cycle is running for the active account.
6. **Achievement Unlocker** — `TbAward` (an award/medal-ribbon icon), links to
   `/dashboard/achievement-unlocker`. Pulses while the unlocker automation is running for the
   active account.
7. **Auto Idle** — `TbHourglassLow` (an hourglass icon), links to `/dashboard/auto-idle`. Note the
   on-screen label is **"Automatic Idler"**, not "Auto Idle" — "Auto Idle" is only the route-name/
   internal-feature name; the literal `dashboard.sidebar.nav.autoIdle` string users see is
   "Automatic Idler". This item has no pulse indicator of its own.

**"Misc"**:
8. **Inventory Manager** — `TbBuildingStore` (a storefront/building icon), links to
   `/dashboard/inventory-manager`. No pulse indicator.

All icons come from `react-icons/tb` (Tabler Icons), rendered at 18px. Every item's on-screen label
and every section header text above is pulled verbatim from `src/i18n/locales/en-US.json`'s
`dashboard.sidebar.nav`/`dashboard.sidebar.section` keys — don't paraphrase these labels when
answering a "what's that icon in the sidebar" question.

Which page is "active" (highlighted) is computed purely from the current route
(`useIsActiveRoute`: `router.pathname === href`) — there's no separate navigation store tracking
this. An active item's row gets a slightly raised background (`bg-surface`, with a lighter hover
shade); an inactive item is plain text that also lightens on hover. Achievement Unlocker's single
route serves both its browse/queue-setup view and its running-automation live view internally, so
the sidebar highlights it as active either way — the highlight only cares about the URL, not which
internal view is showing.

## Collapsing and expanding the sidebar

The sidebar's collapsed/expanded state lives in `sidebarStore`, persisted to `localStorage` under
the key `sidebarCollapsed` (a pure per-window UI preference, not tied to any Steam account or
synced anywhere). Toggling it:

- **Keyboard shortcut**: **Ctrl+W** (checked as `e.ctrlKey || e.metaKey` plus `key === 'w'`/`'W'`
  with no Shift held) toggles the sidebar, wired up in `useDashboardShortcuts` (mounted once in
  `DashboardShell`). This shortcut is suppressed while focus is inside an `<input>`, `<textarea>`,
  or any content-editable element, so typing a literal "w" while Ctrl is held in a text field never
  accidentally collapses the sidebar.
- There is no on-screen collapse/expand button in the sidebar itself — Ctrl+W is the only trigger.

**Collapsed** (64px / icon rail): every nav item shows only its icon, centered, with no visible
label text — hovering (or focusing) an item shows its label in a tooltip that appears to the right
of the icon after a 300ms delay. The section header text ("Games"/"Automation"/"Misc") is hidden
entirely while collapsed. The account switcher shrinks to just an avatar (with its name moved into
the same kind of hover tooltip), and the Settings gear button also gets a tooltip instead of an
inline label. The "Plan" row is dropped entirely while collapsed (see below) since there's no room
for a label+badge row at icon-rail width.

**Expanded** (256px): full labels, section headers, and the "Plan" row all show.

The very first paint after the app opens never animates this transition, even for a user who had
previously collapsed the sidebar — `sidebarStore`'s `hydrated` flag stays `false` until the
persisted preference is read from `localStorage` (which can't happen during Next.js's
server-rendered first pass), and the width-transition CSS class is only applied once `hydrated` is
true. So a returning user who last had the sidebar collapsed sees it collapsed immediately on
launch with no visible animation; only a Ctrl+W toggle pressed after that point actually animates.
The titlebar mirrors this same `collapsed` value with its own margin animation, so the sidebar and
titlebar always resize in sync.

## Pulse indicators — Idling, Card Farming, Achievement Unlocker

Three of the eight nav items can "pulse" — visually, a pulsing item's entire row (icon and label
together) fades in and out on a repeating ~2-second cycle (the standard CSS `animate-pulse` fade
between full and roughly half opacity) while also being recolored to the app's accent color, for as
long as the underlying condition holds. This is a different visual effect from the Free Games gold
icon (below), which recolors only the icon and never fades/pulses.

Each pulse condition reads a feature-scoped store's **active-account, denormalized view** — not
that store's full per-account `entries` map:

- **Idling** pulses when `idlingStore`'s `appIds` (the active account's currently-idling app id
  list) is non-empty. Critically, `appIds` reflects **every** game currently idling for that
  account regardless of which feature claimed it — manual idling, auto-idle, card farming, and the
  achievement unlocker all funnel through the same idle-claims mechanism and land in this same
  list. So the Idling nav item can pulse even if you never opened the Idling page yourself — e.g.
  starting Card Farming or Auto Idle also makes the Idling item pulse, because those games are now
  part of the active account's idling set.
- **Card Farming** pulses when `cardFarmingStore`'s active-account view reports `isFarming: true` —
  specifically whether a farming cycle is running, distinct from the general idling pulse above.
- **Achievement Unlocker** pulses when `achievementUnlockerStore`'s active-account view reports
  `isRunning: true` — whether the unlocker automation loop is currently running.

**Because all three read the active-account view, not the `entries` map, none of these three pulse
indicators reflect a *backgrounded* (signed-in-but-not-currently-active) account's automation.** If
account B is farming cards in the background while account A is the active account shown in the
switcher, the sidebar's Card Farming pulse stays off — switch to account B (via the account
switcher) to see it pulse. This is a deliberate, confirmed difference from the account switcher's
own per-row automation dot, which does read each store's `entries` map directly so a backgrounded
account's automation stays visible there even while it isn't active (see `account-switcher.md`).

Auto Idle and Inventory Manager have no pulse indicator at all — there is no `pulseWhen...` flag
wired up for either in `Sidebar.tsx`'s section data.

## Free Games gold icon

The Free Games nav item's icon (only the icon — not its label text, and not its active/selected
row styling) turns gold (`text-[#ffc700]`) whenever the currently active Steam account has at least
one claimable free game — i.e. whenever the Free Games page's own grid would show at least one
card. This is computed from the same `useFreeGames()` hook the Free Games page itself uses: the
raw discovery list (`freeGamesStore`, a single account-agnostic list shared app-wide) filtered
against the **active account's** owned-games cache (`gamesListStore`). So, like the pulse
indicators above, this gold highlight is scoped to whichever account is currently active in the
switcher — a claimable free game sitting unclaimed for a backgrounded account does not gold the
icon until you switch to that account.

This gold recolor doesn't compete with the pulse animation mechanism (Free Games has no pulse
condition of its own) and is the app's equivalent of a sidebar notification highlight, rather than
a separate badge/counter. Full detail on what counts as a claimable free game, and how claiming
itself works, lives in `free-games.md`.

## The ad slot in the sidebar footer

Just above the "Plan" row, the sidebar footer optionally shows a small house/Google ad slot
(`AdSlot`, `src/shared/components/pro/AdSlot.tsx`). Two independent gates control whether it
renders at all:

- It's only mounted in a **production build** at all (`process.env.NODE_ENV === 'production'` is
  checked in `Sidebar.tsx` itself) — it never appears in a local dev build regardless of tier.
- Even in production, `AdSlot` itself renders nothing (`return null`) once the subscription check
  has resolved and the active tier has Casual access or higher — ads are a **Casual-tier-and-up
  removed** perk, matching the "ad-free" line item in the Casual tier's feature list. It also
  renders nothing while the subscription check hasn't resolved yet (`isSubscribed === null`), so it
  never briefly flashes an ad for a paying account before the check completes.

The ad slot shrinks (rather than disappearing) when the sidebar is collapsed — it stays mounted at
a much smaller scale in icon-rail mode rather than being hidden outright.

## The "Plan" row — the sidebar's own upgrade path

Directly above the account switcher/Settings bar, a row labeled **"Plan"** (the literal
`dashboard.sidebar.tier.label` string) shows the active subscription tier as a small colored pill
via the shared `TierBadge` component — "Free" (neutral gray) for the free tier, "Casual" (blue
gradient) for Casual, "Gamer" (purple gradient) for Gamer. This row is hidden entirely until the
subscription check has actually resolved (`isSubscribed !== null`) so it never flashes an incorrect
tier on load, and it's dropped entirely while the sidebar is collapsed (no room for a label+badge
row at icon-rail width).

**Only a Casual-tier row is actually clickable.** Clicking it calls `openWithTier('gamer')`,
opening the upgrade modal (`GoProModal`, covered in full in `go-pro-modal.md`) pre-scrolled to the
Gamer tier card — Casual is the one tier with somewhere left to upgrade to. At **Gamer** (already
the highest tier) and at **Free** (`null`), the exact same row still renders — badge and all — but
as a static, non-interactive label with no click handler; it's not hidden, just inert. This matches
root `CLAUDE.md`'s framing: **the titlebar's white "Go Pro" pill is the free tier's upgrade CTA**
(and disappears entirely once you're Casual or Gamer, per `GoPro.tsx`), while **this sidebar "Plan"
row is Casual's upgrade path to Gamer** — a free-tier user actually sees both: the titlebar pill as
the real clickable CTA, and this same static "Plan: Free" row in the sidebar doing nothing when
clicked.

## The embedded account switcher

The account switcher (`AccountSwitcher`, `src/features/account-switcher/components/
AccountSwitcher.tsx`) is rendered directly inside the sidebar's footer bar, immediately to the left
of the Settings gear button — permanent chrome, not a per-feature nav entry, and it never goes
away regardless of which dashboard page is open. `Sidebar.tsx` passes it a `compact` prop tied
directly to the sidebar's own collapsed state, which is what shrinks its trigger down to just an
avatar (with the account name moved into a hover tooltip) while the sidebar is collapsed. This
sidebar footer bar is the app's one sign-out entry point — there is no separate standalone
"sign out" button anywhere else. The switcher's own popover contents, per-account rows, sign-in-
mode labels, add-account flow, and sign-out confirmation are all covered in depth in
`account-switcher.md`; this file only documents where it physically sits.

## The embedded Settings gear button

Directly to the right of the account switcher in the sidebar's footer bar sits a plain icon button
— a gear icon (`TbSettings`, 18px), `aria-label`/tooltip text "Settings" (the literal
`common.actions.settings` string). While the sidebar is collapsed this button shows its label as a
300ms-delay hover tooltip to the right of the icon (matching every other collapsed nav item's
tooltip behavior); while expanded, it's just a bare icon button with no visible text label at all
(unlike the nav items, which show their label text when expanded).

Clicking it calls `settingsModalStore`'s `open()` with **no tab argument**, which per that store's
own logic keeps whatever `activeTab` the store currently holds rather than forcing a specific one.
In practice, this means the sidebar's Settings button opens on the **General** tab almost every
time: the Settings modal's `close()` action (triggered by its own X button, pressing Escape, or
clicking its backdrop — anything that dismisses the modal) unconditionally resets `activeTab` back
to `'general'` the moment it closes. So unless the modal is somehow still open from a moment ago
(e.g. it was opened via a different feature's own settings-gear shortcut and never actually closed
since), the sidebar's gear button will show General, not "whatever tab you had open last time you
used Settings." A feature page's own settings-gear button (e.g. Card Farming's or Achievement
Unlocker's header gear icon) behaves differently — those call `open('cardFarming')` etc. with an
explicit tab argument, jumping straight to that feature's own tab regardless of this reset
behavior.

## Cross-feature connections summary

- **`sidebarStore`** — collapsed/expanded + hydration state, read by both `Sidebar.tsx` (width,
  content density) and the global `Titlebar` (mirrors the same collapsed value for its own margin
  animation). Toggled only via Ctrl+W (`useDashboardShortcuts`).
- **`idlingStore` / `cardFarmingStore` / `achievementUnlockerStore`** — each feature-scoped store's
  active-account denormalized view drives one pulse condition; see "Pulse indicators" above for the
  exact fields read and the active-account-only scoping caveat.
- **`freeGamesStore` (via `useFreeGames()`) / `gamesListStore`** — drives the Free Games gold icon,
  scoped to the active account's ownership filter; see "Free Games gold icon" above.
- **`subscriptionStore` / `proModalStore`** — the "Plan" row reads the live subscription tier and,
  only when Casual, reroutes its click to `proModalStore.openWithTier('gamer')`; see "The 'Plan'
  row" above and `go-pro-modal.md` for the modal itself.
- **`settingsModalStore`** — the Settings gear button opens the modal via a bare `open()` call (no
  tab argument), sharing the same store every feature's own settings-gear shortcut uses to jump to
  a specific tab instead.
- **Account switcher (`sessionStore` and friends)** — embedded as permanent chrome next to the
  Settings gear button; fully covered in `account-switcher.md`.
- **`DashboardShell`** — mounts the sidebar once, app-wide; it never unmounts on route changes
  within `/dashboard/*`, which is why pulse state and collapsed state both persist seamlessly
  across navigation.
