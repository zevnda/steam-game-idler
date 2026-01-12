import type { InvokeSteamCredentials } from '@/types'
import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Button, cn, Divider, Input, Spinner } from '@heroui/react'
import { useUserStore } from '@/stores/userStore'
import Image from 'next/image'
import { Trans, useTranslation } from 'react-i18next'
import { TbChevronRight, TbEraser, TbRefresh, TbUpload } from 'react-icons/tb'

import ExtLink from '@/components/ui/ExtLink'
import WebviewWindow from '@/components/ui/WebviewWindow'
import {
  fetchGamesWithDropsData,
  handleCredentialsClear,
  handleCredentialsSave,
  useCardSettings,
} from '@/hooks/settings/useCardSettings'
import { logEvent } from '@/utils/tasks'
import { showDangerToast } from '@/utils/toasts'

export default function SteamCredentials(): ReactElement {
  const { t } = useTranslation()
  const userSummary = useUserStore(state => state.userSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const setUserSettings = useUserStore(state => state.setUserSettings)
  const cardSettings = useCardSettings()

  const handleShowSteamLoginWindow = async (): Promise<void> => {
    const result = await invoke<InvokeSteamCredentials>('open_steam_login_window')

    if (!result || result.success === false) {
      showDangerToast(t('common.error'))
      logEvent(`[Error] in (handleShowSteamLoginWindow): ${result?.message || 'Unknown error'}`)
      return
    }

    if (result.success) {
      handleCredentialsSave(
        result.sessionid,
        result.steamLoginSecure,
        undefined,
        cardSettings.setHasCookies,
        cardSettings.setCardFarmingUser,
        userSummary,
        userSettings,
        setUserSettings,
        cardSettings.setIsCFDataLoading,
      )
    }
  }

  const handleSignOutCurrentUser = async (): Promise<void> => {
    const result = await invoke<InvokeSteamCredentials>('delete_login_window_cookies')

    if (!result || result.success === false) {
      showDangerToast(t('common.error'))
      logEvent(
        `[Error] in (handleSignOutCurrentUser) this error can occur if you are not already signed in: ${result?.message || 'Unknown error'}`,
      )
      return
    }

    handleCredentialsClear(
      cardSettings.setHasCookies,
      cardSettings.setSidValue,
      cardSettings.setSlsValue,
      cardSettings.setSmaValue,
      cardSettings.setCardFarmingUser,
      userSummary,
      setUserSettings,
      cardSettings.setGamesWithDrops,
      cardSettings.setTotalDropsRemaining,
    )
  }

  return (
    <div className='relative flex flex-col gap-4 mt-9 pb-16 w-4/5'>
      <div className='flex flex-col gap-0 select-none'>
        <p className='flex items-center text-xs text-altwhite font-bold'>
          {t('settings.title')}
          <span>
            <TbChevronRight size={12} />
          </span>
        </p>
        <p className='text-3xl font-black'>{t('settings.cardFarming.steamCredentialsTitle')}</p>
      </div>

      <div className='flex flex-col gap-3 mt-4'>
        <div className='flex justify-between items-start'>
          <div className='flex flex-col gap-2 w-1/2'>
            <div className='flex items-center'>
              <p className='text-sm text-content font-bold'>{t('settings.steamCredentials.automated')}</p>
            </div>
            <p className='text-xs text-altwhite'>{t('settings.steamCredentials.automated.description')}</p>
            <WebviewWindow
              href='https://steamgameidler.com/docs/steam-credentials#automated-method'
              className='text-xs text-dynamic hover:text-dynamic-hover duration-150'
            >
              {t('common.learnMore')}
            </WebviewWindow>
          </div>

          <div className='flex flex-col justify-end gap-2'>
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              onPress={handleShowSteamLoginWindow}
            >
              {cardSettings.hasCookies ? t('common.reauthenticate') : t('common.signInSteam')}
            </Button>
            <Button size='sm' variant='light' radius='full' color='danger' onPress={handleSignOutCurrentUser}>
              {t('common.signOut')}
            </Button>
          </div>
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-start'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.steamCredentials.manual')}</p>
            <p className='text-xs text-altwhite'>
              <Trans i18nKey='settings.cardFarming.steamCredentials'>
                Steam credentials are required in order to use the Card Farming and Trading Card Manager features.&nbsp;
                <WebviewWindow
                  href='https://steamgameidler.com/docs/steam-credentials#manual-method'
                  className='text-dynamic hover:text-dynamic-hover duration-150'
                >
                  Learn more
                </WebviewWindow>
              </Trans>
            </p>
            <p className='text-xs text-altwhite'>
              <Trans i18nKey='settings.cardFarming.steamCredentialsTwo'>
                Get your Steam credentials from.&nbsp;
                <ExtLink
                  href='https://steamcommunity.com/'
                  className='text-dynamic hover:text-dynamic-hover duration-150'
                >
                  https://steamcommunity.com/
                </ExtLink>
              </Trans>
            </p>
            {cardSettings.cardFarmingUser && (
              <div className='flex gap-4 bg-tab-panel p-2 rounded-lg items-center w-fit min-w-[50%] mt-3'>
                {!cardSettings.isCFDataLoading ? (
                  <>
                    <Image
                      src={userSummary?.avatar || ''}
                      height={38}
                      width={38}
                      alt='user avatar'
                      className='w-9.5 h-9.5 rounded-full'
                      priority
                    />
                    <div className='flex flex-col items-end gap-1'>
                      <div className='flex gap-1'>
                        <p className='text-sm text-altwhite font-bold'>{t('settings.cardFarming.gamesWithDrops')}</p>
                        <p className='text-sm text-dynamic font-bold'>{userSettings.cardFarming.gamesWithDrops || 0}</p>
                      </div>
                      <div className='flex gap-1'>
                        <p className='text-sm text-altwhite font-bold'>{t('settings.cardFarming.totalDrops')}</p>
                        <p className='text-sm text-dynamic font-bold'>
                          {userSettings.cardFarming.totalDropsRemaining || 0}
                        </p>
                      </div>
                    </div>
                    <div
                      className='text-altwhite hover:bg-item-hover p-1 rounded-full cursor-pointer duration-150'
                      onClick={() =>
                        fetchGamesWithDropsData(userSummary, cardSettings.setIsCFDataLoading, setUserSettings)
                      }
                    >
                      <TbRefresh size={18} />
                    </div>
                  </>
                ) : (
                  <div className='flex items-center justify-center gap-2'>
                    <Spinner size='sm' variant='simple' />
                    <p className='text-xs text-altwhite'>{t('settings.cardFarming.loading')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className='flex flex-col gap-4 w-62.5'>
            <Input
              isRequired
              label='sessionid'
              labelPlacement='outside'
              placeholder='sessionid'
              className='max-w-72.5'
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover',
                  'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                ),
                label: ['text-xs !text-altwhite font-bold'],
                input: ['!text-content placeholder:text-altwhite/50'],
              }}
              value={cardSettings.sidValue}
              onChange={e => cardSettings.setSidValue(e.target.value)}
              type='password'
            />
            <Input
              isRequired
              label='steamLoginSecure'
              labelPlacement='outside'
              placeholder='steamLoginSecure'
              className='max-w-72.5'
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover',
                  'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                ),
                label: ['text-xs !text-altwhite font-bold'],
                input: ['!text-content placeholder:text-altwhite/50'],
              }}
              value={cardSettings.slsValue}
              onChange={e => cardSettings.setSlsValue(e.target.value)}
              type='password'
            />
            <Input
              label={<p>steamParental / steamMachineAuth</p>}
              labelPlacement='outside'
              placeholder='steamParental / steamMachineAuth'
              className='max-w-72.5'
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover',
                  'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                ),
                label: ['text-xs !text-altwhite font-bold'],
                input: ['!text-content placeholder:text-altwhite/50'],
              }}
              value={cardSettings.smaValue}
              onChange={e => cardSettings.setSmaValue(e.target.value)}
              type='password'
            />
            <div className='flex justify-end gap-2'>
              <Button
                size='sm'
                variant='light'
                radius='full'
                color='danger'
                isDisabled={!cardSettings.hasCookies}
                onPress={() =>
                  handleCredentialsClear(
                    cardSettings.setHasCookies,
                    cardSettings.setSidValue,
                    cardSettings.setSlsValue,
                    cardSettings.setSmaValue,
                    cardSettings.setCardFarmingUser,
                    userSummary,
                    setUserSettings,
                    cardSettings.setGamesWithDrops,
                    cardSettings.setTotalDropsRemaining,
                  )
                }
                startContent={<TbEraser size={20} />}
              >
                {t('common.clear')}
              </Button>
              <Button
                size='sm'
                className='bg-btn-secondary text-btn-text font-bold'
                radius='full'
                isDisabled={cardSettings.hasCookies || !cardSettings.sidValue || !cardSettings.slsValue}
                onPress={() =>
                  handleCredentialsSave(
                    cardSettings.sidValue,
                    cardSettings.slsValue,
                    cardSettings.smaValue,
                    cardSettings.setHasCookies,
                    cardSettings.setCardFarmingUser,
                    userSummary,
                    userSettings,
                    setUserSettings,
                    cardSettings.setIsCFDataLoading,
                  )
                }
                startContent={<TbUpload size={20} />}
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
