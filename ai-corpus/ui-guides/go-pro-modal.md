<!-- url: https://steamgameidler.com/pro -->
# Go Pro Modal (Upgrade / Tier Comparison)

This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/shared/components/pro/GoProModal/` component source (`index.tsx`, `TierCard.tsx`,
`ComparisonTable.tsx`, `FeatureCard.tsx`, `FAQItem.tsx`, `SectionHeading.tsx`,
`BackgroundEffects.tsx`, `data.ts`, `types.ts`), `src/shared/components/pro/GoPro.tsx`,
`src/shared/components/pro/AdSlot.tsx`, the `proModalStore`, `subscriptionAccess.ts`, the
`pro.mdx` docs page, and every confirmed `openWithTier(...)` call site across the app (verified
directly in `Sidebar.tsx`, `Titlebar.tsx`, `AiChatOverlay.tsx`, `AddAccountModal.tsx`,
`AccountSwitcher.tsx`, `CardFarmingSettingsTab.tsx`, `AchievementUnlockerSettingsTab.tsx`,
`AchievementOrderOverlay.tsx`, `SteamCookiesConnectPanel.tsx`, `InventoryPageHeader.tsx`,
`FreeGamesSettingsTab.tsx`, `GeneralSettingsTab.tsx`, `CustomizationSettingsTab.tsx`, and
`SubscriptionSettingsTab.tsx`). It is the single merged source for this modal (UI + docs +
cross-feature entry points) and should be regenerated via that skill whenever the modal's content,
pricing, tier features, FAQ, or any gated control's tier changes — not hand-patched for small
drift.

**Scope boundary — read this first:** this file covers the marketing/comparison/upgrade-decision
surface only: which tier to pick, what each tier includes, and how to start a purchase. It does
**not** cover managing an already-active subscription (the billing portal, license-key
activate/copy/clear, device-transfer confirmation, or cancellation) — that is the Settings modal's
Subscription tab (`SubscriptionSettingsTab.tsx`, backed by the `settings/subscription.mdx` docs
page), a separate surface reached via Settings → Subscription. If a question is about "how do I
activate my license key" / "how do I cancel" / "how do I see my invoices" / "how do I transfer my
subscription to a new device," it belongs to that other surface, not this one. This file only
mentions those flows in passing, as pointers, where the modal's own FAQ accordion happens to
reference them.

## What Steam Game Idler PRO actually is

Steam Game Idler is completely free to use, and every core feature — Card Farming, Achievement
Unlocker, Achievement Manager, Inventory Manager, Playtime Booster (manual idling), and so on — is
available to every user, including the free tier, at no cost. **PRO never paywalls a core feature
in the "requires a fee" sense** — it only unlocks automation/convenience extras and higher
concurrency caps. This fact is not shown anywhere in the modal's own UI (no callout renders it);
it comes only from the `pro.mdx` docs page (`https://steamgameidler.com/pro`), so it's worth
stating precisely for anyone unsure why a "premium" upgrade wouldn't lock out a core feature.

Steam Game Idler PRO is framed explicitly as a way to **support the app's development**, not a
paywall — the modal's own hero copy says: "SGI's core features are free, and always will be. PRO
exists purely for users who wish to support the ongoing development of SGI — the extra features
are our way of saying thank you for your support." There are two paid tiers, **Casual** and
**Gamer** (Gamer includes everything Casual has, plus more) — no other paid tiers exist.

## Where the modal opens from (entry points)

`GoProModal` is mounted once at the app root in `_app.tsx` (not inside `DashboardShell`), gated by
`proModalStore`'s `isOpen` boolean — so it can be triggered from anywhere in the app, including
before a full dashboard session exists. `proModalStore` has two ways to open it:

- **`open()`** — plain open, no tier pre-selected. The only caller is `GoPro.tsx`, the small white
  "Go Pro" pill button in the app's titlebar, rendered only when `isDashboard && isSubscribed !==
  null` (per `Titlebar.tsx`) **and** `subscriptionTier === null` — it disappears entirely once a
  user is on Casual or Gamer. Corrected from an earlier version of this file: the button itself
  has **no width-based hiding at all** — it stays visible at every window width once those
  conditions hold. Only the "Support / Steam Game Idler" two-line label to its left is
  width-gated, via a bare `xl:flex` class (Tailwind's default 1280px breakpoint, not overridden
  anywhere in this codebase) — hidden below `xl`, shown only at `xl`+. The white "GO PRO" pill
  portion is always the visible, clickable part regardless of window width. (`GlobalSearchBar`
  has its own, separate `lg`/1024px-keyed pill-vs-icon swap — a different component, not part of
  this button — so don't conflate the two breakpoints.)
- **`openWithTier(tier)`** — opens the modal and additionally auto-scrolls to and highlights one
  specific tier card (see "Auto-scroll and highlight" below). Every tier-gated control in the app
  reroutes to this instead of disabling itself — this is the single most-triggered entry point into
  the modal. Confirmed call sites, each following the same "stays a real, clickable, non-disabled
  control with a `TierBadge`" pattern documented in `frontend-architecture.md`'s tier-gating
  section:
  - **Sidebar's "Plan" row** (`Sidebar.tsx`) — clickable only when the current tier is `casual`
    (the one tier with somewhere left to upgrade to); clicking it calls `openWithTier('gamer')`.
    At `gamer` (already the max tier) and at free (`null`, where the titlebar button is the CTA
    instead) the same row renders as a static, non-interactive label.
  - **AI Assistant quota banner** (`AiChatOverlay.tsx`) — its "Upgrade" button computes the target
    tier dynamically: `openWithTier(hasCasualAccess(tier) ? 'gamer' : 'casual')`, i.e. it always
    points at the next tier up from whatever the user currently has.
  - **Add Account modal** (`AddAccountModal.tsx`) — when the agent-mode (Steam Sign-in) account cap
    is reached and the user isn't already Gamer, the "Add another account" upsell calls
    `openWithTier('gamer')`.
  - **Account switcher's own popover** (`AccountSwitcher.tsx`) — a distinct, per-row upsell from
    the Add Account modal's cap-reached upsell above: once a subscription downgrade drops the
    active tier's concurrent-agent-account allowance below the number of accounts already signed
    in, every account past the new cap (`isOverCap`, computed by `computeAllowedAccountKeys` from
    the current `accounts` map and `subscriptionTier`) renders its row at 50% opacity with a
    Gamer-tier `TierBadge` next to its sign-in-mode label. Clicking that row (instead of switching
    to it) closes the popover and calls `openWithTier('gamer')`. The account itself stays fully
    signed in and its automation keeps running while over-cap — being over-cap only blocks
    switching to it from this popover, it never forces a sign-out (matching root `CLAUDE.md`'s
    "never silently force-sign-out an existing session" rule); the row's own sign-out control is
    untouched by this gate and still works normally.
  - **Card Farming settings tab** (`CardFarmingSettingsTab.tsx`) — the "Automatic Card Farming"
    toggle is Gamer-gated; toggling it while ungated calls `openWithTier('gamer')` instead of
    enabling the setting.
  - **Achievement Unlocker settings tab** (`AchievementUnlockerSettingsTab.tsx`) — a single
    "Multiple Games" toggle is gated at Casual (`hasCasualAccess`); while ungated it renders as an
    always-off switch whose `onChange` calls `openWithTier('casual')` instead of saving. There is
    no separate Gamer-tier gate on this same toggle — once Casual, the toggle is simply usable, and
    the concurrency cap it unlocks is computed automatically from the live tier (3 games at Casual,
    32 at Gamer via `hasGamerAccess`) and shown only in the row's description text, not as a second
    upsell step.
  - **Achievement Order overlay** (`AchievementOrderOverlay.tsx`) — "Import Timings" is Gamer-gated
    (`canImportTimings = hasGamerAccess(tier)`); its upsell calls `openWithTier('gamer')`.
  - **Steam Cookies connect panel** (`SteamCookiesConnectPanel.tsx`, shared by Card Farming and
    Inventory Manager) — automatic Steam Community cookie acquisition is Gamer-gated (manually
    pasting cookies is free-tier); the upsell calls `openWithTier('gamer')`.
  - **Inventory Manager page header** (`InventoryPageHeader.tsx`) — "Sell Dupes" is Gamer-gated;
    calls `openWithTier('gamer')`.
  - **Free Games settings tab** (`FreeGamesSettingsTab.tsx`) — automatic free-game redemption is
    Gamer-gated; calls `openWithTier('gamer')`.
  - **General settings tab** (`GeneralSettingsTab.tsx`) — automatic games-list updates is
    Casual-gated, and presence/custom-idle-status settings are Gamer-gated; each upsells to its
    respective tier.
  - **Customization settings tab** (`CustomizationSettingsTab.tsx`) — non-default themes, custom
    background image, and the non-default font picker are all Casual-gated; upsells call
    `openWithTier('casual')`.
  - **Subscription settings tab** (`SubscriptionSettingsTab.tsx`) — a Casual subscriber sees an
    "Upgrade" button next to their status that calls `openWithTier('gamer')` (this is the one call
    site inside the subscription-management surface that still opens *this* modal, since upgrading
    tiers is a purchase decision, not a management action).
  - **Ad slot** (`AdSlot.tsx`) — the in-app ad placeholder shown to free-tier users carries its own
    upsell that opens the modal (ad-free is a Casual-tier benefit).

`requiredTier` resets to `null` whenever the modal closes (`proModalStore.close()`), so a stale
highlight never leaks into the next plain open.

## The hero section

The very top of the modal (no visible header bar — see "Visual presentation" below) shows:
- Small uppercase kicker text: "Steam Game Idler **PRO**" (PRO rendered in a purple-to-blue
  gradient).
- A large headline: "Unlock more features."
- Subtext (see the exact wording quoted above under "What Steam Game Idler PRO actually is").
- A white pill button reading "View PRO Tiers" with a down-arrow icon — clicking it smooth-scrolls
  the modal down to the tier-card section (the same scroll target the auto-highlight effect uses).
- Below that, small muted text: "Starting at $\{price}/month · Cancel anytime" — `{price}` is the
  live-fetched Casual-tier price (see "Live pricing" below), not a hardcoded number.

## The "All Features" bento grid

Below the hero, a `SectionHeading` labeled "All Features" introduces a responsive grid (2 columns
below `lg`, 3 columns at `lg`+, capped and centered at ~948px) of nine `FeatureCard` tiles, each a
rounded image-backed card with a title, one-line description, and a "Learn more" pill button. Every
card's "Learn more" button opens an external browser link to a specific anchor on
`https://steamgameidler.com/pro` (via `openExternalLink`, so it opens in the system default
browser, not inside the app). The nine cards, in the exact order rendered (from `data.ts`'s
`getFeatureCards`, the canonical source per project convention — this order is what must be edited
first if a feature's tier or description ever changes):

1. **Ad-Free Experience** — "Use SGI without any advertisements for a completely clean,
   distraction-free interface."
2. **Exclusive Themes** — "Customize SGI with 6 unique themes available only to PRO subscribers."
3. **Real-Time Live Support** — "Skip the queue — chat directly with the developer via the in-app
   help desk and get support in real time."
4. **Multi-Account Support** — "Sign in and manage multiple Steam accounts at the same time."
5. **Automatic Card Farming** — "SGI monitors your library and automatically starts farming any
   game that still has card drops remaining."
6. **Automatic Games List Updates** — "Your games list refreshes automatically every 15 minutes as
   you add and play games."
7. **Unlock Achievements For Multiple Games** — "Unlock achievements for several games at the same
   time in Achievement Unlocker instead of one at a time."
8. **Free Game Redemption** — "Automatically redeem free games on Steam the moment they become
   available — never miss a freebie."
9. **Sell Duplicate Items** — "Easily list all duplicate inventory items for sale with a single
   click."

Two of these cards (Exclusive Themes, Free Game Redemption) render with dark text instead of white,
since their background images are lighter — a purely cosmetic detail, not a functional difference.

## The tier cards ("Choose Your Tier")

Below a `SectionHeading` labeled "Choose Your Tier," two `TierCard`s render side by side (stacked
on narrow widths): **Casual** (blue accent, `#3b82f6`→`#38bdf8`) and **Gamer** (purple/magenta
gradient background, `#630064`→`#2f0474`, with a faint decorative sparkles icon in the top-right
corner). Both card bodies list: the tier name, price (`$\{price}/month`, live-fetched — see below),
and a bullet list of that tier's features, each with an icon. The Gamer card additionally shows
"Everything in casual, plus" above its own bullet list, since Gamer implies every Casual benefit.

**Casual card's feature bullets, in order** (from `index.tsx`'s hardcoded `features=` array passed
to `TierCard` — this must independently match `getComparisonRows`' order/content per project
convention, and was verified against the real current file for this guide):
1. 3 Concurrent Accounts
2. Unlock 3 Games At Once
3. Automatic Games List Updates
4. Ad-Free Experience
5. Exclusive Themes
6. Custom Background Image
7. Custom Fonts
8. Discord PRO Role
9. Real-Time Live Support
10. 25 AI Assistant Messages/Day
11. Cancel Anytime

