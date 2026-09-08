<!-- url: https://steamgameidler.com/docs/get-started/how-to-sign-in -->
# Sign-in Landing

This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/features/sign-in-landing/components/SignInLanding.tsx` source, the shared `AuthLayout.tsx`/
`AuthCard.tsx`/`SignInHero.tsx` shell it renders inside, `src/pages/index.tsx` (the standalone
route that mounts it), `src/pages/_app.tsx`'s pre-dashboard gating, and the
`get-started/how-to-sign-in.mdx`/`get-started/install.mdx` docs pages. It is the single merged
source for this screen (UI + docs + cross-feature connections) and should be regenerated via that
skill whenever this screen's layout, buttons, or gating logic change — not hand-patched for small
drift. The two flows this screen leads into have their own separate guides:
`ai-corpus/ui-guides/agent-sign-in.md` (Steam Sign-in) and `ai-corpus/ui-guides/local-sign-in.md`
(Legacy Sign-in) — neither flow's own detail is repeated here.

## What this screen is and when you see it

This is `SignInLanding.tsx`, the very first screen shown when there is no signed-in Steam Game
Idler session at all — it's rendered by `src/pages/index.tsx`, the app's `/` route. It presents a
choice between the two sign-in methods and does nothing else itself; clicking either button just
swaps which screen the parent renders next (`useState<'landing' | 'agent' | 'local'>`), it is not a
route change and calls no backend command.

You don't necessarily land here on every app launch even with no window state remembered:
`useSessionBootstrap` (mounted once at the app root in `_app.tsx`, not on this page) tries to
silently resume every account that was signed in the last time the app closed by re-validating each
one against the real backend (a saved refresh token for a Steam Sign-in account, a fresh
`loginusers.vdf` read for a Legacy Sign-in account) before this page ever gets a chance to mount. A
full-viewport `FullscreenLoader` (and a minimal, window-controls-only `Titlebar`) covers the whole
app while that check is in flight (capped at 4 seconds per account, with a short extra 1.5-second
grace period only if literally nothing resumed in time). You only actually see this landing screen
once that check has finished and found no account to resume at all — a fresh install, or every
previously-signed-in account failing to re-validate (e.g. a revoked token, or the local Steam
client no longer knowing about a saved SteamID). If at least one account resumes successfully, the
app navigates straight to `/dashboard` instead and this screen is never shown.

## The two-pane shell around this screen (`AuthLayout`)

This screen (and both sign-in flows it leads to) render inside `AuthLayout.tsx`, a full-viewport
(`h-screen w-screen`) two-pane shell:

- **Left pane (`w-3/5`)**: SGI's app logo (a 70×70 rounded-square icon) sitting inside a soft
  cyan-to-violet glow at the top, with the actual sign-in card (`SignInLanding`'s content, wrapped
  in `AuthCard`) centered below it.
- **Right pane (`flex-1`)**: `SignInHero`, a purely decorative marketing panel — a large rounded
  panel showing a continuously auto-scrolling wall of real Steam game cover art behind a headline
  ("The Only Steam Automation Tool You Will Ever Need"), a subtitle describing SGI's core features,
  and a product screenshot mockup. Nothing on this panel is interactive.
- **Bottom-left, fixed and overlaid on top of both panes**: a language switcher
  (`LanguageSwitch`) and a plain text "Need help?" link/button
  (`t('common.needHelp')`) that opens `https://steamgameidler.com/docs/get-started/how-to-sign-in`
  (this exact docs page) in your default browser.

`AuthCard` itself is a plain centered wrapper (not a HeroUI `Card` — no border/shadow/padding
chrome), showing a bold centered title above whatever children are passed in. On this screen the
title is `t('auth.landing.title')`: **"Sign in to Steam Game Idler."**

## The two buttons — what they look like and what each one says

Below the title, `SignInLanding` renders its buttons stacked vertically (`flex flex-col gap-4`),
both full-width, in this fixed order:

1. **"Steam Sign-in"** (`t('auth.landing.agentButton')`) — a plain, default-styled, full-width
   `Button` with no icon, text only. This is the primary/recommended action, shown first — Steam
   Sign-in (agent mode) needs no local Steam client at all, so it's the method most users should be
   steered toward. Clicking it calls the `onSelectAgent` prop, which (from `pages/index.tsx`) swaps
   this landing card out for `SignInScreen` (the combined credentials/QR sign-in screen — see
   `agent-sign-in.md` for everything past this click).
2. **"Legacy Sign-in"** (`t('auth.landing.localButton')`) — a full-width `Button` with
   `variant='secondary'` (visually de-emphasized relative to the Steam Sign-in button above it),
   also text-only with no icon. This is the fallback for users who'd rather not enter Steam
   credentials into the app at all — it requires a real, locally-installed, running Steam client.
   Clicking it calls `onSelectLocal`, swapping the card for `LocalSignInScreen` (the account-picker
   screen — see `local-sign-in.md` for everything past this click). **This button does not exist at
   all on Linux** — see the dedicated section below.

