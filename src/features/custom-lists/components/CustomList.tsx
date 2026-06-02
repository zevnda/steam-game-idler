import type { CustomListType, Game } from '@/shared/types'
import type { DragEndEvent } from '@dnd-kit/core'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbAward, TbCards, TbHeart, TbHourglassLow, TbSettings } from 'react-icons/tb'
import { FixedSizeList as List } from 'react-window'
import { DndContext } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, cn, Tab, Tabs } from '@heroui/react'
import { startAchievementUnlocker } from '@/features/achievement-unlocker/services/startAchievementUnlocker'
import { startCardFarming } from '@/features/card-farming/services/startCardFarming'
import { ManualAddModal } from '@/features/custom-lists/components/ManualAddModal'
import { useCustomList } from '@/features/custom-lists/hooks/useCustomList'
import { startAutoIdleGamesImpl } from '@/features/idle'
import { GameCard } from '@/shared/components/GameCard'
import { useSessionStore, useUiStore, useUserStore } from '@/shared/stores'

function SortableGameCard({
  game,
  onRemove,
  isAutoIdle,
  autoIdleEnabled,
  onToggle,
}: {
  game: Game
  onRemove: (g: Game) => void
  isAutoIdle?: boolean
  autoIdleEnabled?: boolean
  onToggle?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: game.appid,
  })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
    >
      <div {...listeners} className='cursor-grab active:cursor-grabbing'>
        <GameCard
          item={game}
          isCustomList
          isAutoIdleList={isAutoIdle}
          autoIdleEnabled={autoIdleEnabled}
          onToggleAutoIdle={onToggle}
          handleRemoveGame={async () => onRemove(game)}
        />
      </div>
    </div>
  )
}

const Row = memo(
  ({
    index,
    style,
    data,
  }: {
    index: number
    style: React.CSSProperties
    data: {
      games: Game[]
      type: CustomListType
      blacklist: number[]
      onRemove: (g: Game) => void
      disabledAutoIdle: Set<number>
      onToggleAutoIdle: (id: number) => void
    }
  }) => {
    const { games, type, blacklist, onRemove, disabledAutoIdle, onToggleAutoIdle } = data
    const COLS = 5
    const row = games.slice(index * COLS, (index + 1) * COLS)
    return (
      <div
        style={style}
        className='grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-5 gap-y-4 px-6'
      >
        {row.map(game => {
          if (type === 'cardFarmingList' && blacklist.includes(game.appid)) return null
          return (
            <GameCard
              key={game.appid}
              item={game}
              isCustomList
              isAutoIdleList={type === 'autoIdleList'}
              autoIdleEnabled={
                type === 'autoIdleList' ? !disabledAutoIdle.has(game.appid) : undefined
              }
              onToggleAutoIdle={() => onToggleAutoIdle(game.appid)}
              handleRemoveGame={async () => onRemove(game)}
            />
          )
        })}
      </div>
    )
  },
)

