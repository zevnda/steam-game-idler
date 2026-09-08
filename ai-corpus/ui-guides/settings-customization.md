<!-- url: https://steamgameidler.com/docs/settings/customization -->
# Settings: Customization

Generated corpus content (see `.claude/skills/generate-ui-guide/SKILL.md`) — the single merged
source for the Settings modal's Customization tab: UI, its one docs page, and its cross-feature
connections. Verified against `src/features/settings/components/CustomizationSettingsTab.tsx`,
`src/shared/theme/**`, the relevant shared stores/hooks, `src-tauri/src/customization/**`, and
`docs/app/(marketing)/docs/_content/settings/customization.mdx`. Regenerate via that skill when any
of those change — don't hand-edit this file to patch small drift.

## Where this tab lives and how it's laid out

Settings → Customization is one of 11 tabs in the Settings modal's left-hand vertical tab list
(`SettingsModal.tsx`). Unlike Card Farming, Achievement Unlocker, Free Games, and Inventory
Manager — each of which has its own page-header gear icon that opens the Settings modal already
on that specific tab (`openSettings('cardFarming')` etc.) — nothing in the app jumps straight to
Customization. The only way in is opening the modal from the Sidebar's Settings button (which in
practice always lands on the **General** tab, since `settingsModalStore`'s `close()` resets
`activeTab` back to `'general'` every time the modal closes, and the Sidebar's own button calls
`openSettings()` with no tab argument) and then clicking "Customization" in the tab list yourself.
The tab's own page title is "Customization". Its controls render top to bottom as:
Disable tooltips, Show Recommended carousel, Show Recently Played carousel, Font, Background image,
then (after a horizontal divider) Theme. Every row above the divider uses the shared `SettingsRow`
layout (label + muted description on the left, the control on the right, with a thin divider line
under each row); the Theme section below the divider is a plain labeled block instead, since its
swatches wrap onto multiple lines rather than sitting in a single row.

While settings are still loading, the tab renders its title plus 5 skeleton placeholder bars. If
the initial `get_settings` load fails, the tab instead shows a danger `Alert` with a "Try again"
button that re-runs the load — none of the controls below render in that state.

## Disable tooltips toggle — free for everyone

A plain on/off `Switch` labeled "Disable tooltips", with the muted description "Hide hover
tooltips throughout the app." Turning it on hides the small informational pop-ups that appear when
hovering over buttons and settings throughout the app; turning it off restores them. This setting
is **not tier-gated** — every account, free or paid, can toggle it.

