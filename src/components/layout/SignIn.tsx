import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Button, cn, Spinner } from '@heroui/react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Trans, useTranslation } from 'react-i18next'
import { TbArrowRight } from 'react-icons/tb'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import GradientBackground from '@/components/ui/GradientBackground'
import Header from '@/components/ui/header/Header'
import LanguageSwitch from '@/components/ui/i18n/LanguageSwitch'
import WebviewWindow from '@/components/ui/WebviewWindow'
import useSignIn from '@/hooks/layout/useSignIn'

export default function SignIn(): ReactElement {
  const { t } = useTranslation()
  const { setActivePage } = useNavigationContext()
  const [refreshKey, setRefreshKey] = useState(0)
  const { isLoading, userSummaries, handleLogin, steamUsers, selectedUser, setSelectedUser, getRandomAvatarUrl } =
    useSignIn(refreshKey)

  useEffect(() => {
    setActivePage('setup')
  }, [setActivePage])

  const handleRefresh = async (): Promise<void> => {
    await invoke('delete_user_summary_file')
    setSelectedUser(null)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      <Header />

      {/* Language switch */}
      <div className='absolute bottom-0 right-0 p-10 z-10'>
        <LanguageSwitch
          className='w-[180px]'
          classNames={{
            trigger: [
              'bg-input/80 data-[hover=true]:!bg-inputhover/80 data-[open=true]:!bg-inputhover/80 duration-100 rounded-lg border border-border',
            ],
          }}
        />
      </div>

      {isLoading ? (
        <div className='w-screen h-screen flex items-center justify-center'>
          <Spinner variant='simple' />
        </div>
      ) : (
        <div className='w-screen h-screen relative overflow-hidden'>
          <div className='flex flex-col items-center justify-center w-screen h-calc'>
            {/* Logo and glow effect */}
            <div className='relative flex items-center justify-center mb-10'>
              {/* Outer, soft vibrant glow */}
              <span
                className='absolute -inset-1 rounded-full'
                style={{
                  zIndex: 0,
                  filter: 'blur(18px)',
                  background: 'linear-gradient(45deg, #00f7ffff 10%, #8c00ffff 80%)',
                  opacity: 0.5,
                }}
                aria-hidden='true'
              />
              <Image src='/app-logo.svg' alt='logo' width={70} height={70} className='rounded-2xl relative z-10' />
            </div>

            {/* User selection */}
            {steamUsers.length > 0 ? (
              <div className='flex flex-col items-center'>
                {/* Welcome text */}
                <div className='flex flex-col items-center mb-6'>
                  <p className='text-3xl font-semibold'>{t('setup.chooseAccount')}</p>
                </div>

                {/* User cards */}
                <div className='flex flex-row flex-wrap items-center justify-center mb-10'>
                  {userSummaries.map(user => (
                    <div
                      key={user?.steamId}
                      className='flex flex-col items-center mx-4 cursor-pointer hover:scale-105 transition-transform group'
                      onClick={() => setSelectedUser(user)}
                    >
                      {/* User avatar */}
                      <div
                        className={cn(
                          'relative p-1 rounded-lg',
                          selectedUser?.steamId === user?.steamId
                            ? 'ring-transparent bg-gradient-to-tr from-cyan-500 via-blue-500 to-violet-700'
                            : 'ring-transparent bg-transparent',
                        )}
                        style={{ display: 'inline-block' }}
                      >
                        {user?.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user.personaName}
                            width={128}
                            height={128}
                            className='rounded-md bg-white'
                          />
                        ) : (
                          <Image
                            src={getRandomAvatarUrl()}
                            alt='Placeholder Avatar'
                            width={128}
                            height={128}
                            className='rounded-md'
                          />
                        )}
                      </div>

                      {/* User persona name */}
                      <p className='text-lg mt-1'>{user?.personaName}</p>
                    </div>
                  ))}
                </div>

                {/* Agreement */}
                <p className='text-xs text-altwhite max-w-sm text-center'>
                  <Trans
                    i18nKey='setup.acknowledge'
                    components={[
                      // index 0 is plain text, so start with 1
                      <WebviewWindow
                        href='https://steamgameidler.com/tos'
                        className='font-semibold hover:opacity-90 duration-150'
                        key='tos'
                      >
                        Terms of Service
                      </WebviewWindow>,
                      <WebviewWindow
                        href='https://steamgameidler.com/privacy'
                        className='font-semibold hover:opacity-90 duration-150'
                        key='privacy'
                      >
                        Privacy Policy
                      </WebviewWindow>,
                    ]}
                  />
                </p>

                {/* Buttons */}
                <div className='flex gap-4 mt-10'>
                  <Button
                    radius='full'
                    variant='bordered'
                    className='font-semibold border-white'
                    onPress={handleRefresh}
                  >
                    {t('setup.refresh')}
                  </Button>
                  <Button
                    radius='full'
                    className='font-semibold bg-content text-black group'
                    onPress={() => {
                      if (selectedUser) handleLogin(steamUsers.indexOf(selectedUser))
                    }}
                    isDisabled={!selectedUser}
                  >
                    {t('common.continue')}
                    <TbArrowRight className='group-hover:translate-x-1 duration-150' />
                  </Button>
                </div>
              </div>
            ) : (
              <div className='flex flex-col items-center text-center gap-2'>
                <p className='text-xl font-semibold'>{t('setup.noUsers')}</p>
                <p className='text-xs text-altwhite max-w-md'>{t('setup.noUsersTwo')}</p>

                <div className='flex items-center gap-4 mt-10'>
                  <WebviewWindow href='https://steamgameidler.com/docs/faq#error-messages:~:text=No%20Steam%20users%20found'>
                    <div className='border-2 border-content py-2 px-4 rounded-full hover:opacity-90 duration-150'>
                      <p className='text-sm font-semibold'>{t('common.learnMore')}</p>
                    </div>
                  </WebviewWindow>
                  <Button radius='full' className='font-semibold bg-content text-black' onPress={handleRefresh}>
                    {t('setup.refresh')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <GradientBackground />
    </>
  )
}
