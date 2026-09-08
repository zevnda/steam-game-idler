import type { TFunction } from 'i18next'
import type { CardDef, ComparisonRowDef } from './types'
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
import { CDN_BASE_URL } from '@/shared/constants'

export const PRO_DOCS_URL = 'https://steamgameidler.com/pro'

// Feature bento grid content, ported from `main` (src/shared/components/pro/GoProModal/data.ts).
// `tier`/`bg` fields on `main`'s `CardDef` were dropped here - every card used the same flat `bg`
// color and `tier` was never actually read by `FeatureCard`, so both were unused weight.
export function getFeatureCards(t: TFunction) {
  return [
    {
      title: t('proMode.cards.adFree.title'),
      description: t('proMode.cards.adFree.description'),
      colSpan: 1,
      imgBg: `${CDN_BASE_URL}/pro-modal/pro1.webp`,
      learnMoreUrl: `${PRO_DOCS_URL}#ad-free-experience`,
    },
    {
      title: t('proMode.cards.themes.title'),
      description: t('proMode.cards.themes.description'),
      colSpan: 1,
      imgBg: `${CDN_BASE_URL}/pro-modal/pro2.webp`,
      darkText: true,
      learnMoreUrl: `${PRO_DOCS_URL}#exclusive-themes`,
    },
    {
      title: t('proMode.cards.liveSupport.title'),
      description: t('proMode.cards.liveSupport.description'),
      colSpan: 1,
      imgBg: `${CDN_BASE_URL}/pro-modal/pro4.webp`,
      learnMoreUrl: `${PRO_DOCS_URL}#real-time-live-support`,
    },
    {
      title: t('proMode.cards.multiAccount.title'),
      description: t('proMode.cards.multiAccount.description'),
      colSpan: 1,
      imgBg: `${CDN_BASE_URL}/pro-modal/pro5.webp`,
      learnMoreUrl: `${PRO_DOCS_URL}#multi-account-support`,
    },
    {
      title: t('proMode.cards.autoFarmCards.title'),
      description: t('proMode.cards.autoFarmCards.description'),
      colSpan: 1,
      imgBg: `${CDN_BASE_URL}/pro-modal/pro6.webp`,
      learnMoreUrl: `${PRO_DOCS_URL}#automatic-card-farming`,
    },
    {
      title: t('proMode.cards.gamesList.title'),
      description: t('proMode.cards.gamesList.description'),
      colSpan: 1,
      imgBg: `${CDN_BASE_URL}/pro-modal/pro7.webp`,
      learnMoreUrl: `${PRO_DOCS_URL}#automatic-games-list-updates`,
    },
    {
      title: t('proMode.cards.multipleUnlockerGames.title'),
      description: t('proMode.cards.multipleUnlockerGames.description'),
      colSpan: 1,
      imgBg: `${CDN_BASE_URL}/pro-modal/pro11.webp`,
      learnMoreUrl: `${PRO_DOCS_URL}#unlock-achievements-for-multiple-games`,
    },
    {
      title: t('proMode.cards.freeGames.title'),
      description: t('proMode.cards.freeGames.description'),
      colSpan: 1,
      imgBg: `${CDN_BASE_URL}/pro-modal/pro8.webp`,
      darkText: true,
      learnMoreUrl: `${PRO_DOCS_URL}#free-game-redemption`,
    },
    {
      title: t('proMode.cards.sellDupes.title'),
      description: t('proMode.cards.sellDupes.description'),
      colSpan: 1,
      imgBg: `${CDN_BASE_URL}/pro-modal/pro9.webp`,
      learnMoreUrl: `${PRO_DOCS_URL}#sell-duplicate-items`,
    },
  ] satisfies CardDef[]
}

export function getComparisonRows(t: TFunction) {
  return [
    {
      label: t('proMode.cards.multiAccount.title'),
      icon: TbUsers,
      tier: 'casual',
      freeValue: '1',
      casualValue: '3',
      gamerValue: '10',
    },
    {
      label: t('proMode.cards.multipleUnlockerGames.title'),
      icon: TbAward,
      tier: 'casual',
      freeValue: '1',
      casualValue: '3',
      gamerValue: '32',
    },
    { label: t('proMode.cards.adFree.title'), icon: TbAd, tier: 'casual' },
    { label: t('proMode.cards.themes.title'), icon: TbPalette, tier: 'casual' },
    { label: t('proMode.cards.customBackground.title'), icon: TbPhoto, tier: 'casual' },
    { label: t('proMode.cards.customFont.title'), icon: TbTypography, tier: 'casual' },
    { label: t('proMode.tier.casual.discordRole'), icon: FaDiscord, tier: 'casual' },
    { label: t('proMode.cards.liveSupport.title'), icon: TbHeadset, tier: 'casual' },
    { label: t('proMode.cards.gamesList.title'), icon: TbRefresh, tier: 'casual' },
    { label: t('proMode.cards.credentials.title'), icon: TbKey, tier: 'gamer' },
    { label: t('proMode.tier.gamer.freeGames'), icon: TbGift, tier: 'gamer' },
    { label: t('proMode.cards.autoFarmCards.title'), icon: TbCards, tier: 'gamer' },
    { label: t('proMode.tier.gamer.sellDupes'), icon: TbCurrencyDollar, tier: 'gamer' },
    { label: t('proMode.tier.gamer.importTimings'), icon: TbClock, tier: 'gamer' },
    { label: t('proMode.cards.customPresence.title'), icon: TbUserCircle, tier: 'gamer' },
  ] satisfies ComparisonRowDef[]
}

export function getFaqItems(t: TFunction) {
  return [
    {
      q: t('proMode.faq.subscriptionNotActivated.q'),
      a: t('proMode.faq.subscriptionNotActivated.a'),
    },
    { q: t('proMode.faq.transferDevice.q'), a: t('proMode.faq.transferDevice.a') },
    { q: t('proMode.faq.cancel.q'), a: t('proMode.faq.cancel.a') },
    { q: t('proMode.faq.switchTier.q'), a: t('proMode.faq.switchTier.a') },
    { q: t('proMode.faq.invoices.q'), a: t('proMode.faq.invoices.a') },
    { q: t('proMode.faq.refund.q'), a: t('proMode.faq.refund.a') },
    { q: t('proMode.faq.chargeback.q'), a: t('proMode.faq.chargeback.a') },
  ]
}
