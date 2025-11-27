import type { Game } from '@/types'
import type { CSSProperties, ReactElement, SyntheticEvent } from 'react'

import { cn, Divider, Input, NumberInput } from '@heroui/react'
import { memo, useEffect, useMemo, useState } from 'react'
import { useUserStore } from '@/stores/userStore'
import Image from 'next/image'
import { Trans, useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbChevronRight } from 'react-icons/tb'
import { FixedSizeList as List } from 'react-window'

import { useGameSettings } from '@/hooks/settings/useGameSettings'

interface RowData {
  filteredGamesList: Game[]
  selectedGame: Game | null
  onGameSelect: (game: Game) => void
}

interface RowProps {
  index: number
  style: CSSProperties
  data: RowData
}

const Row = memo(({ index, style, data }: RowProps): ReactElement => {
  const { filteredGamesList, selectedGame, onGameSelect } = data
  const item = filteredGamesList[index]

  const handleImageError = (event: SyntheticEvent<HTMLImageElement, Event>): void => {
    ;(event.target as HTMLImageElement).src = '/fallback.webp'
  }

  const isSelected = selectedGame?.appid === item.appid

  return (
    <div
      style={style}
      className={cn(
        'flex justify-between items-center gap-2',
        'hover:bg-item-hover cursor-pointer px-3 py-1',
        'duration-150 select-none',
        isSelected && 'bg-item-hover border-l-2 border-blue-500',
      )}
      onClick={() => onGameSelect(item)}
    >
      <div className='flex items-center gap-3 max-w-[90%]'>
        <Image
          src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
          className='aspect-62/29 rounded-sm'
          width={62}
          height={29}
          alt={`${item.name} image`}
          priority={true}
          onError={handleImageError}
        />
        <p className='text-sm truncate mr-8'>{item.name}</p>
      </div>
    </div>
  )
})

Row.displayName = 'Row'

