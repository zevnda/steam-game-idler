// Exact-match only (no fuzzy matching) - maps a feature/highlight label used on a supported-games
// page to the real docs page that covers it, so only labels we're sure have a matching page get
// linked. Titles that don't appear here (e.g. game-specific flavor like "No Manual Babysitting")
// just render as plain text.
export const FEATURE_DOCS_LINKS: Record<string, string> = {
  'Card Farming': '/docs/features/card-farming',
  'Achievement Manager': '/docs/features/achievement-manager',
  'Achievement Unlocker': '/docs/features/achievement-unlocker',
  'Achievement Tracking': '/docs/features/achievement-manager',
  'Favorites': '/docs/features/favorites',
  'Favorites & Auto-Idle': '/docs/features/favorites',
  'Auto-Idle': '/docs/features/auto-idle',
  'Auto-Idle Scheduling': '/docs/features/auto-idle',
  'Idling & Playtime': '/docs/features/idling',
  'Passive Playtime': '/docs/features/idling',
  'Multi-Game Idling': '/docs/features/idling',
  'Multi-Game Sessions': '/docs/features/idling',
  'Lightweight Idling': '/docs/features/idling',
  'Idle Multiple Accounts': '/docs/get-started/multi-account',
  'Multi-Account Idling': '/docs/get-started/multi-account',
  'Sign-in Method': '/docs/get-started/how-to-sign-in',
}

export function getFeatureDocsLink(label: string) {
  return FEATURE_DOCS_LINKS[label]
}
