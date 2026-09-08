This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/shared/components/titlebar/Titlebar.tsx`, `Menu.tsx`, `Notifications.tsx`, `HelpDesk.tsx`,
`AiChatButton.tsx`, `src/shared/components/UpdateButton.tsx`, `src/shared/components/pro/GoPro.tsx`,
`src/shared/components/dashboard/Logo.tsx`, `src/shared/hooks/useTitlebar.ts`,
`src/shared/hooks/useNotifications.ts`, `src/shared/hooks/useDashboardShortcuts.ts`,
`src/shared/hooks/useCheckForUpdates.ts`, `src/shared/utils/update.ts`,
`src/shared/stores/updateStore.ts`/`sidebarStore.ts`/`subscriptionStore.ts`, and `src/i18n/locales/en-US.json`'s
`titlebar`/`menu`/`notifications`/`common` keys. No dedicated docs page covers the titlebar itself
(confirmed against the full docs page tree) — the closest related docs content is
`settings/keybinds.mdx` (documents the `Ctrl+W` sidebar-toggle shortcut this titlebar's button also
triggers) and `pro.mdx`'s tier-comparison row for "Real-time live support" (confirms Help Desk's
Casual-tier gate) — neither is folded in as a supersede, both are only cross-referenced, since
neither page is actually about the titlebar. It is the single merged source for this chrome and
should be regenerated via that skill whenever the titlebar's buttons, layout, or gating change — not
hand-patched for small drift.

# Titlebar

## What the titlebar is, and why it's the only way to move/resize/close the window

Steam Game Idler runs as a frameless window — `tauri.conf.json`'s window config sets
`"decorations": false`, so there is no OS-drawn title bar anywhere. `Titlebar` (`src/shared/
components/titlebar/Titlebar.tsx`) is a custom-built replacement for that OS chrome, mounted once at
the app root in `src/pages/_app.tsx` (not inside `DashboardShell`), so it's present on every screen
the app can show, including the pre-sign-in landing page — there is no screen without it. Confirmed
directly in the component's own comment: this is "the only way the window can be moved, minimized,
maximized, or closed at all."

It's a fixed `h-14` (56px-tall) strip pinned to the top-left of the viewport (`fixed left-0 top-0
w-screen`), opaque (`bg-background` with a bottom border) in its normal state. Most of the strip —
the outer wrapper, the main flex row, the logo's own wrapper `div`, the flex-1 spacer between the
left and right button groups, and the logo SVG itself — carries Tauri's `data-tauri-drag-region`
attribute, meaning clicking and dragging on any of that empty space moves the whole window. The
buttons themselves (sidebar toggle, Go Pro pill, every right-side icon button, the window controls)
are NOT drag regions, so clicking them acts as a normal click rather than starting a window drag.

The titlebar has a second, stripped-down `minimal` rendering mode used only while a full-viewport
splash screen (`FullscreenLoader` at boot, or `UpdateLoader` during a silent self-update) is on
screen — see "Minimal mode during splash screens" below for what that hides and why.

## Window controls: minimize, maximize/restore, close

Three icon-only buttons sit at the far right of the titlebar, after a vertical `Separator` — these
three are the ONLY window controls in the entire app, since the window has no OS-drawn title bar to
provide its own (see the section above). Left to right:

- **Minimize** — a `VscChromeMinimize` icon (a plain horizontal underscore-style line, matching
  Windows' own minimize glyph). Clicking it calls `getCurrentWindow().minimize()` directly. This
  button carries no `aria-label` and no hover tooltip in the current code.
- **Maximize/Restore** — toggles between `VscChromeMaximize` (an empty square outline, shown when
  the window is not maximized) and `VscChromeRestore` (two overlapping squares, shown when it is)
  depending on live state tracked by `useTitlebar`'s `isMaximized` (refreshed on every window resize
  via `appWindow.onResized`). Its `aria-label` is a hardcoded, non-translated string — literally
  `"Maximize"` or `"Restore"` depending on state — clicking it calls
  `getCurrentWindow().toggleMaximize()`.
- **Close** — a `VscChromeClose` icon (an X), the only one of the three with a distinct hover color
  (`hover:bg-danger`, i.e. it turns red on hover, matching the universal OS convention for a close
  button). Clicking it runs `useTitlebar`'s `close()`: it re-reads `Settings.closeToTray` fresh via
  `get_settings` (not from a store — there's no ongoing state to keep in sync, only a one-shot
  decision at click time). If `closeToTray` is `false`, it calls the `quit_app` command and the app
  exits. If `true` (the default), it instead hides the window (`getCurrentWindow().hide()`) rather
  than quitting — the app keeps running in the system tray. The very first time this happens on a
  given install, it also fires a native OS notification reading "Steam Game Idler will continue to
  run in the background" (only a real OS notification can reach the user here, since the window —
  and every in-app toast with it — is already hidden by the time it fires); this is tracked via a
  `closeToTrayNotified` `localStorage` flag so it only ever shows once per install, not every time
  the window is closed to tray.

All three window-control buttons are always shown — they're outside the `!minimal` conditional that
hides the rest of the titlebar's content, so they remain clickable even while a splash screen is on
screen (see "Minimal mode" below).

## Left side: logo/wordmark, sidebar toggle, and the Go Pro pill

Reading left to right, the titlebar's left side (hidden entirely in `minimal` mode) is:

**Logo + wordmark.** A plain inline SVG logo (`Logo.tsx`, no image asset, colored via `fill-current`
so it follows the current theme) followed by the text "Steam Game Idler" (set in the Unbounded font,
via `next/font/google`) — this text is a literal, non-translated string in the component (brand
name, not user-facing copy that needs localizing). This block is sized to track the sidebar's own
width: on any `/dashboard/*` route it's `w-16` (matching the sidebar's collapsed width) when the
sidebar is collapsed, or `w-64` (matching the sidebar's expanded width) otherwise, animating between
the two over 200ms in step with the sidebar's own collapse/expand transition (both read the same
`sidebarStore.collapsed` boolean). The "Steam Game Idler" text itself is hidden while collapsed
(there's no room for it next to just the logo mark). On any non-dashboard route (e.g. the sign-in
landing page), the block just left-aligns with a fixed left padding instead of tracking sidebar
width, since there's no sidebar to match there.

**Sidebar-toggle button.** Only rendered on `/dashboard/*` routes (`isDashboard`). A `h-14 w-12`
(56px × 48px) icon button showing `TbLayoutSidebarFilled` (a filled/solid sidebar glyph) when the
sidebar is currently collapsed, or `TbLayoutSidebar` (an outline sidebar glyph) when it's expanded —
clicking it calls `sidebarStore`'s `toggle()`. Its `aria-label` is the translated string "Toggle
sidebar" (`dashboard.settings.keybinds.toggleSidebar`). Unlike every other titlebar icon button, this
one has no hover tooltip (`AppTooltip`) wrapped around it. **The same action is also bound to the
`Ctrl+W` keyboard shortcut** (`useDashboardShortcuts.ts`, mounted only inside `DashboardShell`, so
only active on dashboard routes) — pressing `Ctrl+W` anywhere outside a text input/textarea calls the
exact same `useSidebarStore.getState().toggle()` action this button does. This shortcut is also
listed in the docs' `Settings → Keybinds` reference page (`settings/keybinds.mdx`) under
"Navigation."

**Go Pro pill.** Rendered only when `isDashboard` is true AND `subscriptionTier === null` (i.e. only
for a free-tier user, and only once `useCheckSubscription` has actually resolved a tier — it's
deliberately gated on `isSubscribed !== null` too, so it never flashes on screen for a split second
before a Casual/Gamer subscriber's real tier is known). A Casual or Gamer subscriber never sees this
button at all — for them, the sidebar's own "Plan" row (a clickable "Casual" badge that opens
`GoProModal` pre-scrolled to the Gamer tier, or a static "Gamer" badge since Gamer is already the top
tier — see the sidebar's own UI guide for that row's full behavior) is the upgrade/plan-status
surface instead. Visually it's a pill with an animated shiny border (the `.shiny-cta` CSS class) with
a white rounded-pill "GO PRO" badge on its right side (this badge itself has no width-based hiding —
it's always visible) and, on wide windows only (`xl` breakpoint, 1280px+, hidden below that —
matching the same narrow-window collision `GlobalSearchBar` avoids), a small "Support / Steam Game
Idler" two-line label to its left. Both text strings are literal,
non-translated English (an explicit `eslint-disable-next-line i18next/no-literal-string` marks this
as deliberate, matching the pre-rewrite app's same free-tier-only branch never being run through
i18n). Clicking it calls `proModalStore`'s `open()`, opening `GoProModal` with no specific tier
pre-selected (see the Go Pro Modal guide for what that modal shows).

## Right side layout and button order

The right-side button group (also hidden entirely in `minimal` mode) renders in this exact left-to-
right order, each button a `h-14 w-12` (56px × 48px) icon-only hit target:

1. **Update button** — only rendered at all if `updateStore.updateAvailable` is true (see "Update
   button" below); otherwise this slot is simply absent, not a disabled placeholder.
2. **AI Assistant button** (`AiChatButton`) — see its own section below.
3. **Help Desk button** — only rendered for Casual-tier-or-above accounts; renders nothing (not a
   locked/disabled icon) below that tier. See its own section below.
4. **Notifications bell** (`Notifications`) — always rendered, no tier gating. See its own section
   below.
5. **Overflow menu** (`Menu`, the chevron-down icon) — always rendered. See its own section below.

A vertical `Separator` follows the menu button, then the three window controls (minimize, maximize/
restore, close) described above. Every button in this group except the sidebar-toggle button and the
Go Pro pill is wrapped in an `AppTooltip` with a 300ms open delay, showing its translated label
below the icon on hover.

## Update button (opt-in update)

`UpdateButton` (`src/shared/components/UpdateButton.tsx`) only ever renders when `updateStore.
updateAvailable` is `true`, and that flag is only ever set for the "regular" update case: a
non-major update, checked on any poll after the very first check since the app started. Two other
cases never show this button at all, because they install silently on their own before this flag
would ever get set: a release the developer flags as `major` in `latest.json` (installs immediately,
no button, no user click, on whichever periodic check first sees it), and the very first update
check after the app launches (also installs silently, regardless of whether that release is major or
not — existing users shouldn't linger on a stale version just because the pending update happened to
be a minor/patch release). See `ai-corpus/architecture-guides/updates.md` for the full mechanics of
that silent path, signature verification, and the portable-build/Linux-can't-auto-update skip — this
section only covers the button itself.

When it is shown, it renders a `TbCircleArrowDown` icon (a downward arrow inside a circle) in the
accent color (not the plain foreground color every other titlebar icon uses — this is the one
titlebar button that's colored to stand out). Its `aria-label`/tooltip text is the translated string
"Update ready" (`titlebar.updateReady`). Clicking it re-checks for the update, then calls the same
`performUpdate` sequence the silent path uses: kill any running `SteamUtility.exe` processes, run
`update.downloadAndInstall()`, wait at least 2.5 seconds, and relaunch — `updateStore.isUpdating` is
flipped to `true` partway through this, which mounts `UpdateLoader` (a full-viewport splash) and
switches `Titlebar` itself into `minimal` mode, so this button disappears the moment the update
actually starts installing rather than staying clickable mid-install. The button disables itself
(`disabled={isChecking}`, dimmed via `disabled:opacity-50`) for the brief moment between the click
and `UpdateLoader` taking over, so a second click can't double-fire the check.

## AI Assistant button

`AiChatButton` (`src/shared/components/titlebar/AiChatButton.tsx`) is the trigger for the AI
Assistant chat overlay — this section covers only the button itself; the overlay's message
composer, markdown replies, quota UX, and error states are fully covered by the dedicated `ai-chat`
UI guide and are not repeated here.

It's a plain `h-14 w-12` icon button showing `RiRobot3Line` (a robot-face icon), with a translated
tooltip/`aria-label` reading "AI Assistant" (`titlebar.aiChat`). It carries no badge, dot, or unread
indicator of any kind — nothing on the icon itself changes based on chat state. Clicking it calls
`aiChatStore`'s `open()` directly, with no confirmation or intermediate step. Unlike Help Desk (fully
hidden below Casual tier), this button is visible and clickable at every subscription tier including
Free — the AI Assistant overlay is reachable at every tier, and what actually differs by tier is only
the daily message cap enforced server-side, not whether this button appears. It's also reachable
before signing in to any Steam account, since `AiChatOverlay` (like `Titlebar` itself) is mounted at
the app root rather than inside `DashboardShell`.

## Help Desk (live chat)

`HelpDesk` (`src/shared/components/titlebar/HelpDesk.tsx`) is the titlebar launcher for a
third-party live-chat widget (Chatway), gated to Casual tier and above: `hasCasualAccess
(subscriptionTier)` returns `false` for a free-tier account, and the whole component returns `null`
in that case — meaning it's not a disabled/greyed-out icon at that tier, the icon is simply absent
from the titlebar entirely. This matches the "Real-time live support" row in the docs' `pro.mdx`
tier-comparison table, which lists it as available for both Casual and Gamer, not Free.

When visible, it renders `RiCustomerService2Line` (a headset/customer-service icon) with a
translated tooltip/`aria-label` reading "Help Desk" (`titlebar.helpDesk`). Chatway's own widget
script is unconditionally injected app-wide from `_app.tsx` with its default floating launcher icon
hidden, so this titlebar button is the only way to open it. Clicking it toggles the widget open/
closed (`window.$chatway.openChatwayWidget()`/`closeChatwayWidget()`); opening it also pushes
identifying context into the chat session first — the signed-in account's persona name, resolved
SteamID64, app version, subscription tier, whether this is a portable or installer build, and the
user's Pro license key (or the literal string `"N/A (legacy subscriber)"` if none is stored) — so a
support agent sees this context without the user typing it out. While the widget is open, a
translucent full-screen backdrop appears behind it (clicking the backdrop closes the widget). A small
red dot appears on the Help Desk icon itself whenever Chatway reports an unread message via its own
`data-unread-message` attribute; it clears the moment the widget is opened. There is no keyboard
shortcut for opening Help Desk in this rewrite — a `Ctrl+Shift+H` shortcut existed for it in the
pre-rewrite app but was deliberately dropped since Chatway is a third-party embed with no equivalent
hook to bind it to here.

## Notifications bell

`Notifications` (`src/shared/components/titlebar/Notifications.tsx`) shows a `TbBell` icon with a
translated tooltip/`aria-label` reading "Notifications" (`common.notifications`) — this button has
no tier gating at all, visible identically at every subscription tier. It fetches a small remote
notifications feed (a JSON file from the project's GitHub repo, cached in `localStorage` with a
30-minute cooldown and refreshed hourly) — this is unrelated to the in-app achievement/action toasts
elsewhere in the app; it's a small developer-curated announcements feed (e.g. news, promotions).

When there are unseen entries, a small red numbered `Badge` overlays the top-right corner of the bell
icon showing the unseen count. Clicking the bell opens a `Popover` (not a full modal) anchored below
it: a 384px-wide (`w-96`) panel with a header row containing a "Mark all as read" text link (only
shown if there are any notifications at all) and, below it, a scrollable list (max height ~400px) of
up to 10 most-recent notifications. Each notification renders as its own clickable row: a small dot
(`GoDotFill`, colored accent-blue if unseen or dim gray if already seen) plus the notification's
title, a relative timestamp (e.g. "2h ago," via `Intl.RelativeTimeFormat`, localized per the app's
current language), and its message body. Clicking a row marks it seen and opens its associated URL in
the user's default external browser (not inside the app). If there are zero notifications at all, the
panel instead shows a large dimmed bell icon and the translated text "No notifications yet"
(`notifications.empty`).

## Overflow menu

`Menu` (`src/shared/components/titlebar/Menu.tsx`) is the chevron-down icon
(`TbSquareRoundedChevronDown`) at the far right of the main button group, just before the vertical separator and the window
controls. Its tooltip/`aria-label` is the translated string "Menu" (`common.menu`). Clicking it opens
a dropdown (HeroUI v3's `Dropdown`, react-aria `Menu` underneath) with these items, in this exact
order:

1. **Documentation** (`TbBookFilled` icon, book glyph) — opens `https://steamgameidler.com/docs/` in
   the external browser.
2. **Report an issue** (`TbBugFilled`, bug glyph) — opens a pre-filled GitHub issue-creation URL
   (`.../issues/new?...&labels=bug%2Cinvestigating&template=issue_report.yml`) in the external
   browser.
3. **Feature request** (`TbBulbFilled`, lightbulb glyph) — opens a pre-filled GitHub issue-creation
   URL with `labels=feature+request&template=feature_request.yml`, also external.
4. **Join our Discord** (`FaDiscord`) — opens the project's Discord invite link externally.
5. **Changelog** (`TbListCheck`, a small checklist icon) — calls `updateStore.setShowChangelog(true)`
   directly, with no confirmation, opening `ChangelogModal` (mounted at the app root, so reachable
   even on the pre-sign-in screen). This modal is fully covered by the `dashboard-overlays` UI guide
   — this is only the trigger, not the modal's own content. Note that the same `showChangelog` flag
   is also set automatically, once, right after any silent app update finishes (see
   `useCheckForUpdates.ts`) — this menu item is simply the manual way to open the same modal on
   demand.
6. **Check for updates** (`TbDownload`) — only present in the menu at all if `canAutoUpdateCheck()`
   resolves `true` (i.e. the current build is capable of self-updating at all — hidden entirely on a
   portable Windows zip or a Linux `.deb`/`.rpm` install, matching `platform::can_auto_update`'s
   gating). Clicking it runs the same manual update-check-and-install flow as `UpdateButton`
   (`check()` → `fetchLatest()` → `performUpdate()`), showing an info toast reading "No updates
   found" if none is available, or a danger toast reading "Something went wrong while checking for
   updates" if the check itself throws. While a check triggered this way is in flight, the menu
   trigger button itself is disabled (can't be reopened mid-check).

Every menu action other than "Changelog" opens something outside the app window via
`openExternalLink`. Note that `Menu.tsx`'s own `handleAction` switch statement also has a `'support'`
case (opens `https://github.com/sponsors/zevnda`) — but no corresponding `Dropdown.Item` for it is
ever rendered in the JSX, so this case is currently dead code: there is no actual menu item a user can
click to reach it. Only the six items listed above (Documentation, Report an issue, Feature request,
Join our Discord, Changelog, Check for updates) are reachable from this menu as it exists today.

## Global search bar

`GlobalSearchBar` is rendered as the last child inside `Titlebar`'s outer wrapper (below the main
button row, still part of the same `!minimal`-gated block), positioned centered in the titlebar's
drag-region strip. It only actually renders visible content on a handful of searchable dashboard
routes (Games, Favorites, and a few automation pages' browse tabs) — everywhere else it renders
nothing at all, not a disabled/greyed-out search icon. Full behavior — which exact pages/tabs show
it, how typing filters a page's grid, the companion `GlobalSearchModal`, and `searchStore`'s query
persistence — is covered in full by the dedicated `global-search` UI guide; this titlebar guide only
notes where it physically sits (bottom edge of the titlebar strip, horizontally centered) and that
it's part of the same titlebar component tree.

## Minimal mode during splash screens

`Titlebar` accepts a `minimal` prop, set to `true` only while a full-viewport splash screen —
`FullscreenLoader` (the app's boot-time loading check) or `UpdateLoader` (shown once a self-update
actually starts installing, see "Update button" above) — is covering the screen. While `minimal` is
active:

- The logo/wordmark, sidebar toggle, Go Pro pill, update button, AI Assistant button, Help Desk,
  Notifications, Menu, the vertical separator, and the global search bar are ALL hidden — stripped
  down to literally nothing but the three window-control buttons (minimize, maximize/restore,
  close).
- The titlebar's background becomes fully transparent (`bg-transparent`, no border) instead of its
  normal opaque `bg-background` — this lets the splash screen's own full-window background/video
  show through the strip where the titlebar sits, rather than the titlebar visibly covering the
  bottom of the splash content with an opaque bar.
- Its stacking order is bumped from the normal `z-50` up to `z-9999` (one level above
  `FullscreenLoader`/`UpdateLoader`'s own `z-9998`) — specifically so the window controls stay
  genuinely clickable/on-top during the splash, rather than being visually and functionally covered
  by it. Outside of `minimal` mode the titlebar deliberately stays at the lower `z-50` so ordinary
  modals (Settings, GoProModal, etc., all `z-50` too) can still stack above it via normal DOM order.

The practical effect: even while the app is showing a full-screen loading/updating splash with no
other UI reachable, the user can still drag, minimize, maximize, or close the window — only the
logo, search, and every feature-launching button in the normal titlebar disappear until the splash
clears.
