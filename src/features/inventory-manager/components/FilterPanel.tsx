import type { useTradingCardsList } from '@/features/inventory-manager'
import type { cardSortOption } from '@/shared/types'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TbAward,
  TbBox,
  TbCards,
  TbCheck,
  TbCopy,
  TbLock,
  TbMoodSmile,
  TbPhoto,
  TbSortDescending2,
  TbSparkles,
  TbTag,
} from 'react-icons/tb'
import { cn, Select, SelectItem } from '@heroui/react'

interface FilterPanelProps {
  tradingCardContext: ReturnType<typeof useTradingCardsList>
  cardFilterValues: Set<string>
  setCardFilterValues: React.Dispatch<React.SetStateAction<Set<string>>>
}

interface FilterOption {
  key: string
  label: string
  icon: ComponentType<{ fontSize?: number; className?: string }>
}

export const FilterPanel = ({
  tradingCardContext,
  cardFilterValues,
  setCardFilterValues,
}: FilterPanelProps) => {
  const { t } = useTranslation()
  const isDisabled = tradingCardContext.tradingCardsList.length === 0

  const cardSortOptions: cardSortOption[] = [
    { key: 'a-z', label: t('tradingCards.sort.cardNameAsc') },
    { key: 'z-a', label: t('tradingCards.sort.cardNameDesc') },
    { key: 'aa-zz', label: t('tradingCards.sort.gameNameAsc') },
    { key: 'zz-aa', label: t('tradingCards.sort.gameNameDesc') },
    { key: 'badge-desc', label: t('tradingCards.sort.badgeLevel' as never) },
  ]

  const cardFilterOptions: FilterOption[] = [
    { key: 'cards', label: t('tradingCards.filter.cards' as never), icon: TbCards },
    { key: 'foil', label: t('tradingCards.filter.foil' as never), icon: TbSparkles },
    { key: 'backgrounds', label: t('tradingCards.filter.backgrounds' as never), icon: TbPhoto },
    { key: 'emoticons', label: t('tradingCards.filter.emoticons' as never), icon: TbMoodSmile },
    { key: 'boosters', label: t('tradingCards.filter.boosters' as never), icon: TbBox },
    { key: 'sale', label: t('tradingCards.filter.sale' as never), icon: TbTag },
    { key: 'badge', label: t('tradingCards.filter.badge' as never), icon: TbAward },
    { key: 'dupes', label: t('tradingCards.filter.dupes' as never), icon: TbCopy },
    { key: 'locked', label: t('tradingCards.filter.locked' as never), icon: TbLock },
  ]

  const toggleFilter = (key: string) => {
    setCardFilterValues(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className='w-64 shrink-0 h-full overflow-y-auto'>
      <div className='flex flex-col gap-2 px-6 pt-2 pb-4'>
        <p className='text-[11px] font-bold uppercase tracking-wider text-altwhite'>
          {t('common.sortBy')}
        </p>

        <Select
          aria-label='sort'
          disallowEmptySelection
          isDisabled={isDisabled}
          radius='none'
          startContent={<TbSortDescending2 fontSize={22} />}
          items={cardSortOptions}
          className='w-full'
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
            if (e.currentKey) tradingCardContext.setCardSortStyle?.(e.currentKey)
          }}
        >
          {item => (
            <SelectItem
              key={item.key}
              classNames={{
                base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
              }}
            >
              {item.label}
            </SelectItem>
          )}
        </Select>
      </div>

      <div className='h-px bg-border/60 mx-6 mb-3' />

      <div className='px-6 pb-2'>
        <p className='text-[11px] font-bold uppercase tracking-wider text-altwhite'>
          {t('tradingCards.filter.placeholder')}
        </p>
      </div>

      <div className='flex flex-col gap-0.5 px-4 pb-4'>
        {cardFilterOptions.map(option => {
          const isActive = cardFilterValues.has(option.key)
          const Icon = option.icon

          return (
            <div
              key={option.key}
              role='button'
              aria-disabled={isDisabled}
              onClick={() => !isDisabled && toggleFilter(option.key)}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg duration-150 select-none',
                isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]',
                isActive
                  ? 'bg-dynamic/10 text-dynamic'
                  : 'text-altwhite hover:bg-item-hover hover:text-content',
              )}
            >
              <Icon fontSize={16} className='shrink-0' />
              <p className='text-sm font-medium truncate grow'>{option.label}</p>
              {isActive && <TbCheck fontSize={16} className='shrink-0' />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
