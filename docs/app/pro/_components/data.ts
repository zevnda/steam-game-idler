import type { IconType } from 'react-icons'
import { FaDiscord } from 'react-icons/fa6'
import {
  TbAd,
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
  tier: 'casual' | 'gamer'
  imgBg?: string
  darkText?: boolean
  /** Overrides `title` when this feature is listed inside a tier card — app's source of truth uses different copy in a few cases. */
  tierLabel?: string
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
    tier: 'casual',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro1.webp`,
  },
  {
    icon: TbPalette,
    title: 'Exclusive Themes',
    description: 'Customize SGI with 6 unique themes available only to PRO subscribers.',
    tier: 'casual',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro2.webp`,
    darkText: true,
  },
  {
    icon: FaDiscord,
    title: 'Discord PRO Role',
    description: 'Stand out in our Discord community with a special exclusive @PRO role.',
    tier: 'casual',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro3.webp`,
  },
  {
    icon: TbHeadset,
    title: 'Real-Time Live Support',
    description:
      'Skip the queue — chat directly with the developer via the in-app help desk and get support in real time.',
    tier: 'casual',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro4.webp`,
  },
  {
    icon: TbKey,
    title: 'Automatic Steam Credentials Retrieval',
    description: 'Automatically retrieve your Steam credentials without any manual input.',
    tier: 'gamer',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro5.webp`,
  },
  {
    icon: TbCards,
    title: 'Automatic Card Farming',
    description:
      'SGI monitors your library and automatically starts farming any game that still has card drops remaining.',
    tier: 'gamer',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro6.webp`,
  },
  {
    icon: TbRefresh,
    title: 'Automatic Games List Updates',
    description:
      'Your games list refreshes automatically every 15 minutes as you add and play games.',
    tier: 'gamer',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro7.webp`,
  },
  {
    icon: TbGift,
    title: 'Free Game Redemption',
    description:
      'Automatically redeem free games on Steam the moment they become available — never miss a freebie.',
    tier: 'gamer',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro8.webp`,
    darkText: true,
    tierLabel: 'Automatic Free Game Redemption',
  },
  {
    icon: TbCurrencyDollar,
    title: 'Sell Duplicate Items',
    description: 'Easily list all duplicate inventory items for sale with a single click.',
    tier: 'gamer',
    imgBg: `${CDN_BASE_URL}/pro-modal/pro9.webp`,
    tierLabel: 'Sell Duplicate Inventory Items',
  },
  {
    icon: TbClock,
    title: 'Import Achievement Unlock Timings',
    description:
      'Copy the exact achievement unlock order and timing delays from any public Steam profile.',
    tier: 'gamer',
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
