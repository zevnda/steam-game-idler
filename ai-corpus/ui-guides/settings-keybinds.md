<!-- url: https://steamgameidler.com/docs/settings/keybinds -->
# Settings — Keybinds tab

Generated corpus content (see `.claude/skills/generate-ui-guide/SKILL.md`). This file is the
single merged source (UI + docs) for the Settings modal's Keybinds tab — the app's full keyboard-
shortcut reference — and should be regenerated via that skill whenever a shortcut is added,
removed, or changed, not hand-edited to patch small drift. The Settings modal has 10 other tabs,
each documented in its own sibling corpus file (see `settings-general.md` for the full list and for
how the modal itself opens/is laid out). Card Farming's, Achievement Unlocker's, Inventory
Manager's, and Free Games's own settings tabs are documented in their respective feature's own
ui-guide, not here.

## What this tab is: a read-only reference list, not a remapping UI

`KeybindsSettingsTab.tsx` renders a static, non-interactive reference table — there is no control
anywhere in this tab to change, add, or remove a shortcut. Every shortcut listed here is hardcoded
in the app's actual keydown listeners; nothing about the bindings themselves is configurable, and
this tab is purely a lookup table for what already exists elsewhere in the app. This matches the
live docs page's own wording verbatim ("It's read-only. Shortcuts can't be remapped.").

Visually, the tab shows two labeled sections ("Zoom" and "Navigation"), each rendered as a bordered
box with alternating row shading (odd rows tinted slightly darker) and a thin divider between rows.
Each row shows the action's label on the left and its key combination on the right, rendered as
individual small badges (one badge per physical key, e.g. a "Ctrl" badge next to a "+" badge) — a
row that has an alternate way to trigger the same action (only Zoom In/Zoom Out have this) shows a
second row of key badges stacked directly beneath the primary one.

This tab documents exactly 8 shortcuts, backed by three separate keydown-listener hooks in the
real codebase — `useZoomControls` (mounted once at the app root in `_app.tsx`, so it's live even on
the pre-sign-in screens), `useDashboardShortcuts` (mounted once in `DashboardShell`, so it's live
only on `/dashboard/*` pages), and `useGlobalSearchShortcut` (also mounted once in
`DashboardShell`). None of the three is gated by subscription tier — every shortcut here works
identically at every tier, including Free.

## Zoom section — Zoom in, Zoom out, Reset zoom

Three rows, backed by `useZoomControls` (mounted at the app root, so these three work everywhere in
the app, including the sign-in landing page and every sign-in sub-screen — not just inside the
dashboard):

- **Zoom in** — `Ctrl` `+`, with a listed alternate of `Ctrl` + scroll up (holding Ctrl and rolling
  the mouse wheel up). In the real listener, the primary key check actually accepts either the `+`
  character or a bare `=` character (`e.key === '+' || e.key === '='`) — so on a standard US
  keyboard layout, both `Ctrl+Shift+=` (which produces `+`) and plain `Ctrl+=` (no Shift needed)
  zoom in identically; the tab's displayed badge just shows `Ctrl` `+`.
- **Zoom out** — `Ctrl` `-`, with a listed alternate of `Ctrl` + scroll down.
- **Reset zoom** — `Ctrl` `0`. Resets the zoom level to exactly 100% (`1.0`), not to whatever level
  the app happened to start at.

Mechanically: each keypress/scroll adjusts the zoom level by a fixed step of `0.1` (10 percentage
points) per press or scroll tick, clamped between a minimum of `0.7` (70%) and a maximum of `1.3`
(130%) — you cannot zoom below 70% or above 130% no matter how many times you repeat the shortcut.
The resulting level is saved to `localStorage` (key `zoomLevel`) and applied by invoking the Rust
`set_zoom` command with that scale factor, so it persists across app restarts and reapplies
automatically the next time the app launches (read once during `useZoomControls`'s own mount
effect). This is a pure frontend preference — there is nothing to configure on this in
`settings.json`.

Two behavioral details worth knowing when explaining "why did zoom do something unexpected":

- The keydown listener is registered in the event **capture phase**, not the normal bubble phase —
  this is deliberate so the zoom shortcuts keep working even if some other on-screen element (e.g.
  an open modal) calls `stopPropagation()` on the bubbling keydown event.
- **Unlike every shortcut in the Navigation section below, the zoom shortcuts have no "don't fire
  while typing in a text field" guard at all.** Pressing `Ctrl` `+`/`Ctrl` `-`/`Ctrl` `0` (or
  Ctrl-scrolling) zooms the whole app even while a text input, textarea, or contenteditable element
  currently has focus.

## Navigation section — page cycling, search, settings toggle, sidebar toggle

Five rows. Unlike the Zoom section, all five of these are backed by hooks mounted only in
`DashboardShell` — meaning **none of them do anything on the sign-in landing page or any sign-in
sub-screen**, only once you're on an actual `/dashboard/*` page. All five also share one common
guard: none of them fire while focus is currently inside an `<input>`, a `<textarea>`, or any
`contentEditable` element — so typing a literal `/`, `,`, `[`, `]`, or `w` character into a text
field never accidentally triggers one of these.

