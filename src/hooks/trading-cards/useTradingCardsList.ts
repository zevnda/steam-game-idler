import type {
  InvokeCardData,
  InvokeCardPrice,
  InvokeListCards,
  InvokeRemoveListings,
  InvokeValidateSession,
  TradingCard,
} from '@/types'

import { invoke } from '@tauri-apps/api/core'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useStateContext } from '@/components/contexts/StateContext'
import { useUserContext } from '@/components/contexts/UserContext'
import { decrypt, logEvent } from '@/utils/tasks'
import {
  showDangerToast,
  showIncorrectCredentialsToast,
  showMissingCredentialsToast,
  showPrimaryToast,
  showSuccessToast,
} from '@/utils/toasts'

interface UseTradingCardsList {
  tradingCardsList: TradingCard[]
  filteredTradingCardsList?: TradingCard[]
  isLoading: boolean
  loadingItemPrice: Record<string, boolean>
  loadingListButton: boolean
  loadingRemoveListings: boolean
  changedCardPrices: Record<string, number>
  selectedCards: Record<string, boolean>
  fetchCardPrices: (hash: string) => Promise<{ success: boolean; price?: string }>
  updateCardPrice: (assetId: string, value: number) => void
  toggleCardSelection: (assetId: string) => void
  handleSellSelectedCards: () => Promise<void>
  handleSellSingleCard: (assetId: string, itemId: string, price: number) => Promise<void>
  getCardPriceValue: (assetId: string) => number
  refreshKey: number
  handleRefresh: () => void
  handleSellAllCards: () => Promise<void>
  handleRemoveActiveListings: () => Promise<void>
  cardSortStyle: string
  setCardSortStyle: (style: string) => void
}

