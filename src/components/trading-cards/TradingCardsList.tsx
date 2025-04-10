import type { TradingCard } from '@/types'
import type { CSSProperties, ReactElement } from 'react'

import { Checkbox, cn, Spinner } from '@heroui/react'
import { memo, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { SiExpertsexchange } from 'react-icons/si'
import { FixedSizeList as List } from 'react-window'

import { useStateContext } from '@/components/contexts/StateContext'
import PageHeader from '@/components/trading-cards/PageHeader'
import PriceData from '@/components/trading-cards/PriceData'
import PriceInput from '@/components/trading-cards/PriceInput'
import CustomTooltip from '@/components/ui/CustomTooltip'
import ExtLink from '@/components/ui/ExtLink'
import useTradingCardsList from '@/hooks/trading-cards/useTradingCardsList'

interface RowData {
  tradingCardContext: ReturnType<typeof useTradingCardsList>
  styles: CSSProperties
  t: (key: string) => string
}

interface RowProps {
  index: number
  style: CSSProperties
  data: RowData
}

const Row = memo(({ index, style, data }: RowProps): ReactElement | null => {
  const { tradingCardContext, styles, t } = data

  const item1 = tradingCardContext.tradingCardsList[index * 6]
  const item2 = tradingCardContext.tradingCardsList[index * 6 + 1]
  const item3 = tradingCardContext.tradingCardsList[index * 6 + 2]
  const item4 = tradingCardContext.tradingCardsList[index * 6 + 3]
  const item5 = tradingCardContext.tradingCardsList[index * 6 + 4]
  const item6 = tradingCardContext.tradingCardsList[index * 6 + 5]

  if (!item1 && !item2 && !item3 && !item4 && !item5 && !item6) return null

  const renderCard = (item: TradingCard): ReactElement | null => {
    if (!item) return null

    return (
      <div
        key={item.assetid}
        className='flex flex-col justify-start items-center bg-titlebar mb-4 rounded-lg border border-border p-2'
      >
        <div className='relative flex justify-between items-center w-full mb-2'>
          <div className='absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center'>
            <p className='text-sm truncate max-w-[120px]'>
              {item.full_name.replace('(Trading Card)', '') || 'Unknown'}
            </p>
          </div>

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

          <CustomTooltip content={t('tradingCards.cardExchange')} placement='top'>
            <div>
              <ExtLink href={`https://www.steamcardexchange.net/index.php?gamepage-appid-${item.appid}`}>
                <div className='hover:bg-titlehover rounded-full p-1.5 cursor-pointer duration-200'>
                  <SiExpertsexchange fontSize={10} />
                </div>
              </ExtLink>
            </div>
          </CustomTooltip>
        </div>

        <div className='flex items-center justify-between bg-input rounded-lg p-1.5 border border-border'>
          <Image
            className='w-[150px] h-auto border border-border'
            src={item.image}
            width={224}
            height={261}
            alt={`${item.appname} image`}
            priority={true}
          />
        </div>

        <div className='flex flex-col items-center justify-center mt-2'>
          <p className='text-xs text-altwhite truncate max-w-[140px]'>{item.appname}</p>
        </div>

        <PriceInput item={item} tradingCardContext={tradingCardContext} />

        <PriceData item={item} tradingCardContext={tradingCardContext} />
      </div>
    )
  }

  return (
    <div style={style} className='grid grid-cols-6 gap-4 px-4 mt-[72px]'>
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
  const { isDarkMode } = useStateContext()
  const [styles, setStyles] = useState({})
  const [windowInnerHeight, setWindowInnerHeight] = useState(0)
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

  const itemData: RowData = {
    tradingCardContext,
    styles,
    t,
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
        'w-calc min-h-calc max-h-calc bg-base overflow-y-auto',
        'overflow-x-hidden rounded-tl-xl border-t border-l border-border',
      )}
      key={tradingCardContext.refreshKey}
    >
      <PageHeader selectedCardsWithPrice={selectedCardsWithPrice} tradingCardContext={tradingCardContext} />

      {!tradingCardContext.isLoading ? (
        <div className='flex flex-col'>
          <List
            height={windowInnerHeight - 49}
            itemCount={Math.ceil(tradingCardContext.tradingCardsList.length / 6)}
            itemSize={355}
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
