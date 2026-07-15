// Maps a stable AppError code (src-tauri/src/error.rs::AppError::code) to a docs anchor worth a
// toast's "Learn more" link. Only codes where `main`'s Toasts.tsx had a real, still-applicable
// anchor and a matching error code exists in this rewrite - no invented URLs, no codes without a
// real rewrite equivalent (e.g. main's "account mismatch"/"no games" toasts have no matching
// AppError code today and are deliberately left out).
const ERROR_DOCS_HREFS: Record<string, string> = {
  steam_community_session_expired:
    'https://steamgameidler.com/docs/faq#error-messages:~:text=Card%20farming%20credentials%20need%20to%20be%20updated%20in%20%E2%80%9Csettings%20%3E%20general%22',
  steam_community_session_failed:
    'https://steamgameidler.com/docs/faq#error-messages:~:text=Incorrect%20card%20farming%20credentials',
  market_price_rate_limited:
    'https://steamgameidler.com/docs/faq#:~:text=Rate%20limited%20when%20fetching%20card%20prices',
}

export const errorDocsHref = (code: string) => ERROR_DOCS_HREFS[code]
