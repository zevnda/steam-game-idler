import type { TradingCard } from '@/types'
import type { CSSProperties, ReactElement } from 'react'

import { Button, Checkbox, cn, NumberInput, Spinner } from '@heroui/react'
import { memo, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { SiExpertsexchange, SiSteam } from 'react-icons/si'
import { TbArrowsHorizontal, TbCaretDownFilled, TbCurrencyDollar, TbRefresh, TbShoppingBagCheck } from 'react-icons/tb'
import { FixedSizeList as List } from 'react-window'

import { useStateContext } from '@/components/contexts/StateContext'
import Beta from '@/components/ui/Beta'
import CustomTooltip from '@/components/ui/CustomTooltip'
import ExtLink from '@/components/ui/ExtLink'
import useTradingCardsList from '@/hooks/trading-cards/useTradingCardsList'

interface RowData {
  tradingCardsList: TradingCard[]
  changedCardPrices: Record<string, number>
  selectedCards: Record<string, boolean>
  loadingItemPrice: Record<string, boolean>
  updateCardPrice: (assetId: string, value: number) => void
  toggleCardSelection: (assetId: string) => void
  fetchCardPrices: (hash: string) => Promise<void>
  styles: CSSProperties
  t: (key: string) => string
}

interface RowProps {
  index: number
  style: CSSProperties
  data: RowData
}

const Row = memo(({ index, style, data }: RowProps): ReactElement | null => {
  const {
    tradingCardsList,
    changedCardPrices,
    selectedCards,
    loadingItemPrice,
    updateCardPrice,
    toggleCardSelection,
    fetchCardPrices,
    styles,
    t,
  } = data

  const item1 = tradingCardsList[index * 2]
  const item2 = tradingCardsList[index * 2 + 1]

  if (!item1 && !item2) return null

  const renderCard = (item: TradingCard): ReactElement | null => {
    if (!item) return null

    const getCardPriceValue = (assetId: string): number => {
      return changedCardPrices[assetId] || 0
    }

    return (
      <div key={item.assetid} className='relative bg-titlebar rounded-lg border border-border p-2 mb-2'>
        <div className='flex justify-between w-full h-full'>
          <div className='flex gap-2'>
            <CustomTooltip
              content={
                <div className='py-2'>
                  <Image
                    className='w-[150px] h-auto'
                    src={item.image}
                    width={224}
                    height={261}
                    alt={`${item.appname} image`}
                    priority={true}
                  />
                </div>
              }
              placement='right'
            >
              <div className='flex items-center justify-center w-[100px] bg-input border border-border p-1.5 rounded-lg'>
                <Image
                  className='w-[64px] h-[75px] border border-border'
                  src={item.image}
                  width={224}
                  height={261}
                  alt={`${item.appname} image`}
                  priority={true}
                />
              </div>
            </CustomTooltip>

            <div className='flex flex-col justify-between w-full h-full'>
              <div className='w-fit'>
                <div className='flex items-center gap-1'>
                  <p className='text-sm truncate max-w-[300px]'>{item.full_name || 'Unknown Card Name'}</p>

                  <CustomTooltip content={t('achievementManager.steam')} placement='top'>
                    <div>
                      <ExtLink href={`https://steamcommunity.com/market/listings/753/${item.market_hash_name}`}>
                        <div className='hover:bg-titlehover rounded-full p-1.5 cursor-pointer duration-200'>
                          <SiSteam fontSize={14} />
                        </div>
                      </ExtLink>
                    </div>
                  </CustomTooltip>

                  <CustomTooltip content={t('tradingCards.cardExchange')} placement='top'>
                    <div>
                      <ExtLink href={`https://www.steamcardexchange.net/index.php?gamepage-appid-${item.appid}`}>
                        <div className='hover:bg-titlehover rounded-full p-1.5 cursor-pointer duration-200'>
                          <SiExpertsexchange fontSize={14} />
                        </div>
                      </ExtLink>
                    </div>
                  </CustomTooltip>
                </div>

                <p className='text-xs text-altwhite truncate max-w-[300px]'>{item.appname}</p>
              </div>

              <div className='flex items-center gap-1 mt-2'>
                <NumberInput
                  hideStepper
                  isInvalid={selectedCards[item.assetid] && getCardPriceValue(item.assetid) <= 0}
                  size='sm'
                  value={getCardPriceValue(item.assetid)}
                  maxValue={99999}
                  defaultValue={0}
                  step={0.01}
                  formatOptions={{
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }}
                  aria-label='statistic value'
                  startContent={<TbCurrencyDollar className='text-altwhite' size={18} />}
                  className='w-[120px] mb-1'
                  classNames={{
                    inputWrapper: cn(
                      'bg-input border border-border hover:!bg-inputhover rounded-lg h-6',
                      'group-data-[focus-visible=true]:ring-transparent',
                      'group-data-[focus-visible=true]:ring-offset-transparent',
                      'group-data-[focus-within=true]:!bg-inputhover',
                      'border group-data-[invalid=true]:!border-red-500',
                      'border group-data-[invalid=true]:!bg-red-500/10',
                    ),
                    input: ['text-sm !text-content'],
                  }}
                  onValueChange={value => updateCardPrice(item.assetid, value)}
                />

                {item.price_data && (
                  <div className='flex flex-col justify-center items-center gap-1 text-xs'>
                    <div
                      className='flex items-center cursor-pointer hover:opacity-80'
                      onClick={() => {
                        if (item.price_data?.lowest_price) {
                          const price = parseFloat(item.price_data.lowest_price.replace('$', ''))
                          updateCardPrice(item.assetid, price)
                        } else {
                          updateCardPrice(item.assetid, 0)
                        }
                      }}
                    >
                      <TbCaretDownFilled className='text-danger' />
                      <p>{item.price_data.lowest_price || '$0.00'}</p>
                    </div>

                    <div
                      className='flex items-center cursor-pointer hover:opacity-80'
                      onClick={() => {
                        if (item.price_data?.median_price) {
                          const price = parseFloat(item.price_data.median_price.replace('$', ''))
                          updateCardPrice(item.assetid, price)
                        } else {
                          updateCardPrice(item.assetid, 0)
                        }
                      }}
                    >
                      <TbArrowsHorizontal className='text-success' />
                      <p>{item.price_data.median_price || '$0.00'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='flex flex-col justify-between items-end h-full'>
            <Checkbox
              name={item.assetid}
              isSelected={selectedCards[item.assetid] || false}
              onChange={() => toggleCardSelection(item.assetid)}
              classNames={{
                hiddenInput: 'w-fit',
                wrapper: cn(
                  styles,
                  'before:group-data-[selected=true]:!border-dynamic',
                  'after:bg-dynamic text-button-text m-0',
                ),
                label: 'hidden',
              }}
            />

            <CustomTooltip content={t('tradingCards.fetchPrice')} placement='left'>
              <Button
                size='sm'
                isIconOnly
                isLoading={loadingItemPrice[item.market_hash_name]}
                className='font-semibold rounded-lg bg-dynamic text-button-text'
                startContent={!loadingItemPrice[item.market_hash_name] && <TbCurrencyDollar fontSize={16} />}
                onPress={() => fetchCardPrices(item.market_hash_name)}
              />
            </CustomTooltip>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={style} className='grid grid-cols-2 gap-2 px-4'>
      {renderCard(item1)}
      {renderCard(item2)}
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
    tradingCardsList: tradingCardContext.tradingCardsList,
    changedCardPrices: tradingCardContext.changedCardPrices,
    selectedCards: tradingCardContext.selectedCards,
    loadingItemPrice: tradingCardContext.loadingItemPrice,
    updateCardPrice: tradingCardContext.updateCardPrice,
    toggleCardSelection: tradingCardContext.toggleCardSelection,
    fetchCardPrices: tradingCardContext.fetchCardPrices,
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
      <div
        className={cn(
          'fixed flex justify-between items-center w-[calc(100svw-68px)]',
          'py-2 pl-4 bg-base bg-opacity-90 backdrop-blur-md z-10 rounded-tl-xl',
          tradingCardContext.tradingCardsList?.length >= 21 ? 'pr-4' : 'pr-2',
        )}
      >
        <div className='flex justify-between items-center w-full select-none'>
          <div className='flex items-center gap-1'>
            <div className='flex flex-col justify-center'>
              <p className='text-lg font-bold'>
                {t('tradingCards.title')}
                <Beta />
              </p>
              <div className='flex gap-1'>
                <p className='text-sm text-altwhite'>{t('tradingCards.subtitle')}</p>
                <div
                  className='flex justify-center items-center cursor-pointer'
                  onClick={tradingCardContext.handleRefresh}
                >
                  <TbRefresh className='text-altwhite' fontSize={16} />
                </div>
              </div>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              size='sm'
              className='font-semibold rounded-lg bg-dynamic text-button-text'
              onPress={tradingCardContext.handleSellSelectedCards}
              isDisabled={selectedCardsWithPrice.length === 0}
              startContent={<TbShoppingBagCheck fontSize={20} />}
            >
              {t('tradingCards.list')} {selectedCardsWithPrice.length > 0 && `(${selectedCardsWithPrice.length})`}
            </Button>
          </div>
        </div>
      </div>

      {!tradingCardContext.isLoading ? (
        <div className='flex flex-col mt-[64px]'>
          <List
            height={windowInnerHeight - 110}
            itemCount={Math.ceil(tradingCardContext.tradingCardsList.length / 2)}
            itemSize={115}
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
