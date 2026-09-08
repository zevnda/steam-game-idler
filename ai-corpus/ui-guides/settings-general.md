<!-- url: https://steamgameidler.com/docs/settings/general -->
# Settings — General tab (and the Settings modal itself)

Generated corpus content (see `.claude/skills/generate-ui-guide/SKILL.md`). This file is the
single merged source (UI + docs) for the Settings modal shell and its General tab specifically —
regenerate via that skill when either changes, don't hand-edit to patch small drift. The Settings
modal has 10 other tabs, each documented in its own sibling corpus file: `settings-subscription.md`
(Subscription — license key/billing), `settings-customization.md` (Customization — theme/font/
background/tooltips/carousels), `settings-steam-credentials.md` (Steam Credentials — Steam
Community cookies for Card Farming/Inventory Manager), `settings-game-settings.md` (Game Settings —
per-game overrides), `settings-keybinds.md` (Keybinds — the full keyboard-shortcut reference), and
`settings-debug.md` (Debug — log viewer, reset settings, clear data). Card Farming's, Achievement
Unlocker's, Inventory Manager's, and Free Games's own settings tabs are documented in their
respective feature's own ui-guide (`card-farming.md`, `achievement-unlocker.md`,
`inventory-manager.md`, `free-games.md`), not here or in any settings-*.md file.

## Opening the Settings modal

Settings is an overlay, not a routed page — it renders from `DashboardShell` (mounted once at the
app root, so it's reachable from any dashboard page without losing that page's state underneath
it) and is entirely driven by a dedicated `settingsModalStore` (`isOpen`, `activeTab`). There are
three ways to open it:

- **The Settings gear icon embedded in the Sidebar** (bottom of the sidebar, next to the account
  switcher's avatar/name — a plain icon button with a gear icon, `aria-label="Settings"`, shown as
  an icon-only button with a tooltip when the sidebar is collapsed). This always opens with no
  specific tab requested. Because closing the modal (via its own close button, clicking outside, or
  the `,` shortcut below) always resets the store's `activeTab` back to `'general'`, in practice
  this gear button opens on the **General** tab every time you use it after any previous close —
  not literally "whichever tab you last had open," even though the tab does stay wherever you left
  it if you navigate between tabs without closing the modal in between.
- **A feature page's own Settings gear icon** — Card Farming's, Achievement Unlocker's, Inventory
  Manager's, and Free Games's page headers each have their own settings-gear button that jumps
  straight to that feature's own tab in this same modal (e.g. Card Farming's gear opens directly on
  the Card Farming tab, not General).
