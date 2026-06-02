import type { GameForFarming } from '@/features/card-farming/services/cardFarmingService'
import type { ActivePageType } from '@/shared/types'
import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TbCheck, TbPlayerStopFilled } from 'react-icons/tb'
import { Button, cn, Spinner } from '@heroui/react'
import Image from 'next/image'
import { startAchievementUnlocker } from '@/features/achievement-unlocker/services/startAchievementUnlocker'
import {
  beginFarmingCycle,
  checkForNextTask,
  checkGamesForDrops,
} from '@/features/card-farming/services/cardFarmingService'
import { startAutoIdleGames, stopFarmIdle } from '@/features/idle'
import { logEvent } from '@/shared/services/logService'
import { useSessionStore, useUiStore } from '@/shared/stores'
import { updateDiscordPresence, updateTrayIcon } from '@/shared/utils'

export function CardFarming({ activePage }: { activePage: ActivePageType }) {
  const { t } = useTranslation()
  const isCardFarming = useSessionStore(s => s.isCardFarming)
  const setIsCardFarming = useSessionStore(s => s.setIsCardFarming)
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)
  const transitionDuration = useUiStore(s => s.transitionDuration)

  const abortRef = useRef(new AbortController())
  const [isComplete, setIsComplete] = useState(false)
  const [totalDropsRemaining, setTotalDropsRemaining] = useState(0)
  const [gamesWithDrops, setGamesWithDrops] = useState<Set<GameForFarming>>(new Set())
  const [disableStop, setDisableStop] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [fallbackImage, setFallbackImage] = useState('')

  useEffect(() => {
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    const runFarming = async () => {
      try {
        if (signal.aborted) return

        const { totalDrops, gamesSet } = await checkGamesForDrops()
        if (signal.aborted) return

        setTotalDropsRemaining(totalDrops)
        setGamesWithDrops(new Set(gamesSet))

        if (gamesSet.size > 0) {
          const success = await beginFarmingCycle(
            gamesSet,
            signal,
            setGamesWithDrops,
            setTotalDropsRemaining,
          )
          if (!success) {
            await logEvent('[Card Farming] An error occurred - stopping')
            return setIsComplete(true)
          }
        } else {
          const { shouldStart, task } = await checkForNextTask()
          if (shouldStart) {
            await stopFarmIdle(gamesSet)
            setIsCardFarming(false)
            if (task === 'achievementUnlocker') await startAchievementUnlocker()
            if (task === 'autoIdle') await startAutoIdleGames()
            await logEvent('[Card Farming] No drops remaining - moving to next task: ' + task)
          } else {
            await logEvent('[Card Farming] No games left - stopping')
          }
          return setIsComplete(true)
        }

        if (!signal.aborted) runFarming()
      } catch (error) {
        if (error) {
          console.error('Error in card farming cycle:', error)
          await logEvent(`[Error] in card farming: ${error}`)
        }
        setIsComplete(true)
      }
    }

    runFarming()

    return () => {
      abortRef.current.abort()
    }
  }, [setIsCardFarming])

  useEffect(() => {
    if (isCardFarming && gamesWithDrops.size > 0 && totalDropsRemaining > 0) {
      updateTrayIcon(
        t('trayIcon.cardFarming', { count: totalDropsRemaining, total: gamesWithDrops.size }),
        true,
      )
      updateDiscordPresence(
        'Farming Cards',
        `${gamesWithDrops.size} games with ${totalDropsRemaining} drops remaining`,
      )
    }
  }, [isCardFarming, gamesWithDrops.size, totalDropsRemaining, t])

  useEffect(() => {
    setTimeout(() => setDisableStop(false), 5000)
  }, [])

  const firstGame = [...gamesWithDrops][0]

  useEffect(() => {
    setImageLoaded(false)
    setFallbackImage('')
  }, [firstGame?.appid])

  const handleStop = async () => {
    abortRef.current.abort()
    await stopFarmIdle(gamesWithDrops)
    setIsCardFarming(false)
    updateTrayIcon()
    updateDiscordPresence()
  }

  return (
    <div
      className={cn(
        'absolute top-0 z-4 w-full h-screen bg-gradient-bg overflow-y-auto overflow-x-hidden ease-in-out',
        activePage !== 'customlists/card-farming' && 'hidden',
      )}
      style={{ transitionDuration, transitionProperty: 'width, left' }}
    >
      {firstGame?.appid && (
        <Image
          src={
            fallbackImage ||
            `https://cdn.steamstatic.com/steam/apps/${firstGame.appid}/library_hero.jpg`
          }
          className={cn('absolute top-0 left-0 w-full', !imageLoaded && 'hidden')}
          alt='background'
          width={1920}
          height={1080}
          priority
          onLoad={() => setImageLoaded(true)}
          onError={() =>
            setFallbackImage(`https://cdn.steamstatic.com/steam/apps/${firstGame.appid}/header.jpg`)
          }
          style={{
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 70%)',
          }}
        />
      )}
      {imageLoaded && <div className='absolute top-0 left-0 w-full h-screen bg-base/70' />}

      <div
        className={cn(
          'relative w-[calc(100vw-227px)] pl-6 pt-2 pr-12 mt-12 ease-in-out',
          sidebarCollapsed ? 'ml-14' : 'ml-62.5',
        )}
        style={{ transitionDuration, transitionProperty: 'margin-left' }}
      >
        <div className='flex justify-between items-center pb-3'>
          <div className='flex items-center gap-1 select-none'>
            <div className='flex flex-col justify-center'>
              <p className='text-3xl font-black'>{t('common.cardFarming')}</p>
              <p className='text-xs text-altwhite my-2'>{t('automation.cardFarming.running')}</p>
              <div className='flex items-center gap-2 mt-1'>
                <Button
                  color='danger'
                  radius='full'
                  className='font-bold'
                  startContent={<TbPlayerStopFilled size={18} />}
                  isDisabled={!isComplete && disableStop}
                  onPress={handleStop}
                >
                  {isComplete ? t('common.close') : t('common.stop')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'flex flex-col item max-h-[calc(100vh-104px)] ease-in-out pt-10 overflow-hidden',
            sidebarCollapsed ? 'w-[calc(100vw-106px)]' : 'w-[calc(100vw-300px)]',
          )}
          style={{ transitionDuration, transitionProperty: 'width' }}
        >
          <div className='flex justify-center items-center flex-col p-6 bg-tab-panel rounded-4xl border border-border'>
            {isComplete ? (
              <div className='flex flex-col items-center justify-center'>
                <div className='border border-border rounded-full inline-block p-2 w-fit'>
                  <TbCheck className='text-green-400' fontSize={50} />
                </div>
                <p className='mt-4'>{t('common.done')}</p>
              </div>
            ) : !gamesWithDrops.size ? (
              <Spinner
                variant='simple'
                label={t('automation.cardFarming.initialDelay')}
                classNames={{ label: 'text-content' }}
              />
            ) : (
              <>
                <p>
                  <Trans
                    i18nKey='automation.cardFarming.progress'
                    values={{ count: gamesWithDrops.size, total: totalDropsRemaining }}
                    components={{
                      1: <span className='font-bold text-dynamic' />,
                      3: <span className='font-bold text-dynamic' />,
                    }}
                  />
                </p>
                <div className='p-2 rounded-lg w-full max-h-[calc(100vh-392px)] overflow-y-auto'>
                  <div className='grid grid-cols-2 gap-2 px-2 overflow-y-auto'>
                    {Array.from(gamesWithDrops).map(item => (
                      <div
                        key={item.appid}
                        className='flex gap-1 border border-border rounded-lg p-1'
                      >
                        <Image
                          src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
                          className='aspect-62/36 rounded'
                          width={62}
                          height={36}
                          alt={`${item.name} image`}
                          priority
                        />
                        <div className='flex flex-col px-2 max-w-[80%]'>
                          <p className='text-sm font-semibold truncate'>{item.name}</p>
                          <p className='text-xs text-altwhite'>{item.appid}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
