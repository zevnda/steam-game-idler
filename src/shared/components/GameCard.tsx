import type { Game } from '@/shared/types'
import { memo } from 'react'
import { FaSteam } from 'react-icons/fa'
import { FaX } from 'react-icons/fa6'
import { TbArrowsSort, TbAwardFilled, TbPlayerPlayFilled, TbPlayerStopFilled } from 'react-icons/tb'
import { Button, Checkbox, cn } from '@heroui/react'
import Image from 'next/image'
import { CardMenu } from '@/features/games-list/components/CardMenu'
import { handleIdle, handleStopIdle } from '@/features/idle'
import { ExtLink } from '@/shared/components/ExtLink'
import { IdleTimer } from '@/shared/components/IdleTimer'
import { useSessionStore, useUiStore } from '@/shared/stores'

interface GameCardProps {
  item: Game
  isFreeGame?: boolean
  isCustomList?: boolean
  isAchievementUnlocker?: boolean
  isAutoIdleList?: boolean
  autoIdleEnabled?: boolean
  onToggleAutoIdle?: () => void
  onOpen?: () => void
  handleRemoveGame?: (game: Game) => Promise<void>
}

export const GameCard = memo(function GameCard({
  item,
  isFreeGame = false,
  isCustomList = false,
  isAchievementUnlocker = false,
  isAutoIdleList = false,
  autoIdleEnabled,
  onToggleAutoIdle,
  onOpen,
  handleRemoveGame,
}: GameCardProps) {
  const idleGamesList = useSessionStore(s => s.idleGamesList)
  const setSelectedGame = useUiStore(s => s.setSelectedGame)

  const idlingGame = idleGamesList.find(g => g.appid === item.appid)
  const isIdling = idlingGame !== undefined

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    ;(e.target as HTMLImageElement).src = '/fallback.webp'
  }

  if (isFreeGame) {
    return (
      <div className='relative group select-none'>
        <div className='overflow-hidden will-change-transform transition-transform duration-150'>
          <div className='aspect-460/215 relative overflow-hidden'>
            <Image
              src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
              width={460}
              height={215}
              alt={`${item.name} image`}
              priority
              onError={handleImageError}
              className='w-full h-full object-cover rounded-lg duration-150'
            />
            <div
              className='pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150'
              style={{ boxShadow: 'inset 0 0 0 2px hsl(var(--heroui-dynamic))' }}
            />
          </div>
          <div className='flex justify-between items-center pt-3'>
            <h3 className='text-xs font-bold text-altwhite group-hover:text-content truncate duration-150'>
              {item.name}
            </h3>
            <div className='flex gap-1'>
              <ExtLink href={`https://store.steampowered.com/app/${item.appid}`}>
                <div className='bg-transparent hover:bg-item-hover text-altwhite hover:text-content p-2 rounded-full transition-colors duration-150'>
                  <FaSteam size={18} />
                </div>
              </ExtLink>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative group select-none',
        isAutoIdleList && autoIdleEnabled === false && 'opacity-50',
      )}
    >
      <div className='overflow-hidden will-change-transform transition-transform duration-150'>
        <div className='aspect-460/215 relative overflow-hidden'>
          {isIdling && <IdleTimer startTime={idlingGame.startTime ?? 0} />}
          <Image
            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
            width={460}
            height={215}
            alt={`${item.name} image`}
            priority
            onError={handleImageError}
            className='w-full h-full object-cover rounded-lg duration-150'
          />
          <div
            className='pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150'
            style={{ boxShadow: 'inset 0 0 0 2px hsl(var(--heroui-dynamic))' }}
          />
        </div>
        <div className='flex justify-between items-center pt-3'>
          <h3 className='text-xs font-bold text-altwhite group-hover:text-content truncate duration-150'>
            {item.name}
          </h3>
          <div className='flex gap-1'>
            <Button
              isIconOnly
              size='sm'
              radius='full'
              className='bg-transparent hover:bg-item-hover text-altwhite hover:text-content transition-colors duration-150'
              onPress={() =>
                isIdling
                  ? handleStopIdle(item, idleGamesList, gs =>
                      useSessionStore.setState({ idleGamesList: gs }),
                    )
                  : handleIdle(item)
              }
            >
              {isIdling ? <TbPlayerStopFilled size={18} /> : <TbPlayerPlayFilled size={18} />}
            </Button>
            {!isAutoIdleList && (
              <Button
                isIconOnly
                size='sm'
                radius='full'
                className='bg-transparent hover:bg-item-hover text-altwhite hover:text-content transition-colors duration-150'
                onPress={() => setSelectedGame(item)}
              >
                <TbAwardFilled size={18} />
              </Button>
            )}
            {isAchievementUnlocker && (
              <Button
                isIconOnly
                size='sm'
                radius='full'
                className='bg-transparent hover:bg-item-hover text-altwhite hover:text-content transition-colors duration-150'
                onPress={() => onOpen?.()}
              >
                <TbArrowsSort size={18} />
              </Button>
            )}
            {isAutoIdleList && (
              <div className='flex items-center' onPointerDown={e => e.stopPropagation()}>
                <Checkbox
                  size='sm'
                  isSelected={autoIdleEnabled !== false}
                  classNames={{ wrapper: cn('group-data-[selected=true]:!bg-dynamic') }}
                  onValueChange={() => onToggleAutoIdle?.()}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {!isCustomList ? (
        <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150'>
          <CardMenu item={item} />
        </div>
      ) : (
        <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150'>
          <div
            className='bg-danger hover:opacity-90 rounded-full cursor-pointer p-1.5 duration-150'
            onPointerDown={e => e.stopPropagation()}
            onClick={() => handleRemoveGame?.(item)}
          >
            <FaX size={10} />
          </div>
        </div>
      )}
    </div>
  )
})
