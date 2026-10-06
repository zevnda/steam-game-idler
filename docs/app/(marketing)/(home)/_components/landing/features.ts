// The landing page's feature list - the single source for the showcase playground's feature
// picker, the bento grid's "Try it live" buttons, and which mock-app page + camera pose each
// feature shows. Pure data: must never import three.js (the page's main bundle uses it).
//
// Copy stays honest: real claims from the README/docs only, real UI wording, fictional games.

import type { PageId, Pose } from './showcase/engine/types'

export type FeatureId =
  | 'games'
  | 'card-farming'
  | 'achievement-unlocker'
  | 'achievement-manager'
  | 'playtime'
  | 'inventory'
  | 'free-games'

export interface Feature {
  id: FeatureId
  page: PageId
  name: string
  /** short label for the phone layout's feature grid */
  short: string
  /** one sentence for the playground panel */
  summary: string
  href: string
  /** accent colour (the same per-feature hues the old features section used) */
  accent: string
  /** subtle per-feature framing inside the playground, so switching feels alive */
  pose: Pose
}

export const FEATURES: Feature[] = [
  {
    id: 'games',
    page: 'games',
    name: 'Your Games',
    short: 'Games',
    summary:
      'Your whole Steam library in one place, with idling and achievements one click away from every game.',
    href: '/docs',
    accent: '#a3a3a3',
    pose: { focus: [730, 440], zoom: 1, rx: 3, ry: -5 },
  },
  {
    id: 'card-farming',
    page: 'cardFarming',
    name: 'Card Farming',
    short: 'Card Farming',
    summary:
      'Farms the trading card drops left in your library automatically, up to 32 games at once. Sell the cards or craft them into badges.',
    href: '/docs/features/card-farming',
    accent: '#60a5fa',
    pose: { focus: [740, 440], zoom: 1, rx: 3, ry: -6 },
  },
  {
    id: 'achievement-unlocker',
    page: 'achievementUnlocker',
    name: 'Achievement Unlocker',
    short: 'Unlocker',
    summary:
      'Works through a queue of games, waiting a random, human-like delay between every unlock.',
    href: '/docs/features/achievement-unlocker',
    accent: '#c084fc',
    pose: { focus: [760, 450], zoom: 1, rx: 2, ry: -4 },
  },
  {
    id: 'achievement-manager',
    page: 'achievementManager',
    name: 'Achievement Manager',
    short: 'Achieve­ments',
    summary: 'Unlock, lock and edit stats for any game you own, then apply every change in one go.',
    href: '/docs/features/achievement-manager',
    accent: '#f0abfc',
    pose: { focus: [740, 460], zoom: 1, rx: 3, ry: -7 },
  },
  {
    id: 'playtime',
    page: 'idling',
    name: 'Playtime Booster',
    short: 'Playtime',
    summary:
      'Farm Steam hours on up to 32 games at once, grouped by whichever feature started them.',
    href: '/docs/features/playtime-booster',
    accent: '#fb923c',
    pose: { focus: [740, 440], zoom: 1, rx: 4, ry: -5 },
  },
  {
    id: 'inventory',
    page: 'inventory',
    name: 'Inventory Manager',
    short: 'Inventory',
    summary:
      'Browse your Steam inventory and list items on the Community Market without opening a browser.',
    href: '/docs/features/inventory-manager',
    accent: '#34d399',
    pose: { focus: [740, 440], zoom: 1, rx: 3, ry: -6 },
  },
  {
    id: 'free-games',
    page: 'freeGames',
    name: 'Free Games',
    short: 'Free Games',
    summary: 'Get notified the moment a game goes free on Steam, and claim it in one click.',
    href: '/docs/features/free-games',
    accent: '#facc15',
    pose: { focus: [720, 440], zoom: 1, rx: 2, ry: -5 },
  },
]

export const featureById = (id: FeatureId) => FEATURES.find(f => f.id === id) ?? FEATURES[0]

/**
 * Which feature a mock-app page belongs to, so navigating *inside* the 3D app highlights the
 * matching feature in the picker: Favorites is part of the library, the Automatic Idler part of
 * the Playtime Booster.
 */
export function featureForPage(page: PageId) {
  if (page === 'favorites') return 'games'
  if (page === 'autoIdle') return 'playtime'
  return FEATURES.find(f => f.page === page)?.id ?? null
}