Mechanically, every tooltip in the app renders through one shared wrapper component
(`AppTooltip.Root`, in `src/shared/components/AppTooltip.tsx`) rather than HeroUI's raw `Tooltip`
directly. That wrapper reads `disableTooltipsStore`'s `disabled` flag: when true (and the specific
tooltip wasn't marked `important` — an escape hatch that exists in the code but nothing currently
uses), the wrapper renders only the trigger element's own children, completely unwrapped, so no
tooltip content ever mounts at all. Toggling the switch calls `set_disable_tooltips`, and on success
writes `disableTooltipsStore` directly (via `useDisableTooltipsStore`'s `setDisabled`) — so every
tooltip in the currently-open app reacts immediately, without needing a reload. A separate hook,
`useDisableTooltipsSync` (mounted once in `DashboardShell`), hydrates that same store from
`Settings.disableTooltips` once on app start so the toggle's on-screen state matches what was last
saved. If the save call itself fails, a danger toast shows a mapped error message and the switch's
displayed state does not change.

## Show Recommended carousel toggle — free for everyone, controls the Games page

A `Switch` labeled "Show Recommended carousel", description "Show a row of unplayed games at the
top of the games list." Free for every account, no tier gate. This setting doesn't affect anything
inside the Settings modal itself — it controls whether the **Recommended** carousel renders at the
top of the Games page (`/dashboard`, the default landing page after sign-in, rendered by
`GamesPage.tsx`). That carousel shows up to 20 owned games with zero forever-playtime (i.e. games
you've never played), used as a discovery surface independent of the page's own search/sort state.

Toggling the switch calls `set_show_recommended_carousel`, and on success writes
`carouselSettingsStore`'s `showRecommended` flag directly so the Games page's carousel
shows/hides immediately if it's open in the background — no reload needed. A separate hook,
`useCarouselSettingsSync` (mounted once in `DashboardShell`), hydrates that same store from
`Settings.showRecommendedCarousel` once on app start.

## Show Recently Played carousel toggle — free for everyone, controls the Games page

A `Switch` labeled "Show Recently Played carousel", description "Show a row of your most recently
played games at the top of the games list." Free for every account, no tier gate. Like the
Recommended toggle above, this controls a carousel on the Games page (`/dashboard`,
`GamesPage.tsx`) rather than anything in the Settings modal — the **Recently Played** carousel,
showing up to 15 owned games sorted by most-recent-played timestamp descending (only games with a
nonzero last-played time are eligible).

Toggling the switch calls `set_show_recent_carousel`, and on success writes
`carouselSettingsStore`'s `showRecent` flag directly for an immediate effect on the Games page, the
same live-sync pattern the Recommended toggle uses (same store, same `useCarouselSettingsSync`
hydration hook).

## Font picker — Casual-tier gated except the default

A dropdown (`Select`) labeled "Font", description "Choose the app's font." A `TierBadge` reading
"CASUAL" appears next to the label whenever the signed-in account doesn't have Casual-tier access
(or higher — Gamer tier implies Casual). Opening the dropdown lists every available font, each
rendered in its own actual typeface so you can preview it before picking (via that font's own CSS
variable), in this fixed order: **Inter (default)**, Audiowide, Black Ops One, Bungee, Cinzel
Decorative, Michroma, Monoton, Montserrat, Orbitron, Silkscreen, Zen Dots — 11 fonts total. Every
one of them is bundled into the app at build time (`next/font/google`, self-hosted, no runtime
network fetch), so picking any of them never triggers a download.

**Inter is the only free-tier font** — every other font in the list requires Casual tier (or
Gamer, which implies Casual) to actually apply. The dropdown itself is never disabled and every
font stays selectable/clickable regardless of tier (there's no per-item lock badge in the list —
the row-level `TierBadge` next to the "Font" label is the only gating signal shown). What actually
enforces the gate is the selection handler: picking any font other than Inter while not on
Casual-or-above opens the upsell modal (`proModalStore`'s `openWithTier('casual')`) instead of
saving anything, and because the dropdown's displayed value stays bound to the live saved setting,
a blocked selection never visually moves the dropdown off whatever font is already active. Picking
Inter is always allowed regardless of tier. A successful pick calls `set_font`, applies the change
immediately for a live preview via `applyFont()` (writes `--font-sans`, plus a per-font
`--font-size-scale` correction for fonts whose rendered size needs correcting — several of the
display fonts read visually larger than their nominal size), persists the chosen key to
`localStorage` under `sgi-font` (so the correct font paints on the very next app launch before the
async settings load resolves), and shows a "Font updated" success toast. A failed save shows a
danger toast instead and leaves the current font applied.

Note: an earlier default font, "Poppins", no longer appears anywhere in the current font list —
it's referenced only in code comments as "the previous default," not as a live selectable option.

## Background image — upload/clear, Casual-tier gated

A row labeled "Background image", description "Use a custom image as the app's background," with
a `TierBadge` reading "CASUAL" shown next to the label whenever the account lacks Casual access.
Two buttons sit side by side: **Choose image** and **Clear**.

**Choose image**: if the account has Casual-tier access, this is a real enabled button that opens
the native OS file picker (`@tauri-apps/plugin-dialog`, filtered to `png`/`jpg`/`jpeg`/`webp`/`gif`
files). Picking a file uploads it: the button shows a pending/spinner state while the save is in
flight. On success, the newly-set background's `data:` URI is fetched and pushed into
`customBackgroundStore`, and a "Background updated" success toast appears. Backend-side
(`src-tauri/src/customization/mod.rs`), the picked file is validated against an allow-list of
extensions and a **10 MB size cap**; a rejected file returns a specific "background invalid" error
(shown as "That image couldn't be used - check the file type and size and try again."). The file is
copied (not stored as base64 inside `settings.json`) into its own `customization/` folder under the
app's cache directory, replacing any previously-set background file regardless of its extension —
only the filename is persisted in `Settings.customBackground`.

If the account does **not** have Casual access, the "Choose image" button is not a native-disabled
control — it stays a real, clickable button (styled at 50% opacity to read as locked) whose click
handler opens the upsell (`openWithTier('casual')`) instead of the file picker. This matches the
app-wide gated-control pattern: a genuinely `isDisabled` HeroUI button would silently swallow real
trusted clicks, which would break the "click to see the upsell" flow this gate depends on.

**Clear**: unlike "Choose image," this button is **not tier-gated at all** — it stays available
regardless of subscription tier, so a background image set while previously subscribed can still be
removed after a downgrade (the image already stops rendering once downgraded, per
`CustomBackground.tsx`'s own tier check — see below — but without an always-available Clear button
the file would otherwise be stuck on disk with no UI path to delete it short of a full settings
reset). Clear is disabled (real native `isDisabled`, since this is a genuine "nothing to do" state,
not a monetization gate) whenever there's no background currently set, or while a
choose-image upload is already in progress. Clicking it removes the stored file and clears
`Settings.customBackground`, updates `customBackgroundStore` to `null`, and shows a "Background
cleared" success toast.

**Where the image actually renders**: a background image, once set, is drawn by
`CustomBackground.tsx` (mounted once in `DashboardShell`, permanent chrome behind the whole
dashboard) as a full-bleed, blurred, partially-scrimmed image layer behind the sidebar and main
content, faded out toward the bottom via a mask gradient. That component only shows the image layer
when the account is both currently subscribed and has Casual access — so on a downgrade, the stored
file stays on disk (recoverable if the account resubscribes) but stops rendering immediately,
independent of whether the Clear button is ever pressed.

## Theme picker — Casual-tier gated except Default

Below a divider, a labeled section titled "Theme" (description: "Choose a color theme for the
app."), with a `TierBadge` reading "CASUAL" next to the label when the account lacks Casual access.
Below that is a wrapping row of round color swatches, each a `Radio` button showing a filled circle
previewing that theme's background color plus its name underneath. In display order: **Default**,
Blue, Red, Purple, Pink, Orange, Black, White — 8 options (Default plus 7 named presets, read
directly from `THEME_PRESETS` in `src/shared/theme/presets.ts`).

**Default is free for everyone; all 7 other presets require Casual tier** (or Gamer, which implies
Casual). Every swatch stays a real, clickable radio option regardless of tier — none of them is
ever `isDisabled` — but a locked (non-Default, non-Casual-eligible) swatch is rendered at 50%
opacity instead of the normal `cursor-pointer` styling. Clicking a locked swatch doesn't apply the
theme: it opens the upsell (`openWithTier('casual')`) instead, and because the radio group's value
stays bound to the actually-saved theme, a blocked click never visually moves the selection ring
onto the locked swatch. Clicking an eligible swatch (Default, always; any other preset, only if
Casual-eligible) calls `set_theme`, applies the new theme's color tokens immediately for a live
preview (writing them as inline CSS custom properties on `<html>`, which win over the stylesheet
unconditionally), persists the choice to `localStorage` under `sgi-theme` (so the correct theme
paints on the very next launch before settings finish loading), and shows a "Theme updated" success
toast. Selecting Default clears any inline override entirely, falling back to the app's built-in
dark stylesheet baseline rather than reapplying Default's own values a second time.

Every non-Default preset reuses Default's exact lightness/elevation ladder and only shifts
hue/chroma — except **Black**, a separately hand-tuned darker near-neutral variant (not a hue
shift of Default), and **White**, the one light-background preset, which is also the only preset
that flips `<html>`'s `data-theme` attribute to `'light'` (every other preset, including Black,
keeps `data-theme='dark'` since they only re-tint this app's own color layer, not HeroUI's own
light/dark-derived tokens like text/link/shadow colors).

## Tier-gating summary for this tab

Two controls are genuinely restricted by subscription tier — **Font** (every font except Inter) and
**Background image**'s "Choose image" action (the whole feature, upload and the image render both)
and **Theme** (every preset except Default) — all gated at Casual tier or above (Gamer implies
Casual). Every gated control follows the same app-wide pattern: it stays a real, normal-looking,
clickable element with a `TierBadge` next to its row label, and its action is rerouted to
`proModalStore.openWithTier('casual')` instead of performing the real action — never a native
`isDisabled` control, since a real disabled HTML control silently swallows the trusted click the
upsell flow depends on. Three controls on this tab are **not** tier-gated at all, for every
account regardless of subscription: Disable tooltips, both carousel-visibility toggles, and
clearing an already-set background image.

## Settings storage

Every setting on this tab lives in the single app-wide `settings.json` file
(`src-tauri/src/settings/mod.rs`'s `Settings` struct) — not a per-Steam-account file, since theme,
font, tooltip visibility, carousel visibility, and the background image are properties of the app
installation itself, not tied to which Steam account is currently signed in. The relevant fields
are `theme` (string preset key or `"default"`), `font` (string font key or `"inter"`),
`customBackground` (the stored background filename, or `null`), `disableTooltips`,
`showRecommendedCarousel`, and `showRecentCarousel` (all booleans). The actual background image
bytes are not stored in `settings.json` at all — only the filename is; the image file itself lives
in its own `customization/` folder under the app's cache directory (portable-install aware, so a
portable build never leaks the file outside its own folder).
