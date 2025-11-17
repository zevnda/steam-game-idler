import type { GameWithDrops } from '@/hooks/automation/useCardFarming'
import type { ActivePageType } from '@/types'
import type { ReactElement } from 'react'

import { Button, cn, Spinner } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Trans, useTranslation } from 'react-i18next'
import { TbCheck, TbPlayerStopFilled } from 'react-icons/tb'

import { useStateContext } from '@/components/contexts/StateContext'
import { useAutomate } from '@/hooks/automation/useAutomateButtons'
import { handleCancel, useCardFarming } from '@/hooks/automation/useCardFarming'
import { updateTrayIcon } from '@/utils/tasks'

export default function CardFarming({ activePage }: { activePage: ActivePageType }): ReactElement {
  const { t } = useTranslation()
  const { isCardFarming, sidebarCollapsed, transitionDuration, setIsCardFarming } = useStateContext()

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
      setIsCardFarming,
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
    if (isCardFarming && gamesWithDrops.size > 0 && totalDropsRemaining > 0) {
      updateTrayIcon(
        t('trayIcon.cardFarming', {
          count: totalDropsRemaining,
          total: gamesWithDrops.size,
        }),
        true,
      )
    }
  }, [isCardFarming, gamesWithDrops.size, totalDropsRemaining, t])

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

        <div className='p-2 rounded-lg w-full max-h-[calc(100vh-380px)] overflow-y-auto'>
          <div className='grid grid-cols-2 gap-2 px-2 overflow-y-auto'>
            {[...Array.from(gamesWithDrops)].map(item => (
              <div key={item.appid} className='flex gap-1 border border-border rounded-lg p-1'>
                <Image
                  src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
                  className='aspect-62/36 rounded'
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
        <div className='flex flex-col items-center justify-center'>
          <div className='border border-border rounded-full inline-block p-2 w-fit'>
            <TbCheck className='text-green-400' fontSize={50} />
          </div>
          <p className='mt-4'>{t('common.done')}</p>
        </div>
      )
    }

    return renderGamesList()
  }

  return (
    <div
      className={cn(
        'absolute top-0 z-4 w-full h-screen bg-base',
        'overflow-y-auto overflow-x-hidden ease-in-out',
        activePage !== 'customlists/card-farming' && 'hidden',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width, left',
      }}
    >
      <div
        className={cn(
          'relative w-[calc(100vw-227px)] pl-6 pt-2 pr-12 mt-9 ease-in-out',
          sidebarCollapsed ? 'ml-14' : 'ml-[250px]',
        )}
        style={{
          transitionDuration,
          transitionProperty: 'margin-left',
        }}
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
                  isDisabled={!isComplete && disableStopButton}
                  onPress={() => {
                    handleCancel(gamesWithDrops, isMountedRef, abortControllerRef)
                    setIsCardFarming(false)
                    updateTrayIcon()
                  }}
                >
                  {isComplete ? <p>{t('common.close')}</p> : <p>{t('common.stop')}</p>}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'flex flex-col item max-h-[calc(100vh-92px)] ease-in-out pt-10 overflow-hidden',
            sidebarCollapsed ? 'w-[calc(100vw-106px)]' : 'w-[calc(100vw-300px)]',
          )}
          style={{
            transitionDuration,
            transitionProperty: 'width',
          }}
        >
          <div className='flex flex-col items-center gap-6 bg-sidebar rounded-xl p-8 w-full'>{renderContent()}</div>
        </div>
      </div>
    </div>
  )
}
