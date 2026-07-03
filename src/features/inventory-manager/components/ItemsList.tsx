import type { TradingCard } from '@/shared/types'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaCheckCircle } from 'react-icons/fa'
import { SiExpertsexchange } from 'react-icons/si'
import { TbLock, TbLockOpen } from 'react-icons/tb'
import { Checkbox, cn, Spinner } from '@heroui/react'
import Image from 'next/image'
import {
  FilterPanel,
  PageHeader,
  PriceData,
  PriceInput,
  useTradingCardsList,
} from '@/features/inventory-manager'
import { CustomTooltip, ExtLink } from '@/shared/components'
import { useSearchStore, useStateStore, useUserStore } from '@/shared/stores'

export const TradingCardsList = () => {
  const { t } = useTranslation()
  const tradingCardQueryValue = useSearchStore(state => state.tradingCardQueryValue)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const transitionDuration = useStateStore(state => state.transitionDuration)
  const userSettings = useUserStore(state => state.userSettings)
  const [lockedCards, setLockedCards] = useState<string[]>([])
  const [cardFilterValues, setCardFilterValues] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const tradingCardContext = useTradingCardsList()

  const CARDS_PER_PAGE = 54

  useEffect(() => {
    setCurrentPage(1)
  }, [tradingCardContext.cardSortStyle, cardFilterValues])

  useEffect(() => {
    const storedLockedCards = localStorage.getItem('lockedTradingCards')
    if (storedLockedCards) {
      setLockedCards(JSON.parse(storedLockedCards))
    }
  }, [])

  const handleLockCard = (id: string) => {
    setLockedCards(prev => {
      const newLockedCards = prev.includes(id)
        ? prev.filter(cardId => cardId !== id)
        : [...prev, id]
      localStorage.setItem('lockedTradingCards', JSON.stringify(newLockedCards))
      return newLockedCards
    })
  }

  const filteredTradingCardsList = useMemo(() => {
    let list = tradingCardContext.tradingCardsList

    if (tradingCardQueryValue) {
      list = list.filter(
        card =>
          card.full_name.toLowerCase().includes(tradingCardQueryValue.toLowerCase()) ||
          card.appname.toLowerCase().includes(tradingCardQueryValue.toLowerCase()),
      )
    }

    // By default hide locked items; include them only when the locked filter is active
    if (!cardFilterValues.has('locked')) {
      list = list.filter(card => !lockedCards.includes(card.assetid))
    }

    if (cardFilterValues.size === 0) return list

    const dupeMap: Record<string, number> = {}
    if (cardFilterValues.has('dupes')) {
      list.forEach(card => {
        dupeMap[card.market_hash_name] = (dupeMap[card.market_hash_name] || 0) + 1
      })
    }

    // Type filters (OR): card must match at least one selected type/class
    const typeFilterMap: Record<string, string> = {
      cards: 'item_class_2',
      backgrounds: 'item_class_3',
      emoticons: 'item_class_4',
      boosters: 'item_class_5',
      sale: 'item_class_10',
    }
    const activeTypeFilters = Object.keys(typeFilterMap).filter(k => cardFilterValues.has(k))
    const hasTypeFilter = activeTypeFilters.length > 0 || cardFilterValues.has('foil')

    // Attribute filters (AND): narrow down whatever the type filters matched
    return list.filter(card => {
      if (hasTypeFilter) {
        const matchesType = activeTypeFilters.some(k => card.item_type === typeFilterMap[k])
        const matchesFoil = cardFilterValues.has('foil') && card.foil
        if (!matchesType && !matchesFoil) return false
      }
      if (cardFilterValues.has('badge') && !(card.badge_level > 0)) return false
      if (cardFilterValues.has('dupes') && !(dupeMap[card.market_hash_name] > 1)) return false
      if (cardFilterValues.has('locked') && !lockedCards.includes(card.assetid)) return false
      return true
    })
  }, [tradingCardContext.tradingCardsList, tradingCardQueryValue, cardFilterValues, lockedCards])

  const totalPages = Math.ceil(filteredTradingCardsList.length / CARDS_PER_PAGE)

  const paginatedCards = useMemo(
    () =>
      filteredTradingCardsList.slice(
        (currentPage - 1) * CARDS_PER_PAGE,
        currentPage * CARDS_PER_PAGE,
      ),
    [filteredTradingCardsList, currentPage],
  )

  const selectedCardsWithPrice = useMemo(
    () =>
      Object.keys(tradingCardContext.selectedCards).filter(
        id => tradingCardContext.selectedCards[id] && tradingCardContext.changedCardPrices[id] > 0,
      ),
    [tradingCardContext.selectedCards, tradingCardContext.changedCardPrices],
  )

  const renderCard = (item: TradingCard) => {
    if (!item) return null

    const isLocked = lockedCards.includes(item.assetid)
    const isFoil = item.foil

    return (
      <div
        key={item.assetid}
        className={cn(
          'flex flex-col justify-start items-center bg-sidebar rounded-xl border border-border p-2',
          lockedCards.includes(item.assetid) && 'opacity-50',
          isFoil && 'holo-bg',
        )}
      >
        <div className='relative flex justify-between items-center w-full mb-2'>
          <Checkbox
            isDisabled={isLocked}
            size='sm'
            name={item.assetid}
            isSelected={(!isLocked && tradingCardContext.selectedCards[item.assetid]) || false}
            onChange={() => tradingCardContext.toggleCardSelection(item.assetid)}
            classNames={{
              hiddenInput: 'w-fit',
              wrapper: cn(
                'before:group-data-[selected=true]:!border-dynamic',
                'before:border-altwhite after:bg-dynamic m-0',
              ),
              label: 'hidden',
            }}
          />

          <div className='flex items-center gap-1'>
            <CustomTooltip content={t('tradingCards.lockCard')} placement='top'>
              <div
                className='hover:bg-item-hover rounded-full p-1 cursor-pointer duration-200'
                onClick={() => handleLockCard(item.assetid)}
              >
                {isLocked ? (
                  <TbLock fontSize={14} className='text-yellow-500' />
                ) : (
                  <TbLockOpen fontSize={14} />
                )}
              </div>
            </CustomTooltip>

            <CustomTooltip content={t('tradingCards.cardExchange')} placement='top'>
              <div>
                <ExtLink
                  href={`https://www.steamcardexchange.net/index.php?gamepage-appid-${item.appid}`}
                >
                  <div className='hover:bg-item-hover rounded-full p-1.5 cursor-pointer duration-200'>
                    <SiExpertsexchange fontSize={10} />
                  </div>
                </ExtLink>
              </div>
            </CustomTooltip>
          </div>
        </div>

        <div className='flex items-center justify-center p-1.5'>
          <Image
            className='w-30 h-30 object-contain'
            src={item.image}
            width={224}
            height={261}
            alt={`${item.appname} image`}
            priority={true}
          />
        </div>

        <div className='flex flex-col items-center justify-center gap-0.5 mt-2'>
          <p className='text-xs truncate max-w-35'>
            {item.full_name.replace('(Trading Card)', '') || 'Unknown'}
          </p>

          {item.item_type === 'item_class_2' ? (
            <CustomTooltip
              content={
                item.badge_level > 0
                  ? t('tradingCards.badgeLevel', { level: item.badge_level })
                  : t('tradingCards.noBadge')
              }
              placement='top'
              important
            >
              <div className='flex items-center justify-center gap-1'>
                {item.badge_level > 0 && (
                  <div className='flex items-center justify-center'>
                    <FaCheckCircle size={12} className='text-green-400' />
                  </div>
                )}
                <p
                  className={cn(
                    'text-xs text-altwhite truncate max-w-35',
                    item.badge_level > 0 && 'text-green-400',
                  )}
                >
                  {item.appname}
                </p>
              </div>
            </CustomTooltip>
          ) : (
            <p className='text-xs text-altwhite truncate max-w-35'>{item.appname}</p>
          )}
        </div>

        <PriceInput item={item} tradingCardContext={tradingCardContext} isLocked={isLocked} />

        <PriceData item={item} tradingCardContext={tradingCardContext} isLocked={isLocked} />
      </div>
    )
  }

  return (
    <div
      key={tradingCardContext.refreshKey}
      className={cn(
        'flex flex-col h-calc mt-12 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width',
      }}
    >
      <PageHeader
        selectedCardsWithPrice={selectedCardsWithPrice}
        tradingCardContext={tradingCardContext}
        filteredTradingCardsList={filteredTradingCardsList}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        lockedCards={lockedCards}
      />

      <div className='flex flex-1 min-h-0'>
        <FilterPanel
          tradingCardContext={tradingCardContext}
          cardFilterValues={cardFilterValues}
          setCardFilterValues={setCardFilterValues}
        />

        <div className='h-full overflow-y-auto overflow-x-hidden flex-1 min-w-0'>
          {!userSettings.cardFarming.credentials ? (
            <div className='flex flex-col justify-center items-center gap-2 h-full'>
              <p className='text-sm text-altwhite px-6'>{t('settings.tradingCards.alert')}</p>
            </div>
          ) : !tradingCardContext.isLoading ? (
            <div className='flex flex-col'>
              <div className='grid gap-4 pr-6 pt-2 grid-cols-[repeat(auto-fill,minmax(190px,1fr))]'>
                {paginatedCards.map(item => renderCard(item))}
              </div>
            </div>
          ) : (
            <div className='flex justify-center items-center w-full h-full'>
              <Spinner variant='simple' />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
