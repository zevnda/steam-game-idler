import type { ReactElement } from 'react'

import { cn, Spinner } from '@heroui/react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { TbRefresh, TbUserFilled } from 'react-icons/tb'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useStateContext } from '@/components/contexts/StateContext'
import CustomTooltip from '@/components/ui/CustomTooltip'
import ExtLink from '@/components/ui/ExtLink'
import Header from '@/components/ui/header/Header'
import useSetup from '@/hooks/layout/useSetup'

export default function Setup(): ReactElement {
  const { t } = useTranslation()
  const { isDarkMode } = useStateContext()
  const { setActivePage } = useNavigationContext()
  const [imageSrc, setImageSrc] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const { isLoading, handleLogin, steamUsers } = useSetup(refreshKey)

  useEffect(() => {
    setActivePage('setup')
  }, [setActivePage])

  useEffect(() => {
    setImageSrc(
      isDarkMode
        ? 'https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/public/dbg.webp'
        : 'https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/public/lbg.webp',
    )
  }, [isDarkMode])

  const handleRefresh = (): void => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      <Header />
      <div className='relative w-full bg-base border-t border-border/40'>
        {imageSrc && (
          <Image
            src={imageSrc}
            className='absolute top-0 left-0 w-full h-full object-cover'
            alt='background'
            width={1920}
            height={1080}
            priority
          />
        )}
        <div className='absolute bg-base/10 backdrop-blur-[10px] w-full h-full' />
        <div className='relative flex justify-center items-center flex-col gap-5 w-full h-svh'>
          <motion.div
            className={cn(
              'flex backdrop-blur-md bg-base/20 justify-center items-center',
              'flex-col border border-border/40 min-w-[400px] max-w-[400px]',
              'rounded-lg shadow-lg',
            )}
            initial={{ y: 500 }}
            animate={{ y: -30 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 23,
            }}
          >
            <div className='p-6'>
              <p className='text-2xl font-bold'>{t('setup.welcome')}</p>
            </div>
            <div className='flex justify-center items-center flex-col'>
              {isLoading ? (
                <Spinner variant='simple' />
              ) : steamUsers.length > 0 ? (
                <>
                  <p className='mb-2'>{t('setup.chooseAccount')}</p>
                  <div
                    className={cn(
                      'flex flex-col border border-border/40 max-h-[200px]',
                      'min-w-[300px] overflow-y-auto rounded-lg',
                    )}
                  >
                    {steamUsers.map((item, index) => (
                      <div
                        key={item?.steamId}
                        className='last:border-none border-b border-border/40 hover:bg-containerhover hover:bg-opacity-30'
                        onClick={() => handleLogin(index)}
                      >
                        <div className='flex gap-2 h-full p-2 w-full cursor-pointer group'>
                          <Image
                            src={item?.avatar || ''}
                            height={40}
                            width={40}
                            alt='user avatar'
                            priority
                            className='w-[40px] h-[40px] rounded-full group-hover:scale-110 duration-200'
                          />
                          <div className='w-[140px]'>
                            <p className='font-bold truncate'>{item?.personaName}</p>
                            <p className='text-sm text-altwhite truncate'>{item?.steamId}</p>
                          </div>
                          {item?.mostRecent === 1 && (
                            <div className='flex justify-end items-center w-full'>
                              <CustomTooltip content='Signed in to Steam'>
                                <TbUserFilled size={20} className='text-dynamic' />
                              </CustomTooltip>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className='flex gap-1 mt-4  cursor-pointer' onClick={handleRefresh}>
                    <p className='text-xs text-altwhite'>{t('setup.refresh')}</p>
                    <div className='flex justify-center items-center'>
                      <TbRefresh className='text-altwhite' fontSize={14} />
                    </div>
                  </div>
                </>
              ) : (
                <div className='flex flex-col items-center border border-border/40 w-full rounded-lg p-4'>
                  <p>{t('setup.noUsers')}</p>
                  <ExtLink href='https://steamgameidler.vercel.app/faq#error-messages:~:text=No%20Steam%20users%20found'>
                    <p className='text-sm text-link hover:text-linkhover'>{t('setup.learn')}</p>
                  </ExtLink>
                </div>
              )}
            </div>

            <div
              className={cn(
                'flex justify-center items-center p-6 w-full border-t',
                'border-border/40 rounded-br-lg rounded-bl-lg mt-4',
              )}
            >
              <ExtLink href='https://steamgameidler.vercel.app/get-started/how-to-sign-in'>
                <p className='text-sm font-semibold cursor-pointer text-link hover:text-linkhover'>{t('setup.help')}</p>
              </ExtLink>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