export function CustomList({ type }: { type: CustomListType }) {
  const { t } = useTranslation()
  const userSummary = useUserStore(s => s.userSummary)
  const userSettings = useUserStore(s => s.userSettings)
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)
  const transitionDuration = useUiStore(s => s.transitionDuration)
  const setCurrentSettingsTab = useUiStore(s => s.setCurrentSettingsTab)
  const setActivePage = useUiStore(s => s.setActivePage)
  const setPreviousActivePage = useUiStore(s => s.setPreviousActivePage)
  const activePage = useUiStore(s => s.activePage)
  const isCardFarming = useSessionStore(s => s.isCardFarming)
  const isAchievementUnlocker = useSessionStore(s => s.isAchievementUnlocker)
  const [windowH] = useState(typeof window !== 'undefined' ? window.innerHeight : 800)

  const listName =
    type === 'cardFarmingList'
      ? 'cardFarmingList'
      : type === 'achievementUnlockerList'
        ? 'achievementUnlockerList'
        : type === 'autoIdleList'
          ? 'autoIdleList'
          : 'favoritesList'

  const {
    list,
    setList,
    isLoading,
    filteredGamesList,
    searchTerm,
    activeTab,
    setActiveTab,
    handleAddAllGames,
    handleAddAllResults,
    handleRemoveGame,
    handleUpdateListOrder,
    handleClearList,
    handleClearBlacklist,
    handleBlacklistGame,
    disabledAutoIdleGames,
    handleToggleAutoIdleGame,
  } = useCustomList(listName)

  const blacklist = useMemo(
    () => userSettings.cardFarming.blacklist || [],
    [userSettings.cardFarming.blacklist],
  )

  const config = useMemo(() => {
    switch (type) {
      case 'cardFarmingList':
        return {
          title: t('common.cardFarming'),
          icon: <TbCards size={22} />,
          startFn: () => startCardFarming(),
          isRunning: isCardFarming,
          settingsTab: 'card-farming' as const,
        }
      case 'achievementUnlockerList':
        return {
          title: t('common.achievementUnlocker'),
          icon: <TbAward size={22} />,
          startFn: () => startAchievementUnlocker(),
          isRunning: isAchievementUnlocker,
          settingsTab: 'achievement-unlocker' as const,
        }
      case 'autoIdleList':
        return {
          title: t('customLists.autoIdle.title'),
          icon: <TbHourglassLow size={22} />,
          startFn: () => startAutoIdleGamesImpl(userSummary?.steamId || '', true),
          isRunning: false,
          settingsTab: null,
        }
      default:
        return {
          title: t('customLists.favorites.title'),
          icon: <TbHeart size={22} className='text-yellow-400' />,
          startFn: null,
          isRunning: false,
          settingsTab: null,
        }
    }
  }, [type, t, isCardFarming, isAchievementUnlocker, userSummary?.steamId])

  const displayList = useMemo(() => {
    if (activeTab === 'all') return filteredGamesList
    if (activeTab === 'blacklist' && type === 'cardFarmingList')
      return filteredGamesList.filter(g => blacklist.includes(g.appid))
    return list.filter(g => !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [activeTab, filteredGamesList, list, blacklist, type, searchTerm])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over && active.id !== over.id) {
        const oi = list.findIndex(g => g.appid === active.id)
        const ni = list.findIndex(g => g.appid === over.id)
        handleUpdateListOrder(arrayMove(list, oi, ni))
      }
    },
    [list, handleUpdateListOrder],
  )

  const COLS = 5
  const rowCount = Math.ceil(displayList.length / COLS)
  const rowData = useMemo(
    () => ({
      games: displayList,
      type,
      blacklist,
      onRemove: activeTab === 'list' ? handleRemoveGame : handleBlacklistGame,
      disabledAutoIdle: disabledAutoIdleGames,
      onToggleAutoIdle: handleToggleAutoIdleGame,
    }),
    [
      displayList,
      type,
      blacklist,
      activeTab,
      handleRemoveGame,
      handleBlacklistGame,
      disabledAutoIdleGames,
      handleToggleAutoIdleGame,
    ],
  )

  return (
    <div
      className={cn(
        'min-h-calc max-h-calc overflow-y-auto overflow-x-hidden mt-12 ease-in-out',
        sidebarCollapsed ? 'w-calc-collapsed' : 'w-calc',
      )}
      style={{ transitionDuration, transitionProperty: 'width' }}
    >
      <div className='px-6 pt-4 pb-3'>
        <div className='flex items-end justify-between pb-3 select-none'>
          <div>
            <p className='text-2xl font-black'>{config.title}</p>
            <p className='text-xs text-altwhite/60 mt-0.5'>
              {t('common.showing', { total: list.length })}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            {config.startFn && (
              <Button
                size='sm'
                className='bg-btn-secondary text-btn-text font-semibold'
                radius='full'
                isDisabled={config.isRunning || list.length === 0}
                onPress={config.startFn}
              >
                {type === 'cardFarmingList'
                  ? t('customLists.cardFarming.buttonLabel')
                  : type === 'achievementUnlockerList'
                    ? t('customLists.achievementUnlocker.buttonLabel')
                    : t('customLists.autoIdle.buttonLabel')}
              </Button>
            )}
            {config.settingsTab && (
              <Button
                size='sm'
                variant='light'
                radius='full'
                className='text-altwhite'
                startContent={<TbSettings size={16} />}
                onPress={() => {
                  setPreviousActivePage(activePage)
                  setActivePage('settings')
                  setCurrentSettingsTab(config.settingsTab!)
                }}
              >
                {t('common.gameSettings')}
              </Button>
            )}
            <ManualAddModal listTitle={config.title} listName={listName} setList={setList} />
            {list.length > 0 && (
              <Button
                size='sm'
                variant='light'
                color='danger'
                radius='full'
                className='font-semibold'
                onPress={handleClearList}
              >
                {t('common.clear')}
              </Button>
            )}
          </div>
        </div>

        <div className='flex items-center gap-2 mb-4'>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={k => setActiveTab(k as 'all' | 'list' | 'blacklist')}
            size='sm'
            radius='full'
            classNames={{
              tabList: 'bg-card border border-border/20 gap-0 px-1 py-1',
              tab: 'data-[hover-unselected=true]:!bg-item-hover data-[hover-unselected=true]:opacity-100',
              cursor: '!bg-surface rounded-full w-full',
              tabContent:
                'text-xs group-data-[selected=true]:text-content text-altwhite/60 font-semibold',
            }}
          >
            <Tab key='all' title={`${t('customLists.allGames')} (${filteredGamesList.length})`} />
            <Tab key='list' title={`${t('common.list')} (${list.length})`} />
            {type === 'cardFarmingList' && blacklist.length > 0 && (
              <Tab key='blacklist' title={`${t('customLists.blacklist')} (${blacklist.length})`} />
            )}
          </Tabs>
          {activeTab === 'all' && filteredGamesList.length > 0 && (
            <div className='flex gap-2'>
              <Button
                size='sm'
                className='bg-btn-secondary text-btn-text font-semibold'
                radius='full'
                onPress={() => handleAddAllGames(displayList)}
              >
                {t('customLists.addAll')}
              </Button>
              {searchTerm && (
                <Button
                  size='sm'
                  className='bg-btn-secondary text-btn-text font-semibold'
                  radius='full'
                  onPress={() => handleAddAllResults(displayList)}
                >
                  {t('customLists.addAllResults')}
                </Button>
              )}
            </div>
          )}
          {activeTab === 'blacklist' && blacklist.length > 0 && (
            <Button
              size='sm'
              variant='light'
              color='danger'
              radius='full'
              className='font-semibold'
              onPress={handleClearBlacklist}
            >
              {t('common.clear')}
            </Button>
          )}
        </div>
      </div>

      {!isLoading &&
        (activeTab === 'list' ? (
          <DndContext onDragEnd={handleDragEnd}>
            <SortableContext items={list.map(g => g.appid)}>
              <div className='grid grid-cols-5 gap-x-5 gap-y-4 px-6'>
                {list
                  .filter(
                    g => !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase()),
                  )
                  .map(game => (
                    <SortableGameCard
                      key={game.appid}
                      game={game}
                      onRemove={handleRemoveGame}
                      isAutoIdle={type === 'autoIdleList'}
                      autoIdleEnabled={
                        type === 'autoIdleList' ? !disabledAutoIdleGames.has(game.appid) : undefined
                      }
                      onToggle={() => handleToggleAutoIdleGame(game.appid)}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <List
            height={windowH - 200}
            itemCount={rowCount}
            itemSize={160}
            width='100%'
            itemData={rowData}
          >
            {Row}
          </List>
        ))}
    </div>
  )
}
