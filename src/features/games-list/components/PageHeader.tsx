import type { Game, SortOption, SortStyleValue } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { Button, cn, Divider, Tab, Tabs } from '@heroui/react'
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
    <div className={cn('relative w-[calc(100vw-227px)] pl-6 pt-2')}>
      <div className='flex justify-between items-center pb-3'>
        <div className='flex items-center gap-1 select-none'>
          <div className='flex flex-col justify-center'>
            <p className='text-3xl font-black'>{t('gamesList.title')}</p>
            <p className='text-xs text-altwhite my-2'>
              {t('common.showing', { total: filteredGames.length })}
            </p>
            <div className='flex items-center gap-2 mt-1'>
              <Button
                className='bg-btn-secondary text-btn-text font-bold'
                radius='full'
                onPress={() => refreshGamesList(userSummary?.steamId, incrementRefreshKey, true)}
              >
                {t('common.refresh')}
              </Button>
              <Divider orientation='vertical' className='mx-2 h-8 bg-border' />
              <p className='text-sm text-altwhite font-bold'>{t('common.sortBy')}</p>
              <Tabs
                size='lg'
                aria-label='sort options'
                items={sortOptions}
                selectedKey={sortStyle}
                radius='full'
                classNames={{
                  tabList: 'gap-0 bg-item-active',
                  tab: cn(
                    'data-[hover-unselected=true]:!bg-item-hover data-[hover-unselected=true]:opacity-100',
                  ),
                  cursor: '!bg-item-active w-full',
                  tabContent:
                    'text-sm group-data-[selected=true]:text-content text-altwhite font-bold max-w-50 truncate',
                }}
                onSelectionChange={key => changeSortStyle(key as string, setSortStyle)}
              >
                {item => <Tab key={item.key} title={item.label} />}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
