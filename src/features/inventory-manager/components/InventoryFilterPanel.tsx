import type { TranslationKey } from '@/i18n'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import {
  TbAward,
  TbBox,
  TbCards,
  TbCheck,
  TbCopy,
  TbLock,
  TbMoodSmile,
  TbPhoto,
  TbSparkles,
  TbTag,
  TbX,
} from 'react-icons/tb'
import { cn, InputGroup, Typography } from '@heroui/react'
import { GameSortSelect } from '@/shared/components/GameSortSelect'

export type SortStyle = 'name-asc' | 'name-desc' | 'game-asc' | 'game-desc' | 'badge-desc'

export const SORT_STYLES: SortStyle[] = [
  'name-asc',
  'name-desc',
  'game-asc',
  'game-desc',
  'badge-desc',
]

// 'name-asc'/'name-desc' reuse the shared common.sort keys instead of duplicating the string here.
const SORT_STYLE_LABEL_KEYS: Record<SortStyle, TranslationKey> = {
  'name-asc': 'common.sort.nameAsc',
  'name-desc': 'common.sort.nameDesc',
  'game-asc': 'dashboard.inventoryManager.sort.game-asc',
  'game-desc': 'dashboard.inventoryManager.sort.game-desc',
  'badge-desc': 'dashboard.inventoryManager.sort.badge-desc',
}

export type FilterKey =
  | 'cards'
  | 'foil'
  | 'backgrounds'
  | 'emoticons'
  | 'boosters'
  | 'sale'
  | 'dupes'
  | 'badge'
  | 'locked'

interface InventoryFilterPanelProps {
  isDisabled: boolean
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  sortStyle: SortStyle
  onSortStyleChange: (style: SortStyle) => void
  filterValues: Set<FilterKey>
  onFilterValuesChange: (next: Set<FilterKey>) => void
}

interface FilterOption {
  key: FilterKey
  labelKey: TranslationKey
  icon: ComponentType<{ fontSize?: number; className?: string }>
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'cards', labelKey: 'dashboard.inventoryManager.filter.cards', icon: TbCards },
  { key: 'foil', labelKey: 'dashboard.inventoryManager.filter.foil', icon: TbSparkles },
  {
    key: 'backgrounds',
    labelKey: 'dashboard.inventoryManager.filter.backgrounds',
    icon: TbPhoto,
  },
  {
    key: 'emoticons',
    labelKey: 'dashboard.inventoryManager.filter.emoticons',
    icon: TbMoodSmile,
  },
  { key: 'boosters', labelKey: 'dashboard.inventoryManager.filter.boosters', icon: TbBox },
  { key: 'sale', labelKey: 'dashboard.inventoryManager.filter.sale', icon: TbTag },
  { key: 'dupes', labelKey: 'dashboard.inventoryManager.filter.dupes', icon: TbCopy },
  { key: 'badge', labelKey: 'dashboard.inventoryManager.filter.badge', icon: TbAward },
  { key: 'locked', labelKey: 'dashboard.inventoryManager.filter.locked', icon: TbLock },
]

// Left rail: sort (single-select, `GameSortSelect` - the same dropdown every other list page's
// sort control uses) and type/attribute filters (multi-select, vertically-stacked toggle rows -
// there's no single-select `Select` equivalent for a multi-select set, and unlike sort this is
// inherently a "several can be active at once" interaction, not a "pick one" interaction, so it
// stays its own row-list shape rather than being forced into the same widget). Mirrors `main`'s
// `FilterPanel` scope (sort + type/foil/dupes/badge/locked filters), restyled to this rewrite's
// `Typography`/`cn` conventions.
export const InventoryFilterPanel = ({
  isDisabled,
  searchQuery,
  onSearchQueryChange,
  sortStyle,
  onSortStyleChange,
  filterValues,
  onFilterValuesChange,
}: InventoryFilterPanelProps) => {
  const { t } = useTranslation()

  const toggleFilter = (key: FilterKey) => {
    const next = new Set(filterValues)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    onFilterValuesChange(next)
  }

  return (
    <div className='flex h-full w-56 shrink-0 flex-col gap-4 overflow-y-auto overflow-x-hidden border-r border-border p-4'>
      <InputGroup isDisabled={isDisabled}>
        <InputGroup.Prefix>
          <RiSearchLine className='text-muted' fontSize={16} />
        </InputGroup.Prefix>
        <InputGroup.Input
          placeholder={t('common.search.placeholder')}
          value={searchQuery}
          onChange={event => onSearchQueryChange(event.target.value)}
        />
        {searchQuery && (
          <InputGroup.Suffix>
            <button aria-label='Clear search' type='button' onClick={() => onSearchQueryChange('')}>
              <TbX fontSize={16} />
            </button>
          </InputGroup.Suffix>
        )}
      </InputGroup>

      <div className='flex flex-col gap-1.5'>
        <Typography
          className='px-1 uppercase tracking-wide'
          color='muted'
          type='body-xs'
          weight='semibold'
        >
          {t('dashboard.inventoryManager.sort.label')}
        </Typography>
        <GameSortSelect
          ariaLabel={t('dashboard.inventoryManager.sort.label')}
          className='w-full'
          isDisabled={isDisabled}
          options={SORT_STYLES.map(style => ({
            id: style,
            label: t(SORT_STYLE_LABEL_KEYS[style]),
          }))}
          value={sortStyle}
          onChange={onSortStyleChange}
        />
      </div>

      <div className='h-px bg-border' />

      <div className='flex flex-col gap-1'>
        <Typography
          className='px-1 uppercase tracking-wide'
          color='muted'
          type='body-xs'
          weight='semibold'
        >
          {t('dashboard.inventoryManager.filter.label')}
        </Typography>
        {FILTER_OPTIONS.map(option => {
          const isActive = filterValues.has(option.key)
          const Icon = option.icon
          return (
            <button
              key={option.key}
              className={cn(
                'flex select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-left duration-150',
                isDisabled ? 'opacity-40' : 'cursor-pointer active:scale-[0.98]',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-surface-hover hover:text-foreground',
              )}
              disabled={isDisabled}
              type='button'
              onClick={() => toggleFilter(option.key)}
            >
              <Icon className='shrink-0' fontSize={16} />
              <span className='grow truncate text-sm font-medium'>{t(option.labelKey)}</span>
              {isActive && <TbCheck className='shrink-0' fontSize={16} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
