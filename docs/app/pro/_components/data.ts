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

export interface Feature {
  icon: IconType
  title: string
  description: string
  tier: 'casual' | 'gamer'
  span: 1 | 2
}

export interface TierFeature {
  icon: IconType
  title: string
}

export const allFeatures: Feature[] = [
  {
    icon: TbAd,
    title: 'Ad-Free Experience',
    description: 'Enjoy SGI without any advertisements for a completely clean interface.',
    tier: 'casual',
    span: 1,
  },
  {
    icon: TbPalette,
    title: 'Exclusive Themes',
    description: 'Customize SGI with 6 unique themes available only to PRO subscribers.',
    tier: 'casual',
    span: 2,
  },
  {
    icon: FaDiscord,
    title: 'Unique Discord Role',
    description: 'Stand out in our Discord community with a special @PRO role.',
    tier: 'casual',
    span: 2,
  },
  {
    icon: TbHeadset,
    title: 'Real-Time Live Support',
    description:
      'Skip the queue — chat directly with the developer via the in-app help desk and get support in real time.',
    tier: 'casual',
    span: 1,
  },
  {
    icon: TbKey,
    title: 'Automated Steam Credentials',
    description: 'Instantly retrieve your Steam credentials without any manual input.',
    tier: 'gamer',
    span: 1,
  },
  {
    icon: TbRefresh,
    title: 'Automated Games List Updates',
    description: 'Your games list updates automatically every 15 minutes as you add games.',
    tier: 'gamer',
    span: 2,
  },
  {
    icon: TbGift,
    title: 'Automated Free Game Redemption',
    description: 'Automatically redeem free games on Steam the moment they become available.',
    tier: 'gamer',
    span: 2,
  },
  {
    icon: TbCurrencyDollar,
    title: 'Sell Duplicate Inventory Items',
    description: 'Instantly list all duplicate inventory items for sale with a single click.',
    tier: 'gamer',
    span: 1,
  },
  {
    icon: TbClock,
    title: 'Import Achievement Unlock Timings',
    description:
      'Copy the exact achievement unlock order and timing delays from any public Steam profile.',
    tier: 'gamer',
    span: 1,
  },
  {
    icon: TbCards,
    title: 'Auto Card Farming',
    description:
      'Automatically detects games with card drops remaining after every library sync and starts farming them — no manual check needed.',
    tier: 'gamer',
    span: 2,
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
