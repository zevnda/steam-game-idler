<!-- url: https://steamgameidler.com/docs/get-started/multi-account -->
# Account Switcher (Multi-Account)

This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/features/account-switcher/` component source, its cross-feature store wiring, and the
`get-started/multi-account.mdx` docs page. It is the single merged source for this feature (UI +
docs + cross-feature connections) and should be regenerated via that skill whenever the account
switcher's UI, stores, or docs page change — not hand-patched for small drift. For the deeper "why"
behind multi-account behavior (not covered again here), see
`ai-corpus/architecture-guides/multi-account.md`.

## Where the account switcher lives and how to open it

The account switcher is permanent app chrome, not a page of its own — it has no route under
`/dashboard/*`. It's rendered by `Sidebar.tsx` as part of a "Discord-style user bar" fixed at the
bottom of the sidebar, right next to the Settings gear icon button (`TbSettings`, opens the
Settings modal to whatever tab was last active). This bar is the app's one sign-out entry point —
there is no separate standalone "sign out" button anywhere else in the app.

- **Expanded sidebar**: the trigger is a full-width row showing your avatar (`Avatar`, falling back
  to your display name's first letter in a circle if no avatar has loaded yet), your current
  account's display name (Steam persona name once resolved, otherwise the raw sign-in identifier —
  your Steam username for a Steam Sign-in account, or your SteamID64 for a Legacy Sign-in account),
  and a chevron-down icon (`TbChevronDown`) on the far right.
- **Collapsed sidebar** (icon-rail mode, toggled by Ctrl+W): the trigger shrinks to just the avatar,
  with the account name moved into a hover tooltip instead (delay 300ms, appears to the right of
  the icon). This is driven by the switcher's own `compact` prop, which `Sidebar.tsx` sets from
  `sidebarStore`'s collapsed state.

Clicking the trigger opens a popover (anchored above the trigger, `placement='top'`) containing:
one row per signed-in account, a horizontal divider, and an "Add another account" row at the
bottom. The popover is implemented with HeroUI's `Popover` (not `Dropdown`/`Menu`) specifically
because each account row needs its own nested interactive sign-out button, which would conflict
with `Menu`'s item click semantics in react-aria-components.

## The account list — one row per signed-in account

Every account you've signed into and haven't explicitly signed out of gets a row, sourced from
`sessionStore`'s `accounts: Record<AccountKey, SignedInAccount>` map (`AccountKey` is
`"agent:<username>"` for a Steam Sign-in account or `"local:<steamId>"` for a Legacy Sign-in
account). Each row shows:

- **Avatar** (small, left) with a fallback initial letter if no avatar summary has resolved yet.
- **Display name** (Steam persona name if resolved via `accountSummaryStore`, otherwise the raw
  username/SteamID64), truncated with an ellipsis if too long for the row.
- **Mode label** underneath the name, in small muted text: "Signed in with Steam" for a Steam
  Sign-in (agent-mode) account, or "Local Steam client" for a Legacy Sign-in (CLI-mode) account —
  these are the literal `dashboard.sidebar.accountSwitcher.modeAgent`/`modeLocal` strings. Note this
  differs from the sign-in button labels themselves ("Steam Sign-in" / "Legacy Sign-in", used on the
  sign-in landing screen) — same two modes, different label wording depending on where in the UI
  you're looking.
- **A small filled dot** (accent color, bottom-right corner of the avatar) if that account currently
  has *any* automation running — idling, card farming, or achievement unlocking — regardless of
  whether that account is the one currently active/displayed. This is the "automation running"
  indicator described in the cross-feature section below.
- **The active account's row** is highlighted with a soft accent background (`bg-accent-soft`).
- **A sign-out button** on the far right of each row: a logout icon (`TbLogout`), `aria-label` "Sign
  out of {displayName}". Clicking it never triggers a switch — it calls `event.stopPropagation()`
  and always opens the sign-out flow described below, even for a row that isn't the active account.
- While a row is mid-switch (see below), its sign-out button is replaced by a small spinner, and the
  whole row becomes visually dimmed (70% opacity) and non-interactive until the switch finishes.

Clicking anywhere on a row *other than* the sign-out button attempts to switch to that account
(unless the row needs special handling — see the over-cap and reauth states below). Clicking the
already-active row's body does nothing (no-op).

## Switching accounts

Clicking a normal, in-good-standing row that isn't already active calls `switchAccount(key)` on
`sessionStore`, which updates `activeAccountKey` and the denormalized `account` field, and persists
the new active key to `localStorage` so it's remembered across app restarts.

- **Local (Legacy Sign-in) accounts get a pre-flight check**: before switching, the app calls the
  `is_steam_running` command. If the local Steam client isn't running, the switch is aborted, a
  warning toast fires ("Steam needs to be running to switch to this account"), and the app's
  persistent Steam-down warning modal is raised (via `steamWarningStore`). This exists because a
  Legacy Sign-in account can't do anything without a real, running local Steam client — silently
  switching into it anyway would land you on an account that can't function.
- **Steam Sign-in (agent-mode) accounts switch immediately**, no pre-flight check.
- On a successful switch: any active search query is cleared (a search scoped to the previous
  account's owned games/achievements/cards is stale for the new account), an info toast fires
  ("Switched to {name}"), and the app navigates to `/dashboard` (the Games page) regardless of which
  page you were on — a page scoped to the old account's data (e.g. a card-farming run in progress
  view) has no meaning for the newly active account.
- While a switch is in flight, that specific row shows a spinner in place of its sign-out button and
  becomes non-interactive; further clicks on it are ignored until the switch completes.
- The popover closes automatically once the switch finishes.

Every added account keeps running its own idling, card farming, and achievement-unlocking
independently in the background regardless of which account is currently active/displayed —
switching only changes which account's dashboard you're looking at, it never pauses anything.

## Adding another account

The "Add another account" row sits below the divider at the bottom of the account list popover: a
plus icon (`TbPlus`) plus the text "Add another account" (`dashboard.sidebar.accountSwitcher.
addAccount.trigger`). Clicking it closes the popover and opens `AddAccountModal` (driven by
`addAccountModalStore`, rendered once in `DashboardShell`).

`AddAccountModal` reuses the exact same building blocks as the app's initial sign-in flow —
`SignInLanding` (the same landing card with "Steam Sign-in" and "Legacy Sign-in" buttons),
`CredentialsForm`/`GuardCodeForm`/`QrSignInPanel` for the Steam Sign-in path, and `AccountPicker`
for the Legacy Sign-in path — completely unmodified except for a few new props passed only when
embedded this way. The full click-by-click detail of those sign-in forms themselves lives in the
sign-in-landing/agent-sign-in/local-sign-in guides, not repeated here; this section only covers what
changes about that flow when it's reached through "Add another account" instead of the initial
sign-in screen:

- **The Terms of Service / Privacy Policy acknowledgment footer is hidden** (`embedded` prop) — that
  acknowledgment only makes sense once, at the very first sign-in.
- **The credentials form and the QR panel are stacked vertically** (credentials above a divider
  above the QR panel), rather than the standalone sign-in screen's side-by-side two-column layout —
  the modal is a narrower, vertical context.
- **Legacy Sign-in is disabled with a native disabled button** if a Legacy Sign-in account is already
  signed in ("A local Steam client account is already signed in — only one can be signed in at a
  time."). This is a real, non-monetization technical ceiling (a real local Steam client can only be
  logged into one account at all), so unlike every tier gate in this app, it correctly uses a native
  `isDisabled` button rather than the pressable-with-badge pattern.
- **Steam Sign-in can be gated by the concurrent-account tier cap**, in one of two distinct ways:
  - If you're already on Gamer tier and have hit its own sanity-capped ceiling of 10 concurrent
    Steam Sign-in accounts, the "Steam Sign-in" button becomes a genuine native-disabled button (no
    upgrade would help), with muted helper text below it: "You've reached the maximum number of
    accounts that can be signed in with Steam at the same time."
  - If you're on Free or Casual and have hit your tier's lower cap (1 for Free, 3 for Casual), the
    button instead stays a real, clickable, dimmed-looking (50% opacity) button with a "GAMER"
    `TierBadge` next to its label, and clicking it opens the upgrade modal (`GoProModal`, pre-scrolled
    to the Gamer tier) instead of starting sign-in — the standard tier-gating pattern used everywhere
    else in this app (never a swallowed click). The helper text below reads: "The {tier} plan allows
    {count} account(s) signed in with Steam at a time. Sign out of one to add another, or upgrade for
    more." — where `{tier}` is "Casual" or "Free" and `{count}` is 1 or 3.
- On success, the modal shows a centered loading spinner, then closes itself, shows a success toast
  ("Added {name}"), and navigates to `/dashboard` — mirroring the account-switcher's own post-switch
  toast/navigation behavior. The newly added account automatically becomes the active account (its
  sign-in hook already made it active internally before this fires), so the toast/navigation reflect
  it, not whatever account was active before.

**Concurrent account caps** (Steam Sign-in only — a Legacy Sign-in account never counts against
this): Free allows 1, Casual allows up to 3, Gamer allows up to 10 concurrent Steam Sign-in
accounts. You can additionally always have one Legacy Sign-in account signed in alongside any number
of Steam Sign-in accounts, at any tier — Legacy Sign-in doesn't count against the cap at all, since
its one-account ceiling is a real Steam-client constraint, not a subscription tier.

## Signing out

Every row's sign-out button (the `TbLogout` icon, far right) is the app's one sign-out entry point
for that account, whether or not it's the currently active one.

- **If that account has no automation currently running** (no idling, card farming, or achievement
  unlocking in progress), clicking sign-out signs it out immediately with no confirmation.
- **If that account has automation running**, clicking sign-out instead closes the popover and opens
  a confirmation dialog (`AlertDialog`) titled "Sign out?" with the description: "This will stop the
  automation currently running for {name} and sign that account out." It has a "Cancel" button
  (secondary style) and a "Sign out" button (danger/red style, shows a pending spinner while sign-out
  is in progress). This is the one sign-out consequence considered worth pausing for — everything
  else about sign-out is instant.
- Signing out an account stops its card farming and achievement unlocker first, then either logs the
  agent-mode session off cleanly (`agent_logout`) or, for a Legacy Sign-in account, stops its idling
  processes (`stop_all_idling`) — both scoped to just that one account. Only that account's cached
  idling/games/card-farming/achievement-unlocker/summary state is cleared; every other signed-in
  account's cached state is left untouched.
- **The blanket `kill_all_steam_utility_processes` command is never called while any other account
  remains signed in** — it only fires as a last-resort cleanup once the account you just signed out
  was the *last* one signed in at all (i.e., you're now fully signed out of the app). Calling it
  earlier would kill every other concurrently signed-in account's process too.
- If signing out the account leaves zero accounts signed in, the app navigates back to the sign-in
  landing page (`/`).
- If you signed out the *active* account but other accounts remain, the app auto-switches to
  whichever account is now active (picked automatically by `sessionStore`) and shows the same
  "Switched to {name}" toast a normal switch would show — from your perspective this is still a
  switch, just one you didn't explicitly pick a target for.
- If the cleanup itself partially fails (e.g. the stop-automation calls or the logout call errors),
  you still get signed out, but see an additional danger toast: "Sign-out cleanup didn't fully
  finish, but you've been signed out."

## Accounts over the concurrent-account cap (subscription downgrade)

If your subscription lapses or you downgrade to a lower tier while you have more Steam Sign-in
accounts signed in than the new tier allows, **the app never force-signs-out any account over the
cap** — this is a deliberate, absolute rule; only an explicit sign-out action (above) ever stops an
account's automation. Instead:

- Every over-cap account's row in the switcher stays visible but visually dimmed (50% opacity on
  both the avatar and the name/mode-label block), and shows a "GAMER" `TierBadge` next to its mode
  label.
- Clicking an over-cap row does not switch to it — it closes the popover and opens the upgrade modal
  (`GoProModal`, pre-scrolled to Gamer tier) instead.
- The over-cap row's sign-out button remains fully functional and untouched by any of this — you can
  always sign an over-cap account out directly from its row exactly as described above.
- If the account that was *active* at the moment of a downgrade becomes over-cap, the app
  automatically falls back to switching the active account to the very first account you ever added
  (which is always allowed under any tier, since every tier's cap is at least 1) — this prevents you
  from being stranded on a now-locked account with no visible way back except manually reopening the
  switcher.
- Being over-cap doesn't stop that account's backend automation from running if it was already
  running before the downgrade — the cap only blocks new switches to it, and its automation keeps
  running invisibly in the background even while its row is dimmed, until you either upgrade again or
  explicitly sign it out.

## "Signed in elsewhere" — the reconnect/reauth flow

If a Steam Sign-in account gets signed in on another device or session (Steam only allows one active
session per account for this sign-in method), the app detects this automatically and reacts even if
the account switcher popover isn't open:

- A red-tinted badge appears on that account's row: a warning-triangle icon (`TbAlertTriangle`) plus
  the text "Signed in elsewhere", with a tooltip on hover: "This account was signed in on another
  device, so its automation has been paused. Sign in again to continue."
- `ReauthModal` (driven by `reauthModalStore`, rendered once in `DashboardShell`) **opens
  automatically the instant this is detected**, without you needing to click anything — a badge alone
  was found to be too easy to miss for something this disruptive. No separate toast fires for this;
  the modal opening is itself the notification.
- By the time this badge/modal appears, that account's card farming and achievement unlocking have
  already been stopped on the backend.
- Clicking a reauth-flagged row directly in the switcher (instead of waiting for the automatic popup)
  reopens the same `ReauthModal` for that account.
- **`ReauthModal`'s content**: title "Signed in on another device", body text "{account} was signed
  in on another device, so its automation has been paused. Sign in again to continue.", followed by a
  second line explaining the underlying limitation: "Steam Sign-in only allows one active session per
  account. If you'd like to keep playing games while Steam Game Idler runs, use Legacy Sign-in
  instead." Two buttons:
  - **"Reconnect"** (primary) — attempts to resume the same account's session using its saved
    refresh token (`agent_login_with_token`), the same mechanism used to silently resume accounts on
    app launch. It does *not* ask for a password again. If this succeeds, the modal closes and the
    reauth badge clears itself once the daemon's next status event confirms the reconnect (not
    immediately on click). If it fails, an inline red alert shows an error message beneath the
    buttons; if there's no saved credential left to reconnect with at all, the modal automatically
    falls through to the "use a different sign-in method" flow below instead of just showing an
    error.
  - **"Use a different sign-in method"** (secondary) — closes `ReauthModal` and opens the same
    `AddAccountModal` flow "+ Add another account" uses. This is the only path back to a genuinely
    different sign-in mode (e.g. switching that same account over to Legacy Sign-in) — the reauth
    flow itself never offers a password-entry form of its own.
- The reauth-needed state (`isOverCap`'s sibling flag on each row) takes priority over the over-cap
  dimmed state if a row is somehow both — a reauth-needed account has already had its automation
  stopped and genuinely needs fresh credentials before anything else about it applies, whereas an
  over-cap account is still a normal, live session that's merely not switchable.

## Cross-feature connections

- **`sessionStore`** (`src/shared/stores/sessionStore.ts`) is what the switcher's account list is
  built from directly: `accounts: Record<AccountKey, SignedInAccount>` for every row, and
  `activeAccountKey`/`account` for which row is highlighted and what "switch"/"sign out" acts on by
  default. Nearly every other feature in the app also reads this store to know which account to
  query.
- **Per-account automation dot reads other features' stores directly, not their denormalized view.**
  The switcher reads `idlingStore.entries[accountKey]?.appIds.length`,
  `cardFarmingStore.entries[accountKey]?.isFarming`, and
  `achievementUnlockerStore.entries[accountKey]?.isRunning` — the raw per-account `entries` map each
  of those stores keeps, not the single "currently active account" denormalized field those stores
  also expose. This is deliberate: a *backgrounded* account's automation state has to stay observable
  in the switcher even while a different account is the one actively displayed, which the
  denormalized view (scoped to only the active account) can't provide.
- **`accountSummaryStore`** supplies each row's resolved persona name/avatar, keyed by `AccountKey` —
  until it resolves for a given account, the row falls back to the raw sign-in identifier
  (username/SteamID64) and an initial-letter avatar.
- **`subscriptionStore`** (via `computeAllowedAccountKeys`/`maxConcurrentAgentAccounts` in
  `subscriptionAccess.ts`) drives which rows are dimmed/over-cap and what `AddAccountModal`'s Steam
  Sign-in button does when the cap is hit.
- **`proModalStore`**'s `openWithTier('gamer')` is what both the over-cap row click and
  `AddAccountModal`'s upsell button reroute to — the shared tier-gating pattern used throughout the
  app: a gated control always stays a real, clickable element (never native-`isDisabled`) with a
  `TierBadge`, rerouted to open the upgrade modal instead of performing the real action.
- **`searchStore.clearAllQueries()`** is called on both a successful switch and a sign-out that
  affected the active account — any in-flight search is scoped to the previous account's data and
  would otherwise show stale results after the switch.
- **Sign-out clears exactly one account's entry** from `idlingStore`, `gamesListStore`,
  `cardFarmingStore`, `achievementUnlockerStore`, and `accountSummaryStore` (each store's
  `clearEntry`/`clearSummary`), then `sessionStore.clearAccount(key)` — never a blanket reset of
  these stores, so other signed-in accounts' cached data survives.
- **`steamWarningStore`** is raised by a failed `is_steam_running` pre-flight check when switching
  into a Legacy Sign-in account while the local Steam client isn't running.
- **`useAgentAccountCapEnforcement`** and **`useAgentReauthWatcher`** (both mounted once in
  `DashboardShell`, not owned by the switcher's own components) are what actually drive the
  over-cap-fallback-switch and the automatic `ReauthModal` pop-open described above — the switcher's
  own components only render the resulting state, they don't detect these conditions themselves.
- **Settings**: the account switcher itself has no dedicated Settings tab or settings file of its
  own — account data lives in `sessionStore`'s `localStorage`-persisted session blob (candidate-only,
  re-validated against the real backend on every app launch by `useSessionBootstrap`, never blindly
  trusted) plus each agent-mode account's refresh token in the OS credential store (Windows
  Credential Manager via `keyring`). Sign-in-mode selection itself (Steam Sign-in vs. Legacy
  Sign-in) is not a settings toggle — it's decided per-account, at the moment you add that account.
- **Sign-in-mode branching**: this feature's own commands (`is_steam_running`, `agent_login_with_
  token`, `agent_logout`, `stop_all_idling`, `stop_farming`, `stop_achievement_unlocker`,
  `kill_all_steam_utility_processes`) don't themselves branch on a `GamesAccount` enum the way
  per-game feature commands do — sign-out simply calls the agent-specific or local-specific command
  depending on that one account's own `mode` field, since sign-out for an agent account and a local
  account are genuinely different operations (log off a daemon session vs. stop local idle
  processes), not two branches of one shared command surface.
