import type { Game, SortOption } from '@/types'
import type { Dispatch, ReactElement, SetStateAction } from 'react'

import { Button, cn, Divider, Tab, Tabs } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbX } from 'react-icons/tb'

import { useSearchContext } from '@/components/contexts/SearchContext'
import { useUserContext } from '@/components/contexts/UserContext'
import { usePageHeader } from '@/hooks/gameslist/usePageHeader'

interface PageHeaderProps {
  sortStyle: string
  setSortStyle: Dispatch<SetStateAction<string>>
  filteredGames: Game[]
  visibleGames: Game[]
  setRefreshKey: Dispatch<SetStateAction<number>>
}

export default function PageHeader({
  sortStyle,
  setSortStyle,
  filteredGames,
  setRefreshKey,
}: PageHeaderProps): ReactElement {
  const { t } = useTranslation()
  const { userSummary } = useUserContext()
  const { gameQueryValue, setGameQueryValue } = useSearchContext()
  const { handleSorting, handleRefetch } = usePageHeader(setSortStyle, setRefreshKey)

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
              {t('common.showing', {
                total: filteredGames.length,
              })}
            </p>

            <div className='flex items-center gap-2 mt-1'>
              <Button
                className='bg-btn-secondary text-btn-text font-bold'
                radius='full'
                onPress={() => handleRefetch(userSummary?.steamId)}
              >
                {t('setup.refresh')}
              </Button>

              <Divider orientation='vertical' className='mx-2 h-8 bg-border' />

              <p className='text-sm text-altwhite font-bold'>{t('common.sortBy')}</p>

              <Tabs
                aria-label='sort options'
                items={sortOptions}
                selectedKey={sortStyle}
                radius='full'
                classNames={{
                  tabList: 'gap-0 w-full bg-item-active',
                  tab: 'data-[hover-unselected=true]:!bg-item-hover data-[hover-unselected=true]:opacity-100',
                  tabContent: 'text-sm group-data-[selected=true]:text-dynamic text-altwhite font-bold',
                  cursor: '!bg-dynamic/10 w-full',
                }}
                onSelectionChange={key => {
                  handleSorting(key as string)
                }}
              >
                {item => <Tab key={item.key} title={item.label} />}
              </Tabs>

              {gameQueryValue && (
                <div className='flex items-center gap-2'>
                  <Divider orientation='vertical' className='mx-2 h-8 bg-border' />
                  <p className='text-sm text-altwhite font-bold'>Search</p>
                  <div className='flex items-center gap-2 text-sm text-altwhite p-2 bg-item-active rounded-full max-w-64'>
                    <p className='text-content truncate'>{gameQueryValue}</p>
                    <div
                      className='flex items-center justify-center cursor-pointer bg-item-hover hover:bg-item-hover/80 rounded-full p-1 duration-150'
                      onClick={() => setGameQueryValue('')}
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
  )
}
