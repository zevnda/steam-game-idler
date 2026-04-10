import type { useTradingCardsList } from '@/features/inventory-manager'
import type { cardSortOption, SortOption, TradingCard } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import {
  TbChecks,
  TbChevronLeft,
  TbChevronRight,
  TbEraser,
  TbFilter,
  TbPackageExport,
  TbSettings,
  TbSortDescending2,
} from 'react-icons/tb'
import { Button, cn, Select, SelectItem, useDisclosure } from '@heroui/react'
import { CustomModal, ProBadge } from '@/shared/components'
import { useNavigationStore, useStateStore, useUserStore } from '@/shared/stores'
import { hasGamerFeature } from '@/shared/utils'

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
  cardFilterValues: Set<string>
  setCardFilterValues: React.Dispatch<React.SetStateAction<Set<string>>>
}

export const PageHeader = ({
  selectedCardsWithPrice,
  tradingCardContext,
  filteredTradingCardsList,
  currentPage,
  totalPages,
  onPageChange,
  lockedCards,
  cardFilterValues,
  setCardFilterValues,
}: PageHeaderProps) => {
  const { t } = useTranslation()
  const userSettings = useUserStore(state => state.userSettings)
  const proTier = useUserStore(state => state.proTier)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const transitionDuration = useStateStore(state => state.transitionDuration)
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

  const handleCardSorting = (key: string) => {
    tradingCardContext.setCardSortStyle?.(key)
  }

  const cardSortOptions: cardSortOption[] = [
    { key: 'a-z', label: t('tradingCards.sort.cardNameAsc') },
    { key: 'z-a', label: t('tradingCards.sort.cardNameDesc') },
    { key: 'aa-zz', label: t('tradingCards.sort.gameNameAsc') },
    { key: 'zz-aa', label: t('tradingCards.sort.gameNameDesc') },
    { key: 'badge-desc', label: t('tradingCards.sort.badgeLevel' as never) },
  ]

  const cardFilterOptions: SortOption[] = [
    { key: 'cards', label: t('tradingCards.filter.cards' as never) },
    { key: 'foil', label: t('tradingCards.filter.foil' as never) },
    { key: 'backgrounds', label: t('tradingCards.filter.backgrounds' as never) },
    { key: 'emoticons', label: t('tradingCards.filter.emoticons' as never) },
    { key: 'boosters', label: t('tradingCards.filter.boosters' as never) },
    { key: 'sale', label: t('tradingCards.filter.sale' as never) },
    { key: 'badge', label: t('tradingCards.filter.badge' as never) },
    { key: 'dupes', label: t('tradingCards.filter.dupes' as never) },
    { key: 'locked', label: t('tradingCards.filter.locked' as never) },
  ]

  return (
    <>
      <div
        className={cn(
          'z-50 pl-6 pt-2',
          sidebarCollapsed ? 'w-[calc(100vw-85px)]' : 'w-[calc(100vw-280px)]',
        )}
        style={{
          transitionDuration,
          transitionProperty: 'width',
        }}
      >
        <div className='flex justify-between items-center pb-3 w-full'>
          <div className='flex items-center gap-1 select-none w-full'>
            <div className='flex flex-col justify-center w-full'>
              <p className='text-3xl font-black'>{t('tradingCards.title')}</p>
              <p className='text-xs text-altwhite my-2'>{t('tradingCards.subtitle')}</p>

              <div className='flex flex-col justify-center gap-2 mt-1'>
                <div className='flex items-center gap-2 mt-1'>
                  <Button
                    className='bg-btn-secondary text-btn-text font-bold'
                    radius='full'
                    onPress={() => tradingCardContext.handleRefresh()}
                  >
                    {t('common.refresh')}
                  </Button>

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
                      if (!hasGamerFeature(proTier)) {
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
                        !hasGamerFeature(proTier)
                      }
                      isLoading={tradingCardContext.loadingListButton}
                      startContent={
                        !tradingCardContext.loadingListButton && <TbPackageExport fontSize={20} />
                      }
                      onPress={onDupesOpen}
                    >
                      {t('tradingCards.sellDupes')}
                      {!hasGamerFeature(proTier) && (
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

                <div className='flex items-center gap-3 mt-1'>
                  <Select
                    aria-label='sort'
                    disallowEmptySelection
                    isDisabled={tradingCardContext.tradingCardsList.length === 0}
                    radius='none'
                    startContent={<TbSortDescending2 fontSize={22} />}
                    items={cardSortOptions}
                    className='w-52'
                    classNames={{
                      listbox: ['p-0'],
                      value: ['text-sm !text-content'],
                      trigger: cn(
                        'bg-input data-[hover=true]:!bg-inputhover',
                        'data-[open=true]:!bg-inputhover duration-100 rounded-lg',
                      ),
                      popoverContent: ['bg-input rounded-xl justify-start !text-content'],
                    }}
                    selectedKeys={[tradingCardContext.cardSortStyle]}
                    onSelectionChange={e => {
                      if (e.currentKey) handleCardSorting(e.currentKey)
                    }}
                  >
                    {item => (
                      <SelectItem
                        key={item.key}
                        classNames={{
                          base: [
                            'data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content',
                          ],
                        }}
                      >
                        {item.label}
                      </SelectItem>
                    )}
                  </Select>

                  <Select<SortOption>
                    aria-label='filter'
                    selectionMode='multiple'
                    isDisabled={tradingCardContext.tradingCardsList.length === 0}
                    radius='none'
                    placeholder={t('tradingCards.filter.placeholder' as never)}
                    startContent={<TbFilter fontSize={20} />}
                    items={cardFilterOptions}
                    className='w-56'
                    classNames={{
                      listbox: ['p-0'],
                      value: ['text-sm !text-content'],
                      trigger: cn(
                        'bg-input data-[hover=true]:!bg-inputhover',
                        'data-[open=true]:!bg-inputhover duration-100 rounded-lg',
                      ),
                      popoverContent: ['bg-input rounded-xl justify-start !text-content'],
                    }}
                    selectedKeys={cardFilterValues}
                    renderValue={items =>
                      items.length === 1
                        ? items[0].rendered
                        : t('tradingCards.filter.active' as never, { count: items.length })
                    }
                    onSelectionChange={selection => {
                      if (selection === 'all') return
                      setCardFilterValues(
                        new Set(Array.from(selection as Set<React.Key>).map(String)),
                      )
                    }}
                  >
                    {(item: SortOption) => (
                      <SelectItem
                        key={item.key}
                        classNames={{
                          base: [
                            'data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content',
                          ],
                        }}
                      >
                        {item.label}
                      </SelectItem>
                    )}
                  </Select>
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
