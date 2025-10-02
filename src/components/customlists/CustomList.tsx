import type { Game, InvokeSettings, UserSummary } from '@/types'
import type { DragEndEvent } from '@dnd-kit/core'
import type { ReactElement, ReactNode } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Button, cn } from '@heroui/react'
import { useEffect, useState } from 'react'
import { DndContext } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { TbAward, TbCards, TbEdit } from 'react-icons/tb'

import { useStateContext } from '@/components/contexts/StateContext'
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
  const { startCardFarming, startAchievementUnlocker } = useAutomate()
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const { sidebarCollapsed, transitionDuration, isGameSettingsOpen } = useStateContext()
  const [gamesWithDrops, setGamesWithDrops] = useState<Game[]>([])
  const [isLoadingDrops, setIsLoadingDrops] = useState(false)

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
    },
    achievementUnlockerList: {
      title: t('common.achievementUnlocker'),
      description: t('customLists.achievementUnlocker.subtitle'),
      icon: <TbAward fontSize={20} />,
      startButton: 'startAchievementUnlocker',
      buttonLabel: t('customLists.achievementUnlocker.buttonLabel'),
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
        <div className={cn('w-[calc(100vw-227px)] z-[50] pl-6 pt-2')}>
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

                  {listType.startButton && (
                    <Button
                      className='bg-gradient-to-r from-purple-800 via-purple-600 to-cyan-500 text-white font-bold transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full before:animate-[shimmer_2s_ease-in-out_infinite] hover:before:animate-[shimmer_0.7s_ease-in-out] [&>*]:relative [&>*]:z-10'
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
                    <SortableGameCard key={item.appid} item={item} isGameSettingsOpen={isGameSettingsOpen} />
                  ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

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
  isGameSettingsOpen: boolean
}

function SortableGameCard({ item, isGameSettingsOpen }: SortableGameCardProps): ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.appid })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div className='cursor-grab' ref={setNodeRef} style={style} {...attributes} {...(!isGameSettingsOpen && listeners)}>
      <GameCard item={item} />
    </div>
  )
}
