import type { IconType } from 'react-icons'
import { FaDiscord } from 'react-icons/fa6'
import {
  TbAd,
  TbAward,
  TbCards,
  TbClock,
  TbCurrencyDollar,
  TbGift,
  TbHeadset,
  TbKey,
  TbPalette,
  TbPhoto,
  TbRefresh,
  TbTypography,
  TbUserCircle,
  TbUsers,
} from 'react-icons/tb'

const CDN_BASE_URL = 'https://pub-ca47df86597c4ccbb6ddf4366ca7f733.r2.dev'

export interface Feature {
  icon: IconType
  title: string
  description: string
  detail: string
  tier: 'casual' | 'gamer'
  imgBg?: string
  darkText?: boolean
  tierLabel?: string
  id: string
  cta?: { label: string; url: string }
  // Overrides the tick/cross in the comparison table's tier columns with a literal value (e.g. an
  // account count) - for a feature both tiers get, but at a different quantity.
  casualValue?: string
  gamerValue?: string
}

export interface TierFeature {
  icon: IconType
  title: string
}

// Mirrors src/shared/components/pro/GoProModal/types.ts's ComparisonRowDef field-for-field
// (just `IconType` instead of `React.ElementType`) so a row object can be copy-pasted verbatim
// between that file's getComparisonRows and this file's comparisonRows below.
export interface ComparisonRow {
  label: string
  icon: IconType
  tier: 'casual' | 'gamer'
  casualValue?: string
  gamerValue?: string
  // Free tier's own cap for a quantity row (e.g. "1" concurrent account) - free is never a plain
  // check/cross here since it's a real, lower cap rather than "no access". Omitted for boolean
  // rows, which free genuinely doesn't have at all (shown as a cross).
  freeValue?: string
}

