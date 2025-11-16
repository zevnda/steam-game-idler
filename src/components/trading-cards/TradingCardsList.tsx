import type { TradingCard } from '@/types'
import type { ReactElement } from 'react'

import { Checkbox, cn, Spinner } from '@heroui/react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { FaCheckCircle } from 'react-icons/fa'
import { SiExpertsexchange } from 'react-icons/si'
import { TbLock, TbLockOpen } from 'react-icons/tb'
import { FixedSizeList as List } from 'react-window'

import { useSearchContext } from '@/components/contexts/SearchContext'
import { useStateContext } from '@/components/contexts/StateContext'
import PageHeader from '@/components/trading-cards/PageHeader'
import PriceData from '@/components/trading-cards/PriceData'
import PriceInput from '@/components/trading-cards/PriceInput'
import CustomTooltip from '@/components/ui/CustomTooltip'
import ExtLink from '@/components/ui/ExtLink'
import useTradingCardsList from '@/hooks/trading-cards/useTradingCardsList'

interface RowData {
  filteredTradingCardsList: TradingCard[]
  selectedCards: Record<string, boolean>
  changedCardPrices: Record<string, number>
  lockedCards: string[]
  cardsPerRow: number
  tradingCardContext: ReturnType<typeof useTradingCardsList>
  t: (key: string, options?: Record<string, number>) => string
  handleLockCard: (id: string) => void
}

interface RowProps {
  index: number
  data: RowData
  style: React.CSSProperties
}

const Row = memo(
  ({ index, data, style }: RowProps): ReactElement | null => {
    const { filteredTradingCardsList, selectedCards, lockedCards, cardsPerRow, tradingCardContext, t, handleLockCard } =
      data

    const items = []
    for (let i = 0; i < cardsPerRow; i++) {
      const item = filteredTradingCardsList[index * cardsPerRow + i]
      items.push(item)
    }

    if (items.every(item => !item)) return null

    const renderCard = (item: TradingCard): ReactElement | null => {
      if (!item) return null

      const isLocked = lockedCards.includes(item.id)
      const isFoil = item.foil

      return (
        <div
          key={item.assetid}
          className={cn(
            'flex flex-col justify-start items-center bg-sidebar mb-2 rounded-lg border border-border p-2',
            lockedCards.includes(item.id) && 'opacity-50',
            isFoil && 'holo-bg',
          )}
        >
          <div className='relative flex justify-between items-center w-full mb-2'>
            <Checkbox
              size='sm'
              name={item.assetid}
              isSelected={selectedCards[item.assetid] || false}
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
                  onClick={() => handleLockCard(item.id)}
                >
                  {isLocked ? <TbLock fontSize={14} className='text-yellow-500' /> : <TbLockOpen fontSize={14} />}
                </div>
              </CustomTooltip>

              <CustomTooltip content={t('tradingCards.cardExchange')} placement='top'>
                <div>
                  <ExtLink href={`https://www.steamcardexchange.net/index.php?gamepage-appid-${item.appid}`}>
                    <div className='hover:bg-item-hover rounded-full p-1.5 cursor-pointer duration-200'>
                      <SiExpertsexchange fontSize={10} />
                    </div>
                  </ExtLink>
                </div>
              </CustomTooltip>
            </div>
          </div>

          <CustomTooltip
            important
            placement='right'
            content={
              <div className='py-2'>
                <Image
                  className='w-[150px] h-auto border border-border'
                  src={item.image}
                  width={224}
                  height={261}
                  alt={`${item.appname} image`}
                  priority={true}
                />
              </div>
            }
          >
            <div className='flex items-center justify-center bg-input rounded-lg p-1.5 border border-border'>
              <Image
                className='w-[80px] h-auto border border-border'
                src={item.image}
                width={224}
                height={261}
                alt={`${item.appname} image`}
                priority={true}
              />
            </div>
          </CustomTooltip>

          <div className='flex flex-col items-center justify-center gap-0.5 mt-2'>
            <p className='text-xs truncate max-w-[140px]'>
              {item.full_name.replace('(Trading Card)', '') || 'Unknown'}
            </p>

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
                    'text-xs text-altwhite truncate max-w-[140px]',
                    item.badge_level > 0 && 'text-green-400',
                  )}
                >
                  {item.appname}
                </p>
              </div>
            </CustomTooltip>
          </div>

          <PriceInput item={item} tradingCardContext={tradingCardContext} />

          <PriceData item={item} tradingCardContext={tradingCardContext} />
        </div>
      )
    }

    return (
      <div style={style} className={`grid gap-4 px-6 pt-2 ${cardsPerRow === 9 ? 'grid-cols-9' : 'grid-cols-6'}`}>
        {items.map((item, idx) => renderCard(item))}
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    if (prevProps.index !== nextProps.index) return false
    if (prevProps.data.cardsPerRow !== nextProps.data.cardsPerRow) return false

    // Check if the actual cards in this row have changed
    const prevCards = []
    const nextCards = []
    const cardsPerRow = prevProps.data.cardsPerRow || 6

    for (let i = 0; i < cardsPerRow; i++) {
      prevCards.push(prevProps.data.filteredTradingCardsList[prevProps.index * cardsPerRow + i])
      nextCards.push(nextProps.data.filteredTradingCardsList[nextProps.index * cardsPerRow + i])
    }

    // Compare cards by their assetids
    for (let i = 0; i < cardsPerRow; i++) {
      const prevCard = prevCards[i]
      const nextCard = nextCards[i]

      if (prevCard?.assetid !== nextCard?.assetid) return false

      // If card exists, check relevant properties
      if (prevCard && nextCard) {
        // Check if selection state changed
        if (prevProps.data.selectedCards[prevCard.assetid] !== nextProps.data.selectedCards[nextCard.assetid]) {
          return false
        }

        // Check if price changed
        if (prevProps.data.changedCardPrices[prevCard.assetid] !== nextProps.data.changedCardPrices[nextCard.assetid]) {
          return false
        }

        // Check if locked state changed
        if (prevProps.data.lockedCards.includes(prevCard.id) !== nextProps.data.lockedCards.includes(nextCard.id)) {
          return false
        }
      }
    }

    return true // Props are equal, don't re-render
  },
)