**Gamer card's feature bullets, in order:**
1. 10 Concurrent Accounts
2. Unlock 32 Games At Once
3. Automatic Steam Credentials Retrieval
4. Automatic Free Game Redemption
5. Automatic Card Farming
6. Sell Duplicate Inventory Items
7. Import Achievement Unlock Timings
8. Custom Steam Status
9. 50 AI Assistant Messages/Day
10. Cancel Anytime

**Card states:**
- If the signed-in user already owns that tier or higher (`hasCasualAccess`/`hasGamerAccess`), the
  card's action area is replaced by a static "Current Plan" pill instead of payment buttons.
- Otherwise, each card shows two payment buttons side by side: a Stripe button (Stripe logo +
  "Stripe" + arrow icon, purple gradient) and a PayPal button (PayPal logo + "PayPal" + arrow icon,
  navy-to-blue gradient) — see "Payment methods" below for exactly what each does.
- The Gamer card shows a "Most Popular" badge in its top-right corner — but **only when no specific
  tier was required** to open the modal (`isMostPopular={!requiredTier}`); if a gated control
  opened the modal requiring a specific tier, the "Most Popular" badge is suppressed so it doesn't
  compete visually with the highlighted-required-tier styling.

A small decorative samurai illustration floats behind/beside the tier cards (purely visual, no
interaction). Below both cards, small muted footer text reads: "Prices displayed are in USD and
exclude taxes and currency conversion fees which may apply depending on your location and payment
method."

