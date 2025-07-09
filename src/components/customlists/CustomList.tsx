import type { Game } from '@/types'
import type { DragEndEvent } from '@dnd-kit/core'
import type { ReactElement, ReactNode } from 'react'

import { Button, cn } from '@heroui/react'
import { useState } from 'react'
import { DndContext } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { TbAward, TbCards, TbEdit } from 'react-icons/tb'

import { useStateContext } from '@/components/contexts/StateContext'
import EditListModal from '@/components/customlists/EditListModal'
import ManualAdd from '@/components/customlists/ManualAdd'
import GameCard from '@/components/ui/GameCard'
import { useAutomate } from '@/hooks/automation/useAutomateButtons'
import useCustomList from '@/hooks/customlists/useCustomList'

type CustomListType = 'cardFarmingList' | 'achievementUnlockerList' | 'autoIdleList' | 'favoritesList'

interface CustomListProps {
  type: CustomListType
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
    setSearchTerm,
    showInList,
    setShowInList,
    handleAddGame,
    handleAddAllGames,
    handleRemoveGame,
    handleUpdateListOrder,
    handleClearList,
  } = useCustomList(type)
  const { startCardFarming, startAchievementUnlocker } = useAutomate()
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const { sidebarCollapsed, isGameSettingsOpen } = useStateContext()

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

  return (
    <>
      <div
        className={cn(
          'min-h-calc max-h-calc bg-base overflow-y-auto overflow-x-hidden mt-9 duration-500 ease-in-out',
          sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
        )}
        ref={containerRef}
      >
        <div
          className={cn(
            'flex flex-col justify-center w-[calc(100svw-68px)]',
            'py-2 pl-4 bg-base bg-opacity-90 backdrop-blur-md z-10 rounded-tl-xl',
            list.slice(0, visibleGames).length >= 21 ? 'pr-4' : 'pr-2',
          )}
        >
          <div className='flex flex-col select-none'>
            <p className='text-3xl font-black'>{listType.title}</p>
            <p className='text-xs text-altwhite my-2'>{listType.description}</p>
          </div>

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
                onPress={listType.startButton === 'startCardFarming' ? startCardFarming : startAchievementUnlocker}
              >
                {listType.buttonLabel}
              </Button>
            )}
          </div>
        </div>

        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={list.map(item => item.appid)}>
            <div className='grid grid-cols-5 2xl:grid-cols-7 gap-4 p-4'>
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
        setSearchTerm={setSearchTerm}
        setShowInList={setShowInList}
        handleAddGame={handleAddGame}
        handleAddAllGames={handleAddAllGames}
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
