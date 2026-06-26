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
  TbRefresh,
} from 'react-icons/tb'
import { CDN_BASE_URL } from '@/shared/constants'

export function getFeatureCards(t: TFunction) {
  const cards: CardDef[] = [
    {
      title: t('proMode.cards.adFree.title'),
      description: t('proMode.cards.adFree.description'),
      tier: 'casual',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro1.webp`,
    },
    {
      title: t('proMode.cards.themes.title'),
      description: t('proMode.cards.themes.description'),
      tier: 'casual',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro2.webp`,
      darkText: true,
    },
    {
      title: t('proMode.cards.liveSupport.title'),
      description: t('proMode.cards.liveSupport.description'),
      tier: 'casual',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro4.webp`,
    },
    {
      title: t('proMode.cards.credentials.title'),
      description: t('proMode.cards.credentials.description'),
      tier: 'gamer',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro5.webp`,
    },
    {
      title: t('proMode.cards.autoFarmCards.title'),
      description: t('proMode.cards.autoFarmCards.description'),
      tier: 'gamer',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro6.webp`,
    },
    {
      title: t('proMode.cards.gamesList.title'),
      description: t('proMode.cards.gamesList.description'),
      tier: 'gamer',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro7.webp`,
    },
    {
      title: t('proMode.cards.multipleUnlockerGames.title'),
      description: t('proMode.cards.multipleUnlockerGames.description'),
      tier: 'gamer',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro11.webp`,
    },
    {
      title: t('proMode.cards.freeGames.title'),
      description: t('proMode.cards.freeGames.description'),
      tier: 'gamer',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro8.webp`,
      darkText: true,
    },
    {
      title: t('proMode.cards.sellDupes.title'),
      description: t('proMode.cards.sellDupes.description'),
      tier: 'gamer',
      colSpan: 1,
      bg: '#131313',
      imgBg: `${CDN_BASE_URL}/pro-modal/pro9.webp`,
    },
  ]
  return cards
}

export function getComparisonRows(t: TFunction) {
  const rows: ComparisonRowDef[] = [
    { label: t('proMode.tier.casual.adFree'), icon: TbAd, tier: 'casual' },
    { label: t('proMode.tier.casual.themes'), icon: TbPalette, tier: 'casual' },
    { label: t('proMode.tier.casual.discordRole'), icon: FaDiscord, tier: 'casual' },
    { label: t('proMode.tier.casual.liveSupport'), icon: TbHeadset, tier: 'casual' },
    { label: t('proMode.tier.gamer.credentials'), icon: TbKey, tier: 'gamer' },
    { label: t('proMode.tier.gamer.freeGames'), icon: TbGift, tier: 'gamer' },
    { label: t('proMode.tier.gamer.gamesList'), icon: TbRefresh, tier: 'gamer' },
    { label: t('proMode.tier.gamer.autoFarmCards'), icon: TbCards, tier: 'gamer' },
    { label: t('proMode.tier.gamer.multipleUnlockerGames'), icon: TbAward, tier: 'gamer' },
    { label: t('proMode.tier.gamer.sellDupes'), icon: TbCurrencyDollar, tier: 'gamer' },
    { label: t('proMode.tier.gamer.importTimings'), icon: TbClock, tier: 'gamer' },
  ]
  return rows
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