## Auto-scroll and highlight when opened from a gated control

When `openWithTier(tier)` is called (as opposed to the plain `open()`), two things happen once the
modal is open, after a 400ms delay (letting the modal's own open transition/layout settle first):
1. The tier-card section smooth-scrolls into view (`scrollIntoView({behavior:'smooth',
   block:'start'})`) — so the user lands directly on the pricing comparison rather than the top of
   the hero.
2. The matching `TierCard` (Casual or Gamer, whichever the gate required) gets a colored outline
   (2px solid, blue for Casual / purple for Gamer) plus a soft matching glow drop-shadow around the
   card, so the user immediately sees which plan they actually need without having to read every
   card. This is the `isRequired` prop on `TierCard`.

This is the modal's way of making "why is this locked, and what do I need" self-evident without
any extra copy — the visual highlight itself communicates the answer.

## Live pricing

Prices shown throughout the modal (hero's "starting at," both tier cards, and the comparison
table's per-tier headers) are **not hardcoded** — they're fetched once, the first time the modal is
ever opened in a session (deferred until first open, not fetched eagerly at app launch), from
`https://api.steamgameidler.com/api/pro-data`, which returns `{tierOne: {url, price}, tierTwo:
{url, price}}` (`tierOne` = Casual, `tierTwo` = Gamer). Until that fetch resolves, both prices
default to `'0'`. The `url` field in that same response is the real Stripe checkout link opened by
each tier's Stripe button. As a reference point only (verify against the live modal/site for the
current figure, since this is fetched live and can change): the `pro.mdx` docs page lists Casual at
$2/month and Gamer at $4/month, billed monthly, cancel anytime.

## The comparison table ("Compare Tiers")

Below a `SectionHeading` labeled "Compare Tiers," `ComparisonTable` renders a single grid with four
columns (feature label, Free, Casual, Gamer) and one row per comparable feature. Free and Casual
columns use plain checkmark/cross icons for a yes/no feature, or the exact string it stored in
`freeValue`/`casualValue`/`gamerValue` when the row is a quantity comparison rather than a plain
yes/no. The Gamer column is visually emphasized with a purple gradient background wash. Rows, in
exact order (from `data.ts`'s `getComparisonRows`, the canonical source per project convention —
verified against the real current file for this guide, not from memory of what the tiers
"probably" include):

| Feature | Free | Casual | Gamer |
|---|---|---|---|
| Multi-Account Support | 1 | 3 | 10 |
| Unlock Achievements For Multiple Games | 1 | 3 | 32 |
| AI Assistant messages | 3 msgs/day | 25 msgs/day | 50 msgs/day |
| Ad-Free Experience | ✗ | ✓ | ✓ |
| Exclusive Themes | ✗ | ✓ | ✓ |
| Custom Background Image | ✗ | ✓ | ✓ |
| Custom Fonts | ✗ | ✓ | ✓ |
| Discord PRO Role | ✗ | ✓ | ✓ |
| Real-Time Live Support | ✗ | ✓ | ✓ |
| Automatic Games List Updates | ✗ | ✓ | ✓ |
| Automatic Steam Credentials Retrieval | ✗ | ✗ | ✓ |
| Automatic Free Game Redemption | ✗ | ✗ | ✓ |
| Automatic Card Farming | ✗ | ✗ | ✓ |
| Sell Duplicate Inventory Items | ✗ | ✗ | ✓ |
| Import Achievement Unlock Timings | ✗ | ✗ | ✓ |
| Custom Steam Status | ✗ | ✗ | ✓ |

Below the table, a "Learn more about each feature" pill button opens an external browser link to
`https://steamgameidler.com/pro#feature-details`.

Note: "Custom Steam Status" (the presence/custom-idle-status feature) is Gamer-gated and only
applies to agent-mode (Steam Sign-in) accounts — there is no CLI-mode (Legacy Sign-in) equivalent.
The online-status picker itself (choosing Online/Away/Invisible etc.) is not gated at all, only the
custom idle-status message shown while idling is.

## The FAQ accordion

Below a `SectionHeading` labeled "FAQ," seven collapsible `FAQItem` entries render (single-open
accordion — clicking a question toggles a CSS grid-rows expand/collapse of its answer, with a
chevron that rotates 180° when open). Exact questions and answers, in order (verbatim from the live
translation strings, which is what the modal actually renders):

1. **"I purchased PRO but my subscription is not activated?"** — "After checking out, you will
   receive an email containing your license key. Open the app, go to Settings → Subscription,
   paste your license key into the input field, and click Activate. If you are still experiencing
   issues, contact us via the help desk at the top-right of the app or at
   contact@steamgameidler.com."
2. **"How do I transfer my license key to a new device?"** — "Your license key is tied to one
   device at a time. To transfer it, open the app on your new device, go to Settings →
   Subscription, enter your license key, and click Activate. A prompt will ask you to confirm the
   transfer. Once confirmed, your new device is active and the previous device loses access on its
   next launch. If you reinstalled the app on the same machine, no transfer is needed — your device
   is recognised by its hardware ID."
3. **"How do I cancel my subscription?"** — "Go to Settings → Subscription → Manage Subscription,
   and follow the cancellation prompts. After cancellation, you will retain access to PRO benefits
   until the end of your current billing period."
4. **"Can I switch between tiers?"** — "Yes. Cancel your current subscription then re-subscribe to
   your desired tier following the standard subscription process."
5. **"Where can I find invoices and receipts?"** — "You'll receive an email receipt after
   subscribing. For full billing history, go to Settings → Subscription → Manage Subscription."
6. **"What is the refund policy?"** — "PRO subscriptions are treated as donations and are generally
   non-refundable. Refunds are considered on a case-by-case basis. Contact us via the help desk at
   the top-right of the app or at contact@steamgameidler.com."
7. **"What happens if I file a chargeback?"** — "Fraudulent chargebacks significantly impact this
   small independent project. Filing one without prior communication may result in your access to
   this app being permanently revoked. If there was a billing error, we are always happy to work
   with you to get it sorted as fast as possible, so please contact us via the help desk at the
   top-right of the app or at contact@steamgameidler.com."

Questions 1–3 and 5 describe actions that happen on the Settings → Subscription tab
(`SubscriptionSettingsTab.tsx`) — that tab's own controls (license-key input, Activate/Copy/Clear
buttons, the transfer-confirmation dialog, the "Manage Subscription" button that opens the Stripe
or PayPal billing portal) are out of scope for this file; see the scope-boundary note at the top.
This modal's FAQ accordion is simply the one place those answers are also surfaced, since a user
deciding whether to subscribe often has exactly these questions before they buy.

