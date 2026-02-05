import type { InvokeSettings, InvokeSteamCredentials } from '@/shared/types'
import type { ReactElement } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import { TbChevronRight } from 'react-icons/tb'
import { Button, Divider } from '@heroui/react'
import SettingsSwitch from '@/features/settings/SettingsSwitch'
import { useStateStore } from '@/shared/stores/stateStore'
import { useUserStore } from '@/shared/stores/userStore'
import Beta from '@/shared/ui/Beta'
import ProBadge from '@/shared/ui/pro/ProBadge'
import WebviewWindow from '@/shared/ui/WebviewWindow'
import { logEvent } from '@/shared/utils/tasks'
import { showDangerToast, showSuccessToast } from '@/shared/utils/toasts'

export default function CardSettings(): ReactElement {
  const { t } = useTranslation()
  const isPro = useUserStore(state => state.isPro)
  const userSummary = useUserStore(state => state.userSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const setUserSettings = useUserStore(state => state.setUserSettings)
  const setProModalOpen = useStateStore(state => state.setProModalOpen)

  const handleShowStoreLoginWindow = async (): Promise<void> => {
    const result = await invoke<InvokeSteamCredentials>('open_store_login_window')

    if (!result || result.success === false) {
      showDangerToast(t('common.error'))
      logEvent(`[Error] in (handleShowStoreLoginWindow): ${result?.message || 'Unknown error'}`)
      return
    }

    if (result.success) {
      const response = await invoke<InvokeSettings>('update_user_settings', {
        steamId: userSummary?.steamId,
        key: 'general.autoRedeemFreeGames',
        value: true,
      })

      setUserSettings(response.settings)

      showSuccessToast(t('toast.autoRedeem.authenticated', { user: userSummary?.personaName }))
    }
  }

  const handleSignOutCurrentStoreUser = async (): Promise<void> => {
    const result = await invoke<InvokeSteamCredentials>('delete_store_cookies')

    if (!result || result.success === false) {
      showDangerToast(t('common.error'))
      logEvent(
        `[Error] in (handleSignOutCurrentStoreUser) this error can occur if you are not already signed in: ${result?.message || 'Unknown error'}`,
      )
      return
    }

    const response = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'general.autoRedeemFreeGames',
      value: false,
    })

    setUserSettings(response.settings)
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
        <p className='text-3xl font-black'>{t('freeGames.title')}</p>
      </div>

      <div className='flex flex-col gap-3 mt-4'>
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.general.freeGameNotifications')}
            </p>
            <p className='text-xs text-altwhite'>
              {t('settings.general.freeGameNotifications.description')}
            </p>
          </div>
          <SettingsSwitch type='general' name='freeGameNotifications' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <div className='flex items-center'>
              <p className='text-sm text-content font-bold'>
                {t('settings.general.autoRedeemFreeGames')}
              </p>
              {!isPro && <ProBadge className='scale-65' />}
              <Beta />
            </div>
            <p className='text-xs text-altwhite'>
              {t('settings.general.autoRedeemFreeGames.description')}
            </p>
            <WebviewWindow
              href='https://steamgameidler.com/docs/settings/free-games#auto-redeem-free-games'
              className='text-xs text-dynamic hover:text-dynamic-hover duration-150'
            >
              {t('common.learnMore')}
            </WebviewWindow>
          </div>

          <div
            className='flex flex-col justify-end gap-2'
            onClick={() => !isPro && setProModalOpen(true)}
          >
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              isDisabled={!isPro}
              onPress={handleShowStoreLoginWindow}
            >
              {userSettings.general?.autoRedeemFreeGames
                ? t('common.reauthenticate')
                : t('common.signInSteam')}
            </Button>
            <Button
              size='sm'
              variant='light'
              radius='full'
              color='danger'
              isDisabled={!isPro}
              onPress={handleSignOutCurrentStoreUser}
            >
              {t('common.signOut')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
