import type {
  ActivePageType,
  CurrentSettingsTabType,
  Game,
  InvokeSettings,
  UserSummary,
} from '@/shared/types'
import type { DragEndEvent } from '@dnd-kit/core'
import { invoke } from '@tauri-apps/api/core'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FaMinus, FaPlus } from 'react-icons/fa6'
import {
  TbAward,
  TbCards,
  TbHeart,
  TbHourglassLow,
  TbSettings,
  TbSortDescending2,
  TbX,
} from 'react-icons/tb'
import { FixedSizeList as List } from 'react-window'
import { DndContext } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, cn, Divider, Select, SelectItem, Tab, Tabs } from '@heroui/react'
import i18next from 'i18next'
import Image from 'next/image'
import { RecommendedCardDropsCarousel } from '@/features/card-farming'
import { ManualAddModal, useCustomList } from '@/features/custom-lists'
import { GameCard } from '@/shared/components'
import { useNavigationStore, useSearchStore, useStateStore, useUserStore } from '@/shared/stores'
import {
  getAllGamesWithDrops,
  startAchievementUnlocker,
  startAutoIdleGamesImpl,
  startCardFarming,
} from '@/shared/utils'

type CustomListType =
  | 'cardFarmingList'
  | 'achievementUnlockerList'
  | 'autoIdleList'
  | 'favoritesList'

interface CustomListProps {
  type: CustomListType
}

interface GameWithDropsData {
  id: string
  name: string
  remaining: number
}

interface ListTypeConfig {
  title: string
  description: string
  icon: React.ReactNode
  startButton: 'startCardFarming' | 'startAchievementUnlocker' | 'startAutoIdleGamesImpl' | null
  buttonLabel: string | null
  settingsButton?: boolean
  settingsButtonLink?: string
  switches?: boolean
}