- **Next page** — `Ctrl` `]`. **Previous page** — `Ctrl` `[`. Both are backed by
  `useDashboardShortcuts` and cycle through the app's 8 dashboard pages in a fixed order matching
  the Sidebar's own section layout, flattened: Games, Idling, Favorites, Free Games, Card Farming,
  Achievement Unlocker, Auto Idle, Inventory Manager — wrapping around at either end (pressing
  Next Page from Inventory Manager goes back to Games, and vice versa from Games with Previous
  Page). **Both shortcuts are silently skipped (no-op) whenever the Settings modal is currently
  open** — cycling the page underneath a still-open modal would look broken rather than useful, so
  the hook checks `settingsModalStore`'s `isOpen` and returns early if it's `true`.
- **Open search** — `/` (no modifier key). Backed by a separate, dedicated hook
  (`useGlobalSearchShortcut`, not part of `useDashboardShortcuts`) that opens the same global search
  modal documented in full in `global-search.md`. It only actually does something when **both**: the
  current page has a registered searchable scope (Games, Favorites, Achievement Unlocker, Auto
  Idle, or Card Farming — Idling, Free Games, and Inventory Manager have no search wiring at all),
  **and** that scope's "is my active tab actually searchable right now" flag is currently true (e.g.
  Favorites/Auto Idle only while their "Browse" tab is showing, Card Farming only while its "Browse"
  tab is active with a Steam Community cookie connection and no farming cycle/summary on screen).
  Outside those conditions, pressing `/` is a plain inert keystroke — see `global-search.md` for the
  full scope/tab-gating table. This is the exact same shortcut also described in `global-search.md`;
  the binding and behavior are identical in both places, this file just adds it as part of the full
  keybind list.
- **Toggle settings** — `Ctrl` `,`. Backed by `useDashboardShortcuts`. Opens the Settings modal if
  it's currently closed, or closes it if it's currently open (a true toggle, checked against
  `settingsModalStore`'s live `isOpen` state at the moment of the keypress). When used to *open* the
  modal, it calls the store's `open()` with no specific tab argument, which keeps whatever tab was
  already active rather than forcing a particular one — in practice this means it opens on the
  **General** tab almost every time, since closing the modal by any means (its own close button,
  Escape, clicking the backdrop, or this same shortcut used to close it) unconditionally resets the
  active tab back to `'general'`. See `settings-general.md`'s "Opening the Settings modal" section
  for the full explanation of this reset behavior.
- **Toggle sidebar** — `Ctrl` `W`. Backed by `useDashboardShortcuts`. Toggles `sidebarStore`'s
  collapsed/expanded state (persisted to `localStorage` under the key `sidebarCollapsed`), switching
  the sidebar between its 256px expanded width and 64px icon-only collapsed rail. **This binding
  additionally requires Shift not be held** (`!e.shiftKey` in the real check) — `Ctrl+Shift+W` does
  **not** toggle the sidebar, only a bare `Ctrl+W` (or `Cmd+W` — the check accepts `e.ctrlKey ||
  e.metaKey`, though SGI doesn't ship a macOS build). This is the same shortcut and mechanism
  documented in full in `sidebar.md`'s "Collapsing and expanding the sidebar" section — there is no
  on-screen collapse/expand button anywhere in the sidebar itself; this shortcut is the sidebar's
  only trigger for collapsing/expanding.

## What's deliberately not on this list

The predecessor app (referred to internally as "`main`") had a 9th shortcut, `Ctrl+Shift+H`, that
toggled a Chatway help-desk widget. That widget was a `main`-only third-party embed with no
equivalent feature in this rewrite, so the shortcut was deliberately dropped rather than kept
pointing at nothing — if a user asks about a help/support keyboard shortcut and it isn't one of the
8 listed above, it doesn't exist in the current app.

## Where each hook is mounted (for "why doesn't this shortcut work here" questions)

- `useZoomControls` — mounted once in `_app.tsx` (the app root). Works everywhere, sign-in screens
  included, and works even with a text field focused.
- `useDashboardShortcuts` — mounted once in `DashboardShell`. Covers Next/Previous page, Toggle
  settings, and Toggle sidebar. Only live on `/dashboard/*` pages; suppressed while a text
  input/textarea/contenteditable has focus.
- `useGlobalSearchShortcut` — mounted once in `DashboardShell`, separately from
  `useDashboardShortcuts`. Covers only the `/` Open search shortcut. Only live on `/dashboard/*`
  pages with an active searchable scope; suppressed while a text input/textarea/contenteditable has
  focus.

So a shortcut that "does nothing" is most often one of: you're not on a `/dashboard/*` page yet
(affects everything except the three Zoom shortcuts), a text field currently has focus (affects
every shortcut except the three Zoom shortcuts), the Settings modal is open (affects only Next/
Previous page), or — for `/` specifically — the current page/tab has no active searchable scope
(see `global-search.md` for the full per-page table).