export default function useTradingCardsList(): UseTradingCardsList {
  const { t } = useTranslation()
  const { userSummary, userSettings } = useUserContext()
  const {
    loadingItemPrice,
    setLoadingItemPrice,
    loadingListButton,
    setLoadingListButton,
    loadingRemoveListings,
    setLoadingRemoveListings,
  } = useStateContext()
  const [tradingCardsList, setTradingCardsList] = useState<TradingCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [changedCardPrices, setChangedCardPrices] = useState<Record<string, number>>({})
  const [selectedCards, setSelectedCards] = useState<Record<string, boolean>>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [cardSortStyle, setCardSortStyle] = useState('a-z')

  // Sorting logic
  const sortedTradingCardsList = useMemo(() => {
    const list = tradingCardsList.slice()
    switch (cardSortStyle) {
      case 'a-z':
        return list.sort((a, b) => a.full_name.localeCompare(b.full_name))
      case 'z-a':
        return list.sort((a, b) => b.full_name.localeCompare(a.full_name))
      case 'aa-zz':
        return list.sort((a, b) => a.appname.localeCompare(b.appname))
      case 'zz-aa':
        return list.sort((a, b) => b.appname.localeCompare(a.appname))
      case 'badge':
        return list
          .filter(card => card.badge_level !== undefined)
          .sort((a, b) => {
            const levelA = a.badge_level || 0
            const levelB = b.badge_level || 0
            return levelB - levelA
          })
      case 'foil':
        return list
          .filter(card => card.foil === true)
          .sort((a, b) => {
            const levelA = a.badge_level || 0
            const levelB = b.badge_level || 0
            return levelB - levelA
          })
      case 'dupes': {
        const countMap: Record<string, number> = {}
        list.forEach(card => {
          countMap[card.market_hash_name] = (countMap[card.market_hash_name] || 0) + 1
        })
        return list.filter(card => countMap[card.market_hash_name] > 1)
      }
      default:
        return list
    }
  }, [tradingCardsList, cardSortStyle])

  useEffect(() => {
    const getTradingCards = async (): Promise<void> => {
      try {
        const credentials = userSettings.cardFarming.credentials
        const apiKey = userSettings.general?.apiKey

        if (!credentials?.sid || !credentials?.sls) return showMissingCredentialsToast()

        setIsLoading(true)

        const cachedCards = await invoke<InvokeCardData>('get_trading_cards_cache', {
          steamId: userSummary?.steamId,
        })

        if (cachedCards && cachedCards.card_data) {
          const sortedCards = cachedCards.card_data.sort((a, b) => a.appname.localeCompare(b.appname))
          setTradingCardsList(sortedCards)
        } else {
          // Validate credentials
          const validate = await invoke<InvokeValidateSession>('validate_session', {
            sid: decrypt(credentials.sid),
            sls: decrypt(credentials.sls),
            sma: credentials?.sma,
            steamid: userSummary?.steamId,
          })

          if (!validate.user) return showIncorrectCredentialsToast()

          const response = await invoke<InvokeCardData>('get_trading_cards', {
            sid: decrypt(credentials.sid),
            sls: decrypt(credentials.sls),
            sma: credentials?.sma,
            steamId: userSummary?.steamId,
            includePrices: true,
            apiKey: apiKey ? decrypt(apiKey) : null,
          })

          if (response.card_data.length > 0) {
            const sortedCards = response.card_data.sort((a, b) => a.appname.localeCompare(b.appname))
            setTradingCardsList(sortedCards)
          } else {
            setTradingCardsList([])
            showPrimaryToast(t('toast.tradingCards.noCards'))
          }
        }
      } catch (error) {
        console.error('Error in getTradingCards:', error)
        logEvent(`[Error] in getTradingCards: ${error}`)
      } finally {
        setIsLoading(false)
      }
    }
    getTradingCards()
  }, [refreshKey, t, userSettings.cardFarming.credentials, userSummary?.steamId, userSettings.general?.apiKey])

  const fetchCardPrices = async (hash: string): Promise<{ success: boolean; price?: string }> => {
    setLoadingItemPrice(prev => ({ ...prev, [hash]: true }))

    try {
      const credentials = userSettings.cardFarming.credentials

      if (!credentials?.sid || !credentials?.sls) {
        showMissingCredentialsToast()
        return { success: false }
      }

      // Validate credentials
      const validate = await invoke<InvokeValidateSession>('validate_session', {
        sid: decrypt(credentials.sid),
        sls: decrypt(credentials.sls),
        sma: credentials?.sma,
        steamid: userSummary?.steamId,
      })

      if (!validate.user) {
        showIncorrectCredentialsToast()
        return { success: false }
      }

      const cardPrices = await invoke<InvokeCardPrice>('get_card_price', {
        marketHashName: hash,
        currency: localStorage.getItem('currency') || '1',
      })

      if (!cardPrices.success || !cardPrices.sell_order_graph || !cardPrices.buy_order_graph) {
        return { success: false }
      }

      let price: string | undefined
      if (userSettings.tradingCards?.sellOptions === 'highestBuyOrder') {
        price = cardPrices?.buy_order_graph?.[0]?.[0]?.toString()
      } else if (userSettings.tradingCards?.sellOptions === 'lowestSellOrder') {
        price = cardPrices?.sell_order_graph?.[0]?.[0]?.toString()
      } else {
        price = cardPrices?.buy_order_graph?.[0]?.[0]?.toString()
      }

      const priceDataCleaned = {
        sell_order_graph: cardPrices.sell_order_graph,
        buy_order_graph: cardPrices.buy_order_graph,
        highest_buy_order: cardPrices?.buy_order_graph?.[0]?.[0]?.toString(), // Convert to string
        lowest_sell_order: cardPrices?.sell_order_graph?.[0]?.[0]?.toString(), // Convert to string
        buy_order_summary: cardPrices?.buy_order_summary || '', // Fallback to empty string
        sell_order_summary: cardPrices?.sell_order_summary || '', // Fallback to empty string
      }

      const response = await invoke<InvokeCardData>('update_card_data', {
        steamId: userSummary?.steamId,
        key: hash,
        data: priceDataCleaned,
      })

      if (response.card_data.length > 0) {
        const sortedCards = response.card_data.sort((a, b) => a.appname.localeCompare(b.appname))
        setTradingCardsList(sortedCards)
      } else {
        // Update only the specific card's price_data
        setTradingCardsList(prevCards =>
          prevCards.map(card => (card.market_hash_name === hash ? { ...card, price_data: priceDataCleaned } : card)),
        )
      }

      return { success: true, price }
    } catch (error) {
      console.error('Error fetching card prices:', error)
      logEvent(`[Error] in fetchCardPrices: ${error}`)
      return { success: false }
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

  const isWithinSellLimits = (finalPrice: number): boolean => {
    const sellLimit = userSettings?.tradingCards?.sellLimit
    if (!sellLimit) return true

    const { min, max } = sellLimit
    return finalPrice >= min && finalPrice <= max
  }

  const isCardLocked = (cardId: string): boolean => {
    const storedLockedCards = localStorage.getItem('lockedTradingCards')
    if (!storedLockedCards) return false

    try {
      const lockedCards: string[] = JSON.parse(storedLockedCards)
      return lockedCards.includes(cardId)
    } catch {
      return false
    }
  }

  const handleSellSingleCard = async (assetId: string, itemId: string, price: number): Promise<void> => {
    try {
      const card = tradingCardsList.find(c => c.assetid === assetId)
      if (card && isCardLocked(card.id)) {
        showDangerToast(t('toast.tradingCards.cardLocked'))
        return
      }

      const credentials = userSettings?.cardFarming.credentials

      if (!credentials?.sid || !credentials?.sls) return showMissingCredentialsToast()

      const priceAdjustment = userSettings?.tradingCards?.priceAdjustment || 0.0
      const adjustedPrice = price + priceAdjustment

      // Check if price is within sell limits
      if (!isWithinSellLimits(adjustedPrice)) {
        const sellLimit = userSettings?.tradingCards?.sellLimit
        showDangerToast(
          t('toast.tradingCards.priceOutOfRange', {
            price: adjustedPrice.toFixed(2),
            min: sellLimit?.min?.toFixed(2) || '0.00',
            max: sellLimit?.max?.toFixed(2) || '∞',
          }),
        )
        logEvent(
          `[Info] Card ${assetId} price ${adjustedPrice} is outside sell limits (${sellLimit?.min}-${sellLimit?.max})`,
        )
        return
      }

      setLoadingListButton(true)

      // Format for the API - single card as an array item
      const cardForListing: [string, string] = [assetId, adjustedPrice.toString()]
      logEvent(`Card for listing: ${JSON.stringify(cardForListing)}`)

      const response = await invoke<InvokeListCards>('list_trading_cards', {
        sid: decrypt(credentials.sid),
        sls: decrypt(credentials.sls),
        sma: credentials?.sma,
        steamId: userSummary?.steamId,
        cards: [cardForListing],
      })

      if (response.successful && response.results && response.results.length > 0) {
        const result = response.results[0]

        if (result.success) {
          if (result.data?.needs_email_confirmation) {
            showSuccessToast(t('toast.tradingCards.emailConfirm', { count: 1 }))
          } else if (result.data?.needs_mobile_confirmation) {
            showSuccessToast(t('toast.tradingCards.mobileConfirm', { count: 1 }))
          } else {
            showSuccessToast(t('toast.tradingCards.listed', { count: 1 }))
          }
        } else {
          showDangerToast(t('common.error'))
          logEvent(`[Error] Failed to list trading card ${assetId}: ${result.message}`)
        }
      } else {
        showDangerToast(t('common.error'))
        logEvent(`[Error] Failed to list trading card: ${JSON.stringify(response)}`)
      }

      logEvent(`Complete listing result: ${JSON.stringify(response)}`)
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in handleSellSingleCard:', error)
      logEvent(`[Error] in handleSellSingleCard: ${error}`)
    } finally {
      setSelectedCards({})
      setChangedCardPrices({})
      setLoadingListButton(false)
    }
  }

  const handleSellSelectedCards = async (): Promise<void> => {
    try {
      const credentials = userSettings.cardFarming.credentials
      const sellDelay = userSettings?.tradingCards?.sellDelay || 3

      if (!credentials?.sid || !credentials?.sls) return showMissingCredentialsToast()

      const selectedAssetIds = Object.keys(selectedCards).filter(assetId => selectedCards[assetId])
      const cardsToSell = selectedAssetIds.filter(assetId => changedCardPrices[assetId] > 0)

      if (cardsToSell.length === 0) {
        return
      }

      // Filter out locked cards
      const unlockedCards = cardsToSell.filter(assetId => {
        const card = tradingCardsList.find(c => c.assetid === assetId)
        return !card || !isCardLocked(card.id)
      })

      const lockedCardsCount = cardsToSell.length - unlockedCards.length

      if (lockedCardsCount > 0) {
        showPrimaryToast(t('toast.tradingCards.skippedLockedCards', { count: lockedCardsCount }))
        logEvent(`[Info] Skipped ${lockedCardsCount} locked cards`)
      }

      if (unlockedCards.length === 0) {
        showDangerToast(t('toast.tradingCards.allCardsLocked'))
        return
      }

      const priceAdjustment = userSettings?.tradingCards?.priceAdjustment || 0.0

      // Filter cards based on sell limits
      const validCards = unlockedCards.filter(assetId => {
        const finalPrice = changedCardPrices[assetId] + priceAdjustment
        return isWithinSellLimits(finalPrice)
      })

      const skippedCards = cardsToSell.length - validCards.length

      if (validCards.length === 0) {
        showDangerToast(t('toast.tradingCards.allCardsOutOfRange'))
        return
      }

      if (skippedCards > 0) {
        showPrimaryToast(t('toast.tradingCards.skippedCards', { count: skippedCards }))
        logEvent(`[Info] Skipped ${skippedCards} cards due to sell limit restrictions`)
      }

      const cardsForBulkListing = validCards.map(assetId => [
        assetId,
        (changedCardPrices[assetId] + priceAdjustment).toString(),
      ]) as [string, string][]

      setLoadingListButton(true)
      showPrimaryToast(t('toast.tradingCards.processing'))
      logEvent(`Cards for listing: ${JSON.stringify(cardsForBulkListing)}`)

      const response = await invoke<InvokeListCards>('list_trading_cards', {
        sid: decrypt(credentials.sid),
        sls: decrypt(credentials.sls),
        sma: credentials?.sma,
        steamId: userSummary?.steamId,
        cards: cardsForBulkListing,
        delay: sellDelay,
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
      setLoadingListButton(false)
    }
  }

  const handleSellAllCards = async (): Promise<void> => {
    try {
      const credentials = userSettings?.cardFarming.credentials

      if (!credentials?.sid || !credentials?.sls) return showMissingCredentialsToast()

      setLoadingListButton(true)
      showPrimaryToast(t('toast.tradingCards.processing'))

      const priceAdjustment = userSettings?.tradingCards?.priceAdjustment || 0.0
      const sellDelay = userSettings?.tradingCards?.sellDelay || 3
      const successfulCards = []
      const failedCards = []
      const skippedCards = []
      let shouldContinue = true

      for (const card of tradingCardsList) {
        if (!shouldContinue) break

        // Skip locked cards
        if (isCardLocked(card.id)) {
          skippedCards.push(card.assetid)
          logEvent(`[Info] Skipped locked card ${card.assetid}`)
          continue
        }

        if (!card.market_hash_name) {
          logEvent(`[Error] Card ${card.assetid} doesn't have a market hash name - skipping`)
          continue
        }

        try {
          const priceResult = await fetchCardPrices(card.market_hash_name)

          if (!priceResult.success) {
            logEvent(`[Error] Failed to fetch price for card ${card.assetid} (${card.market_hash_name}) - skipping`)
            continue
          }

          if (!priceResult.price) {
            logEvent(`[Error] Couldn't determine price for card ${card.assetid} (${card.market_hash_name}) - skipping`)
            continue
          }

          await new Promise(resolve => setTimeout(resolve, sellDelay * 1000)) // Wait between listings to avoid rate limiting

          if (!shouldContinue) break

          const parsedPrice = priceResult.price.replace(/[^0-9.,]/g, '').replace(',', '.')
          const finalPrice = parseFloat(parsedPrice) + priceAdjustment

          // Check if price is within sell limits
          if (!isWithinSellLimits(finalPrice)) {
            skippedCards.push(card.assetid)
            logEvent(`[Info] Skipped card ${card.assetid} - price ${finalPrice} outside sell limits`)
            continue
          }

          const cardForListing: [string, string] = [card.assetid, finalPrice.toString()]

          const response = await invoke<InvokeListCards>('list_trading_cards', {
            sid: decrypt(credentials.sid),
            sls: decrypt(credentials.sls),
            sma: credentials?.sma,
            steamId: userSummary?.steamId,
            cards: [cardForListing],
          })

          if (response.successful && response.results && response.results.length > 0) {
            const result = response.results[0]
            if (result.success) {
              successfulCards.push(card.assetid)
            } else {
              failedCards.push({ assetid: card.assetid, message: result.message })

              if (result.message && result.message.toLowerCase().includes('rate limit')) {
                showDangerToast(t('toast.tradingCards.rateLimit'))
                shouldContinue = false
                break
              }
            }
          }

          await new Promise(resolve => setTimeout(resolve, sellDelay * 1000)) // Wait between listings to avoid rate limiting
        } catch (error) {
          failedCards.push({ assetid: card.assetid, message: String(error) })
          console.error(`Error processing card ${card.assetid}:`, error)
          logEvent(`[Error] processing card ${card.assetid}: ${error}`)
        }
      }

      if (successfulCards.length > 0) {
        showSuccessToast(t('toast.tradingCards.listed', { count: successfulCards.length }))
      }

      if (skippedCards.length > 0) {
        showPrimaryToast(t('toast.tradingCards.skippedCards', { count: skippedCards.length }))
        logEvent(`[Info] Skipped ${skippedCards.length} cards due to sell limit restrictions`)
      }

      if (failedCards.length > 0) {
        for (const failed of failedCards) {
          logEvent(`[Error] Failed to list trading card ${failed.assetid}: ${failed.message}`)
        }
      }
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in handleSellAllCards:', error)
      logEvent(`[Error] in handleSellAllCards: ${error}`)
    } finally {
      setLoadingListButton(false)
    }
  }

  const handleRemoveActiveListings = async (): Promise<void> => {
    try {
      const credentials = userSettings.cardFarming.credentials

      if (!credentials?.sid || !credentials?.sls) return showMissingCredentialsToast()

      // Validate credentials
      const validate = await invoke<InvokeValidateSession>('validate_session', {
        sid: decrypt(credentials.sid),
        sls: decrypt(credentials.sls),
        sma: credentials?.sma,
        steamid: userSummary?.steamId,
      })

      if (!validate.user) return showIncorrectCredentialsToast()

      setLoadingRemoveListings(true)
      showPrimaryToast(t('toast.tradingCards.processing'))

      const response = await invoke<InvokeRemoveListings>('remove_market_listings', {
        sid: decrypt(credentials.sid),
        sls: decrypt(credentials.sls),
        sma: credentials?.sma,
        steamId: userSummary?.steamId,
      })

      if (response.successful_removals > 0) {
        showSuccessToast(
          t('toast.tradingCards.removedListings', {
            count: response.successful_removals,
            total: response.processed_listings,
          }),
        )

        // Refresh the trading cards list after removing listings
        await handleRefresh()
      } else if (response.processed_listings === 0) {
        showPrimaryToast(t('toast.tradingCards.noListings'))
      } else {
        showDangerToast(t('toast.tradingCards.failedRemove'))
      }

      logEvent(`Remove listings result: ${JSON.stringify(response)}`)
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in handleRemoveActiveListings:', error)
      logEvent(`[Error] in handleRemoveActiveListings: ${error}`)
    } finally {
      setLoadingRemoveListings(false)
    }
  }

  const getCardPriceValue = (assetId: string): number => {
    return changedCardPrices[assetId] || 0
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
    tradingCardsList: sortedTradingCardsList,
    isLoading,
    loadingItemPrice,
    loadingListButton,
    loadingRemoveListings,
    changedCardPrices,
    selectedCards,
    fetchCardPrices,
    updateCardPrice,
    toggleCardSelection,
    handleSellSelectedCards,
    handleSellSingleCard,
    getCardPriceValue,
    refreshKey,
    handleRefresh,
    handleSellAllCards,
    handleRemoveActiveListings,
    cardSortStyle,
    setCardSortStyle,
  }
}
