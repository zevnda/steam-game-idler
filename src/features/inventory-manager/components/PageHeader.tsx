import type { useTradingCardsList } from '@/features/inventory-manager'
import type { TradingCard } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import {
  TbChecks,
  TbChevronLeft,
  TbChevronRight,
  TbEraser,
  TbPackageExport,
  TbRefresh,
  TbSettings,
} from 'react-icons/tb'
import { Button, useDisclosure } from '@heroui/react'
import { CustomModal, ProBadge } from '@/shared/components'
import { useNavigationStore, useStateStore, useUserStore } from '@/shared/stores'
import { hasGamerAccess } from '@/shared/utils'

// Helper function to format seconds to HH:MM:SS
const formatTime = (seconds: number) => {
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
  filteredTradingCardsList: TradingCard[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  lockedCards: string[]
}

export const PageHeader = ({
  selectedCardsWithPrice,
  tradingCardContext,
  filteredTradingCardsList,
  currentPage,
  totalPages,
  onPageChange,
  lockedCards,
}: PageHeaderProps) => {
  const { t } = useTranslation()
  const userSettings = useUserStore(state => state.userSettings)
  const subscriptionTier = useUserStore(state => state.subscriptionTier)
  const setProModalOpen = useStateStore(state => state.setProModalOpen)
  const setProModalRequiredTier = useStateStore(state => state.setProModalRequiredTier)
  const setActivePage = useNavigationStore(state => state.setActivePage)
  const setPreviousActivePage = useNavigationStore(state => state.setPreviousActivePage)
  const setCurrentSettingsTab = useNavigationStore(state => state.setCurrentSettingsTab)
  const {
    isOpen: isConfirmOpen,
    onOpen: onConfirmOpen,
    onOpenChange: onConfirmOpenChange,
  } = useDisclosure()
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onOpenChange: onBulkOpenChange } = useDisclosure()
  const {
    isOpen: isDupesOpen,
    onOpen: onDupesOpen,
    onOpenChange: onDupesOpenChange,
  } = useDisclosure()
  const {
    isOpen: isRemoveOpen,
    onOpen: onRemoveOpen,
    onOpenChange: onRemoveOpenChange,
  } = useDisclosure()

  return (
    <>
      <div className='z-50 px-6 pt-2 w-full'>
        <div className='flex justify-between items-center pb-3 w-full'>
          <div className='flex items-center gap-1 select-none w-full'>
            <div className='flex flex-col justify-center w-full'>
              <p className='text-3xl font-black'>{t('tradingCards.title')}</p>
              <p className='text-xs text-altwhite my-2'>{t('tradingCards.subtitle')}</p>

              <div className='flex flex-col justify-center gap-2 mt-1'>
                <div className='flex items-center gap-2 mt-1'>
                  <Button
                    isIconOnly
                    startContent={<TbRefresh size={18} />}
                    className='bg-btn-secondary text-btn-text font-bold'
                    radius='full'
                    onPress={() => tradingCardContext.handleRefresh()}
                  />

                  <Button
                    className='bg-btn-secondary text-btn-text font-bold'
                    radius='full'
                    isDisabled={selectedCardsWithPrice.length === 0}
                    isLoading={tradingCardContext.loadingListButton}
                    startContent={
                      !tradingCardContext.loadingListButton && <TbChecks fontSize={20} />
                    }
                    onPress={onConfirmOpen}
                  >
                    {t('tradingCards.list')}{' '}
                    {selectedCardsWithPrice.length > 0 && `(${selectedCardsWithPrice.length})`}
                  </Button>

                  <Button
                    className='bg-btn-secondary text-btn-text font-bold'
                    radius='full'
                    isDisabled={tradingCardContext.tradingCardsList.length === 0}
                    isLoading={tradingCardContext.loadingListButton}
                    startContent={
                      !tradingCardContext.loadingListButton && <TbPackageExport fontSize={20} />
                    }
                    onPress={onBulkOpen}
                  >
                    {t('tradingCards.bulk', {
                      count: filteredTradingCardsList.length,
                    })}
                  </Button>

                  <div
                    onClick={() => {
                      if (!hasGamerAccess(subscriptionTier)) {
                        setProModalRequiredTier('gamer')
                        setProModalOpen(true)
                      }
                    }}
                  >
                    <Button
                      className='bg-btn-secondary text-btn-text font-bold'
                      radius='full'
                      isDisabled={
                        tradingCardContext.tradingCardsList.length === 0 ||
                        !hasGamerAccess(subscriptionTier)
                      }
                      isLoading={tradingCardContext.loadingListButton}
                      startContent={
                        !tradingCardContext.loadingListButton && <TbPackageExport fontSize={20} />
                      }
                      onPress={onDupesOpen}
                    >
                      {t('tradingCards.sellDupes')}
                      {!hasGamerAccess(subscriptionTier) && (
                        <ProBadge className='scale-70 -mx-2' requiredTier='gamer' />
                      )}
                    </Button>
                  </div>

                  <Button
                    className='font-bold'
                    radius='full'
                    color='danger'
                    isLoading={tradingCardContext.loadingRemoveListings}
                    startContent={
                      !tradingCardContext.loadingRemoveListings && <TbEraser fontSize={20} />
                    }
                    onPress={onRemoveOpen}
                  >
                    {t('tradingCards.remove')}
                  </Button>

                  <Button
                    isIconOnly
                    radius='full'
                    className='bg-btn-secondary text-btn-text font-bold'
                    startContent={<TbSettings size={20} />}
                    onPress={() => {
                      setPreviousActivePage('inventoryManager')
                      setActivePage('settings')
                      setCurrentSettingsTab('inventory-manager')
                    }}
                  />

                  {/* Pagination */}
                  {tradingCardContext.tradingCardsList.length > 0 && (
                    <div className='flex ml-auto justify-center items-center gap-4'>
                      <Button
                        isIconOnly
                        className='bg-btn-secondary text-btn-text font-bold'
                        radius='full'
                        startContent={<TbChevronLeft fontSize={20} />}
                        disabled={currentPage === 1}
                        onPress={() => onPageChange(currentPage - 1)}
                      />

                      <p className='text-sm'>
                        {currentPage} / {totalPages}
                      </p>

                      <Button
                        isIconOnly
                        className='bg-btn-secondary text-btn-text font-bold'
                        radius='full'
                        startContent={<TbChevronRight fontSize={20} />}
                        disabled={currentPage === totalPages}
                        onPress={() => onPageChange(currentPage + 1)}
                      />
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
              time: formatTime(
                Number(filteredTradingCardsList.length) *
                  (userSettings.tradingCards.sellDelay || 10),
              ),
              count: Number(filteredTradingCardsList.length),
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
                tradingCardContext.handleSellAllCards(filteredTradingCardsList)
                onBulkOpenChange()
              }}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />

      <CustomModal
        isOpen={isDupesOpen}
        onOpenChange={onDupesOpenChange}
        title={t('common.notice')}
        body={<div className='whitespace-pre-line'>{t('tradingCards.confirmDupes')}</div>}
        buttons={
          <>
            <Button
              size='sm'
              color='danger'
              variant='light'
              radius='full'
              className='font-semibold'
              onPress={onDupesOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              onPress={() => {
                tradingCardContext.handleSellAllDupes()
                onDupesOpenChange()
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
