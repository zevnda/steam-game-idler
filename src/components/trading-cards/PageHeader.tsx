import type useTradingCardsList from '@/hooks/trading-cards/useTradingCardsList'
import type { ReactElement } from 'react'

import { Button, cn, useDisclosure } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbRefresh, TbShoppingBag, TbShoppingBagCheck } from 'react-icons/tb'

import Beta from '@/components/ui/Beta'
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
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onOpenChange: onConfirmOpenChange } = useDisclosure()
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onOpenChange: onBulkOpenChange } = useDisclosure()

  return (
    <>
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
                <p className='text-sm text-altwhite'>
                  {t('tradingCards.subtitle', { count: tradingCardContext.tradingCardsList?.length || 0 })}
                </p>
                <div
                  className='flex justify-center items-center cursor-pointer'
                  onClick={tradingCardContext.handleRefresh}
                >
                  <TbRefresh className='text-altwhite hover:text-altwhite/80' fontSize={16} />
                </div>
              </div>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              size='sm'
              isDisabled={tradingCardContext.tradingCardsList.length === 0}
              isLoading={tradingCardContext.loadingListButton}
              className='font-semibold rounded-lg bg-dynamic text-button-text'
              startContent={!tradingCardContext.loadingListButton && <TbShoppingBag fontSize={20} />}
              onPress={onBulkOpen}
            >
              {t('tradingCards.bulk')}
            </Button>

            <Button
              size='sm'
              isDisabled={selectedCardsWithPrice.length === 0}
              isLoading={tradingCardContext.loadingListButton}
              className='font-semibold rounded-lg bg-dynamic text-button-text'
              startContent={!tradingCardContext.loadingListButton && <TbShoppingBagCheck fontSize={20} />}
              onPress={onConfirmOpen}
            >
              {t('tradingCards.list')} {selectedCardsWithPrice.length > 0 && `(${selectedCardsWithPrice.length})`}
            </Button>
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
              className='font-semibold rounded-lg'
              onPress={onConfirmOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='font-semibold rounded-lg bg-dynamic text-button-text'
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
              className='font-semibold rounded-lg'
              onPress={onBulkOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='font-semibold rounded-lg bg-dynamic text-button-text'
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
    </>
  )
}
