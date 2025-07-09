import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { cn, Spinner } from '@heroui/react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { TbRefresh, TbUserFilled } from 'react-icons/tb'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import CustomTooltip from '@/components/ui/CustomTooltip'
import ExtLink from '@/components/ui/ExtLink'
import Header from '@/components/ui/header/Header'
import Logo from '@/components/ui/header/Logo'
import useSetup from '@/hooks/layout/useSetup'

export default function Setup(): ReactElement {
  const { t } = useTranslation()
  const { setActivePage } = useNavigationContext()
  const [refreshKey, setRefreshKey] = useState(0)
  const { isLoading, handleLogin, steamUsers } = useSetup(refreshKey)

  useEffect(() => {
    setActivePage('setup')
  }, [setActivePage])

  const handleRefresh = async (): Promise<void> => {
    await invoke('delete_user_summary_file')
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      <Header />
      <div className='relative w-full bg-base'>
        <Image
          src='https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/public/setup_bg.png'
          className='absolute top-0 left-0 w-full h-full object-cover'
          alt='background'
          width={1920}
          height={1080}
          priority
        />
        <div className='absolute bg-base/30 backdrop-blur-[16px] w-full h-screen' />

        <div className='relative flex justify-center items-center flex-col gap-8 w-full h-screen px-4'>
          <motion.div
            className={cn(
              'flex backdrop-blur-xl bg-base/40 justify-center items-center',
              'flex-col border border-border/60 min-w-[500px] max-w-[500px]',
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
            <div className='flex justify-center items-center flex-col w-full'>
              {isLoading ? (
                <div className='flex flex-col items-center py-8'>
                  <Spinner size='lg' className='mb-4' />
                </div>
              ) : steamUsers.length > 0 ? (
                <>
                  <div className='p-4 w-full bg-base/10'>
                    <div className='flex flex-col items-center justify-center text-center'>
                      <Logo width='10' height='10' />
                      <p className='text-3xl font-black text-content mb-8'>{t('setup.welcome')}</p>
                      <p className='font-bold text-content'>{t('setup.chooseAccount')}</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'flex flex-col max-h-[390px]',
                      'w-full overflow-y-auto rounded-xl',
                      'scrollbar-thin scrollbar-thumb-border/50',
                    )}
                  >
                    {steamUsers.map((item, index) => (
                      <div
                        key={item?.steamId}
                        className='last:border-none border-b border-border/30 hover:bg-item-hover/30 transition-all duration-300 cursor-pointer group'
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
                  <div className='flex justify-center items-center bg-base/10 w-full'>
                    <div
                      className='flex gap-1 p-2 cursor-pointer group justify-center items-center w-full'
                      onClick={handleRefresh}
                    >
                      <TbRefresh
                        className='text-altwhite group-hover:text-dynamic group-hover:rotate-180 transition-all duration-300'
                        fontSize={16}
                      />
                      <p className='text-sm text-altwhite group-hover:text-dynamic transition-colors duration-200'>
                        {t('setup.refresh')}
                      </p>
                    </div>
                  </div>
                </>
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
          </motion.div>
        </div>

        <div
          className={cn(
            'absolute flex items-center justify-center bg-base/40 backdrop-blur-md w-full',
            'gap-6 bottom-0 h-9 left-1/2 transform -translate-x-1/2',
          )}
        >
          <ExtLink href='https://steamgameidler.com/docs/get-started/how-to-sign-in'>
            <p className='text-xs font-medium cursor-pointer text-content hover:text-content/80 transition-colors duration-200'>
              {t('setup.help')}
            </p>
          </ExtLink>

          <ExtLink href='https://steamgameidler.com/privacy'>
            <p className='text-xs font-medium cursor-pointer text-content hover:text-content/80 transition-colors duration-200'>
              Privacy Policy
            </p>
          </ExtLink>
          <ExtLink href='https://steamgameidler.com/tos'>
            <p className='text-xs font-medium cursor-pointer text-content hover:text-content/80 transition-colors duration-200'>
              Terms of Service
            </p>
          </ExtLink>
        </div>
      </div>
    </>
  )
}