Neither button shows an icon of its own (confirmed against `MockButton.tsx`'s
`steam-sign-in`/`legacy-sign-in` types, both of which render as plain text pills with no icon) —
don't describe either as having a Steam logo or similar graphic on this screen.

Below the "Terms of Service" acknowledgment footer, described in its own section, is the last thing
on the card.

## Linux: the Legacy Sign-in button is hidden entirely, not just disabled

`SignInLanding.tsx` reads `usePlatformStore(state => state.currentOs)` and computes `isLinux =
currentOs === 'linux'`. The component's JSX wraps the entire Legacy Sign-in button (and its
`localDisabled`-helper-text block, which only ever applies inside `AddAccountModal` anyway — see
below) in `{isLinux ? null : (...)}` — on a confirmed Linux read, that whole block renders nothing
at all. There is no greyed-out/disabled placeholder button shown in its place, and no explanatory
message fills the gap either — the layout simply collapses to showing only the "Steam Sign-in"
button (still full-width, still first/only item in that vertical stack), followed directly by the
Terms of Service footer below it (when not embedded). This matches root `CLAUDE.md`'s documented
behavior exactly.

`currentOs` starts out `null` (not yet resolved by `usePlatform()`, mounted once at the app root)
and every consumer in the codebase — this component included — treats `null` the same as "not
Linux." So on Linux specifically, there's a small window (however long the platform check takes)
where this screen could in principle render with the Legacy Sign-in button still visible for one
frame before `currentOs` resolves to `'linux'` and it disappears; this is a deliberate fail-open
choice (documented on `platformStore` itself) rather than a bug, and is the same trade-off every
other Linux-gated UI element in the app makes.

Why Legacy Sign-in doesn't exist on Linux at all: it's CLI mode, which drives a real local Steam
client via a Steamworks.NET-backed `SteamUtility.exe` CLI process — no such local-client
integration exists or is planned for Linux. `install.mdx`'s Linux section states this directly as a
plain `Callout`: **"Linux supports Steam Sign-in only."** On Linux, Steam Sign-in is therefore the
only sign-in path that exists in the entire app, not just the only one recommended.

## Gating props exist on this component, but never trigger on this standalone screen

`SignInLanding` accepts several optional props for gating the Steam Sign-in button
(`agentDisabled`, `agentDisabledReason`, `agentUpsell`, `onAgentUpsell`) and for disabling the
Legacy Sign-in button (`localDisabled`) — but `src/pages/index.tsx` (the standalone route this file
covers) calls `<SignInLanding onSelectAgent={...} onSelectLocal={...} />` with **none** of these
props supplied, so every one of them defaults to `false`/`undefined` here. Concretely, on this
standalone screen:

