<!-- url: https://steamgameidler.com/docs/get-started/how-to-sign-in -->
# Steam Sign-in (Agent Mode)

This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/features/agent-sign-in/` component source (`SignInScreen.tsx`, `CredentialsForm.tsx`,
`GuardCodeForm.tsx`, `QrSignInPanel.tsx`, `useAgentSignIn.ts`, `useAgentQrSignIn.ts`,
`errorMessageKey.ts`), the `steam_agent` Rust module it drives, the reused-flow wiring inside
`AddAccountModal.tsx`, and the `get-started/how-to-sign-in.mdx`/`get-started/multi-account.mdx`
docs pages. It is the single merged source for this flow (UI + docs + cross-feature connections)
and should be regenerated via that skill whenever this screen's layout, states, or wiring change —
not hand-patched for small drift. The entry point that leads here — the initial landing screen
where the user picks "Steam Sign-in" vs. "Legacy Sign-in" — is its own separate guide
(`sign-in-landing.md`); this file starts from the moment "Steam Sign-in" has already been clicked.
For the deeper credential-security "why" behind how tokens/cookies are stored (not repeated here),
see `ai-corpus/architecture-guides/credential-security.md`.

## What "Steam Sign-in" is and how you get here

Steam Sign-in (internally "agent mode") is the recommended sign-in method — SteamKit2/daemon-backed
via a spawned `SteamUtility.exe agent` process, with no local Steam client needed at all. It's the
primary button on the sign-in landing screen (`SignInLanding.tsx`, rendered by `src/pages/index.tsx`
before any account is signed in). Clicking "Steam Sign-in" there swaps the landing card out for
`SignInScreen` — this is not a route change, just a piece of local state (`signInMethod`) on the
same full-screen two-pane `AuthLayout` shell (SGI's logo top-left, a hero illustration on the right,
a language switch and a "Need help?" link bottom-left that opens this exact docs page in your
browser). The other sign-in method, Legacy Sign-in (CLI mode, requires a real local running Steam
client), is a completely separate component tree (`local-sign-in/`) not covered by this file.

A `Callout` on the docs page states: SGI never sees or stores your Steam password — it's sent
directly to Steam's own servers to establish the sign-in, the same as signing in through the
official Steam client or mobile app. What SGI keeps afterward is only the sign-in token Steam
issues once that succeeds (stored in your OS's secure credential store, not the plain settings
file) — see the architecture guide above for the full detail.

## The combined sign-in screen layout

Once on `SignInScreen`, you see one `AuthCard` containing **two columns side by side**, separated
by a vertical divider line: the credentials form on the left, the QR sign-in panel on the right —
deliberately mirroring Steam's own web sign-in page, which shows both methods at once rather than
making you pick one first. **Both methods are live and running concurrently** the entire time this
screen is shown: the QR attempt starts automatically the instant the screen mounts (it doesn't wait
for you to look at that column), so you can freely try a username/password in the left column while
a QR code is already waiting to be scanned in the right column, and either one completing signs you
in. A back-arrow button (`TbArrowLeft` icon, fixed top-left just below the titlebar) is shown while
you're on the plain form (not yet submitted, or mid-submit) — clicking it returns you to the landing
screen. That back button disappears once a guard-code prompt is showing; from that point the way out
is the guard-code form's own "Cancel" button instead (see below), since a plain "back" wouldn't clean
up the in-flight sign-in attempt.

Whichever method you complete first wins: if you finish signing in with credentials while a QR
attempt is still pending, the QR attempt is torn down automatically (and vice versa isn't fully
guaranteed — an in-flight credentials round trip that resolves late, after QR already succeeded,
is an accepted rare gap). Once either method succeeds, the whole two-column card is replaced by a
single centered loading spinner, and you're redirected to `/dashboard` automatically — there is no
extra "Continue" click needed after a successful Steam Sign-in.

## Credentials sign-in (username/password) — left column

The left column shows the label "Sign in with account name" above a form with:

- **Username** field (`TextField`, required) — label "Username", placeholder "Enter your Steam
  username", `autoComplete='username'`. Leaving it blank and submitting shows inline field-error
  text "Enter your Steam username."
- **Password** field (required, masked, `autoComplete='current-password'`) — label "Password",
  placeholder "Enter your Steam password". Leaving it blank shows "Enter your Steam password."
- A **"Sign In"** submit button below both fields.

Submitting calls the `agent_login` command with your raw username/password. While that request is
in flight, both fields become disabled and the button shows a pending spinner (`isPending`) — you
can't edit or resubmit until it resolves. What happens next depends on the response:

- **Straight success** (no Steam Guard needed) — you're taken directly to the success spinner and
  redirected to `/dashboard`.
- **A Steam Guard prompt is needed** — the entire two-column card is replaced by `GuardCodeForm`
  (see below); the QR column disappears from view but its own attempt keeps running in the
  background regardless.
- **The sign-in itself fails** (wrong credentials, a denied request, a backend/process error) — you
  land back on the plain form with a red `Alert` above the username field, titled "Couldn't sign
  in", and the fields become editable again. The exact message depends on the error (see the "Error
  messages" section below).

If the underlying `agent_login` Tauri call itself throws (rather than returning a structured
failure — e.g. the SteamUtility process couldn't even be spawned), the same red alert path is used,
with the raw error surfaced through the generic-error fallback message.

## Steam Guard — three distinct prompt types

When `agent_login` (or the QR flow, or the guard-code submission below) reports that Steam Guard
verification is needed, the two-column layout is replaced entirely by `GuardCodeForm`, rendered
inside its own `AuthCard`. Steam Guard codes are always exactly **5 alphanumeric characters** — this
is a fixed Steam format, not something SGI enforces arbitrarily. There are three distinct variants,
distinguished by `guardType`:

- **Mobile-authenticator code** (`guardType === 'device'`) — title "Check your Steam Mobile app",
  description "Enter the code from the Steam Mobile app." Shows a 5-slot one-time-code input
  (`InputOTP`, digits-and-letters pattern, auto-focused) below the label "Steam Guard code".
- **Email code** (`guardType === 'email'`) — title "Check your email", description "We sent a code
  to {email}. Enter it below." — where `{email}` is Steam's own partially-masked address string
  passed through from the backend, not something SGI has full knowledge of. Same 5-slot code input.
- **Mobile app confirmation, no code** (`guardType === 'confirmation'`) — title "Confirm this
  sign-in", description "Approve the sign-in request in your Steam Mobile app to continue." This
  variant shows **no code input at all** — just a centered loading spinner and a "Cancel" button.
  The screen sits in this waiting state until an async event resolves it (approved → success,
  denied/timed out → sign-in fails and you're bounced back to the plain form).

For the two code-entry variants (email/device), typing the 5th character enables the "Verify"
submit button (disabled below 5 characters); clicking it calls `agent_submit_guard_code` with the
entered code. Submitting shows a pending state on the Verify button and disables the code input,
but — this is a real asynchronous round trip, not a synchronous response — the form stays in this
submitting state until a separate backend event confirms the outcome, not immediately when the
request returns (the request only confirms Steam *received* the code). Three outcomes:

- **Correct** — an async success event fires, your session is written to `sessionStore`, and you're
  taken to the success spinner → `/dashboard`.
- **Incorrect** — a red `Alert` appears above the code input reading "That code wasn't correct.
  Please try again.", the input is marked invalid/re-enabled, and you can retype and resubmit
  without losing your place in the flow.
- **The whole attempt fails outright** (session expired, connection dropped, etc.) — you're bounced
  all the way back to the plain credentials/QR two-column screen with a red error alert, the same
  as a fresh sign-in failure.

Every guard-code variant has a **"Cancel"** button (secondary style) next to (or, for the
confirmation variant, below) the primary action — this is the only way out once you're in the
guard-code phase (the fixed back-arrow button is hidden during this phase). Cancelling abandons the
in-flight attempt and returns you to the plain form with no error shown.

## QR sign-in — right column

The right column, labeled "Or sign in with QR", shows a live QR code you scan with the Steam Mobile
app. Its lifecycle (`useAgentQrSignIn`) is lifted up to `SignInScreen` itself (not owned by the
panel component) specifically so it keeps running in the background for the screen's whole
lifetime, even while you're looking at the guard-code form for the credentials path — both methods
are genuinely concurrent, not mutually exclusive tabs.

Visible states:

- **Starting** — a centered spinner (52×52) while `agent_begin_qr_login` is requested.
- **Challenge showing** — a white-background rounded panel containing the actual QR code
  (`QRCodeSVG`, 176px), with the instruction text "Use the Steam Mobile app to sign in via QR code."
  below it. Steam rotates this challenge roughly every 20-30 seconds until scanned; each rotation
  silently replaces the rendered code with a fresh one — you never see an explicit "expired, refresh
  manually" moment for an ordinary rotation.
- **Error** — the QR graphic disappears entirely (no placeholder box), replaced by a red `Alert`
  with the error description, and a small "Try again" button appears below it. Clicking it restarts
  the whole QR attempt from scratch (`agent_begin_qr_login` again).
- **Success** — handled the same way as the credentials path: the whole card is replaced by the
  shared success spinner and you're redirected.

**An un-scanned/expired QR code is retried automatically once, silently, before ever showing you an
error.** If the QR attempt times out (Steam's own poll returning "Expired", or the underlying
connection dropping before Steam replies), SGI waits 8 seconds and then silently starts a brand-new
QR attempt — you'll just see the panel briefly reset to the starting spinner and then show a fresh
code, mirroring how Steam's own web sign-in page quietly reissues an unscanned code rather than
making you notice and dismiss an error. This auto-retry only happens **once** per screen visit (a
successful challenge render resets the budget); a second consecutive timeout falls through to the
visible error + manual "Try again" state described above. (This one-retry cap and 8-second delay are
a deliberate rate-limit safeguard — retrying immediately and repeatedly was found to trip Steam's
own login rate limiter, which then also blocked the real Steam client.)

**If you explicitly tap "Deny" in the Steam Mobile app** (for either the QR scan or a device/email
guard-code confirmation), that is never auto-retried — you get the red alert "Sign-in request denied
in the Steam Mobile app. Please try again." immediately, since that's a deliberate choice you made,
not a timeout.

Navigating away from `SignInScreen` (clicking back, or the screen unmounting after a successful
sign-in via either method) cancels any still-pending QR attempt on the backend
(`agent_cancel_qr_login`) so it doesn't keep running invisibly.

## Error messages you can see

Both the credentials form and the QR panel show errors through the same red `Alert` styling, with
copy resolved by a shared error-code mapper (`errorMessageKey.ts`). Recognized cases:

- **Wrong username or password** (Steam reports `logon_failed:InvalidPassword` or
  `logon_failed:AccountLogonDenied` — the latter also covers an unrecognized username, since Steam
  deliberately doesn't distinguish the two to avoid leaking whether an account exists) — "Incorrect
  username or password."
- **Denied in the Steam Mobile app** (a SteamKit2 result of `FileNotFound` from either the QR poll
  or a device/email confirmation poll) — "Sign-in request denied in the Steam Mobile app. Please try
  again."
- **The SteamUtility component itself is missing** from this install — "The Steam agent component is
  missing from this installation."
- **The SteamUtility process couldn't be started** — "Couldn't start the Steam agent process."
- **The SteamUtility process closed unexpectedly** mid-attempt — "The Steam agent process closed
  unexpectedly."
- **Steam took too long to respond** to the request — "Steam took too long to respond. Please try
  again."
- **Any other/unrecognized error code** — a generic fallback: "Something went wrong signing in.
  Please try again. ({{code}})" — the raw error code is always shown in parentheses so an
  unmapped/unexpected failure is never silently swallowed with no detail at all.

## What a successful sign-in actually does

On either path's success, the frontend writes `{ mode: 'agent', username }` into `sessionStore` via
`setAccount` (username normalized: trimmed and lowercased, matching the backend's own account-key
normalization) — this is what makes the account "signed in" from the rest of the app's perspective,
and is the same store every other feature reads to know which account is active. `sessionStore`
also persists this account to `localStorage` as a *candidate* to resume on the next app launch (not
blindly trusted — re-validated against the real backend on every startup). Both `useAgentSignIn` and
`useAgentQrSignIn` write to this store independently on their own success path. Immediately after,
`SignInScreen` navigates to `/dashboard` (the Games page).

## Reused inside "Add another account" (account switcher)

This exact same flow — `SignInLanding` → `CredentialsForm`/`GuardCodeForm`/`QrSignInPanel`, backed
by the same `useAgentSignIn`/`useAgentQrSignIn` hooks — is reused unmodified inside
`AddAccountModal` (`src/features/account-switcher/components/AddAccountModal.tsx`), reached via
"+ Add another account" in the account switcher popover, for signing a second/third/etc. agent-mode
account into the app alongside whatever's already signed in. The full click-by-click detail of that
entry point, its concurrent-account tier cap, and its post-add toast/navigation behavior is covered
in `ai-corpus/ui-guides/account-switcher.md` — only the differences from the standalone screen
described above are summarized here:

- The Terms of Service/Privacy Policy acknowledgment footer is hidden (only shown once, on the very
  first sign-in).
- Credentials and QR are stacked vertically (one above a divider above the other) instead of side by
  side, since the modal is a narrower vertical context.
- Before you can even reach the credentials/QR screen, the "Steam Sign-in" button on the embedded
  landing card can itself be tier-gated by how many agent-mode accounts you already have signed in
  concurrently: **1 for Free, 3 for Casual, 10 for Gamer** (Gamer's 10 is a sanity-capped ceiling on
  what's marketed as "unlimited," not a literal implementation limit) — verified directly against
  `maxConcurrentAgentAccounts` in `src/shared/utils/subscriptionAccess.ts`. Hitting Gamer's own
  ceiling makes the button a genuine native-disabled control (no upgrade would help); hitting a
  lower Free/Casual cap instead keeps the button real and clickable with a "GAMER" tier badge,
  rerouting to the upgrade modal on click — the standard non-disabled tier-gating pattern used
  throughout the app. This cap only applies to Steam Sign-in accounts; a Legacy Sign-in (CLI-mode)
  account never counts against it, since that mode has its own separate one-account ceiling.
  On the very first, initial sign-in (the standalone screen this file otherwise describes, reached
  from `/` before any account exists yet), no such cap applies at all — every tier's cap is at least
  1, so the first account you ever add is always allowed regardless of tier.
- On success, the modal shows a spinner, then closes itself, shows a "Added {name}" success toast,
  and navigates to `/dashboard` — the newly added account automatically becomes the active one.

## Sign-in-mode differences worth knowing from this screen

Per `get-started/how-to-sign-in.mdx`'s comparison table, choosing Steam Sign-in here (vs. Legacy
Sign-in) means: no local Steam client is ever required; you can have multiple accounts signed in
and running automation at once (see the reuse section above); but you **cannot play games locally
while idling** through this account (Legacy Sign-in's local-client idling lets Steam show you as
"in-game" while you're actually playing something else — Steam Sign-in's daemon-backed idling has
no such local process to piggyback on). Every other feature (Card Farming, Achievement Unlocker,
Achievement Manager, Inventory Manager, Idling, Automatic Idler, Favorites) behaves the same
regardless of which method you signed in with. Separately, some Game Coordinator titles (Team
Fortress 2, Dota 2, CS2, Left 4 Dead 2, Portal 2) aren't supported through the Steam Sign-in/daemon
path at all — that's a capability gap of the sign-in method itself, not something this screen
controls or warns about directly.

## Linux: a real, sign-in-blocking dependency

On Linux, Steam Sign-in is the *only* sign-in method available at all (Legacy Sign-in has no local
Steam client concept on Linux and its button is hidden entirely on the landing screen) — so a
failure to sign in on Linux is worth diagnosing carefully rather than assumed to be bad credentials.
SGI needs a working OS keyring (freedesktop Secret Service) to securely store your Steam Sign-in
token; this is preconfigured on most desktop environments, but if it's missing, not running, or
locked for your session, sign-in can fail outright, or you can later see "Your Steam session isn't
active anymore. Please sign in again." even after a prior successful sign-in. Per the docs'
troubleshooting entry for this (`troubleshooting.mdx`, anchor `linux-keyring-secret-service`): GNOME
desktops need `gnome-keyring` installed (usually automatic); KDE Plasma needs KWallet enabled in
System Settings; minimal window managers (Sway, i3, Hyprland, etc.) need a keyring installed and set
to autostart with the session; Bazzite/handheld-console-style distros need sign-in attempted from
Desktop Mode, not Gaming Mode, since Gaming Mode's session doesn't reliably support the keyring.
Already installed but still failing usually means the keyring is present but locked/not running for
the current session (unlock it via your desktop's "Passwords and Keys"/KWallet Manager app, or note
that an auto-login user with no login password can't auto-unlock it and must unlock it manually each
session) — this is not something SGI itself can fix or detect from inside the app.
