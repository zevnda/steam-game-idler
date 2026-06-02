import { useTranslation } from 'react-i18next'
import { Button, Divider } from '@heroui/react'
import {
  handleShowStoreLoginWindow,
  handleSignOutCurrentStoreUser,
} from '@/features/settings/services/freeGamesService'
import { OpenDocs } from '@/shared/components/OpenDocs'
import { ProBadge } from '@/shared/components/pro/ProBadge'
import { SettingsSwitch } from '@/shared/components/SettingsSwitch'
import { useUiStore, useUserStore } from '@/shared/stores'
import { hasGamerFeature } from '@/shared/utils'

export function FreeGamesSettings() {
  const { t } = useTranslation()
  const proTier = useUserStore(s => s.proTier)
  const setUserSettings = useUserStore(s => s.setUserSettings)
  const setProModalOpen = useUiStore(s => s.setProModalOpen)
  const setProModalRequiredTier = useUiStore(s => s.setProModalRequiredTier)

  return (
    <div className='relative flex flex-col gap-4 pb-16 w-4/5'>
      <div className='flex flex-col gap-0 select-none mb-3'>
        <p className='text-[10px] uppercase tracking-widest text-altwhite/40 font-black mb-1'>
          {t('settings.title')}
        </p>
        <p className='text-2xl font-black'>{t('freeGames.title')}</p>
      </div>
      <div className='flex flex-col gap-3 mt-4'>
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.general.freeGameNotifications')}
            </p>
            <p className='text-[11px] text-altwhite/60 leading-relaxed'>
              {t('settings.general.freeGameNotifications.description')}
            </p>
          </div>
          <SettingsSwitch type='general' name='freeGameNotifications' />
        </div>
        <Divider className='bg-border/15 my-5' />
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <div className='flex items-center'>
              <p className='flex items-center gap-2 text-sm text-content font-bold'>
                {t('settings.general.autoRedeemFreeGames')}
                <OpenDocs path='/features/free-games#automated-redemption' />
              </p>
              {!hasGamerFeature(proTier) && <ProBadge className='scale-65' requiredTier='gamer' />}
            </div>
            <p className='text-[11px] text-altwhite/60 leading-relaxed'>
              {t('settings.general.autoRedeemFreeGames.description')}
            </p>
          </div>
          <div
            className='flex items-center gap-2'
            onClick={() => {
              if (!hasGamerFeature(proTier)) {
                setProModalRequiredTier('gamer')
                setProModalOpen(true)
              }
            }}
          >
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-semibold'
              radius='full'
              isDisabled={!hasGamerFeature(proTier)}
              onPress={() => handleShowStoreLoginWindow(setUserSettings)}
            >
              {t('common.signInSteam')}
            </Button>
            <Button
              size='sm'
              variant='light'
              color='danger'
              radius='full'
              isDisabled={!hasGamerFeature(proTier)}
              onPress={() => handleSignOutCurrentStoreUser(setUserSettings)}
            >
              {t('common.signOut')}
            </Button>
          </div>
        </div>
        <Divider className='bg-border/15 my-5' />
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <div className='flex items-center'>
              <p className='text-sm text-content font-bold'>
                {t('settings.general.autoRedeemFreeGames')}
              </p>
              {!hasGamerFeature(proTier) && <ProBadge className='scale-65' requiredTier='gamer' />}
            </div>
            <p className='text-[11px] text-altwhite/60 leading-relaxed'>
              {t('settings.general.autoRedeemFreeGames.description')}
            </p>
          </div>
          <div
            onClick={() => {
              if (!hasGamerFeature(proTier)) {
                setProModalRequiredTier('gamer')
                setProModalOpen(true)
              }
            }}
          >
            <SettingsSwitch type='general' name='autoRedeemFreeGames' isProSetting={true} />
          </div>
        </div>
      </div>
    </div>
  )
}
