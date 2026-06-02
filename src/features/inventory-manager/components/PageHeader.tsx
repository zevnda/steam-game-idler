import type { useTradingCardsList } from '@/features/inventory-manager/hooks/useTradingCardsList'
import type { TradingCard } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import {
  TbChevronLeft,
  TbChevronRight,
  TbEraser,
  TbFilter,
  TbPackageExport,
  TbSettings,
  TbSortDescending2,
} from 'react-icons/tb'
import { Button, cn, Select, SelectItem, useDisclosure } from '@heroui/react'
import { CustomModal } from '@/shared/components/CustomModal'
import { ProBadge } from '@/shared/components/pro/ProBadge'
import { useUiStore, useUserStore } from '@/shared/stores'
import { hasGamerFeature } from '@/shared/utils'

const SORT_OPTIONS = [
  { key: 'a-z', label: 'tradingCards.sort.cardNameAsc' as const },
  { key: 'z-a', label: 'tradingCards.sort.cardNameDesc' as const },
  { key: 'aa-zz', label: 'tradingCards.sort.gameNameAsc' as const },
  { key: 'zz-aa', label: 'tradingCards.sort.gameNameDesc' as const },
  { key: 'badge-desc', label: 'tradingCards.sort.badgeLevel' as const },
]

const FILTER_OPTIONS = [
  { key: 'cards', label: 'tradingCards.filter.cards' as const },
  { key: 'foil', label: 'tradingCards.filter.foil' as const },
  { key: 'dupes', label: 'tradingCards.filter.dupes' as const },
  { key: 'locked', label: 'tradingCards.filter.locked' as const },
]

interface PageHeaderProps {
  ctx: ReturnType<typeof useTradingCardsList>
  filteredList: TradingCard[]
  cardFilterValues: Set<string>
  setCardFilterValues: React.Dispatch<React.SetStateAction<Set<string>>>
  currentPage: number
  setCurrentPage: (p: number) => void
  totalPages: number
}

