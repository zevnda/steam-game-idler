# Dashboard Overlays

This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/shared/components/ChangelogModal.tsx`, `src/shared/components/SteamWarning.tsx`, and
`src/shared/components/Banner.tsx` source, their driving stores/hooks, and the one docs page
(`troubleshooting.mdx`) that documents any of this behavior. It groups three small, app-wide
overlays that don't belong to any single feature and aren't big enough for their own guide file.
Regenerate via that skill if any of these three overlays' triggers, copy, or behavior change — not
hand-patched for small drift.

**Scope note — what this file deliberately does NOT cover**: `DashboardShell.tsx` and `_app.tsx`
mount several other overlays app-wide — `SettingsModal`, `AddAccountModal`, `ReauthModal`,
`AchievementManagerOverlay`, `AchievementOrderOverlay`, `GlobalSearchModal`, `GoProModal`,
`AiChatOverlay` — each of these has (or is getting, in the same regeneration effort as this file)
its own dedicated guide (settings tabs, `account-switcher.md`, achievement-manager, achievement
unlocker, global search, Go Pro, AI chat). None of that content is repeated here. Also excluded on
purpose: `FullscreenLoader` and `UpdateLoader` (both root-mounted in `_app.tsx`) are plain
full-viewport loading spinners with no buttons, choices, or interaction of any kind — nothing a user
would ask "how do I..." about — so they're left out rather than padded into a section here.

## Changelog Modal

`ChangelogModal` (`src/shared/components/ChangelogModal.tsx`) is mounted once at the app root in
`src/pages/_app.tsx` (not inside `DashboardShell`), so unlike `SteamWarning`/`Banner` it can in
principle open even on the pre-dashboard sign-in screens, not just `/dashboard/*` routes. It's
driven entirely by `updateStore`'s `showChangelog` boolean (`src/shared/stores/updateStore.ts`).

**Two ways it opens:**
1. **Manually, from the titlebar overflow menu.** `Menu.tsx`
   (`src/shared/components/titlebar/Menu.tsx`) renders a dropdown (the chevron-down button, far
   right of the titlebar) with a "Changelog" item (`TbListCheck` icon — a small checklist/list icon)
   right below "Join our Discord". Clicking it calls `setShowChangelog(true)` directly — no
   confirmation, opens immediately.
2. **Automatically, right after a silent app update finishes.** `useCheckForUpdates.ts` sets a
   `hasUpdated` flag in `localStorage` immediately before `performUpdate` relaunches the app (see
   `ai-corpus/architecture-guides/updates.md` for the full update mechanism — signature
   verification, the `major`-flag silent-install rule, portable-build skip — not repeated here). On
   the very next app mount after that relaunch, `useCheckForUpdates` reads that flag, clears it, and
   calls `setShowChangelog(true)` once — so a user who was silently auto-updated sees the changelog
   pop up unprompted the next time the app opens, with no separate "what's new" notification needed.

**What it looks like and does:** The dialog has no visible header bar (only a screen-reader-only
heading, "Changelog") — the iframe content runs edge-to-edge against the dialog's own rounded
corners, mirroring `GoProModal`/`SettingsModal`'s same no-visible-header pattern. A small floating
close (`X`) button sits in the top-right corner regardless.
- **Body**: an `<iframe>` loading `https://steamgameidler.com/changelog/{version}` — the app's
  current version, resolved via Tauri's `getVersion()` API (falls back to the literal string
  `"latest"` if that call fails for any reason). This is the docs site's `(embed)` route
  (`docs/app/(embed)/changelog/[slug]/`), a deliberately minimal layout (no analytics/ads/Fumadocs
  provider) built specifically to be safe to load inside the app's webview — distinct from the full
  marketing `/changelog` list page. Until the version resolves, a centered large `Spinner` shows
  instead of the iframe.
- **Footer** (visually separated with a top border, black background): two buttons.
  - **"Star on GitHub"** (amber/gold button, `FaStar` icon) — opens
    `https://github.com/zevnda/steam-game-idler` in the system's default external browser (not
    in-app navigation).
  - **"Changelog"** (white button, no icon) — opens
    `https://steamgameidler.com/changelog#{version}` externally: the full marketing changelog list
    page, deep-linked/anchored to the current version's entry.
- **Closing**: the floating `X` button, clicking the backdrop, or Escape all close it normally (this
  modal does not disable dismissal, unlike `SteamWarning` below).

The changelog's actual written content (release notes text) is not authored or stored anywhere in
this app's codebase at all — it lives entirely on `steamgameidler.com`, sourced from the separate
`docs/` package's `changelogs/*.mdx` files. This component is purely a version-aware iframe wrapper
around that external content, not a content-authoring surface.

## Steam Warning Modal (Legacy Sign-in accounts only)

`SteamWarning` (`src/shared/components/SteamWarning.tsx`) is mounted once inside `DashboardShell`
(`src/shared/components/dashboard/DashboardShell.tsx`), alongside the `useSteamMonitor` hook that
drives it. **This entire overlay only ever applies to a Legacy Sign-in (CLI-mode) account** — a
Steam Sign-in (agent-mode) account has no dependency on a real local Steam client at all, so nothing
here can trigger for it. Legacy Sign-in is Windows-only, so this modal can only ever appear on
Windows.

**Blocking and undismissable**: `Modal.Backdrop` is rendered with `isDismissable={false}` and
`isKeyboardDismissDisabled` — there's no close button, clicking outside does nothing, and Escape
does nothing. This is deliberate: a Legacy Sign-in account's automations genuinely cannot function
without a real, running, signed-in local Steam client, so this isn't optional/dismissable UI.

**What triggers it**: `useSteamMonitor` (`src/shared/hooks/useSteamMonitor.ts`) starts a backend
poll (`start_steam_status_monitor` command) only once at least one Legacy Sign-in account is signed
in (checked via `sessionStore.accounts` for any entry with `mode === 'local'`). The backend
(`src-tauri/src/local_steam/commands.rs`) checks once per second whether a process literally named
`steam.exe` is running, and emits a `steam-status-changed` event (`{ isRunning: bool }`) only when
that observed state actually flips. When the frontend receives `isRunning: false`:
1. `steamWarningStore.showSteamWarning` is set to `true`.
2. That Legacy Sign-in account's CLI-mode automations are stopped concurrently and immediately:
   `stop_all_idling`, `stop_farming`, `stop_achievement_unlocker` (each independently idempotent —
   a no-op if that automation wasn't running for this account).

**Dev-account bypass**: even when `showSteamWarning` flips to `true`, the modal only actually opens
after a fresh `is_dev` backend check comes back `false` *and* the signed-in local account's
SteamID64 isn't one of two hardcoded values (`76561198158912649`, `76561198999797359`) baked into
the component. `is_dev` is a compile-time debug-build flag (`cfg!(debug_assertions)` in
`src-tauri/src/platform.rs`) — a normal release build always fails this check (so the bypass has no
effect for ordinary users), except for those two specific dev/test Steam IDs, which are exempted in
every build. If the `is_dev` check itself errors, the code fails open and still shows the modal
regardless — a broken dev-tooling check should never hide a real "Steam just closed" signal from a
real user.

**On-screen content**: title **"Notice"**, body text **"Steam is closed. Please relaunch Steam to
continue."**, and one button, **"Continue"**, which calls the `launch_steam` command (launches
`steam.exe` fresh, without touching any already-running instance — there normally isn't one, since
this modal only shows when Steam isn't running). Clicking "Continue" does not itself close the
modal; it only attempts to launch Steam. The modal closes itself automatically once Steam is
actually running again (see recovery below), not as a direct result of the button click.

**Recovery is polled independently, not pushed**: once open, the modal runs its own separate 1-
second poll of the `is_steam_running` command (distinct from the backend's push-based
`steam-status-changed` event). As soon as that poll sees `true`, it clears
`steamWarningStore.showSteamWarning` and closes the modal with no further user action needed. This
dual mechanism — a backend push event to *open* it, the modal's own independent poll to *close*
it — means recovery is still detected correctly even if the backend's push event was somehow missed.

**Docs**: this exact scenario, including the companion action-specific error text, is documented at
`https://steamgameidler.com/docs/troubleshooting#steam-closed-warning` ("A 'Steam is closed' warning
appears while using SGI"): reopening the Steam client and signing back into the same account is the
fix; this only affects Legacy Sign-in accounts, never Steam Sign-in ones. That page also notes the
same underlying failure can surface as a specific action's own error, **"Steam isn't running. Please
start Steam and try again."**, rather than this standing modal — same cause, same fix, just a
different presentation depending on whether Steam was already closed when the modal's poll caught it
versus closing at the exact moment of a specific click.

**Cross-feature connection**: `steamWarningStore` is also raised by a second, independent trigger
not owned by this component — the account-switcher's own pre-flight `is_steam_running` check when
attempting to switch *into* a Legacy Sign-in account while Steam isn't running (see
`account-switcher.md`'s "Switching accounts" section). Both triggers show the exact same modal;
`SteamWarning` itself doesn't know or care which one raised it.

## System / Promo Banner

`Banner` (`src/shared/components/Banner.tsx`) is mounted once inside `DashboardShell`, so — unlike
`ChangelogModal` — it only ever appears on `/dashboard/*` routes, never on the pre-dashboard sign-in
screens. It renders as a fixed bar pinned to the bottom of the viewport (`fixed bottom-0 left-0
right-0 z-50`). At most one banner shows at a time; the two possible sources are resolved by
`useBanners.ts` in a fixed priority order — a past-due subscription alert always wins over the
remote promo banner if both are eligible simultaneously.

**1. System banner — "pro-past-due" (higher priority)**: eligible only when
`subscriptionStore.subscriptionDetails?.status === 'past_due'`. Renders as the compact "alert"
variant: a red gradient background, warning-triangle icon (`TbAlertTriangle`), and the message
**"Your PRO subscription is past due. Please update your payment method to avoid losing access."**
A white **"Manage Subscription"** button opens the billing portal externally — Stripe
(`https://billing.stripe.com/p/login/...`) or PayPal (`https://www.paypal.com/myaccount/autopay/`),
chosen automatically based on `subscriptionDetails.paymentProvider`. This banner's dismissal is
**session-only**: clicking its `X` hides it only for the rest of the current app session — it will
reappear the next time the app launches if the subscription is still past due. This is the exact
same live subscription status (`useCheckSubscription.ts`, checked on mount and every 3 hours) every
other tier-gated feature in the app reads via `hasCasualAccess`/`hasGamerAccess` — there is no
separate settings toggle or dedicated settings file for this banner; it's entirely derived, not
user-configured.

**2. Remote promo banner (fallback, lower priority)**: fetched once on app launch from
`https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/banner.json` — a
project-controlled JSON file the developer can edit and roll out at any time without shipping an
app release. It only shows if the fetch succeeds, the fetched banner's own `enabled` field is
`true`, and it hasn't already been dismissed. Renders as a taller, more decorated "promo" variant:
an optional ambient starfield/shooting-star background effect, an optional image asset (loaded from
a CDN) floating on the left side, and a colored gradient/glow chosen from one of 8 named accent
colors defined in the banner's own JSON (`purple`, `blue`, `red`, `orange`, `green`, `gold`,
`black-gold`, or `rainbow` — `rainbow` additionally adds an animated color-shimmer overlay). Its
title, message, and CTA button text all come directly from the fetched JSON — not from this app's
i18n system — so a promo banner shows identical raw text regardless of the user's selected language.
Each promo banner's own `dismissal` field (author-controlled, per banner) is either `'session'`
(same as the system banner above) or `'permanent'` — a permanently-dismissed banner's id is written
to `localStorage` (`dismissedBanners` key) so it never reappears on that device again, even after a
full app restart, unless the developer ships a new banner with a different id.

**Both banner types share the same mechanics**: neither one can appear until **3 seconds after the
component mounts** (`useBanners.ts`'s deliberate settle delay) — so "no banner is showing yet" isn't
necessarily wrong if the dashboard just finished loading moments ago. Dismissing either one (the `X`
icon, `TbX`, at the banner's right edge) doesn't remove it from the screen instantly — it triggers a
300ms CSS exit animation first (`banner-promo-exit`/`banner-alert-exit` in `globals.css`), then
actually drops it from eligibility once that animation finishes.

Neither banner variant is itself tier-gated or hidden behind a Pro check — the past-due banner
exists specifically *because* of subscription state, and the remote promo banner is shown to
whichever users the developer's `banner.json` targets (there is no per-tier filtering logic in
`useBanners.ts` at all; a promo is either enabled for everyone or not fetched/shown).
