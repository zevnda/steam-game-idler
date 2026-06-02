import type { Game, SortOption, SortStyleValue } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { Button, Tab, Tabs } from '@heroui/react'
import { changeSortStyle, refreshGamesList } from '@/features/games-list/services/gamesListService'
import { useUserStore } from '@/shared/stores'

interface PageHeaderProps {
  sortStyle: SortStyleValue
  setSortStyle: (v: SortStyleValue) => void
  filteredGames: Game[]
  incrementRefreshKey: () => void
}

export function PageHeader({
  sortStyle,
  setSortStyle,
  filteredGames,
  incrementRefreshKey,
}: PageHeaderProps) {
  const { t } = useTranslation()
  const userSummary = useUserStore(s => s.userSummary)

  const sortOptions: SortOption[] = [
    { key: '1-0', label: t('gamesList.sort.playtimeDesc') },
    { key: '0-1', label: t('gamesList.sort.playtimeAsc') },
    { key: 'a-z', label: t('gamesList.sort.titleAsc') },
    { key: 'z-a', label: t('gamesList.sort.titleDesc') },
  ]

  return (
    <div className='px-6 pt-4 pb-3 select-none'>
      <div className='flex items-end justify-between'>
        <div>
          <p className='text-2xl font-black'>{t('gamesList.title')}</p>
          <p className='text-xs text-altwhite/60 mt-0.5'>
            {t('common.showing', { total: filteredGames.length })}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            className='bg-btn-secondary text-btn-text font-semibold'
            radius='full'
            onPress={() => refreshGamesList(userSummary?.steamId, incrementRefreshKey, true)}
          >
            {t('common.refresh')}
          </Button>
          <div className='w-px h-5 bg-border/20 mx-1' />
          <p className='text-xs text-altwhite/60 font-semibold'>{t('common.sortBy')}</p>
          <Tabs
            size='sm'
            aria-label='sort options'
            items={sortOptions}
            selectedKey={sortStyle}
            radius='full'
            classNames={{
              tabList: 'gap-0 bg-card border border-border/20',
              tab: 'data-[hover-unselected=true]:!bg-item-hover data-[hover-unselected=true]:opacity-100',
              cursor: '!bg-surface-raised w-full',
              tabContent:
                'text-xs group-data-[selected=true]:text-content text-altwhite/60 font-semibold max-w-50 truncate',
            }}
            onSelectionChange={key => changeSortStyle(key as string, setSortStyle)}
          >
            {item => <Tab key={item.key} title={item.label} />}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