export const CustomList = ({ type }: CustomListProps) => {
  const { t } = useTranslation()
  const {
    list,
    setList,
    isLoading,
    filteredGamesList,
    searchTerm,
    activeTab,
    setActiveTab,
    handleAddGame,
    handleAddAllGames,
    handleAddAllResults,
    handleRemoveGame,
    handleUpdateListOrder,
    handleClearList,
    handleClearBlacklist,
    handleBlacklistGame,
  } = useCustomList(type)
  const setCustomListQueryValue = useSearchStore(state => state.setCustomListQueryValue)
  const [gamesWithDrops, setGamesWithDrops] = useState<Game[]>([])
  const [isLoadingDrops, setIsLoadingDrops] = useState(false)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const transitionDuration = useStateStore(state => state.transitionDuration)
  const isCardFarming = useStateStore(state => state.isCardFarming)
  const isAchievementUnlocker = useStateStore(state => state.isAchievementUnlocker)
  const setShowAchievementOrder = useStateStore(state => state.setShowAchievementOrder)
  const setAchievementOrderGame = useStateStore(state => state.setAchievementOrderGame)
  const setActivePage = useNavigationStore(state => state.setActivePage)
  const setPreviousActivePage = useNavigationStore(state => state.setPreviousActivePage)
  const setCurrentSettingsTab = useNavigationStore(state => state.setCurrentSettingsTab)
  const userSummary = useUserStore(state => state.userSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const [columnCount, setColumnCount] = useState(5)
  const [windowInnerHeight, setWindowInnerHeight] = useState(window.innerHeight)
  const [sortStyle, setSortStyle] = useState('a-z')

  useEffect(() => {
    const handleResize = () => {
      setWindowInnerHeight(window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const blacklist = useMemo(
    () => userSettings.cardFarming.blacklist || [],
    [userSettings.cardFarming.blacklist],
  )

  const blacklistedGames = useMemo(
    () => filteredGamesList.filter(g => blacklist.includes(g.appid)),
    [filteredGamesList, blacklist],
  )

  const filteredList = useMemo(
    () =>
      searchTerm
        ? list.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : list,
    [list, searchTerm],
  )

  const sortOptions = [
    { key: 'a-z', label: t('gamesList.sort.titleAsc') },
    { key: 'z-a', label: t('gamesList.sort.titleDesc') },
    { key: '1-0', label: t('gamesList.sort.playtimeDesc') },
    { key: '0-1', label: t('gamesList.sort.playtimeAsc') },
    ...(list.length > 0 ? [{ key: 'list', label: t('common.list') }] : []),
  ]

  const sortedFilteredGamesList = useMemo(() => {
    const sorted = [...filteredGamesList]
    switch (sortStyle) {
      case 'a-z':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'z-a':
        sorted.sort((a, b) => b.name.localeCompare(a.name))
        break
      case '1-0':
        sorted.sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0))
        break
      case '0-1':
        sorted.sort((a, b) => (a.playtime_forever ?? 0) - (b.playtime_forever ?? 0))
        break
      case 'list': {
        const listIds = new Set(list.map(g => g.appid))
        sorted.sort((a, b) => {
          const aIn = listIds.has(a.appid)
          const bIn = listIds.has(b.appid)
          if (aIn !== bIn) return aIn ? -1 : 1
          return a.name.localeCompare(b.name)
        })
        break
      }
    }
    return sorted
  }, [filteredGamesList, sortStyle, list])

  useEffect(() => {
    if (list.length === 0 && sortStyle === 'list') setSortStyle('a-z')
  }, [list.length, sortStyle])

  useEffect(() => {
    return () => setCustomListQueryValue('')
  }, [setCustomListQueryValue])

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 3200) {
      setColumnCount(12)
    } else if (window.innerWidth >= 2300) {
      setColumnCount(10)
    } else if (window.innerWidth >= 2000) {
      setColumnCount(8)
    } else if (window.innerWidth >= 1500) {
      setColumnCount(7)
    } else {
      setColumnCount(5)
    }
  }, [])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setList(items => {
        const oldIndex = items.findIndex(item => item.appid === active.id)
        const newIndex = items.findIndex(item => item.appid === over.id)
        const newList = arrayMove(items, oldIndex, newIndex)
        handleUpdateListOrder(newList)
        return newList
      })
    }
  }

  useEffect(() => {
    const getGamesWithDrops = async () => {
      if (type === 'cardFarmingList' && userSettings?.general?.showCardDropsCarousel) {
        const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary

        const cachedUserSettings = await invoke<InvokeSettings>('get_user_settings', {
          steamId: userSummary?.steamId,
        })

        setIsLoadingDrops(true)

        const credentials = cachedUserSettings.settings.cardFarming.credentials

        if (!credentials?.sid || !credentials?.sls) {
          setIsLoadingDrops(false)
          return
        }

        const gamesWithDropsData = (await getAllGamesWithDrops(
          userSummary?.steamId,
          credentials.sid,
          credentials.sls,
          credentials?.sma,
        )) as unknown as GameWithDropsData[]

        const parsedGamesData: Game[] = gamesWithDropsData.map((game: GameWithDropsData) => ({
          appid: parseInt(game.id),
          name: game.name,
          playtime_forever: 0,
          img_icon_url: '',
          has_community_visible_stats: false,
          remaining: game.remaining,
        }))

        const shuffledAndLimitedGames = [...parsedGamesData]
          .sort(() => Math.random() - 0.5)
          .slice(0, 10)

        setGamesWithDrops(shuffledAndLimitedGames)
        setIsLoadingDrops(false)
      }
    }
    getGamesWithDrops()
  }, [type, userSettings?.general?.showCardDropsCarousel])

  const listTypes: Record<CustomListType, ListTypeConfig> = {
    cardFarmingList: {
      title: t('common.cardFarming'),
      description: t('customLists.cardFarming.subtitle'),
      icon: <TbCards fontSize={20} />,
      startButton: 'startCardFarming',
      buttonLabel: t('customLists.cardFarming.buttonLabel'),
      settingsButton: true,
      settingsButtonLink: 'card-farming',
      switches: true,
    },
    achievementUnlockerList: {
      title: t('common.achievementUnlocker'),
      description: t('customLists.achievementUnlocker.subtitle'),
      icon: <TbAward fontSize={20} />,
      startButton: 'startAchievementUnlocker',
      buttonLabel: t('customLists.achievementUnlocker.buttonLabel'),
      settingsButton: true,
      settingsButtonLink: 'achievement-unlocker',
    },
    autoIdleList: {
      title: t('customLists.autoIdle.title'),
      description: t('customLists.autoIdle.subtitle'),
      icon: <TbHourglassLow fontSize={20} />,
      startButton: 'startAutoIdleGamesImpl',
      buttonLabel: t('customLists.autoIdle.buttonLabel'),
    },
    favoritesList: {
      title: t('customLists.favorites.title'),
      description: t('customLists.favorites.subtitle'),
      icon: <TbHeart fontSize={20} />,
      startButton: null,
      buttonLabel: null,
    },
  }

  const listType = listTypes[type]

  if (!listType) {
    return <p>{t('customLists.invalid')}</p>
  }

  const handleAddGameFromCarousel = (game: Game) => {
    handleAddGame(game)
  }

  const handleGameClick = (game: Game) => {
    setAchievementOrderGame(game)
    setShowAchievementOrder(true)
  }

  const carouselVisible =
    type === 'cardFarmingList' &&
    !!userSettings?.general?.showCardDropsCarousel &&
    (isLoadingDrops || gamesWithDrops.length > 0)

  return (
    <div
      className={cn(
        'min-h-calc max-h-calc overflow-y-auto overflow-x-hidden mt-9 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width',
      }}
    >
      <div className={cn('w-[calc(100vw-227px)] z-50 pl-6 pt-2')}>
        <div className='flex justify-between items-center pb-1.5'>
          <div className='flex items-center gap-1 select-none'>
            <div className='flex flex-col justify-center'>
              <p className='text-3xl font-black'>{listType.title}</p>
              <p className='text-xs text-altwhite my-2'>{listType.description}</p>

              <div className='flex items-center gap-2 mt-1'>
                {listType.startButton && (
                  <Button
                    className={cn(
                      'text-white font-bold transition-all duration-300 relative overflow-hidden before:absolute',
                      'before:inset-0 before:bg-linear-to-r before:from-transparent before:via-(--shimmer-color)',
                      'before:to-transparent before:-translate-x-full before:animate-[custom-shimmer_2.7s_ease-in-out_infinite]',
                      '*:relative *:z-10',
                    )}
                    style={{
                      backgroundImage: 'var(--gradient-btn)',
                    }}
                    radius='full'
                    startContent={listType.icon}
                    onPress={
                      listType.startButton === 'startCardFarming'
                        ? () => {
                            startCardFarming()
                          }
                        : listType.startButton === 'startAchievementUnlocker'
                          ? () => {
                              startAchievementUnlocker()
                            }
                          : listType.startButton === 'startAutoIdleGamesImpl'
                            ? () => {
                                if (userSummary?.steamId)
                                  startAutoIdleGamesImpl(userSummary.steamId, true)
                              }
                            : undefined
                    }
                  >
                    {listType.buttonLabel}
                  </Button>
                )}

                <ManualAddModal listTitle={listType.title} listName={type} setList={setList} />

                {listType.settingsButton && listType.settingsButtonLink && (
                  <Button
                    isIconOnly
                    radius='full'
                    className='bg-btn-secondary text-btn-text font-bold'
                    startContent={<TbSettings size={20} />}
                    isDisabled={isCardFarming || isAchievementUnlocker}
                    onPress={() => {
                      setPreviousActivePage(
                        ('customlists/' + listType.settingsButtonLink) as ActivePageType,
                      )
                      setActivePage('settings')
                      if (listType.settingsButtonLink) {
                        setCurrentSettingsTab(listType.settingsButtonLink as CurrentSettingsTabType)
                      }
                    }}
                  />
                )}

                <Tabs
                  size='lg'
                  aria-label='Custom list tabs'
                  color='default'
                  variant='solid'
                  radius='full'
                  selectedKey={activeTab}
                  onSelectionChange={key => setActiveTab(key as 'all' | 'list' | 'blacklist')}
                  classNames={{
                    tabList: 'gap-0 bg-item-active',
                    tab: cn(
                      'data-[hover-unselected=true]:!bg-item-hover',
                      'data-[hover-unselected=true]:opacity-100',
                    ),
                    cursor: '!bg-item-active w-full',
                    tabContent:
                      'text-sm group-data-[selected=true]:text-content text-altwhite font-bold',
                  }}
                >
                  <Tab key='all' title={t('gamesList.allGames')} />
                  <Tab key='list' title={`${listType.title} ${t('common.list')}`} />
                  {type === 'cardFarmingList' && (
                    <Tab key='blacklist' title={`${t('customLists.blacklist')}`} />
                  )}
                </Tabs>

                {activeTab === 'all' && (
                  <Select
                    aria-label='sort'
                    disallowEmptySelection
                    radius='full'
                    startContent={<TbSortDescending2 fontSize={26} />}
                    items={sortOptions}
                    className='w-57.5 h-11'
                    classNames={{
                      value: ['text-sm !text-content'],
                      trigger: cn(
                        'bg-item-active data-[hover=true]:!bg-item-active/80 h-11',
                        'data-[open=true]:!bg-btn-achievement-header-open duration-100',
                      ),
                      popoverContent: ['bg-input rounded-xl justify-start !text-content'],
                    }}
                    defaultSelectedKeys={['a-z']}
                    onSelectionChange={e => {
                      if (e.currentKey) setSortStyle(e.currentKey)
                    }}
                  >
                    {item => (
                      <SelectItem
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
                )}

                {type === 'achievementUnlockerList' && activeTab === 'all' && (
                  <div>
                    {searchTerm === '' ? (
                      <Button
                        className='bg-btn-secondary text-btn-text font-bold'
                        radius='full'
                        isDisabled={
                          filteredGamesList.length === 0 || list.length === filteredGamesList.length
                        }
                        onPress={() => handleAddAllGames(filteredGamesList)}
                      >
                        {t('customLists.addAll')}
                      </Button>
                    ) : (
                      <Button
                        className='bg-btn-secondary text-btn-text font-bold'
                        radius='full'
                        isDisabled={
                          filteredGamesList.length === 0 ||
                          filteredGamesList.every(game =>
                            list.some(listGame => listGame.appid === game.appid),
                          )
                        }
                        onPress={() => handleAddAllResults(filteredGamesList)}
                      >
                        {t('customLists.addAllResults')}
                      </Button>
                    )}
                  </div>
                )}

                {((activeTab === 'list' && list.length > 0) ||
                  (activeTab === 'blacklist' && blacklist.length > 0)) && (
                  <Button
                    color='danger'
                    radius='full'
                    className='font-semibold'
                    onPress={activeTab === 'blacklist' ? handleClearBlacklist : handleClearList}
                  >
                    {t('common.clear')}
                  </Button>
                )}

                {searchTerm && (
                  <div className='flex items-center gap-2'>
                    <Divider orientation='vertical' className='mx-2 h-8 bg-border' />
                    <p className='text-sm text-altwhite font-bold'>{t('common.search')}</p>
                    <div className='flex items-center gap-2 text-sm text-altwhite p-2 bg-item-active rounded-full max-w-64'>
                      <p className='text-content truncate'>{searchTerm}</p>
                      <div
                        className='flex items-center justify-center cursor-pointer bg-item-hover hover:bg-item-hover/80 rounded-full p-1 duration-150'
                        onClick={() => setCustomListQueryValue('')}
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

      {activeTab === 'all' && (
        <div className='mt-4'>
          <List
            height={windowInnerHeight - 182}
            itemCount={filteredGamesList.length}
            itemSize={56}
            width='100%'
            itemData={{
              filteredGamesList: sortedFilteredGamesList,
              list,
              handleAddGame,
              handleRemoveGame,
              type,
              handleBlacklistGame,
              blacklist,
            }}
          >
            {Row}
          </List>
        </div>
      )}

      {activeTab === 'list' && (
        <div className='mt-4'>
          {carouselVisible && (
            <RecommendedCardDropsCarousel
              gamesWithDrops={type === 'cardFarmingList' ? gamesWithDrops : []}
              onAddGame={handleAddGameFromCarousel}
              isLoading={type === 'cardFarmingList' ? isLoadingDrops : false}
            />
          )}

          {!isLoading && list.length === 0 ? (
            <div
              className='flex flex-col justify-center items-center gap-2'
              style={{ height: windowInnerHeight - 257 - (carouselVisible ? 266 : 0) }}
            >
              <p className='text-sm text-altwhite px-6'>
                <Trans
                  i18nKey='customLists.emptyList'
                  values={{ title: listType.title }}
                  components={{ 1: <span className='font-black' /> }}
                />
              </p>
            </div>
          ) : (
            <div>
              {searchTerm ? (
                <div
                  className={cn(
                    'grid gap-x-5 gap-y-4 px-6',
                    columnCount === 7 ? 'grid-cols-7' : 'grid-cols-5',
                    columnCount === 8 ? 'grid-cols-8' : '',
                    columnCount === 10 ? 'grid-cols-10' : '',
                    columnCount === 12 ? 'grid-cols-12' : '',
                  )}
                >
                  {filteredList.map(item => (
                    <GameCard
                      key={item.appid}
                      item={item}
                      isCustomList={true}
                      isAchievementUnlocker={type === 'achievementUnlockerList'}
                      onOpen={() => handleGameClick(item)}
                      handleRemoveGame={() => handleRemoveGame(item)}
                    />
                  ))}
                </div>
              ) : (
                <DndContext onDragEnd={handleDragEnd}>
                  <SortableContext items={list.map(item => item.appid)}>
                    <div
                      className={cn(
                        'grid gap-x-5 gap-y-4 px-6',
                        columnCount === 7 ? 'grid-cols-7' : 'grid-cols-5',
                        columnCount === 8 ? 'grid-cols-8' : '',
                        columnCount === 10 ? 'grid-cols-10' : '',
                        columnCount === 12 ? 'grid-cols-12' : '',
                      )}
                    >
                      {list.map(item => (
                        <SortableGameCard
                          key={item.appid}
                          item={item}
                          type={type}
                          onOpen={() => handleGameClick(item)}
                          handleRemoveGame={() => handleRemoveGame(item)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'blacklist' && type === 'cardFarmingList' && (
        <div className='mt-4'>
          {blacklistedGames.length === 0 ? (
            <div className='flex flex-col justify-center items-center gap-2 h-[calc(100vh-250px)]'>
              <p className='text-sm text-altwhite px-6'>
                <Trans
                  i18nKey='customLists.emptyBlacklist'
                  values={{ title: listType.title }}
                  components={{ 1: <span className='font-black' /> }}
                />
              </p>
            </div>
          ) : (
            <List
              height={windowInnerHeight - 182}
              itemCount={blacklistedGames.length}
              itemSize={56}
              width='100%'
              itemData={{
                filteredGamesList: blacklistedGames,
                list,
                handleAddGame,
                handleRemoveGame,
                type,
                handleBlacklistGame,
                blacklist,
              }}
            >
              {Row}
            </List>
          )}
        </div>
      )}
    </div>
  )
}

interface RowData {
  filteredGamesList: Game[]
  list: Game[]
  handleAddGame: (game: Game) => void
  handleRemoveGame: (game: Game) => void
  type?: string
  handleBlacklistGame?: (game: Game) => void
  blacklist: number[]
}

interface RowProps {
  index: number
  style: React.CSSProperties
  data: RowData
}

const Row = memo(({ index, style, data }: RowProps) => {
  const {
    filteredGamesList,
    list,
    handleAddGame,
    handleRemoveGame,
    type,
    handleBlacklistGame,
    blacklist,
  } = data
  const item = filteredGamesList[index]
  const isInList = list.some(g => g.appid === item.appid)
  const isBlacklisted = blacklist.includes(item.appid)

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    ;(e.target as HTMLImageElement).src = '/fallback.webp'
  }

  return (
    <div
      style={style}
      className={cn(
        'flex items-center gap-3 pr-6 pl-4 select-none cursor-pointer duration-150',
        isInList
          ? 'bg-success/5 hover:bg-success/10'
          : isBlacklisted
            ? 'bg-danger/5 hover:bg-danger/10'
            : 'hover:bg-item-hover',
      )}
      onClick={() => (isInList ? handleRemoveGame(item) : !isBlacklisted && handleAddGame(item))}
    >
      <div
        className={cn(
          'w-0.5 h-9 rounded-full shrink-0',
          isInList ? 'bg-success' : isBlacklisted ? 'bg-danger' : 'bg-transparent',
        )}
      />
      <Image
        src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
        width={92}
        height={43}
        alt={`${item.name} image`}
        priority
        className='rounded shrink-0'
        onError={handleImageError}
      />
      <p className='text-sm font-semibold flex-1 truncate'>{item.name}</p>
      <div className='flex items-center gap-2 shrink-0' onClick={e => e.stopPropagation()}>
        {type === 'cardFarmingList' && handleBlacklistGame && (
          <Button
            size='sm'
            radius='full'
            isDisabled={isInList}
            className={cn(
              'font-semibold min-w-25',
              isBlacklisted
                ? 'bg-danger/15 text-danger'
                : 'bg-item-hover text-altwhite hover:text-content',
            )}
            onPress={() => handleBlacklistGame(item)}
          >
            {isBlacklisted
              ? i18next.t('customLists.blacklisted')
              : i18next.t('customLists.blacklist')}
          </Button>
        )}
        <Button
          size='sm'
          isIconOnly
          radius='full'
          isDisabled={isBlacklisted && !isInList}
          color={isInList ? 'danger' : 'default'}
          className={cn(!isInList && 'bg-item-hover text-content')}
          onPress={() => (isInList ? handleRemoveGame(item) : handleAddGame(item))}
        >
          {isInList ? <FaMinus /> : <FaPlus />}
        </Button>
      </div>
    </div>
  )
})

Row.displayName = 'Row'

interface SortableGameCardProps {
  item: Game
  type: CustomListType
  onOpen: () => void
  handleRemoveGame: (game: Game) => Promise<void>
}

function SortableGameCard({ item, type, onOpen, handleRemoveGame }: SortableGameCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.appid,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div className='cursor-grab' ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <GameCard
        item={item}
        isCustomList={true}
        isAchievementUnlocker={type === 'achievementUnlockerList'}
        onOpen={onOpen}
        handleRemoveGame={() => handleRemoveGame(item)}
      />
    </div>
  )
}
