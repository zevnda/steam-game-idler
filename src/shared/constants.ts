// The app's own CDN for static marketing/product assets (game cover-art crops, the sign-in hero
// mockup) - distinct from Steam's own CDN hosts (see next.config.ts's `remotePatterns`), which
// serve real per-game data instead. Same bucket `main` already uses for this and other assets
// (Go Pro modal art, ad slots) - already whitelisted in next.config.ts even before this constant's
// first real consumer landed.
export const CDN_BASE_URL = 'https://pub-ca47df86597c4ccbb6ddf4366ca7f733.r2.dev'

// Billing-portal URLs for the live external subscription service, hardcoded verbatim from `main`.
// Shared by
// SubscriptionSettingsTab's "Manage" link and the past-due system banner so both point at the
// same portal for the same `paymentProvider` rather than keeping two copies in sync.
export const STRIPE_BILLING_URL = 'https://billing.stripe.com/p/login/8x23cwf8CeNE6PLaAecbC00'
export const PAYPAL_BILLING_URL = 'https://www.paypal.com/myaccount/autopay/'