- **The `Ctrl` + `,` keyboard shortcut** (`Cmd` + `,` on macOS-style modifier handling, though SGI
  doesn't ship a macOS build) toggles the modal open/closed from anywhere in the dashboard — pressing
  it while a text field has focus is ignored (the shortcut only fires when nothing is focused in an
  input/textarea/contenteditable). When used to open, it behaves like the sidebar gear: no specific
  tab is requested, so it lands wherever `activeTab` currently is (in practice, General, for the
  same reason as above). The full shortcut reference lives in `settings-keybinds.md`.

## The modal's layout: fixed nav column + scrollable content

The modal has no visible title bar — just a floating circular dismiss button in the top-left corner
(a rounded button on the field-background color) and a screen-reader-only heading reading
"Settings" for accessibility. The body splits into two columns:

- **A fixed-width, non-scrolling left nav column** (styled to match the dashboard Sidebar's own
  background/border for visual consistency) listing all 11 tabs as a vertical list, in this exact
  order: **General**, **Subscription**, **Customization**, **Steam Credentials**, **Card Farming**,
  **Achievement Unlocker**, **Inventory Manager**, **Free Games**, **Game Settings**, **Keybinds**,
  **Debug**. The currently-selected tab renders bold/full-opacity text; the rest render in a muted
  color. Below the tab list, still inside this fixed column, sits a row of three small icon
  buttons — a book icon linking to that tab's own documentation page (deep-links to the specific
  docs page for whichever tab is currently active, e.g. `/docs/settings/general` while General is
  selected), a GitHub icon linking to the project's GitHub repo, and a Discord icon linking to the
  project's Discord server — all opening in the system's default external browser, not inside the
  app. Below that row, the installed app version is shown as small muted text ("Steam Game Idler
  v{version}"), read once via Tauri's own `getVersion()` API each time the modal opens.
- **A scrollable content column** on the right, showing whichever tab is selected. Every tab's
  content is preceded by the same small muted breadcrumb reading "Settings ›" (the word "Settings"
  followed by a right-chevron icon) above that tab's own page heading — this breadcrumb is rendered
  once by a shared wrapper component around every tab, not duplicated per tab.

## The General tab: account identity header

If you're signed in, the top of the General tab shows an identity header row: your avatar (a
circular image if your Steam avatar has resolved yet, otherwise a fallback showing the first letter
of your display name, or "?" if no name is available yet), your display name (your resolved Steam
persona name, falling back to your raw username/Steam ID if the persona name hasn't loaded yet),
and an identifier field. What that identifier field shows and is labeled depends on your sign-in
method:

- **Steam Sign-in** (agent mode) accounts show the sign-in **username** here, labeled "Username" —
  and, once your account summary has resolved, a *separate* additional field further along the row
  labeled "Steam ID" showing your actual Steam ID64 (agent mode's username and Steam ID are
  different values, unlike Legacy Sign-in).
- **Legacy Sign-in** (CLI mode / a real local Steam client) accounts show your **Steam ID** here
  directly, labeled "Steam ID" (username and Steam ID are the same value in this mode, so there's
  no separate second field).

## Language

A dropdown (the label "Language", with a description explaining it picks the app's display
language) lets you pick SGI's UI language. As of this writing every one of SGI's 9 shipped locales
(English, Deutsch, Español, Français, Italiano, Português (Brazil), Русский, Türkçe, 简体中文) is
enabled/selectable in this dropdown — there is currently no dimmed/unselectable locale in the list.
(If a locale is ever pulled back to "in progress" status, the dropdown shows it dimmed and clicking
it opens the community translation help page instead of switching to it, rather than switching to a
half-translated UI.) Below the dropdown's description text sits a separate "Help translate SGI"
link (with an external-link icon) that opens SGI's Crowdin project page — only English is
hand-maintained directly in the codebase; every other locale's translations are contributed and
synced through Crowdin, not hand-edited.

The very first time SGI runs on a machine (before you've ever picked a language in this dropdown),
it auto-detects a starting language from your operating system's own language setting; from then
on, whatever you last selected here is cached and always wins on every subsequent launch, regardless
of any later OS language change, until you change it again in this dropdown.

## Always Online (anti-away) — Legacy Sign-in only

A toggle switch, labeled "Always online," described as "Periodically refresh your Steam status so
you don't appear away while idling." **This row only appears at all for Legacy Sign-in (CLI-mode)
accounts** — it's conditionally rendered based on the active account's sign-in mode, and is
completely absent from the tab for Steam Sign-in (agent-mode) accounts. It toggles and saves
instantly (no separate Save button) — flipping it immediately persists the change and reflects the
new state; if the save fails, the switch reverts and a toast explains the failure. This setting
pokes your real local Steam client's own AFK/away detection so it doesn't mark you away while SGI
idles games in the background — Steam Sign-in accounts don't need this because they have no local
Steam client's OS-idle-detection to counteract in the first place; the persona-state and custom
idle-status controls below cover Steam Sign-in's equivalent need instead, with no periodic
re-poking required (see `presence.md` for the full "why" — a set Steam Sign-in status doesn't decay
on its own the way local-client "away" detection does).

Mechanically, while this toggle is on, SGI re-announces your online status to your local Steam
client every **3 minutes** by launching the `steam://friends/status/online` protocol URI (no
simulated keyboard/mouse input) — this fires unconditionally on that interval rather than first
checking whether you've actually gone away, and it silently no-ops with no error if no local Steam
client happens to be running to catch the URI at that moment (e.g. Steam hasn't been launched yet,
or was closed).

## Online status (persona state) — Steam Sign-in only, free for everyone

A dropdown, labeled "Online status," described as "Choose what status you appear as to friends
while signed in." **Only rendered for Steam Sign-in (agent-mode) accounts** — completely absent for
Legacy Sign-in. The options, in order, are: Online, Busy, Away, Snooze, Looking to Trade, Looking to
Play, Invisible, Offline. This picker is **free at every subscription tier** — it carries no
`TierBadge` and is never gated; only the custom idle-status message below it is Pro-gated. Selecting
an option saves immediately (no separate Save button, matching the toggle switches elsewhere in
this tab) and is disabled/shown loading while the underlying settings are still being fetched or
another save is in flight. See `presence.md` for the full explanation of why this status doesn't
need periodic re-application once set (unlike Legacy Sign-in's Always Online toggle above) and how
it differs conceptually from that toggle.

## Custom status while idling — Steam Sign-in only, Gamer-tier gated

A text field plus separate Clear/Save buttons, labeled "Custom status while idling," described as
'Replace the "Playing [game]" text your friends see while idling with your own custom message.'
**Only rendered for Steam Sign-in (agent-mode) accounts.** This is a **Gamer**-tier feature — its
label shows a `TierBadge` reading Gamer whenever the signed-in account's subscription doesn't
already have Gamer access. Matching the app's standard gated-control pattern, the text field itself
stays typable regardless of tier (so a non-Pro user can draft their message before hitting the
upsell), but the **Clear** and **Save** buttons are real, normal-looking, clickable buttons whose
click handler is rerouted to open the upgrade modal (pre-scrolled to the Gamer tier) instead of
actually saving/clearing, for any account below Gamer tier — neither button is ever rendered
`isDisabled` to represent the tier gate. For a Gamer-tier account, Save persists the typed text
(trimmed; an all-whitespace value is treated as clearing it back to `null`/no custom message) with
a success toast on save; Clear resets it to no custom message and empties the field. Per
`presence.md` and this control's underlying settings module: this message only actually becomes
visible to your friends once you're idling a game you genuinely own — Steam silently ignores it
otherwise, and it works whether it was set before, during, or after idling starts (no ordering
requirement).

## Show games only — Steam Sign-in only

A toggle switch, labeled "Show games only," described as "Only show owned games and family-shared
games in your library, hiding DLC, soundtracks, videos, and tools. Changing this refreshes your
games list." **Only rendered for Steam Sign-in (agent-mode) accounts** — Legacy Sign-in has no
equivalent toggle since its ownership-check mechanism is architecturally different (it's bound to a
curated candidate game list rather than resolving your account's real full owned-app-id set).
Defaults to **on** (games-only) for an account with no saved preference yet, so an existing account
sees no filtering change by default. While the underlying setting is still loading, this row shows
a skeleton placeholder instead of a switch — deliberately, so the toggle never flashes a guessed/
wrong state (e.g. showing "enabled" for a split second before flipping to a saved "disabled" value).
Toggling it saves and applies instantly: flipping it immediately re-fetches your games list with the
new scope applied, so you don't have to wait for the next natural background refresh to see the
change take effect. Family Sharing / borrowed games are included in your library either way this
setting is set — that's inherent to how ownership is resolved and isn't something this toggle
affects.

## Run at startup

A toggle switch, labeled "Run at startup," described as "Automatically launch Steam Game Idler when
you sign in to Windows" (the description text is Windows-specific wording, but the underlying
mechanism — Tauri's autostart plugin — also registers with a Linux desktop's own autostart
mechanism on Linux builds). Unlike every other toggle in this tab, this setting has **no
`settings.json` field at all** — it reads and writes the OS's own registered-startup-app entry
directly (via `isEnabled`/`enable`/`disable` from the autostart plugin) as the single source of
truth, rather than duplicating that state into a separate persisted setting that could drift out of
sync with it. Its current value is queried fresh once when the tab mounts. Pairs well with Start
Minimized below for a fully hands-off "launches and idles in the background with no window ever
shown" setup.

## Start minimized

A toggle switch, labeled "Start minimized," described as "Launch Steam Game Idler hidden in the
system tray instead of showing the window." When enabled, the app opens silently in the background
on your next launch — you access it afterward by clicking the SGI icon in the system tray. This
value is only ever read by the Rust backend once, at the *next* app launch — toggling it here has
no live/immediate effect on the app instance currently running, only on how the app behaves the
next time it starts.

## Close to tray

A toggle switch, labeled "Close to tray," described as "Keep Steam Game Idler running in the system
tray when you close the window." When enabled, clicking the window's close (X) button minimizes SGI
to the system tray instead of fully exiting the app; to actually quit, right-click the tray icon and
choose Quit. This value is read fresh from disk at the moment you click close, not cached into any
live frontend store, since nothing needs to react to it changing while the app is running.

## Automatically update games list — Casual-tier gated

A toggle switch, labeled "Automatically update games list," described as "Silently refresh your
games list in the background so it stays current without a manual refresh." This is a **Casual**-
tier feature — its label shows a `TierBadge` reading Casual whenever the account's subscription
tier is below Casual. Matching the app's standard gated-control pattern, the switch for a
sub-Casual account is still a real, normal-looking, enabled-appearing switch (never rendered
`isDisabled`) whose `onChange` is rerouted to open the upgrade modal (pre-scrolled to Casual) instead
of actually toggling the setting; a Casual-or-above account gets the real toggle, which saves and
applies instantly. When enabled, SGI periodically checks your Steam library in the background for
newly purchased or removed games and silently updates your games list — no manual refresh needed.
The check interval is **5 minutes** by default (using SGI's shared built-in Steam Web API key,
which stays conservative to respect Steam's rate limits since that one key is shared across every
SGI user), or **1 minute** if you've set your own Steam Web API key override in the field below (a
personal key spends only your own API quota, so it's safe to poll far more aggressively). This
background polling is scoped only to your currently-active account, and it live re-checks your
subscription tier on every tick — if your subscription lapses below Casual mid-session, the
background polling stops immediately rather than continuing to run on a stale "was enabled"
in-memory flag.

## Steam Web API key

A password-style text field (input masked like a password field, with autocomplete disabled) plus
separate Clear/Save buttons, labeled "Steam Web API key," described as "Overrides the app's
built-in Steam Web API key," with a placeholder reading "Leave blank to use the built-in key." This
is **not tier-gated** — available to every account regardless of subscription. By default SGI
fetches your profile/game data using its own shared built-in Steam Web API key; providing your own
key here lets SGI access your data even when your Steam profile is set to private, and some
features may still be limited with a private profile even with your own key set. An API key is free
to obtain for any Steam account, from Steam's own developer portal — it must belong to the same
Steam account you're currently signed into in SGI, and if you use multiple SGI accounts you need to
set the key separately for each one (this is an app-installation-wide field per the modal's General
tab, but functionally you're expected to only fill it in while the matching account is active,
since Steam validates the key against a specific account).

Clicking **Save** first validates the trimmed key against Steam's `GetPlayerSummaries` API before
persisting anything (an empty/blank key skips validation entirely and just clears the override) —
if Steam rejects the key (an HTTP 403 response), nothing is saved and a toast reads "Steam rejected
that API key. Double-check it and try again." A successful save persists the key and shows a
"Saved" toast; clicking **Clear** removes any saved override (reverting to the shared built-in key)
and shows a "Cleared" toast. The Clear button is disabled whenever no key is currently saved. Your
key is stored securely in your OS's own credential store (Windows Credential Manager on Windows, the
equivalent secure storage on Linux) — the same secure layer used for your sign-in token and any
saved Steam Community cookies — never written into the plain-text settings file (see
`credential-security.md` for the full explanation of why this matters, e.g. that copying your SGI
settings/cache folder elsewhere doesn't hand over a usable key). If the credential store itself
can't be accessed (a Windows Credential Manager access failure, for example), the save/clear action
fails and a toast reads "Couldn't access the Windows Credential Manager to store your API key."
Saving your own key here is also what enables the faster 1-minute automatic-games-list-update
interval described above, instead of the shared key's more conservative 5-minute interval.

## Error states shared across this tab

If the tab's initial settings load fails entirely (`get_settings` erroring), the whole tab is
replaced with a centered error alert titled "Couldn't load settings" (with the specific reason
text, e.g. "Couldn't read or write your settings file" for an I/O failure, or a generic
"Something went wrong updating settings. Please try again. (code)" fallback for anything
unrecognized) and a "Try again" button that re-runs the load. This is distinct from an individual
save/clear/toggle action failing after the tab has already loaded successfully — those failures
surface as one-off toasts (using the same error-code-to-message mapping) rather than replacing the
whole tab's content, so a single failed toggle doesn't block you from using the rest of the tab.
