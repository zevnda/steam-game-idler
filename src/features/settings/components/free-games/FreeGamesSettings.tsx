import { useTranslation } from 'react-i18next'
import { TbChevronRight } from 'react-icons/tb'
import { Button, Divider } from '@heroui/react'
import { handleShowStoreLoginWindow, handleSignOutCurrentStoreUser } from '@/features/settings'
import { Beta, ExtLink, ProBadge, SettingsSwitch } from '@/shared/components'
import { useStateStore, useUserStore } from '@/shared/stores'

export const FreeGamesSettings = () => {
  const { t } = useTranslation()
  const isPro = useUserStore(state => state.isPro)
  const userSettings = useUserStore(state => state.userSettings)
  const setUserSettings = useUserStore(state => state.setUserSettings)
  const setProModalOpen = useStateStore(state => state.setProModalOpen)

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
            <ExtLink
              href='https://steamgameidler.com/docs/settings/free-games#auto-redeem-free-games'
              className='text-xs text-dynamic hover:text-dynamic-hover duration-150'
            >
              {t('common.learnMore')}
            </ExtLink>
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
              onPress={() => handleShowStoreLoginWindow(setUserSettings)}
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
              onPress={() => handleSignOutCurrentStoreUser(setUserSettings)}
            >
              {t('common.signOut')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
