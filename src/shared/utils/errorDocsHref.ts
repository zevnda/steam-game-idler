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
  // Local Sign-in's local Steam client states - see LOCAL_STEAM_ERROR_KEYS. Each fragment is the
  // start of the matching FAQ entry's title, which is the app's exact message.
  steam_not_running:
    'https://steamgameidler.com/docs/faq#error-messages:~:text=Steam%20isn%27t%20running',
  steam_not_ready:
    'https://steamgameidler.com/docs/faq#error-messages:~:text=Steam%20is%20open%20but%20isn%27t%20signed%20in%20yet',
  steam_client_outdated:
    'https://steamgameidler.com/docs/faq#error-messages:~:text=Your%20Steam%20client%20is%20out%20of%20date',
  game_not_owned:
    'https://steamgameidler.com/docs/faq#error-messages:~:text=The%20Steam%20account%20signed%20in%20on%20this%20PC%20doesn%27t%20own%20this%20game',
  steam_game_unavailable:
    'https://steamgameidler.com/docs/faq#error-messages:~:text=Steam%20wouldn%27t%20load%20this%20game%20right%20now',
}

export const errorDocsHref = (code: string) => ERROR_DOCS_HREFS[code]
