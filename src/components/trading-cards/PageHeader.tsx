import type useTradingCardsList from '@/hooks/trading-cards/useTradingCardsList'
import type { ReactElement } from 'react'

import { Button, cn, useDisclosure } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbRefresh, TbShoppingBagCheck } from 'react-icons/tb'

import Beta from '@/components/ui/Beta'
import CustomModal from '@/components/ui/CustomModal'

interface PageHeaderProps {
  selectedCardsWithPrice: string[]
  tradingCardContext: ReturnType<typeof useTradingCardsList>
}

export default function PageHeader({ selectedCardsWithPrice, tradingCardContext }: PageHeaderProps): ReactElement {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

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
                <p className='text-sm text-altwhite'>{t('tradingCards.subtitle')}</p>
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
              isDisabled={selectedCardsWithPrice.length === 0}
              isLoading={tradingCardContext.loadingListButton}
              className='font-semibold rounded-lg bg-dynamic text-button-text'
              startContent={!tradingCardContext.loadingListButton && <TbShoppingBagCheck fontSize={20} />}
              onPress={onOpen}
            >
              {t('tradingCards.list')} {selectedCardsWithPrice.length > 0 && `(${selectedCardsWithPrice.length})`}
            </Button>
          </div>
        </div>
      </div>

      <CustomModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={t('common.notice')}
        body={<div className='whitespace-pre-line'>{t('tradingCards.confirm')}</div>}
        buttons={
          <>
            <Button
              size='sm'
              color='danger'
              variant='light'
              className='font-semibold rounded-lg'
              onPress={onOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='font-semibold rounded-lg bg-dynamic text-button-text'
              onPress={() => {
                tradingCardContext.handleSellSelectedCards()
                onOpenChange()
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
