import type { TradingCard } from '@/types'
import type { CSSProperties, ReactElement } from 'react'

import { Checkbox, cn, Spinner } from '@heroui/react'
import { memo, useEffect, useMemo, useState } from 'react'
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
  tradingCardContext: ReturnType<typeof useTradingCardsList> & { filteredTradingCardsList: TradingCard[] }
  styles: CSSProperties
  t: (key: string) => string
  lockedCards: string[]
  handleLockCard: (id: string) => void
}

interface RowProps {
  index: number
  style: CSSProperties
  data: RowData
}

const Row = memo(({ index, style, data }: RowProps): ReactElement | null => {
  const { tradingCardContext, styles, t, lockedCards, handleLockCard } = data

  const item1 = tradingCardContext.filteredTradingCardsList[index * 6]
  const item2 = tradingCardContext.filteredTradingCardsList[index * 6 + 1]
  const item3 = tradingCardContext.filteredTradingCardsList[index * 6 + 2]
  const item4 = tradingCardContext.filteredTradingCardsList[index * 6 + 3]
  const item5 = tradingCardContext.filteredTradingCardsList[index * 6 + 4]
  const item6 = tradingCardContext.filteredTradingCardsList[index * 6 + 5]

  if (!item1 && !item2 && !item3 && !item4 && !item5 && !item6) return null

  const renderCard = (item: TradingCard): ReactElement | null => {
    if (!item) return null

    const isLocked = lockedCards.includes(item.id)

    return (
      <div
        key={item.assetid}
        className={cn(
          'flex flex-col justify-start items-center bg-sidebar mb-4 rounded-lg border border-border p-2',
          lockedCards.includes(item.id) && 'opacity-50',
        )}
      >
        <div className='relative flex justify-between items-center w-full mb-2'>
          <Checkbox
            size='sm'
            name={item.assetid}
            isSelected={tradingCardContext.selectedCards[item.assetid] || false}
            onChange={() => tradingCardContext.toggleCardSelection(item.assetid)}
            classNames={{
              hiddenInput: 'w-fit',
              wrapper: cn(
                styles,
                'before:group-data-[selected=true]:!border-dynamic before:border-altwhite',
                'after:bg-dynamic text-button-text m-0',
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
          <div className='flex items-center justify-between bg-input rounded-lg p-1.5 border border-border'>
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
          <p className='text-xs truncate max-w-[140px]'>{item.full_name.replace('(Trading Card)', '') || 'Unknown'}</p>

          <CustomTooltip
            content={item.badge_level > 0 ? 'Badge Level: ' + item.badge_level : 'No Badge'}
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
                className={cn('text-xs text-altwhite truncate max-w-[140px]', item.badge_level > 0 && 'text-green-400')}
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
    <div style={style} className='grid grid-cols-6 gap-4 px-4 pt-2'>
      {renderCard(item1)}
      {renderCard(item2)}
      {renderCard(item3)}
      {renderCard(item4)}
      {renderCard(item5)}
      {renderCard(item6)}
    </div>
  )
})

Row.displayName = 'Row'

export default function TradingCardsList(): ReactElement {
  const { t } = useTranslation()
  const { tradingCardQueryValue } = useSearchContext()
  const { isDarkMode, sidebarCollapsed } = useStateContext()
  const [styles, setStyles] = useState({})
  const [windowInnerHeight, setWindowInnerHeight] = useState(0)
  const [lockedCards, setLockedCards] = useState<string[]>([])
  const tradingCardContext = useTradingCardsList()

  useEffect(() => {
    setStyles(isDarkMode ? 'group-data-[hover=true]:before:bg-white/20' : 'group-data-[hover=true]:before:bg-black/20')
  }, [isDarkMode])

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

  const handleLockCard = (id: string): void => {
    setLockedCards(prev => {
      const newLockedCards = prev.includes(id) ? prev.filter(cardId => cardId !== id) : [...prev, id]
      localStorage.setItem('lockedTradingCards', JSON.stringify(newLockedCards))
      return newLockedCards
    })
  }

  const filteredTradingCardsList = useMemo(
    () =>
      tradingCardContext.tradingCardsList.filter(
        card =>
          card.full_name.toLowerCase().includes(tradingCardQueryValue.toLowerCase()) ||
          card.appname.toLowerCase().includes(tradingCardQueryValue.toLowerCase()),
      ),
    [tradingCardContext.tradingCardsList, tradingCardQueryValue],
  )

  const itemData: RowData = {
    tradingCardContext: {
      ...tradingCardContext,
      filteredTradingCardsList,
    },
    styles,
    t,
    lockedCards,
    handleLockCard,
  }

  const selectedCardsWithPrice = useMemo(
    () =>
      Object.keys(tradingCardContext.selectedCards).filter(
        id => tradingCardContext.selectedCards[id] && tradingCardContext.changedCardPrices[id] > 0,
      ),
    [tradingCardContext.selectedCards, tradingCardContext.changedCardPrices],
  )

  return (
    <div
      className={cn(
        'min-h-calc max-h-calc bg-base overflow-y-auto overflow-hidden mt-9 duration-500 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-217px)]',
      )}
      key={tradingCardContext.refreshKey}
    >
      <PageHeader selectedCardsWithPrice={selectedCardsWithPrice} tradingCardContext={tradingCardContext} />

      {!tradingCardContext.isLoading ? (
        <div className='flex flex-col'>
          <List
            height={windowInnerHeight - 168}
            itemCount={Math.ceil(filteredTradingCardsList.length / 6)}
            itemSize={309}
            width='100%'
            itemData={itemData}
          >
            {Row}
          </List>
        </div>
      ) : (
        <div className='flex justify-center items-center w-calc h-[calc(100vh-57px)]'>
          <Spinner variant='simple' />
        </div>
      )}
    </div>
  )
}
