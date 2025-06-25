import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

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

  const handleRefresh = async (): Promise<void> => {
    await invoke('delete_user_summary_file')
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
        <div className='absolute bg-base/30 backdrop-blur-[16px] w-full h-calc' />
        <div className='relative flex justify-center items-center flex-col gap-8 w-full h-calc px-4'>
          <motion.div
            className={cn(
              'flex backdrop-blur-xl bg-base/40 justify-center items-center',
              'flex-col border border-border/60 min-w-[420px] max-w-[420px]',
              'rounded-2xl shadow-2xl shadow-black/20',
            )}
            initial={{ y: 80, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 25,
              opacity: { duration: 0.3 },
            }}
          >
            <div className='p-8 pb-0'>
              <div className='text-center'>
                <h1 className='text-2xl font-bold mb-2 text-dynamic'>{t('setup.welcome')}</h1>
                <p className='mb-4 text-center font-medium'>{t('setup.chooseAccount')}</p>
              </div>
            </div>
            <div className='flex justify-center items-center flex-col px-8'>
              {isLoading ? (
                <div className='flex flex-col items-center py-8'>
                  <Spinner size='lg' className='mb-4' />
                </div>
              ) : steamUsers.length > 0 ? (
                <div className='w-full'>
                  <div
                    className={cn(
                      'flex flex-col border border-border/40 max-h-[244px]',
                      'min-w-[320px] overflow-y-auto rounded-xl bg-base/20',
                      'scrollbar-thin scrollbar-thumb-border/50',
                    )}
                  >
                    {steamUsers.map((item, index) => (
                      <div
                        key={item?.steamId}
                        className='last:border-none border-b border-border/30 hover:bg-containerhover/50 transition-all duration-300 cursor-pointer group'
                        onClick={() => handleLogin(index)}
                      >
                        <div className='flex gap-3 h-full p-4 w-full items-center'>
                          <div className='relative'>
                            <Image
                              src={item?.avatar || ''}
                              height={38}
                              width={38}
                              alt='user avatar'
                              priority
                              className='w-[38px] h-[38px] rounded-full group-hover:scale-110 transition-transform duration-300 ring-2 ring-border/30 group-hover:ring-dynamic/50'
                            />
                            {item?.mostRecent === 1 && (
                              <div className='absolute -top-1 -right-1 w-4 h-4 bg-dynamic rounded-full border-2 border-base' />
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='font-semibold truncate group-hover:text-dynamic transition-colors duration-200'>
                              {item?.personaName}
                            </p>
                            <p className='text-sm text-altwhite truncate font-mono'>{item?.steamId}</p>
                          </div>
                          {item?.mostRecent === 1 && (
                            <div className='flex justify-end items-center'>
                              <CustomTooltip content='Currently signed in to Steam' placement='top' important>
                                <div className='flex items-center gap-1 px-2 py-1 bg-dynamic/20 rounded-full'>
                                  <TbUserFilled size={16} className='text-dynamic' />
                                </div>
                              </CustomTooltip>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className='flex justify-center items-center'>
                    <div
                      className='flex gap-1 p-2 cursor-pointer group justify-center items-center w-fit'
                      onClick={handleRefresh}
                    >
                      <TbRefresh
                        className='text-altwhite/70 group-hover:text-dynamic group-hover:rotate-180 transition-all duration-300'
                        fontSize={16}
                      />
                      <p className='text-sm text-altwhite/70 group-hover:text-dynamic transition-colors duration-200'>
                        {t('setup.refresh')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='w-full mb-4'>
                  <div className='flex flex-col items-center border border-border/40 w-full rounded-xl p-6 bg-base/10'>
                    <p className='text-center mb-3 text-altwhite/80 font-medium'>{t('setup.noUsers')}</p>
                    <ExtLink href='https://steamgameidler.com/docs/faq#error-messages:~:text=No%20Steam%20users%20found'>
                      <p className='text-sm text-link hover:text-linkhover transition-colors duration-200'>
                        {t('setup.learn')}
                      </p>
                    </ExtLink>
                    <div
                      className='flex gap-1 p-2 cursor-pointer group justify-center items-center w-fit'
                      onClick={handleRefresh}
                    >
                      <TbRefresh
                        className='text-altwhite/70 group-hover:text-dynamic group-hover:rotate-180 transition-all duration-300'
                        fontSize={16}
                      />
                      <p className='text-sm text-altwhite/70 group-hover:text-dynamic transition-colors duration-200'>
                        {t('setup.refresh')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div
              className={cn(
                'flex flex-col justify-center items-center gap-2 p-4 w-full border-t',
                'border-border/40 rounded-br-2xl rounded-bl-2xl bg-base/10',
              )}
            >
              <ExtLink href='https://steamgameidler.com/docs/get-started/how-to-sign-in'>
                <p className='text-xs font-medium cursor-pointer text-link hover:text-linkhover transition-colors duration-200'>
                  {t('setup.help')}
                </p>
              </ExtLink>

              <div className='flex gap-6 text-xs text-altwhite/70'>
                <ExtLink href='https://steamgameidler.com/privacy'>
                  <p className='text-xs font-medium cursor-pointer text-link/80 hover:text-linkhover transition-colors duration-200'>
                    Privacy Policy
                  </p>
                </ExtLink>
                <ExtLink href='https://steamgameidler.com/tos'>
                  <p className='text-xs font-medium cursor-pointer text-link/80 hover:text-linkhover transition-colors duration-200'>
                    Terms of Service
                  </p>
                </ExtLink>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
