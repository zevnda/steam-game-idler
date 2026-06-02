import type {
  InvokeCardData,
  InvokeCardPrice,
  InvokeListCards,
  InvokeRemoveListings,
  InvokeValidateSession,
  TradingCard,
} from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUiStore, useUserStore } from '@/shared/stores'
import { decrypt, hasGamerFeature } from '@/shared/utils'

export function useTradingCardsList() {
  const { t } = useTranslation()
  const userSummary = useUserStore(s => s.userSummary)
  const userSettings = useUserStore(s => s.userSettings)
  const proTier = useUserStore(s => s.proTier)
  const loadingItemPrice = useUiStore(s => s.loadingItemPrice)
  const setLoadingItemPrice = useUiStore(s => s.setLoadingItemPrice)
  const loadingListButton = useUiStore(s => s.loadingListButton)
  const setLoadingListButton = useUiStore(s => s.setLoadingListButton)
  const loadingRemoveListings = useUiStore(s => s.loadingRemoveListings)
  const setLoadingRemoveListings = useUiStore(s => s.setLoadingRemoveListings)

  const [tradingCardsList, setTradingCardsList] = useState<TradingCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [changedCardPrices, setChangedCardPrices] = useState<Record<string, number>>({})
  const [selectedCards, setSelectedCards] = useState<Record<string, boolean>>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [cardSortStyle, setCardSortStyle] = useState('a-z')

  const sortedTradingCardsList = useMemo(() => {
    const list = [...tradingCardsList]
    switch (cardSortStyle) {
      case 'a-z':
        return list.sort((a, b) => a.full_name.localeCompare(b.full_name))
      case 'z-a':
        return list.sort((a, b) => b.full_name.localeCompare(a.full_name))
      case 'aa-zz':
        return list.sort((a, b) => a.appname.localeCompare(b.appname))
      case 'zz-aa':
        return list.sort((a, b) => b.appname.localeCompare(a.appname))
      case 'badge-desc':
        return list.sort((a, b) => (b.badge_level || 0) - (a.badge_level || 0))
      default:
        return list
    }
  }, [tradingCardsList, cardSortStyle])

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const cached = await invoke<InvokeCardData>('get_trading_cards_cache', {
          steamId: userSummary?.steamId,
        })
        if (cached?.card_data?.length) {
          setTradingCardsList(cached.card_data)
          setIsLoading(false)
          return
        }

        const credentials = userSettings.cardFarming.credentials
        if (!credentials?.sid || !credentials?.sls) {
          toast.missingCredentials()
          setIsLoading(false)
          return
        }

        const validate = await invoke<InvokeValidateSession>('validate_session', {
          sid: decrypt(credentials.sid),
          sls: decrypt(credentials.sls),
          sma: credentials?.sma,
          steamid: userSummary?.steamId,
        })

        if (!validate.user) {
          toast.incorrectCredentials()
          setIsLoading(false)
          return
        }

        const data = await invoke<InvokeCardData>('get_trading_cards', {
          steamId: userSummary?.steamId,
          sid: decrypt(credentials.sid),
          sls: decrypt(credentials.sls),
          sma: credentials?.sma,
        })

        setTradingCardsList(data?.card_data || [])
        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
        console.error('Error loading trading cards:', error)
        await logEvent(`[Error] in useTradingCardsList: ${error}`)
      }
    }
    load()
  }, [userSummary?.steamId, userSettings.cardFarming.credentials, refreshKey])

  const handleFetchCardPrice = async (card: TradingCard) => {
    setLoadingItemPrice(prev => ({ ...prev, [card.id]: true }))
    try {
      const lastFetch = localStorage.getItem(`cardPriceCooldown_${card.market_hash_name}`)
      const cooldownMs = 3000
      if (lastFetch && Date.now() - Number(lastFetch) < cooldownMs) {
        const seconds = Math.ceil((cooldownMs - (Date.now() - Number(lastFetch))) / 1000)
        toast.priceFetchCooldown(seconds)
        return
      }
      localStorage.setItem(`cardPriceCooldown_${card.market_hash_name}`, String(Date.now()))

      const credentials = userSettings.cardFarming.credentials
      const res = await invoke<InvokeCardPrice>('get_card_price', {
        marketHashName: card.market_hash_name,
        currency: localStorage.getItem('currency') || '1',
        sid: credentials ? decrypt(credentials.sid) : undefined,
        sls: credentials ? decrypt(credentials.sls) : undefined,
      })

      if (res.error === 'rate_limited') {
        toast.priceFetchRateLimit()
        return
      }
      if (!res.success) return

      setTradingCardsList(prev =>
        prev.map(c =>
          c.id === card.id
            ? {
                ...c,
                price_data: {
                  lowest_sell_order:
                    res.lowest_sell_order || c.price_data?.lowest_sell_order || '0',
                  highest_buy_order:
                    res.highest_buy_order || c.price_data?.highest_buy_order || '0',
                  sell_order_graph: res.sell_order_graph || c.price_data?.sell_order_graph || [],
                  buy_order_graph: res.buy_order_graph || c.price_data?.buy_order_graph || [],
                  buy_order_summary: res.buy_order_summary || c.price_data?.buy_order_summary || '',
                  sell_order_summary:
                    res.sell_order_summary || c.price_data?.sell_order_summary || '',
                },
              }
            : c,
        ),
      )
    } catch (error) {
      console.error('Error fetching card price:', error)
    } finally {
      setLoadingItemPrice(prev => {
        const next = { ...prev }
        delete next[card.id]
        return next
      })
    }
  }

  const handleListCards = async (cards: TradingCard[], adjustedPrices: Record<string, number>) => {
    if (!hasGamerFeature(proTier)) return
    const credentials = userSettings.cardFarming.credentials
    if (!credentials?.sid || !credentials?.sls) return toast.missingCredentials()

    setLoadingListButton(true)
    try {
      const { sellOptions, priceAdjustment, sellLimit } = userSettings.tradingCards
      const cardData = cards.map(card => {
        const basePrice =
          adjustedPrices[card.id] !== undefined
            ? adjustedPrices[card.id]
            : sellOptions === 'highestBuyOrder'
              ? Number(card.price_data?.highest_buy_order || 0) / 100
              : Number(card.price_data?.lowest_sell_order || 0) / 100
        const adjusted = Math.max(
          sellLimit.min,
          Math.min(sellLimit.max, basePrice + priceAdjustment),
        )
        return { assetId: card.assetid, price: Math.round(adjusted * 100) }
      })

      const res = await invoke<InvokeListCards>('list_trading_cards', {
        sid: decrypt(credentials.sid),
        sls: decrypt(credentials.sls),
        cards: cardData,
        sellDelay: userSettings.tradingCards.sellDelay,
      })

      if (res.successful > 0) {
        toast.success(t('toast.tradingCards.listed', { count: res.successful }))
        await logEvent(`[Trading Cards] Listed ${res.successful} cards`)
      }
    } catch (error) {
      toast.danger(t('common.error'))
      await logEvent(`[Error] in handleListCards: ${error}`)
    } finally {
      setLoadingListButton(false)
    }
  }

  const handleRemoveListings = async () => {
    const credentials = userSettings.cardFarming.credentials
    if (!credentials?.sid || !credentials?.sls) return toast.missingCredentials()
    setLoadingRemoveListings(true)
    try {
      const res = await invoke<InvokeRemoveListings>('remove_market_listings', {
        sid: decrypt(credentials.sid),
        sls: decrypt(credentials.sls),
        steamId: userSummary?.steamId,
      })
      if (res.successful_removals > 0) {
        toast.success(
          t('toast.tradingCards.removedListings', {
            count: res.successful_removals,
            total: res.processed_listings,
          }),
        )
        await logEvent(`[Trading Cards] Removed ${res.successful_removals} listings`)
      }
    } catch (error) {
      toast.danger(t('common.error'))
      await logEvent(`[Error] in handleRemoveListings: ${error}`)
    } finally {
      setLoadingRemoveListings(false)
    }
  }

  return {
    tradingCardsList: sortedTradingCardsList,
    isLoading,
    changedCardPrices,
    setChangedCardPrices,
    selectedCards,
    setSelectedCards,
    refreshKey,
    setRefreshKey,
    cardSortStyle,
    setCardSortStyle,
    loadingItemPrice,
    loadingListButton,
    loadingRemoveListings,
    handleFetchCardPrice,
    handleListCards,
    handleRemoveListings,
  }
}
