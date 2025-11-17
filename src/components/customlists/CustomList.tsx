import type { ActivePageType, CurrentSettingsTabType, Game, InvokeSettings, UserSummary } from '@/types'
import type { DragEndEvent } from '@dnd-kit/core'
import type { ReactElement, ReactNode } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Alert, Button, cn, useDisclosure } from '@heroui/react'
import { useEffect, useState } from 'react'
import { DndContext } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { TbAward, TbCards, TbEdit, TbSettings } from 'react-icons/tb'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useStateContext } from '@/components/contexts/StateContext'
import { useUserContext } from '@/components/contexts/UserContext'
import AchievementOrderModal from '@/components/customlists/AchievementOrderModal'
import EditListModal from '@/components/customlists/EditListModal'
import ManualAdd from '@/components/customlists/ManualAdd'
import RecommendedCardDropsCarousel from '@/components/customlists/RecommendedCardDropsCarousel'
import GameCard from '@/components/ui/GameCard'
import { useAutomate } from '@/hooks/automation/useAutomateButtons'
import useCustomList from '@/hooks/customlists/useCustomList'
import { getAllGamesWithDrops } from '@/utils/automation'

type CustomListType = 'cardFarmingList' | 'achievementUnlockerList' | 'autoIdleList' | 'favoritesList'

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
  icon: ReactNode
  startButton: 'startCardFarming' | 'startAchievementUnlocker' | null
  buttonLabel: string | null
  settingsButton?: boolean
  settingsButtonLink?: string
  switches?: boolean
}

export default function CustomList({ type }: CustomListProps): ReactElement {
  const { t } = useTranslation()
  const {
    list,
    setList,
    visibleGames,
    filteredGamesList,
    containerRef,
    searchTerm,
    setSearchTerm,
    showInList,
    setShowInList,
    handleAddGame,
    handleAddAllGames,
    handleAddAllResults,
    handleRemoveGame,
    handleUpdateListOrder,
    handleClearList,
  } = useCustomList(type)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [gamesWithDrops, setGamesWithDrops] = useState<Game[]>([])
  const [isLoadingDrops, setIsLoadingDrops] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const { startCardFarming, startAchievementUnlocker } = useAutomate()
  const { sidebarCollapsed, transitionDuration } = useStateContext()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { setActivePage, setPreviousActivePage, setCurrentSettingsTab } = useNavigationContext()
  const { userSettings } = useUserContext()

  const handleDragEnd = (event: DragEndEvent): void => {
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
    const getGamesWithDrops = async (): Promise<void> => {
      if (type === 'cardFarmingList') {
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

        const shuffledAndLimitedGames = [...parsedGamesData].sort(() => Math.random() - 0.5).slice(0, 10)

        setGamesWithDrops(shuffledAndLimitedGames)
        setIsLoadingDrops(false)
      }
    }
    getGamesWithDrops()
  }, [type])

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
      icon: <TbEdit fontSize={20} />,
      startButton: null,
      buttonLabel: null,
    },
    favoritesList: {
      title: t('customLists.favorites.title'),
      description: t('customLists.favorites.subtitle'),
      icon: <TbEdit fontSize={20} />,
      startButton: null,
      buttonLabel: null,
    },
  }

  const listType = listTypes[type]

  if (!listType) {
    return <p>{t('customLists.invalid')}</p>
  }

  const handleAddGameFromCarousel = (game: Game): void => {
    handleAddGame(game)
  }

  const handleGameClick = (game: Game): void => {
    setSelectedGame(game)
    onOpen()
  }

  return (
    <>
      <div
        ref={containerRef}
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
          <div className='flex justify-between items-center pb-3'>
            <div className='flex items-center gap-1 select-none'>
              <div className='flex flex-col justify-center'>
                <p className='text-3xl font-black'>{listType.title}</p>
                <p className='text-xs text-altwhite my-2'>{listType.description}</p>

                <div className='flex items-center gap-2 mt-1'>
                  <Button
                    className='bg-btn-secondary text-btn-text font-bold'
                    radius='full'
                    startContent={<TbEdit fontSize={20} />}
                    onPress={() => setEditModalOpen(true)}
                  >
                    {t('customLists.edit')}
                  </Button>

                  <ManualAdd listName={type} setList={setList} />

                  {listType.settingsButton && listType.settingsButtonLink && (
                    <Button
                      isIconOnly
                      radius='full'
                      className='bg-btn-secondary text-btn-text font-bold'
                      startContent={<TbSettings size={20} />}
                      onPress={() => {
                        setPreviousActivePage(('customlists/' + listType.settingsButtonLink) as ActivePageType)
                        setActivePage('settings')
                        if (listType.settingsButtonLink) {
                          setCurrentSettingsTab(listType.settingsButtonLink as CurrentSettingsTabType)
                        }
                      }}
                    />
                  )}

                  {listType.startButton && (
                    <Button
                      className='bg-linear-to-r from-purple-800 via-purple-600 to-cyan-500 text-white font-bold transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-linear-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full before:animate-[shimmer_2s_ease-in-out_infinite] hover:before:animate-[shimmer_0.7s_ease-in-out] *:relative *:z-10'
                      radius='full'
                      startContent={listType.icon}
                      onPress={
                        listType.startButton === 'startCardFarming' ? startCardFarming : startAchievementUnlocker
                      }
                    >
                      {listType.buttonLabel}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {!userSettings.cardFarming.credentials && (
          <div className='mx-6 max-w-fit'>
            <Alert
              color='primary'
              variant='faded'
              classNames={{
                base: '!bg-dynamic/30 text-dynamic !border-dynamic/40',
                iconWrapper: '!bg-dynamic/30 border-dynamic/40',
                description: 'font-bold text-xs',
              }}
              description={t('settings.cardFarming.alert')}
            />
          </div>
        )}

        <RecommendedCardDropsCarousel
          gamesWithDrops={type === 'cardFarmingList' ? gamesWithDrops : []}
          onAddGame={handleAddGameFromCarousel}
          isLoading={type === 'cardFarmingList' ? isLoadingDrops : false}
        />

        {list.length > 0 && (
          <div>
            <p className='text-lg font-black px-6'>{t('customLists.yourList')}</p>
          </div>
        )}
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={list.map(item => item.appid)}>
            <div className='grid grid-cols-5 2xl:grid-cols-7 gap-4 p-6 pt-4'>
              {list &&
                list
                  .slice(0, visibleGames)
                  .map(item => (
                    <SortableGameCard key={item.appid} item={item} type={type} onOpen={() => handleGameClick(item)} />
                  ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {selectedGame && <AchievementOrderModal item={selectedGame} isOpen={isOpen} onOpenChange={onOpenChange} />}

      <EditListModal
        type={type}
        list={list}
        isOpen={isEditModalOpen}
        filteredGamesList={filteredGamesList}
        showInList={showInList}
        onOpenChange={setEditModalOpen}
        onClose={() => {
          setSearchTerm('')
          setShowInList(false)
        }}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setShowInList={setShowInList}
        handleAddGame={handleAddGame}
        handleAddAllGames={handleAddAllGames}
        handleAddAllResults={handleAddAllResults}
        handleRemoveGame={handleRemoveGame}
        handleClearList={handleClearList}
      />
    </>
  )
}

interface SortableGameCardProps {
  item: Game
  type: CustomListType
  onOpen: () => void
}

function SortableGameCard({ item, type, onOpen }: SortableGameCardProps): ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.appid })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div className='cursor-grab' ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <GameCard item={item} isAchievementUnlocker={type === 'achievementUnlockerList'} onOpen={onOpen} />
    </div>
  )
}