- The Steam Sign-in button is never disabled and never shows a `TierBadge` — the concurrent-
  agent-account tier cap (1 for Free, 3 for Casual, 10 for Gamer) only matters once you already
  have at least one agent-mode account signed in, which can't be true yet on the very first sign-in
  a fresh install ever does (every tier's cap is at least 1).
- The Legacy Sign-in button is never disabled — the "only one Legacy Sign-in account at a time"
  ceiling only matters once a Legacy Sign-in account already exists, which also can't be true yet
  here.
- No muted helper text ever appears beneath either button on this screen, since that text is only
  rendered when `agentDisabledReason`/`localDisabled` are set.

All of these props exist purely so the exact same `SignInLanding` component can be reused, with
different prop values, inside `AddAccountModal` (the account switcher's "Add another account"
flow) once a session already exists — see the dual-use section below. Do not describe any tier
badge, disabled state, or cap-related helper text as something you can see on the standalone
first-launch screen; all of that is `AddAccountModal`-only.

## Terms of Service / Privacy Policy acknowledgment footer

Beneath the buttons, this standalone screen shows one more block of small, centered, muted text
(`Typography` with `type='body-xs'`, `mt-4`): the `auth.landing.acknowledge` translation string,
**"By continuing, you agree to the Terms of Service and acknowledge that you have read our Privacy
Policy."** — with "Terms of Service" and "Privacy Policy" each rendered as inline accent-colored,
bold, clickable text (not full `<a>` links but `<button>` elements styled to look like links) that
call `openExternalLink` to open `https://steamgameidler.com/tos` and
`https://steamgameidler.com/privacy` respectively in your system's default browser.

This footer is controlled by `SignInLanding`'s `embedded` prop: `pages/index.tsx` never passes
`embedded`, so it defaults to `false` and this footer **always shows** on the standalone landing
screen. It is the one and only place in the whole sign-in flow (standalone or embedded) where this
acknowledgment appears — it's deliberately shown once, at the very first sign-in, not repeated
every time you add another account afterward.

## Dual-use: this exact component also backs "Add another account"

`SignInLanding` is not exclusive to this standalone `/` route — the account switcher's
`AddAccountModal` (`src/features/account-switcher/components/AddAccountModal.tsx`, reached via
"+ Add another account" in the account-switcher popover once you're already signed in) renders the
same component with `embedded` set to `true`, plus live-computed `agentDisabled`/`agentUpsell`/
`localDisabled` values based on your current session and subscription tier. The full detail of how
it renders differently in that context — the hidden ToS footer (already covered above from this
screen's side), the stacked-instead-of-two-column layout of the forms it leads to, and the specific
disabled/tier-gated states each button can show there — is already covered by
`ai-corpus/ui-guides/account-switcher.md`; it is not repeated here. This screen (the standalone
`/` route) is the simpler, ungated case: every prop besides `onSelectAgent`/`onSelectLocal` is left
at its default.

## What's different between the two methods you're choosing here

This screen itself shows no comparison information — no table, no tooltip, no inline callout
explaining the difference between the two buttons. The full comparison lives on the docs page this
screen's own "Need help?" link opens (`get-started/how-to-sign-in.mdx`), which states this table
as a plain domain fact (not derivable from this screen's own code):

| | Steam Sign-in | Legacy Sign-in |
|---|---|---|
| Steam client required? | No | Yes — installed, running, and signed in |
| Sign-in method | Steam username/password, or QR code | Pick from an account already signed in to the local Steam client |
| Multiple accounts at once? | Yes | No — one account at a time |
| Play games while idling? | No | Yes |

Every other feature (Card Farming, Achievement Unlocker, Achievement Manager, Inventory Manager,
Idling, Automatic Idler, Favorites) works identically regardless of which button you pick here. The
"play games while idling" row is the one fact worth calling out explicitly since it's easy to miss:
Legacy Sign-in lets you keep playing a game normally while Steam Game Idler is also idling it,
which Steam Sign-in (agent mode) cannot do — this is covered in full, with the likely mechanical
reason, in `ai-corpus/ui-guides/local-sign-in.md`; this file only restates the fact itself since
it's directly relevant to *choosing* between the two buttons shown here.

## Cross-feature connections

- **`platformStore`** (`src/shared/stores/platformStore.ts`, populated once via `usePlatform()` at
  the app root in `_app.tsx`) is what this screen reads to decide whether the Legacy Sign-in button
  exists at all — see the dedicated Linux section above. This is the only store `SignInLanding`
  itself reads directly.
- **`useSessionBootstrap`** (also root-mounted in `_app.tsx`, not owned by this page) is what
  decides whether you ever see this screen in the first place versus being silently resumed
  straight to `/dashboard` — see the first section above. This screen has no awareness of that
  process itself; it simply doesn't mount until bootstrap has already finished and found nothing to
  resume.
- **`sessionStore`**: this screen itself never reads or writes `sessionStore` — that only happens
  once you've clicked through to one of the two actual sign-in flows (`SignInScreen`/
  `LocalSignInScreen`, both covered in their own guides) and completed sign-in there.
- **`AiChatOverlay`** (the AI Assistant chat button/overlay) is root-mounted in `_app.tsx` rather
  than inside `DashboardShell` specifically so it's reachable from this pre-dashboard screen too —
  the AI Assistant doesn't require a signed-in Steam account to use, so it's available here exactly
  as it is on every dashboard page.
- **`GoProModal`** is also root-mounted in `_app.tsx`, but nothing on this standalone screen ever
  opens it — the tier-gating props that would route into it (`agentUpsell`/`onAgentUpsell`) are
  only ever supplied by `AddAccountModal`, never by `pages/index.tsx`. See the gating-props section
  above.
- **`Titlebar`**: rendered in "minimal" (window-controls-only) mode while `useSessionBootstrap` is
  still checking, then switches to its full form once that resolves — including while this landing
  screen itself is showing, same as on every other pre-dashboard and dashboard screen.
- **Settings**: this screen has no settings of its own and reads no settings file — sign-in-mode
  selection isn't a persisted setting, it's a per-account choice made fresh each time you add an
  account (either here, on the very first sign-in, or later via `AddAccountModal`).

## Docs vs. code note

No mismatch was found between this screen's real behavior and the docs pages read for this guide.
`how-to-sign-in.mdx`'s own `<Callout type='warning'>` (Legacy Sign-in's Steam-client-required
callout) is a known pre-existing typo already tracked in `docs-site-map.md` (Fumadocs' real type
values are `info`/`warn`, not `warning`) — not something this guide's own content is affected by,
since this file doesn't reproduce that specific callout's styling, only the underlying comparison
facts.