export function PageHeader({
  ctx,
  filteredList,
  cardFilterValues,
  setCardFilterValues,
  currentPage,
  setCurrentPage,
  totalPages,
}: PageHeaderProps) {
  const { t } = useTranslation()
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)
  const transitionDuration = useUiStore(s => s.transitionDuration)
  const proTier = useUserStore(s => s.proTier)
  const setActivePage = useUiStore(s => s.setActivePage)
  const setPreviousActivePage = useUiStore(s => s.setPreviousActivePage)
  const setCurrentSettingsTab = useUiStore(s => s.setCurrentSettingsTab)
  const activePage = useUiStore(s => s.activePage)
  const setProModalOpen = useUiStore(s => s.setProModalOpen)
  const setProModalRequiredTier = useUiStore(s => s.setProModalRequiredTier)
  const {
    isOpen: isRemoveOpen,
    onOpen: onRemoveOpen,
    onOpenChange: onRemoveOpenChange,
  } = useDisclosure()

  const selectedWithPrice = Object.entries(ctx.selectedCards)
    .filter(([id, sel]) => sel && filteredList.find(c => c.id === id))
    .map(([id]) => id)

  return (
    <div
      className={cn(
        'sticky top-0 z-40 pl-6 pt-2 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{ transitionDuration, transitionProperty: 'width' }}
    >
      <div className='select-none pb-3'>
        <p className='text-3xl font-black'>{t('tradingCards.title')}</p>
        <p className='text-xs text-altwhite my-2'>
          {t('common.showing', { total: filteredList.length })}
        </p>
        <div className='flex items-center gap-2 mt-1'>
          <Button
            size='sm'
            variant='light'
            radius='full'
            className='text-altwhite'
            startContent={<TbSettings size={16} />}
            onPress={() => {
              setPreviousActivePage(activePage)
              setActivePage('settings')
              setCurrentSettingsTab('inventory-manager')
            }}
          >
            {t('common.gameSettings')}
          </Button>

          {hasGamerFeature(proTier) && (
            <>
              {selectedWithPrice.length > 0 && (
                <Button
                  size='sm'
                  className='bg-btn-secondary text-btn-text font-bold'
                  radius='full'
                  startContent={<TbPackageExport size={16} />}
                  isLoading={ctx.loadingListButton}
                  onPress={() =>
                    ctx.handleListCards(
                      filteredList.filter(c => selectedWithPrice.includes(c.id)),
                      ctx.changedCardPrices,
                    )
                  }
                >
                  {t('tradingCards.list')} ({selectedWithPrice.length})
                </Button>
              )}
              <Button
                size='sm'
                variant='light'
                color='danger'
                radius='full'
                startContent={<TbEraser size={16} />}
                isLoading={ctx.loadingRemoveListings}
                onPress={onRemoveOpen}
              >
                {t('tradingCards.remove')}
              </Button>
            </>
          )}

          {!hasGamerFeature(proTier) && (
            <div
              onClick={() => {
                setProModalRequiredTier('gamer')
                setProModalOpen(true)
              }}
            >
              <Button
                size='sm'
                className='bg-btn-secondary text-btn-text font-bold'
                radius='full'
                isDisabled
                startContent={<TbPackageExport size={16} />}
              >
                {t('tradingCards.sellDupes')}
                <ProBadge className='scale-70 -mx-2' requiredTier='gamer' />
              </Button>
            </div>
          )}

          <Button
            size='sm'
            className='bg-btn-secondary text-btn-text font-bold'
            radius='full'
            onPress={() => ctx.setRefreshKey(k => k + 1)}
          >
            {t('common.refresh')}
          </Button>

          <Select
            aria-label='sort'
            disallowEmptySelection
            radius='none'
            items={SORT_OPTIONS}
            className='w-42'
            defaultSelectedKeys={[ctx.cardSortStyle]}
            classNames={{
              listbox: ['p-0'],
              value: ['text-sm !text-content'],
              trigger: cn(
                'bg-input data-[hover=true]:!bg-inputhover data-[open=true]:!bg-input duration-100 rounded-lg',
              ),
              popoverContent: ['bg-input rounded-xl !text-content'],
            }}
            startContent={<TbSortDescending2 />}
            onSelectionChange={e => {
              if (e.currentKey) ctx.setCardSortStyle(e.currentKey)
            }}
          >
            {item => (
              <SelectItem
                key={item.key}
                classNames={{
                  base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
                }}
              >
                {t(item.label)}
              </SelectItem>
            )}
          </Select>

          <Select
            aria-label='filter'
            radius='none'
            items={FILTER_OPTIONS}
            className='w-36'
            classNames={{
              listbox: ['p-0'],
              value: ['text-sm !text-content'],
              trigger: cn(
                'bg-input data-[hover=true]:!bg-inputhover data-[open=true]:!bg-input duration-100 rounded-lg',
              ),
              popoverContent: ['bg-input rounded-xl !text-content'],
            }}
            startContent={<TbFilter />}
            selectionMode='multiple'
            selectedKeys={cardFilterValues}
            onSelectionChange={keys => setCardFilterValues(new Set(keys as Iterable<string>))}
          >
            {item => (
              <SelectItem
                key={item.key}
                classNames={{
                  base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
                }}
              >
                {t(item.label)}
              </SelectItem>
            )}
          </Select>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center gap-2 mt-2'>
          <Button
            isIconOnly
            size='sm'
            variant='light'
            radius='full'
            isDisabled={currentPage <= 1}
            onPress={() => setCurrentPage(currentPage - 1)}
          >
            <TbChevronLeft />
          </Button>
          <span className='text-sm text-altwhite'>
            {currentPage} / {totalPages}
          </span>
          <Button
            isIconOnly
            size='sm'
            variant='light'
            radius='full'
            isDisabled={currentPage >= totalPages}
            onPress={() => setCurrentPage(currentPage + 1)}
          >
            <TbChevronRight />
          </Button>
        </div>
      )}

      <CustomModal
        isOpen={isRemoveOpen}
        onOpenChange={onRemoveOpenChange}
        title={t('common.confirm')}
        body={t('tradingCards.confirmRemove')}
        buttons={
          <>
            <Button
              size='sm'
              color='danger'
              variant='light'
              radius='full'
              onPress={onRemoveOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              onPress={() => {
                ctx.handleRemoveListings()
                onRemoveOpenChange()
              }}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />
    </div>
  )
}
