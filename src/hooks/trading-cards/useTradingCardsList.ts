import type { InvokeCardData, InvokeCardPrice, InvokeListCards, TradingCard } from '@/types'

import { invoke } from '@tauri-apps/api/core'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useUserContext } from '@/components/contexts/UserContext'
import { logEvent } from '@/utils/tasks'
import { showDangerToast, showMissingCredentialsToast, showPrimaryToast, showSuccessToast } from '@/utils/toasts'

interface UseTradingCardsList {
  tradingCardsList: TradingCard[]
  isLoading: boolean
  loadingItemPrice: Record<string, boolean>
  changedCardPrices: Record<string, number>
  selectedCards: Record<string, boolean>
  fetchCardPrices: (hash: string) => Promise<void>
  updateCardPrice: (assetId: string, value: number) => void
  toggleCardSelection: (assetId: string) => void
  handleSellSelectedCards: () => Promise<void>
  refreshKey: number
  handleRefresh: () => void
}

export default function useTradingCardsList(): UseTradingCardsList {
  const { t } = useTranslation()
  const { userSummary, userSettings } = useUserContext()
  const [tradingCardsList, setTradingCardsList] = useState<TradingCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingItemPrice, setLoadingItemPrice] = useState<Record<string, boolean>>({})
  const [changedCardPrices, setChangedCardPrices] = useState<Record<string, number>>({})
  const [selectedCards, setSelectedCards] = useState<Record<string, boolean>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const getTradingCards = async (): Promise<void> => {
      try {
        const credentials = userSettings.cardFarming.credentials

        if (!credentials?.sid || !credentials?.sls) {
          setIsLoading(false)
          return showMissingCredentialsToast()
        }

        setIsLoading(true)

        const cachedCards = await invoke<InvokeCardData>('get_trading_cards_cache', {
          steamId: userSummary?.steamId,
        })

        if (cachedCards && cachedCards.card_data) {
          const sortedCards = cachedCards.card_data.sort((a, b) => a.appname.localeCompare(b.appname))
          setTradingCardsList(sortedCards)
        } else {
          const response = await invoke<InvokeCardData>('get_trading_cards', {
            sid: credentials.sid,
            sls: credentials.sls,
            sma: credentials?.sma,
            steamId: userSummary?.steamId,
            includePrices: true,
          })

          if (response.card_data.length > 0) {
            const sortedCards = response.card_data.sort((a, b) => a.appname.localeCompare(b.appname))
            setTradingCardsList(sortedCards)
          } else {
            showPrimaryToast(t('toast.tradingCards.noCards'))
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error in getTradingCards:', error)
        logEvent(`[Error] in getTradingCards: ${error}`)
        setIsLoading(false)
      }
    }
    getTradingCards()
  }, [refreshKey, t, userSettings.cardFarming.credentials, userSummary?.steamId])

  const fetchCardPrices = async (hash: string): Promise<void> => {
    setLoadingItemPrice(prev => ({ ...prev, [hash]: true }))

    try {
      const credentials = userSettings.cardFarming.credentials

      if (!credentials?.sid || !credentials?.sls) return showMissingCredentialsToast()

      const cardPrices = await invoke<InvokeCardPrice>('get_card_price', {
        sid: credentials.sid,
        sls: credentials.sls,
        sma: credentials?.sma,
        steamId: userSummary?.steamId,
        marketHashName: hash,
      })

      const response = await invoke<InvokeCardData>('update_card_data', {
        steamId: userSummary?.steamId,
        key: hash,
        data: cardPrices.price_data,
      })

      if (response.card_data.length > 0) {
        const sortedCards = response.card_data.sort((a, b) => a.appname.localeCompare(b.appname))
        setTradingCardsList(sortedCards)
      }
    } catch (error) {
      console.error('Error fetching card prices:', error)
      logEvent(`[Error] in fetchCardPrices: ${error}`)
    } finally {
      setLoadingItemPrice(prev => ({ ...prev, [hash]: false }))
    }
  }

  const updateCardPrice = (assetId: string, value: number): void => {
    setChangedCardPrices(prev => {
      const updated = { ...prev }
      if (value > 0) {
        updated[assetId] = value
      } else {
        delete updated[assetId]
      }
      return updated
    })

    // Enable checkbox when a price is entered or deselect price is 0
    setSelectedCards(prev => {
      const updated = { ...prev }
      updated[assetId] = value > 0
      return updated
    })
  }

  const toggleCardSelection = (assetId: string): void => {
    setSelectedCards(prev => {
      const updated = { ...prev }
      updated[assetId] = !prev[assetId]
      return updated
    })
  }

  const handleSellSelectedCards = async (): Promise<void> => {
    try {
      const credentials = userSettings.cardFarming.credentials

      if (!credentials?.sid || !credentials?.sls) return showMissingCredentialsToast()

      const selectedAssetIds = Object.keys(selectedCards).filter(assetId => selectedCards[assetId])
      const cardsToSell = selectedAssetIds.filter(assetId => changedCardPrices[assetId] > 0)

      if (cardsToSell.length === 0) {
        return
      }

      const cardsForBulkListing = cardsToSell.map(assetId => [assetId, changedCardPrices[assetId].toString()]) as [
        string,
        string,
      ][]

      logEvent(`Cards for listing: ${JSON.stringify(cardsForBulkListing)}`)

      const response = await invoke<InvokeListCards>('list_trading_cards', {
        sid: credentials.sid,
        sls: credentials.sls,
        sma: credentials?.sma,
        steamId: userSummary?.steamId,
        cards: cardsForBulkListing,
      })

      if (response.successful && response.results && response.results.length > 0) {
        const successfulCards = response.results.filter(card => card.success)
        const failedCards = response.results.filter(card => !card.success)
        const needsEmailConfirmation = response.results.filter(card => card.data?.needs_email_confirmation)
        const needsMobileConfirmation = response.results.filter(card => card.data?.needs_mobile_confirmation)

        if (successfulCards.length > 0) {
          if (needsEmailConfirmation.length > 0) {
            showSuccessToast(t('toast.tradingCards.emailConfirm', { count: successfulCards.length }))
          } else if (needsMobileConfirmation.length > 0) {
            showSuccessToast(t('toast.tradingCards.mobileConfirm', { count: successfulCards.length }))
          } else {
            showSuccessToast(t('toast.tradingCards.listed', { count: successfulCards.length }))
          }
        }

        for (const card of failedCards) {
          logEvent(`[Error] Failed to list trading card ${card.assetid}: ${card.message}`)
        }
      } else {
        showDangerToast(t('common.error'))
        logEvent(`[Error] Failed to list trading cards: ${JSON.stringify(response)}`)
      }

      logEvent(`Complete listing results: ${JSON.stringify(response)}`)
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in handleSellSelectedCards:', error)
      logEvent(`[Error] in handleSellSelectedCards: ${error}`)
    } finally {
      setSelectedCards({})
      setChangedCardPrices({})
    }
  }

  const handleRefresh = async (): Promise<void> => {
    try {
      await invoke('delete_user_trading_card_file', {
        steamId: userSummary?.steamId,
      })

      setRefreshKey(prev => prev + 1)
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in handleRefresh:', error)
      logEvent(`[Error] in handleRefresh: ${error}`)
    }
  }

  return {
    tradingCardsList,
    isLoading,
    loadingItemPrice,
    changedCardPrices,
    selectedCards,
    fetchCardPrices,
    updateCardPrice,
    toggleCardSelection,
    handleSellSelectedCards,
    refreshKey,
    handleRefresh,
  }
}
