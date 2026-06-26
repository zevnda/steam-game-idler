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
  TbRefresh,
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
}

export interface TierFeature {
  icon: IconType
  title: string
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
    icon: TbKey,
    title: 'Automatic Steam Credentials Retrieval',
    description: 'Automatically retrieve your Steam credentials without any manual input.',
    detail:
      "Sign in with Steam once and SGI handles the rest — automatically capturing and refreshing the session cookies that Card Farming and Inventory Manager need, without needing to manually copy values out of your browser's dev tools.",
    tier: 'gamer',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro5.webp`,
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
    tier: 'gamer',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro7.webp`,
    id: 'automatic-games-list-updates',
  },
  {
    icon: TbAward,
    title: 'Unlock Achievements For Multiple Games',
    description: 'Unlock achievements for up to 32 games at the same time in Achievement Unlocker.',
    detail:
      'Unlock up to 32 games in the Achievement Unlocker at once instead of running them one at a time. When one game finished, another it added to the queue immediately, so your entire backlog earns achievements in parallel.',
    tier: 'gamer',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro11.webp`,
    tierLabel: 'Unlock Achievement For Multiple Games',
    id: 'unlock-achievements-for-multiple-games',
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
]

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