export default function GameSettings(): ReactElement {
  const { t } = useTranslation()
  const { gamesList } = useUserStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [windowInnerHeight, setWindowInnerHeight] = useState(window.innerHeight)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  const {
    globalMaxIdleTime,
    maxIdleTime,
    maxCardDrops,
    handleGlobalMaxIdleTimeChange,
    maxAchievementUnlocks,
    handleMaxIdleTimeChange,
    handleMaxCardDropsChange,
    handleMaxAchievementUnlocksChange,
  } = useGameSettings({ appId: selectedGame?.appid })

  const filteredGamesList = useMemo(() => {
    if (!searchTerm) return gamesList
    return gamesList.filter(game => game.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [gamesList, searchTerm])

  const itemData = {
    filteredGamesList,
    selectedGame,
    onGameSelect: setSelectedGame,
  }

  useEffect(() => {
    const handleResize = (): void => {
      setWindowInnerHeight(window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className='relative flex flex-col gap-4 mt-9 w-4/5'>
      <div className='flex flex-col gap-0 select-none'>
        <p className='flex items-center text-xs text-altwhite font-bold'>
          {t('settings.title')}
          <span>
            <TbChevronRight size={12} />
          </span>
        </p>
        <p className='text-3xl font-black'>{t('common.gameSettings')}</p>
      </div>

      <div className='flex flex-col gap-3 mt-4'>
        <Input
          isClearable
          placeholder={t('common.search')}
          startContent={<RiSearchLine size={24} className='text-content/60' />}
          classNames={{
            inputWrapper: cn(
              'bg-input data-[hover=true]:!bg-inputhover',
              'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
            ),
            label: ['text-xs !text-altwhite font-bold'],
            input: ['!text-content placeholder:text-altwhite/50'],
          }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
        />

        <div className='border border-border/70 rounded-lg mb-2 overflow-hidden bg-popover/80'>
          <List
            height={windowInnerHeight - 610}
            itemCount={filteredGamesList.length}
            itemSize={37}
            width='100%'
            itemData={itemData}
          >
            {Row}
          </List>
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('gameSettings.globalMaxIdle')}</p>
            <p className='text-xs text-altwhite'>
              <Trans i18nKey='gameSettings.globalMaxIdleSub' />
            </p>
          </div>
          <NumberInput
            size='sm'
            value={globalMaxIdleTime}
            step={1}
            minValue={0}
            maxValue={99999}
            aria-label='max idle time'
            className='w-[90px]'
            classNames={{
              inputWrapper: cn(
                'bg-input data-[hover=true]:!bg-inputhover border-none',
                'group-data-[focus-visible=true]:ring-transparent',
                'group-data-[focus-visible=true]:ring-offset-transparent',
                'group-data-[focus-within=true]:!bg-inputhover',
                'border group-data-[invalid=true]:border-red-500!',
                'border group-data-[invalid=true]:bg-red-500/10!',
                !selectedGame && 'opacity-50',
              ),
              input: ['text-sm !text-content'],
              stepperButton: ['!text-content', 'text-sm'],
            }}
            onValueChange={handleGlobalMaxIdleTimeChange}
          />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('gameSettings.idle')}</p>
            <p className='text-xs text-altwhite'>
              <Trans i18nKey='gameSettings.idleSub' />
            </p>
          </div>
          <NumberInput
            size='sm'
            value={maxIdleTime}
            step={1}
            minValue={0}
            maxValue={99999}
            aria-label='max idle time'
            className='w-[90px]'
            isDisabled={!selectedGame}
            classNames={{
              inputWrapper: cn(
                'bg-input data-[hover=true]:!bg-inputhover border-none',
                'group-data-[focus-visible=true]:ring-transparent',
                'group-data-[focus-visible=true]:ring-offset-transparent',
                'group-data-[focus-within=true]:!bg-inputhover',
                'border group-data-[invalid=true]:border-red-500!',
                'border group-data-[invalid=true]:bg-red-500/10!',
                !selectedGame && 'opacity-50',
              ),
              input: ['text-sm !text-content'],
              stepperButton: ['!text-content', 'text-sm'],
            }}
            onValueChange={handleMaxIdleTimeChange}
          />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('gameSettings.drops')}</p>
            <p className='text-xs text-altwhite'>
              <Trans i18nKey='gameSettings.dropsSub' />
            </p>
          </div>
          <NumberInput
            size='sm'
            value={maxCardDrops}
            step={1}
            minValue={0}
            maxValue={99999}
            aria-label='max card drops'
            className='w-[90px]'
            isDisabled={!selectedGame}
            classNames={{
              inputWrapper: cn(
                'bg-input data-[hover=true]:!bg-inputhover border-none',
                'group-data-[focus-visible=true]:ring-transparent',
                'group-data-[focus-visible=true]:ring-offset-transparent',
                'group-data-[focus-within=true]:!bg-inputhover',
                'border group-data-[invalid=true]:border-red-500!',
                'border group-data-[invalid=true]:bg-red-500/10!',
                !selectedGame && 'opacity-50',
              ),
              input: ['text-sm !text-content'],
              stepperButton: ['!text-content', 'text-sm'],
            }}
            onValueChange={handleMaxCardDropsChange}
          />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('gameSettings.achievements')}</p>
            <p className='text-xs text-altwhite'>
              <Trans i18nKey='gameSettings.achievementsSub' />
            </p>
          </div>
          <NumberInput
            size='sm'
            value={maxAchievementUnlocks}
            step={1}
            minValue={0}
            maxValue={99999}
            aria-label='max achievement unlocks'
            className='w-[90px]'
            isDisabled={!selectedGame}
            classNames={{
              inputWrapper: cn(
                'bg-input data-[hover=true]:!bg-inputhover border-none',
                'group-data-[focus-visible=true]:ring-transparent',
                'group-data-[focus-visible=true]:ring-offset-transparent',
                'group-data-[focus-within=true]:!bg-inputhover',
                'border group-data-[invalid=true]:border-red-500!',
                'border group-data-[invalid=true]:bg-red-500/10!',
                !selectedGame && 'opacity-50',
              ),
              input: ['text-sm !text-content'],
              stepperButton: ['!text-content', 'text-sm'],
            }}
            onValueChange={handleMaxAchievementUnlocksChange}
          />
        </div>
      </div>
    </div>
  )
}
