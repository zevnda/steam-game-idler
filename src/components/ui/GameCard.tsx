import type { Game } from '@/types'
import type { ReactElement, SyntheticEvent } from 'react'

import { Button, useDisclosure } from '@heroui/react'
import { memo } from 'react'
import Image from 'next/image'
import { FaSteam } from 'react-icons/fa'
import { TbAwardFilled, TbPlayerPlayFilled, TbPlayerStopFilled } from 'react-icons/tb'

import { useIdleContext } from '@/components/contexts/IdleContext'
import { useStateContext } from '@/components/contexts/StateContext'
import CardMenu from '@/components/gameslist/CardMenu'
import GameSettings from '@/components/gameslist/GameSettings'
import ExtLink from '@/components/ui/ExtLink'
import IdleTimer from '@/components/ui/IdleTimer'
import { handleIdle, handleStopIdle, viewAchievments } from '@/hooks/ui/useGameCard'

interface GameCardProps {
  item: Game
  isFreeGame?: boolean
}

const GameCard = memo(function GameCard({ item, isFreeGame = false }: GameCardProps): ReactElement {
  const { idleGamesList, setIdleGamesList } = useIdleContext()
  const { setAppId, setAppName, setShowAchievements } = useStateContext()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const idlingGame = idleGamesList.find(game => game.appid === item.appid)
  const isIdling = idlingGame !== undefined

  const handleImageError = (event: SyntheticEvent<HTMLImageElement, Event>): void => {
    ;(event.target as HTMLImageElement).src = '/fallback.jpg'
  }

  if (isFreeGame) {
    return (
      <div className='relative group select-none'>
        <div className='overflow-hidden will-change-transform transition-transform duration-150'>
          <div className='aspect-[460/215] relative overflow-hidden'>
            <Image
              src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
              width={460}
              height={215}
              alt={`${item.name} image`}
              priority={true}
              onError={handleImageError}
              className='w-full h-full object-cover rounded-lg border-2 border-transparent group-hover:border-dynamic duration-150'
            />
          </div>
          <div className='flex justify-between items-center p-1 pt-3'>
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
    <>
      <div className='relative group select-none'>
        <div className='overflow-hidden will-change-transform transition-transform duration-150'>
          <div className='aspect-[460/215] relative overflow-hidden'>
            {isIdling && <IdleTimer startTime={idlingGame.startTime ?? 0} />}
            <Image
              src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
              width={460}
              height={215}
              alt={`${item.name} image`}
              priority={true}
              onError={handleImageError}
              className='w-full h-full object-cover rounded-lg border-2 border-transparent group-hover:border-dynamic duration-150'
            />
          </div>
          <div className='flex justify-between items-center p-1 pt-3'>
            <h3 className='text-xs font-bold text-altwhite group-hover:text-content truncate duration-150'>
              {item.name}
            </h3>

            <div className='flex gap-1'>
              <Button
                isIconOnly
                size='sm'
                radius='full'
                className='bg-transparent hover:bg-item-hover text-altwhite hover:text-content transition-colors duration-150'
                onPress={() => (isIdling ? handleStopIdle(item, idleGamesList, setIdleGamesList) : handleIdle(item))}
              >
                {isIdling ? <TbPlayerStopFilled size={18} /> : <TbPlayerPlayFilled size={18} />}
              </Button>

              <Button
                isIconOnly
                size='sm'
                radius='full'
                className='bg-transparent hover:bg-item-hover text-altwhite hover:text-content transition-colors duration-150'
                onPress={() => viewAchievments(item, setAppId, setAppName, setShowAchievements)}
              >
                <TbAwardFilled size={18} />
              </Button>
            </div>
          </div>
        </div>

        <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150'>
          <CardMenu item={item} onOpen={onOpen} />
        </div>
      </div>

      <GameSettings isOpen={isOpen} onOpenChange={onOpenChange} />
    </>
  )
})

export default GameCard