export const allFeatures: Feature[] = [
  {
    icon: TbAd,
    title: 'Ad-Free Experience',
    description:
      'Use SGI without any advertisements for a completely clean, distraction-free interface.',
    detail:
      'No banners, no pop-ups, no interruptions — just SGI. Every page, from your games list to the achievement unlocker, stays completely clean.',
    tier: 'casual',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro1.webp`,
    id: 'ad-free-experience',
  },
  {
    icon: TbPalette,
    title: 'Exclusive Themes',
    description: 'Customize SGI with 6 unique themes available only to PRO subscribers.',
    detail:
      'Restyle SGI with 6 hand-crafted color themes — Blue, Red, Purple, Pink, Gold, and Black. Switch between them anytime from Settings → Customization, no restart required.',
    tier: 'casual',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro2.webp`,
    darkText: true,
    id: 'exclusive-themes',
  },
  {
    icon: TbPhoto,
    title: 'Custom Background Image',
    description:
      'Personalize SGI with your own custom background image instead of the default backdrop.',
    detail:
      'Upload your own image from Settings → Customization and SGI uses it as the dashboard background instead of the default backdrop — swap it or clear it back to default anytime.',
    tier: 'casual',
    id: 'custom-background-image',
  },
  {
    icon: TbTypography,
    title: 'Custom Fonts',
    description: "Choose from a selection of custom fonts to personalize SGI's interface.",
    detail:
      'Pick from a curated set of fonts under Settings → Customization to change how SGI reads — every font is bundled with the app, so switching never needs a download.',
    tier: 'casual',
    id: 'custom-fonts',
  },
  {
    icon: FaDiscord,
    title: 'Unique Discord Chat Role',
    description: 'Stand out in the community with an exclusive Discord role for PRO subscribers.',
    detail:
      "Get a distinct role badge in the official SGI Discord server that sets you apart from other members and shows the community you're backing the project's development.",
    tier: 'casual',
    tierLabel: 'Discord PRO Role',
    id: 'unique-discord-chat-role',
    cta: { label: 'Join our Discord', url: 'https://discord.com/invite/5kY2ZbVnZ8' },
  },
  {
    icon: TbHeadset,
    title: 'Real-Time Live Support',
    description:
      'Skip the queue — chat directly with the developer via the in-app help desk and get support in real time.',
    detail:
      'Open the in-app help desk and talk to the developer directly — no ticket queues, no waiting days for an email reply. Get help in real time.',
    tier: 'casual',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro4.webp`,
    id: 'real-time-live-support',
  },
  {
    icon: TbUsers,
    title: 'Multi-Account Support',
    description: 'Sign in and manage multiple Steam accounts at the same time.',
    detail:
      'Add extra Steam accounts and switch between them without signing out — each account keeps its own idling, achievement unlocking, and card farming running independently. Casual subscribers can run up to 3 accounts at once; Gamer subscribers can run up to 10.',
    tier: 'casual',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro5.webp`,
    id: 'multi-account-support',
    casualValue: '3',
    gamerValue: '10',
  },
  {
    icon: TbKey,
    title: 'Automatic Steam Credentials Retrieval',
    description: 'Automatically retrieve your Steam credentials without any manual input.',
    detail:
      "Sign in with Steam once and SGI handles the rest — automatically capturing and refreshing the session cookies that Card Farming and Inventory Manager need, without needing to manually copy values out of your browser's dev tools.",
    tier: 'gamer',
    id: 'automatic-steam-credentials-retrieval',
  },
  {
    icon: TbCards,
    title: 'Automatic Card Farming',
    description:
      'SGI monitors your library and automatically starts farming any game that still has card drops remaining.',
    detail:
      'No need to open Card Farming and hit start — SGI continuously scans your library in the background and automatically begins farming any game that still has trading cards left to drop.',
    tier: 'gamer',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro6.webp`,
    id: 'automatic-card-farming',
  },
  {
    icon: TbRefresh,
    title: 'Automatic Games List Updates',
    description:
      'Your games list refreshes automatically every 15 minutes as you add and play games.',
    detail:
      'When you buy a new game or remove one from your library, SGI picks up the change on its own — your games list silently refreshes every 15 minutes, no manual refresh needed.',
    tier: 'casual',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro7.webp`,
    id: 'automatic-games-list-updates',
  },
  {
    icon: TbAward,
    title: 'Unlock Achievements For Multiple Games',
    description:
      'Unlock achievements for several games at the same time in Achievement Unlocker instead of one at a time.',
    detail:
      'Unlock achievements for several queued games at once in the Achievement Unlocker instead of running them one at a time. Casual subscribers can run up to 3 games concurrently; Gamer subscribers can run up to 32 — if you have more queued than that, the next game starts automatically as soon as one finishes, so your entire backlog earns achievements in parallel.',
    tier: 'casual',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro11.webp`,
    tierLabel: 'Unlock Achievement For Multiple Games',
    id: 'unlock-achievements-for-multiple-games',
    casualValue: '3',
    gamerValue: '32',
  },
  {
    icon: TbGift,
    title: 'Free Game Redemption',
    description:
      'Automatically redeem free games on Steam the moment they become available — never miss a freebie.',
    detail:
      "SGI watches for free Steam promotions around the clock and claims them to your account the moment they go live, even while you're away from your PC.",
    tier: 'gamer',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro8.webp`,
    darkText: true,
    tierLabel: 'Automatic Free Game Redemption',
    id: 'free-game-redemption',
  },
  {
    icon: TbCurrencyDollar,
    title: 'Sell Duplicate Items',
    description: 'Easily list all duplicate inventory items for sale with a single click.',
    detail:
      'Instead of pricing and listing every duplicate card, background, and emoticon by hand, one click puts all of your spares up for sale on the Steam marketplace while keeping one copy of each.',
    tier: 'gamer',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro9.webp`,
    tierLabel: 'Sell Duplicate Inventory Items',
    id: 'sell-duplicate-items',
  },
  {
    icon: TbClock,
    title: 'Import Achievement Unlock Timings',
    description:
      'Copy the exact achievement unlock order and timing delays from any public Steam profile.',
    detail:
      'Pull the exact achievement order and unlock delays from any public Steam profile, so your unlocks land with the same natural rhythm as a real play session instead of firing all at once.',
    tier: 'gamer',
    id: 'import-achievement-unlock-timings',
  },
  {
    icon: TbUserCircle,
    title: 'Custom Steam Status',
    description: 'Show a custom message to friends instead of "Playing [game]" while idling.',
    detail:
      'Available when signed in with Steam: set a custom message that replaces the default "Playing [game]" text while idling.',
    tier: 'gamer',
    id: 'custom-online-status',
  },
]

// Comparison-table rows - deliberately a separate, hand-maintained list rather than derived from
// `allFeatures` (which drives the bento grid in FeaturesSection and has its own separate narrative
// order that shouldn't be reshuffled just because a feature's `tier`/comparison position changes).
//
// This intentionally duplicates text out of `allFeatures` in exchange for matching
// src/shared/components/pro/GoProModal/data.ts's getComparisonRows field-for-field (same order,
// same shape) - when that array changes, copy its rows here and swap each `t('proMode.xxx')` call
// for the plain English string from src/i18n/locales/en-US.json. docs has no i18n, so this can
// never be a single shared source - matching shape is the next best thing.
export const comparisonRows: ComparisonRow[] = [
  {
    label: 'Multi-Account Support',
    icon: TbUsers,
    tier: 'casual',
    freeValue: '1',
    casualValue: '3',
    gamerValue: '10',
  },
  {
    label: 'Unlock Achievements For Multiple Games',
    icon: TbAward,
    tier: 'casual',
    freeValue: '1',
    casualValue: '3',
    gamerValue: '32',
  },
  { label: 'Ad-Free Experience', icon: TbAd, tier: 'casual' },
  { label: 'Exclusive Themes', icon: TbPalette, tier: 'casual' },
  { label: 'Custom Background Image', icon: TbPhoto, tier: 'casual' },
  { label: 'Custom Fonts', icon: TbTypography, tier: 'casual' },
  { label: 'Discord PRO Role', icon: FaDiscord, tier: 'casual' },
  { label: 'Real-Time Live Support', icon: TbHeadset, tier: 'casual' },
  { label: 'Automatic Games List Updates', icon: TbRefresh, tier: 'casual' },
  { label: 'Automatic Steam Credentials Retrieval', icon: TbKey, tier: 'gamer' },
  { label: 'Automatic Free Game Redemption', icon: TbGift, tier: 'gamer' },
  { label: 'Automatic Card Farming', icon: TbCards, tier: 'gamer' },
  { label: 'Sell Duplicate Inventory Items', icon: TbCurrencyDollar, tier: 'gamer' },
  { label: 'Import Achievement Unlock Timings', icon: TbClock, tier: 'gamer' },
  { label: 'Custom Idle Status Message', icon: TbUserCircle, tier: 'gamer' },
]

// Casual-then-gamer order for FeatureDetailsSection's "Every Feature, Explained" full list -
// matches comparisonRows' order above (list the same ids in the same sequence if that order ever
// changes). Unlike comparisonRows, this has no GoProModal equivalent to mirror shape-for-shape, so
// it's derived from `allFeatures` (not hand-duplicated) to keep the detail text single-sourced.
// `allFeatures`' own order is untouched and keeps driving the bento grid in FeaturesSection.
const FEATURE_DETAILS_ORDER = [
  'multi-account-support',
  'unlock-achievements-for-multiple-games',
  'ad-free-experience',
  'exclusive-themes',
  'custom-background-image',
  'custom-fonts',
  'unique-discord-chat-role',
  'real-time-live-support',
  'automatic-games-list-updates',
  'automatic-steam-credentials-retrieval',
  'free-game-redemption',
  'automatic-card-farming',
  'sell-duplicate-items',
  'import-achievement-unlock-timings',
  'custom-online-status',
]

export const featureDetails: Feature[] = FEATURE_DETAILS_ORDER.map(id => {
  const feature = allFeatures.find(f => f.id === id)
  if (!feature) {
    throw new Error(`FEATURE_DETAILS_ORDER references unknown feature id: ${id}`)
  }
  return feature
})

export interface ProPriceData {
  tierOne: { url: string; price: string }
  tierTwo: { url: string; price: string }
}

export async function fetchProData() {
  try {
    const res = await fetch('https://apibase.vercel.app/api/pro-data', {
      next: { revalidate: 3600 },
    })
    const data = await res.json()
    return data as ProPriceData
  } catch {
    return {
      tierOne: { url: '', price: '2' },
      tierTwo: { url: '', price: '4' },
    }
  }
}