## Payment methods

Both tier cards offer the same two payment options, verified from `TierCard.tsx`'s real handlers
(this is the live purchase flow, not a mock — do not actually complete it while testing):

- **Stripe** button (`BsStripe` icon + "Stripe" label + arrow icon) — clicking it directly opens
  (via `openExternalLink`, in the system default browser) the tier's live-fetched Stripe checkout
  URL (`priceData.tierOne.url` for Casual, `priceData.tierTwo.url` for Gamer — see "Live pricing"
  above). No in-app network call happens on click; the URL was already fetched when the modal
  opened.
- **PayPal** button (`FaPaypal` icon + "PayPal" label + arrow icon) — clicking it POSTs to
  `https://api.steamgameidler.com/api/paypal-create-subscription` with `{tier}` in the body, then
  opens the returned `url` in the system default browser. While that request is in flight the
  button shows a pending state (label changes to "Processing..." and the arrow icon disappears). If
  the request fails or returns no URL, a danger toast reading the app's "PayPal checkout error"
  message is shown instead and no browser window opens.

After completing either checkout flow, the user receives a license key by email, which they then
activate on the Settings → Subscription tab (out of scope for this file — see the scope-boundary
note at the top and FAQ item 1 above).

## Visual presentation (for context, not interactive detail)

The modal renders full-screen (`Modal.Container size='full'`) with no visible header bar or title
text — a deliberate departure from a standard modal chrome, since the design is a fully immersive,
edge-to-edge dark starfield background (procedurally generated, seeded so it's stable across
renders) with animated shooting stars and two floating decorative illustrations (a dragon and a
"pyramid head" figure). The only visible chrome is a circular close (X) button floating in the
top-left corner (`Modal.CloseTrigger`). A hidden (screen-reader-only) heading still exists so the
dialog has a real accessible name. On Linux, the ambient animations (starfield motion, shooting
stars, floating images) are suppressed (`force-reduced-motion` class) since WebKitGTK's compositor
makes them meaningfully more expensive there than on Windows' WebView2 — this is a performance
accommodation, not a feature difference; all content and interactions are identical on both
platforms.
