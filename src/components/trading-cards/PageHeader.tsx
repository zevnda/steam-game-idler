import type useTradingCardsList from '@/hooks/trading-cards/useTradingCardsList'
import type { cardSortOption } from '@/types'
import type { ReactElement } from 'react'

import { Button, cn, Divider, Tab, Tabs, useDisclosure } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbChecks, TbEraser, TbPackageExport, TbX } from 'react-icons/tb'

import { useSearchContext } from '@/components/contexts/SearchContext'
import CustomModal from '@/components/ui/CustomModal'

// Helper function to format seconds to HH:MM:SS
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':')
}

interface PageHeaderProps {
  selectedCardsWithPrice: string[]
  tradingCardContext: ReturnType<typeof useTradingCardsList>
}

export default function PageHeader({ selectedCardsWithPrice, tradingCardContext }: PageHeaderProps): ReactElement {
  const { t } = useTranslation()
  const { tradingCardQueryValue, setTradingCardQueryValue } = useSearchContext()
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onOpenChange: onConfirmOpenChange } = useDisclosure()
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onOpenChange: onBulkOpenChange } = useDisclosure()
  const { isOpen: isRemoveOpen, onOpen: onRemoveOpen, onOpenChange: onRemoveOpenChange } = useDisclosure()

  const handleCardSorting = (key: string): void => {
    tradingCardContext.setCardSortStyle?.(key)
  }

  const cardSortOptions: cardSortOption[] = [
    { key: 'a-z', label: t('tradingCards.sort.cardNameAsc') },
    { key: 'z-a', label: t('tradingCards.sort.cardNameDesc') },
    { key: 'aa-zz', label: t('tradingCards.sort.gameNameAsc') },
    { key: 'zz-aa', label: t('tradingCards.sort.gameNameDesc') },
    { key: 'badge', label: t('tradingCards.sort.badge') },
    { key: 'foil', label: t('tradingCards.sort.foils') },
    { key: 'dupes', label: t('tradingCards.sort.duplicates') },
  ]

  return (
    <>
      <div
        className={cn(
          'w-[calc(100vw-227px)] z-[50] pl-4 pt-2',
          tradingCardContext.tradingCardsList?.length >= 21 ? 'pr-4' : 'pr-2',
        )}
      >
        <div className='flex justify-between items-center pb-3'>
          <div className='flex items-center gap-1 select-none'>
            <div className='flex flex-col justify-center'>
              <p className='text-3xl font-black'>{t('tradingCards.title')}</p>
              <p className='text-xs text-altwhite my-2'>{t('tradingCards.subtitle')}</p>

              <div className='flex flex-col justify-center gap-2 mt-1'>
                <div className='flex items-center gap-2 mt-1'>
                  <p className='text-sm text-altwhite font-bold'>{t('common.sortBy')}</p>

                  <Tabs
                    aria-label='sort options'
                    items={cardSortOptions}
                    selectedKey={tradingCardContext.cardSortStyle}
                    radius='full'
                    classNames={{
                      tabList: 'gap-0 w-full bg-tab-panel',
                      tab: cn(
                        'data-[hover-unselected=true]:!bg-item-hover',
                        'data-[hover-unselected=true]:opacity-100',
                      ),
                      tabContent: 'text-sm group-data-[selected=true]:text-content text-altwhite font-bold',
                      cursor: '!bg-item-active w-full',
                    }}
                    onSelectionChange={key => {
                      handleCardSorting(key as string)
                    }}
                  >
                    {item => <Tab key={item.key} title={item.label} />}
                  </Tabs>
                </div>

                <div className='flex items-center gap-2 mt-1'>
                  <Button
                    className='bg-btn-secondary text-btn-text font-bold'
                    radius='full'
                    onPress={() => tradingCardContext.handleRefresh()}
                  >
                    {t('setup.refresh')}
                  </Button>

                  <Button
                    className='bg-btn-secondary text-btn-text font-bold'
                    radius='full'
                    isDisabled={selectedCardsWithPrice.length === 0}
                    isLoading={tradingCardContext.loadingListButton}
                    startContent={!tradingCardContext.loadingListButton && <TbChecks fontSize={20} />}
                    onPress={onConfirmOpen}
                  >
                    {t('tradingCards.list')} {selectedCardsWithPrice.length > 0 && `(${selectedCardsWithPrice.length})`}
                  </Button>

                  <Button
                    className='bg-btn-secondary text-btn-text font-bold'
                    radius='full'
                    isDisabled={tradingCardContext.tradingCardsList.length === 0}
                    isLoading={tradingCardContext.loadingListButton}
                    startContent={!tradingCardContext.loadingListButton && <TbPackageExport fontSize={20} />}
                    onPress={onBulkOpen}
                  >
                    {t('tradingCards.bulk', { count: tradingCardContext.tradingCardsList?.length || 0 })}
                  </Button>

                  <Button
                    className='font-bold'
                    radius='full'
                    color='danger'
                    isLoading={tradingCardContext.loadingRemoveListings}
                    startContent={!tradingCardContext.loadingRemoveListings && <TbEraser fontSize={20} />}
                    onPress={onRemoveOpen}
                  >
                    {t('tradingCards.remove')}
                  </Button>

                  {tradingCardQueryValue && (
                    <div className='flex items-center gap-2'>
                      <Divider orientation='vertical' className='mx-2 h-8 bg-border' />
                      <p className='text-sm text-altwhite font-bold'>Search</p>
                      <div className='flex items-center gap-2 text-sm text-altwhite p-2 bg-item-active rounded-full max-w-44'>
                        <p className='text-content truncate'>{tradingCardQueryValue}</p>
                        <div
                          className='flex items-center justify-center cursor-pointer bg-item-hover hover:bg-item-hover/80 rounded-full p-1 duration-150'
                          onClick={() => setTradingCardQueryValue('')}
                        >
                          <TbX />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CustomModal
        isOpen={isConfirmOpen}
        onOpenChange={onConfirmOpenChange}
        title={t('common.notice')}
        body={
          <div className='whitespace-pre-line'>
            {t('tradingCards.confirm', {
              time: formatTime(Number(selectedCardsWithPrice.length) * 1.5),
              count: Number(selectedCardsWithPrice.length),
            })}
          </div>
        }
        buttons={
          <>
            <Button
              size='sm'
              color='danger'
              variant='light'
              radius='full'
              className='font-semibold'
              onPress={onConfirmOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              onPress={() => {
                tradingCardContext.handleSellSelectedCards()
                onConfirmOpenChange()
              }}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />

      <CustomModal
        isOpen={isBulkOpen}
        onOpenChange={onBulkOpenChange}
        title={t('common.notice')}
        body={
          <div className='whitespace-pre-line'>
            {t('tradingCards.confirmBulk', {
              time: formatTime(Number(tradingCardContext.tradingCardsList?.length) * 3),
              count: Number(tradingCardContext.tradingCardsList?.length),
            })}
          </div>
        }
        buttons={
          <>
            <Button
              size='sm'
              color='danger'
              variant='light'
              radius='full'
              className='font-semibold'
              onPress={onBulkOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              onPress={() => {
                tradingCardContext.handleSellAllCards()
                onBulkOpenChange()
              }}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />

      <CustomModal
        isOpen={isRemoveOpen}
        onOpenChange={onRemoveOpenChange}
        title={t('common.notice')}
        body={
          <div className='whitespace-pre-line'>
            {t('tradingCards.confirmRemove', {
              time: formatTime(Number(tradingCardContext.tradingCardsList?.length) * 3),
              count: Number(tradingCardContext.tradingCardsList?.length),
            })}
          </div>
        }
        buttons={
          <>
            <Button
              size='sm'
              color='danger'
              variant='light'
              radius='full'
              className='font-semibold'
              onPress={onRemoveOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              onPress={() => {
                tradingCardContext.handleRemoveActiveListings()
                onRemoveOpenChange()
              }}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />
    </>
  )
}
