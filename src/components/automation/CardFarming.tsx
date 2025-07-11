import type { GameWithDrops } from '@/hooks/automation/useCardFarming'
import type { ActivePageType } from '@/types'
import type { ReactElement } from 'react'

import { Button, cn, Spinner } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Trans, useTranslation } from 'react-i18next'
import { TbCheck } from 'react-icons/tb'

import { useStateContext } from '@/components/contexts/StateContext'
import { useAutomate } from '@/hooks/automation/useAutomateButtons'
import { handleCancel, useCardFarming } from '@/hooks/automation/useCardFarming'

export default function CardFarming({ activePage }: { activePage: ActivePageType }): ReactElement {
  const { t } = useTranslation()
  const { sidebarCollapsed, transitionDuration, setIsCardFarming } = useStateContext()

  const isMountedRef = useRef(true)
  const abortControllerRef = useRef(new AbortController())

  const [isComplete, setIsComplete] = useState(false)
  const [totalDropsRemaining, setTotalDropsRemaining] = useState(0)
  const [gamesWithDrops, setGamesWithDrops] = useState<Set<GameWithDrops>>(new Set())
  const [disableStopButton, setDisableStopButton] = useState(true)
  const { startAchievementUnlocker } = useAutomate()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useCardFarming(
      setIsComplete,
      setTotalDropsRemaining,
      setGamesWithDrops,
      startAchievementUnlocker,
      isMountedRef,
      abortControllerRef,
    )

    const abortController = abortControllerRef.current

    return () => {
      isMountedRef.current = false
      abortController.abort()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTimeout(() => {
      setDisableStopButton(false)
    }, 5000)
  }, [])

  const renderGamesList = (): ReactElement => {
    if (!gamesWithDrops.size) {
      return (
        <Spinner
          variant='simple'
          label={t('automation.cardFarming.initialDelay')}
          classNames={{ label: 'text-content' }}
        />
      )
    }

    return (
      <>
        {!isComplete && (
          <p>
            <Trans
              i18nKey='automation.cardFarming.progress'
              values={{
                count: gamesWithDrops.size,
                total: totalDropsRemaining,
              }}
              components={{
                1: <span className='font-bold text-dynamic' />,
                3: <span className='font-bold text-dynamic' />,
              }}
            />
          </p>
        )}

        <div className='p-2 border border-border rounded-lg'>
          <div className='grid grid-cols-2 gap-2 max-h-[250px] p-2 overflow-y-auto'>
            {[...Array.from(gamesWithDrops)].map(item => (
              <div key={item.appid} className='flex gap-1 border border-border rounded-lg p-1'>
                <Image
                  src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
                  className='aspect-[62/36] rounded'
                  width={62}
                  height={36}
                  alt={`${item.name} image`}
                  priority={true}
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
    )
  }

  const renderContent = (): ReactElement => {
    if (isComplete) {
      return (
        <div className='border border-border rounded-full inline-block p-2 w-fit'>
          <TbCheck className='text-green-400' fontSize={50} />
        </div>
      )
    }

    return renderGamesList()
  }

  return (
    <div
      className={cn(
        'absolute top-0 bg-base h-screen ease-in-out z-[4]',
        activePage !== 'customlists/card-farming' && 'hidden',
        sidebarCollapsed ? 'w-[calc(100vw-56px)] left-[56px]' : 'w-[calc(100vw-250px)] left-[250px]',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width, left',
      }}
    >
      <div className='relative flex justify-evenly items-center flex-col p-14 h-calc'>
        <Image
          src='/background.webp'
          className='absolute top-0 left-0 w-full h-full object-cover'
          alt='background'
          width={1920}
          height={1080}
          priority
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 40%)',
          }}
        />
        <div className='absolute top-0 left-0 bg-base/80 w-full h-screen backdrop-blur-lg' />

        <div className={cn('flex items-center flex-col gap-6 z-10 bg-base/60 p-8 rounded-lg w-full')}>
          <p className='text-3xl font-semibold'>{t('common.cardFarming')}</p>

          {renderContent()}

          <Button
            color='danger'
            radius='full'
            className='font-bold w-56'
            isDisabled={!isComplete && disableStopButton}
            onPress={() => {
              handleCancel(gamesWithDrops, isMountedRef, abortControllerRef)
              setIsCardFarming(false)
            }}
          >
            {isComplete ? <p>{t('common.close')}</p> : <p>{t('common.stop')}</p>}
          </Button>
        </div>
      </div>
    </div>
  )
}
