<!-- url: https://steamgameidler.com/docs/settings/subscription -->
# Settings: Subscription tab

Generated corpus content (see `.claude/skills/generate-ui-guide/SKILL.md`) — the single merged
source for the Settings modal's Subscription tab: its status display, billing-portal link, and
license-key activate/copy/clear/transfer flow. Verified against
`src/features/settings/components/SubscriptionSettingsTab.tsx`,
`src/features/settings/hooks/useSubscriptionSettings.ts`,
`src/shared/hooks/useCheckSubscription.ts`, `src/shared/stores/subscriptionStore.ts`,
`src/shared/utils/subscriptionApi.ts`, `src/shared/utils/subscriptionAccess.ts`,
`src/shared/hooks/useBanners.ts`, `src/shared/components/Banner.tsx`,
`src-tauri/src/subscription.rs`, and `docs/.../settings/subscription.mdx`. Regenerate via that
skill when any of those change — don't hand-edit this file to patch small drift.

**Boundary with `go-pro-modal.md`**: this file covers *managing* a subscription that's already
active (or being entered via a license key) from inside the Settings modal — status, billing
portal, license-key activation/transfer. It does **not** cover choosing a tier, comparing
Casual/Gamer features, or the checkout/payment flow itself (Stripe/PayPal purchase buttons, the
tier-comparison table) — that's `GoProModal`, the titlebar "GO PRO" surface, covered separately in
`ai-corpus/ui-guides/go-pro-modal.md`. This file's "Upgrade" section below only says that the
button opens that other modal — it does not restate what's inside it.

## Where this tab lives and how to get to it

