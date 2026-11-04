// Maps a stable AppError code (src-tauri/src/error.rs::AppError::code) to a docs anchor worth a
// toast's "Learn more" link. Only codes where `main`'s Toasts.tsx had a real, still-applicable
// anchor and a matching error code exists in this rewrite - no invented URLs, no codes without a
// real rewrite equivalent (e.g. main's "account mismatch"/"no games" toasts have no matching
// AppError code today and are deliberately left out).
const ERROR_DOCS_HREFS: Record<string, string> = {
  steam_community_session_expired:
    'https://steamgameidler.com/docs/faq#error-messages:~:text=Your%20Steam%20Community%20session%20has%20expired',
  steam_community_session_failed:
    'https://steamgameidler.com/docs/faq#error-messages:~:text=Couldn%27t%20sign%20in%20to%20Steam%20Community',
  market_price_rate_limited:
    'https://steamgameidler.com/docs/faq#error-messages:~:text=Steam%20is%20rate%2Dlimiting%20price%20lookups',
  family_view_restricted:
    'https://steamgameidler.com/docs/faq#error-messages:~:text=Family%20View%20is%20enabled%20on%20your%20Steam%20account',
}

export const errorDocsHref = (code: string) => ERROR_DOCS_HREFS[code]