Row.displayName = 'Row'

export default function TradingCardsList(): ReactElement {
  const { t } = useTranslation()
  const { tradingCardQueryValue } = useSearchContext()
  const { sidebarCollapsed, transitionDuration } = useStateContext()
  const [windowInnerHeight, setWindowInnerHeight] = useState(0)
  const [lockedCards, setLockedCards] = useState<string[]>([])
  const [cardsPerRow, setCardsPerRow] = useState(6)
  const tradingCardContext = useTradingCardsList()

  useEffect(() => {
    setWindowInnerHeight(window.innerHeight)

    const handleResize = (): void => {
      setWindowInnerHeight(window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const storedLockedCards = localStorage.getItem('lockedTradingCards')
    if (storedLockedCards) {
      setLockedCards(JSON.parse(storedLockedCards))
    }
  }, [])

  useEffect(() => {
    const updateCardsPerRow = (): void => {
      setCardsPerRow(window.innerWidth >= 1536 ? 9 : 6)
    }
    updateCardsPerRow()
    window.addEventListener('resize', updateCardsPerRow)
    return () => window.removeEventListener('resize', updateCardsPerRow)
  }, [])

  const handleLockCard = useCallback((id: string): void => {
    setLockedCards(prev => {
      const newLockedCards = prev.includes(id) ? prev.filter(cardId => cardId !== id) : [...prev, id]
      localStorage.setItem('lockedTradingCards', JSON.stringify(newLockedCards))
      return newLockedCards
    })
  }, [])

  const filteredTradingCardsList = useMemo(
    () =>
      tradingCardContext.tradingCardsList.filter(
        card =>
          card.full_name.toLowerCase().includes(tradingCardQueryValue.toLowerCase()) ||
          card.appname.toLowerCase().includes(tradingCardQueryValue.toLowerCase()),
      ),
    [tradingCardContext.tradingCardsList, tradingCardQueryValue],
  )

  const itemData: RowData = useMemo(
    () => ({
      filteredTradingCardsList,
      selectedCards: tradingCardContext.selectedCards,
      changedCardPrices: tradingCardContext.changedCardPrices,
      lockedCards,
      cardsPerRow,
      tradingCardContext,
      t,
      handleLockCard,
    }),
    [filteredTradingCardsList, lockedCards, cardsPerRow, tradingCardContext, t, handleLockCard],
  )

  const selectedCardsWithPrice = useMemo(
    () =>
      Object.keys(tradingCardContext.selectedCards).filter(
        id => tradingCardContext.selectedCards[id] && tradingCardContext.changedCardPrices[id] > 0,
      ),
    [tradingCardContext.selectedCards, tradingCardContext.changedCardPrices],
  )

  return (
    <div
      key={tradingCardContext.refreshKey}
      className={cn(
        'min-h-calc max-h-calc overflow-y-auto overflow-x-hidden mt-9 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width',
      }}
    >
      <PageHeader selectedCardsWithPrice={selectedCardsWithPrice} tradingCardContext={tradingCardContext} />

      {!tradingCardContext.isLoading ? (
        <div className='flex flex-col'>
          <List
            key={tradingCardContext.cardSortStyle + '-' + tradingCardQueryValue + '-' + cardsPerRow}
            height={windowInnerHeight - 224}
            itemCount={Math.ceil(filteredTradingCardsList.length / cardsPerRow)}
            itemSize={300}
            width='100%'
            itemData={itemData}
          >
            {Row}
          </List>
        </div>
      ) : (
        <div className='flex justify-center items-center w-calc h-[calc(100vh-224px)]'>
          <Spinner variant='simple' />
        </div>
      )}
    </div>
  )
}