Settings → Subscription is the second tab in the Settings modal's left-hand tab list, immediately
after General (before Customization, Steam Credentials, Card Farming, Achievement Unlocker,
Inventory Manager, Free Games, Game Settings, Keybinds, Debug — `SettingsModal.tsx`'s `TABS`
array). Open the Settings modal from the gear icon in the Sidebar or from any feature's own
settings-gear button via `settingsModalStore.open('subscription')`. The Sidebar's gear button calls
plain `open()` with no tab argument — since `close()` always resets `activeTab` back to `'general'`
(`settingsModalStore.ts`), that button in practice opens on **General** every time, not "whichever
tab was last active" as an earlier version of this note claimed; the tab only stays on Subscription
if the modal is still open and something else (e.g. a feature's own settings-gear button) explicitly
targets this tab. See `ai-corpus/ui-guides/settings-general.md`'s "Opening the Settings modal"
section for the full write-up of that mechanic.

This tab has no settings *file* backing it — unlike most other Settings tabs (which load a
draft-and-save struct from a JSON file), every value shown here comes live from `subscriptionStore`
(kept current for the session's lifetime by `useCheckSubscription`, mounted in `DashboardShell`)
plus this tab's own `useSubscriptionSettings` hook for the manual license-key actions. There is
nothing to "Save" on this tab — every action (activate, clear, copy, manage) takes effect
immediately.

## Subscription status row

The top row is titled "Subscription status" with description "Your current plan and billing
details." (`dashboard.settings.subscription.status.title`/`.description`). What it shows depends
on `subscriptionStore.isSubscribed`:

- **Still resolving** (`isSubscribed === null`, i.e. the first live check hasn't returned yet):
  the row renders nothing on the right side at all — no flash of "Inactive" before the real state
  is known.
- **Not subscribed** (`isSubscribed === false`): a single muted line reading "Inactive"
  (`dashboard.settings.subscription.status.inactive`). No billing email, no renewal date, no
  buttons — none of that renders when there's no active subscription.
- **Subscribed** (`isSubscribed === true`): several stacked, right-aligned pieces appear top to
  bottom:
  1. A `TierBadge` showing "Casual" or "Gamer" (gradient pill — blue for Casual, purple for
     Gamer), reflecting `subscriptionStore.subscriptionTier`.
  2. The billing email, shown only if `subscriptionDetails.email` is present — plain muted text,
     no label in front of it.
  3. A renewal or cancellation line, shown only if `subscriptionDetails.currentPeriodEnd` is
     present: "Renews on {date}" in muted color normally, or "Cancels on {date}" in the danger
     (red) color if `subscriptionDetails.cancelAtPeriodEnd` is true. The date is formatted via
     `toLocaleDateString` with `{ year: 'numeric', month: 'long', day: 'numeric' }` (e.g. "January
     15, 2027") in the user's system locale.
  4. A row of one or two buttons — see the next two sections.

`subscriptionDetails` (email, currentPeriodEnd, cancelAtPeriodEnd, status, paymentProvider) comes
straight from the licensing API's response fields (`email`, `current_period_end`,
`cancel_at_period_end`, `status`, `payment_provider`) via `applySubscriptionResult` in
`subscriptionApi.ts` — the same mapping function both the periodic background check
(`useCheckSubscription`, every 3 hours) and this tab's own manual activate/transfer actions call,
so status shown here is never stale relative to what a fresh check would show once either one
resolves.

**Grandfather clause affecting the tier badge**: `applySubscriptionResult` (in `subscriptionApi.ts`)
checks the API response's `created_at` field against a hardcoded cutoff, `GRANDFATHER_CUTOFF =
new Date('2026-04-10')` (`src/shared/utils/subscriptionAccess.ts`). Any subscriber whose
subscription was created before that date is shown as **Gamer** here regardless of what plan/tier
string the API actually returns — this is why a long-time subscriber paying for what they believe
is a Casual plan can correctly see a purple "Gamer" `TierBadge` in this row: it isn't a bug, it's
this deliberate legacy-grandfathering rule. A subscription created on/after the cutoff always shows
its real reported tier (`casual` or `gamer`, or `null`/no badge if the API's `tier` field is missing
or unrecognized — an ambiguous response never defaults toward granting access).

## "Upgrade" button

Only rendered when `subscriptionStore.isSubscribed` is true **and** `subscriptionTier === 'casual'`
— never shown to a Gamer-tier subscriber (already the top tier) or to a non-subscriber (they get
"GO PRO" in the titlebar instead, not this button). It's a small rounded secondary-style button
labeled "Upgrade" (`dashboard.settings.subscription.status.upgrade`), sitting to the left of the
"Manage subscription" button. Clicking it calls `proModalStore.openWithTier('gamer')` — this closes
nothing and simply opens `GoProModal` pre-scrolled/highlighted to the Gamer tier card, exactly like
any other gated-feature upsell in the app. What that modal shows (tier comparison, pricing,
Stripe/PayPal purchase buttons) is out of scope for this file — see `go-pro-modal.md`.

## "Manage subscription" button

Rendered whenever `isSubscribed` is true, regardless of tier — a filled/primary-style rounded
button reading "Manage subscription" with a small external-link icon (`TbExternalLink`) immediately
after the text. Clicking it calls `openExternalLink` (which opens the URL in the user's default
system browser via the Tauri `opener` plugin, not inside the app) pointed at one of two hardcoded
billing-portal URLs depending on `subscriptionDetails.paymentProvider`:

- `paymentProvider === 'paypal'` → `PAYPAL_BILLING_URL`
  (`https://www.paypal.com/myaccount/autopay/`)
- anything else (including `stripe` or an unset/unknown value) → `STRIPE_BILLING_URL`
  (`https://billing.stripe.com/p/login/8x23cwf8CeNE6PLaAecbC00`)

So the button is a single unified control from the user's point of view — it always says "Manage
subscription" regardless of provider — but it silently routes to a different portal underneath
based on how the user actually paid. In the portal itself the user can update payment details,
view invoices, or cancel — none of that happens inside the app; if `openExternalLink` fails (no
default browser registered, malformed URL) the failure is only logged to the console, not
surfaced as a toast or error to the user.

## License key section — activation (no key currently stored)

Below the status row is a second row titled "License key" with description "Activate a license key
to unlock Pro features on this device." (`dashboard.settings.subscription.licenseKey.title`/
`.description`). When no license key is stored on this device (`localStorage`'s `licenseKey` entry
is empty — `useSubscriptionSettings`'s `storedKey` is `null`), this row shows:

- A text input with placeholder "Enter your license key"
  (`dashboard.settings.subscription.licenseKey.placeholder`), disabled while an activation is in
  flight.
- An "Activate" button (`dashboard.settings.subscription.licenseKey.activate`) below the input,
  disabled whenever the input is empty/whitespace-only, and showing a pending/spinner state while
  activating.

Pressing Enter in the input while it has focus also triggers activation (same as clicking
Activate) — no need to click the button specifically.

**A license key can appear here without ever being pasted, for legacy subscribers.**
`useCheckSubscription`'s periodic background check (every 3 hours, mounted for the session's
lifetime in `DashboardShell` — a separate code path from this tab's own manual `activate()`) POSTs
`{steamId, deviceFingerprint}` instead of a license key whenever `localStorage`'s `licenseKey` entry
is empty. If the API recognizes that Steam ID as a subscriber from before license keys existed and
returns a `licenseKey` field in its response, that key is silently written to `localStorage` right
then (a one-time migration, not something this tab's UI drives). So a legacy Steam-ID-based
subscriber who opens this tab may find the "already activated" masked-key layout (see next section)
showing on their very first visit, despite never having pasted or activated anything themselves —
this is expected migration behavior, not a sign of unauthorized activation.

**What happens on Activate**: the app calls `get_device_fingerprint` (a Tauri command that resolves
a device identifier for this install), then POSTs `{ licenseKey, deviceFingerprint }` to the
licensing API
(`https://api.steamgameidler.com/api/subscriptions`). Three outcomes:

1. **Success** — the API returns a `results` object with a truthy `status`. The key is saved to
   `localStorage` under `licenseKey`, the input clears, `subscriptionStore` updates immediately
   (tier badge, status, everything above reflects the new subscription without waiting for the
   next periodic check), a success toast reads "License key activated"
   (`dashboard.settings.subscription.licenseKey.activated`), and this row switches to the
   already-activated layout described in the next section.
2. **Already activated elsewhere** — the API responds with `error: 'already_activated'`. Nothing
   is saved yet; instead the transfer-confirmation dialog opens (see below) so the user must
   explicitly confirm before the key moves to this device.
3. **Any other failure** (missing/falsy `results.status`, a network/parse error) — a danger toast
   reads "Couldn't activate this license key. Check that it's correct and try again."
   (`dashboard.settings.subscription.errors.activationFailed`). The input is left as-is so the user
   can retry.

## License key section — already activated (a key is stored)

When a license key is already stored on this device, the same "License key" row instead shows:

- A read-only, password-masked text field displaying the stored key (type="password", so it
  renders as dots/asterisks, not the literal key characters).
- Two secondary-style buttons beneath it: **"Copy"** (with a copy icon, `TbCopy`) and **"Clear"**
  (text only).

**Copy** copies the real (unmasked) key string to the clipboard via
`navigator.clipboard.writeText` and shows a success toast "License key copied"
(`dashboard.settings.subscription.licenseKey.copied`). It does nothing if there's somehow no
stored key (defensive guard, not reachable through normal UI since this button only renders when
a key exists).

**Clear** removes the `licenseKey` entry from `localStorage`, clears the local `storedKey` state
(the row immediately switches back to the empty-input/Activate layout), and calls
`clearSubscription()` — which sets `subscriptionStore.isSubscribed` to `false` (not `null`) and
wipes `subscriptionTier`/`subscriptionDetails`, i.e. this device now shows as unsubscribed
everywhere in the app. Clearing does **not** cancel or affect the subscription itself on the
billing side — it only deactivates PRO access on this one device; the same key can be re-activated
here or on any other device later. Clearing requires no confirmation dialog — it's immediate on
click.

## Transfer-confirmation dialog

Triggered only by the "already activated elsewhere" outcome of pressing Activate (see above) — it
is a real `AlertDialog` overlay rendered by `SubscriptionSettingsTab`, not a toast. Exact copy,
pulled verbatim from `en-US.json`:

- **Heading**: "Transfer this license key?"
- **Body**: "This license key is already active on another device. Activating it here will
  deactivate it there."
- **Footer buttons**: "Cancel" (secondary style, on the left) and "Continue" (primary style, on
  the right).

Clicking **Cancel** (or dismissing the dialog, e.g. clicking the backdrop) discards the pending key
— nothing is saved, the license-key row stays in its empty/input state exactly as before, and the
user would need to press Activate again to retry.

Clicking **Continue** re-POSTs the same request with `forceTransfer: true` added, shows a pending
state on the Continue button while the request is in flight, and on success: saves the key to
`localStorage`, updates `subscriptionStore` immediately, clears the input, and shows the same
"License key activated" success toast as a normal first-time activation. On failure it shows the
same "Couldn't activate this license key..." danger toast as a normal activation failure. Either
way, the dialog closes once the request settles.

**Domain fact** (from `docs/.../pro.mdx`'s "Transferring to a New Device" FAQ, not visible in the
component code itself): transferring a key to a new device takes effect immediately — the
subscription becomes active on the new device right away, and the previous device loses PRO access
on its *next launch* (not instantly while it's still running). Reinstalling the app on the **same**
machine does not trigger this transfer dialog at all — the device is recognized by its existing
hardware ID, so the key reactivates silently with no prompt.

## Cross-feature connections

- **`subscriptionStore`** (`src/shared/stores/subscriptionStore.ts`) is both read and written here.
  Read: `isSubscribed`, `subscriptionTier`, `subscriptionDetails` drive everything in the status
  row. Written: every successful activate/transfer/clear action updates it immediately (via
  `applySubscriptionResult`/`clearSubscription`, the same helpers `useCheckSubscription`'s
  3-hour background poll uses), and also persists a cache snapshot to `localStorage`
  (`persistSubscriptionCache`) so the next app launch shows the correct tier on first paint before
  the live check resolves. This store is read by nearly every tier-gated control across the whole
  app (Sidebar's tier pill, every `hasCasualAccess`/`hasGamerAccess` check, `GoProModal`), so
  activating/clearing a key here has app-wide, immediate effect — not scoped to this tab.
- **`proModalStore`** — the "Upgrade" button is this tab's only connection to it, via
  `openWithTier('gamer')`. This tab never opens `proModalStore` any other way (no plain "GO PRO"
  entry point lives inside Settings; that's the titlebar's job).
- **Subscriptions are device-wide, not Steam-account-scoped** — the license key lives in
  `localStorage`, independent of which Steam account(s) are signed in. Signing out of every Steam
  account resets `subscriptionStore.isSubscribed` back to `null` (unknown/not-yet-checked) rather
  than `false`, specifically so a returning sign-in doesn't flash "Inactive" before the check
  re-runs — but a subscription itself is never tied to or lost by signing out of a Steam account.
- **Revocation**: `useCheckSubscription`'s periodic check (every 3 hours, not something this tab
  triggers) can receive `revoked: true` from the API, in which case the app force-quits via the
  `quit_app` Tauri command — this isn't something visible from this Settings tab itself, but
  explains "why did the app just close" if a subscription/license key is revoked server-side while
  the app is running.
- **Past-due payment banner** (`src/shared/components/Banner.tsx` + `src/shared/hooks/
  useBanners.ts`, rendered by `DashboardShell` as permanent chrome, not owned by this tab): whenever
  `subscriptionDetails.status === 'past_due'`, a red/danger banner slides in at the very bottom of
  the screen reading "Your PRO subscription is past due. Please update your payment method to avoid
  losing access." with a white "Manage Subscription" button. That button routes through the exact
  same `paymentProvider`-based Stripe-vs-PayPal URL selection this tab's own "Manage subscription"
  button uses — it's the same billing portal, just surfaced as an app-wide alert instead of requiring
  the user to open Settings first. The banner is dismissible for the current session only (it
  reappears next launch if still past-due) and never competes with the unrelated remote promo
  banner that shares the same bottom-of-screen slot — only one of the two ever shows at once, and
  the past-due alert always wins that priority check.
- **No tier gate on this tab itself** — the Subscription tab and every control on it (viewing
  status, activating/copying/clearing a key, opening the billing portal) is available to every
  user regardless of current tier, including free-tier users with no subscription at all (they
  just see "Inactive" and the license-key activation input).

## Docs page correspondence

`docs/.../settings/subscription.mdx` ("Subscription Settings") matches the component's actual
behavior closely — no stale content found. It documents the same three pieces covered above
(status/manage/upgrade, license key activate/copy/clear, and the transfer-confirmation note) and
links to `/docs/pro#faq` for the fuller "Transferring to a New Device" walkthrough, which is where
the same-machine-reinstall/hardware-ID behavioral fact above was sourced from — that FAQ section
also covers "How to Cancel PRO Subscription" (paste-license/subscribe purchase flow, switching
tiers), which belongs to `go-pro-modal.md`'s territory, not this file.
