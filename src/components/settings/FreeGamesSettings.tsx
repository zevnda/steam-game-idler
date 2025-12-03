import type { ReactElement } from 'react'

import { Divider } from '@heroui/react'
import { useStateStore } from '@/stores/stateStore'
import { useUserStore } from '@/stores/userStore'
import { Trans, useTranslation } from 'react-i18next'
import { TbChevronRight } from 'react-icons/tb'

import SettingsSwitch from '@/components/settings/SettingsSwitch'
import Beta from '@/components/ui/Beta'
import ProBadge from '@/components/ui/ProBadge'
import WebviewWindow from '@/components/ui/WebviewWindow'

export default function CardSettings(): ReactElement {
  const { t } = useTranslation()
  const isPro = useUserStore(state => state.isPro)
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
            <p className='text-sm text-content font-bold'>{t('settings.general.freeGameNotifications')}</p>
            <p className='text-xs text-altwhite'>{t('settings.general.freeGameNotifications.description')}</p>
          </div>
          <SettingsSwitch type='general' name='freeGameNotifications' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <div className='flex items-center'>
              <p className='text-sm text-content font-bold'>{t('settings.general.autoRedeemFreeGames')}</p>
              {!isPro && <ProBadge className='scale-65' />}
              <Beta />
            </div>
            <p className='text-xs text-altwhite'>
              <Trans i18nKey='settings.general.autoRedeemFreeGames.description'>
                Automatically redeem free games on Steam when they become available. You must be signed in via the
                <strong>Automated Method</strong> in <strong>Steam Credentials</strong>
              </Trans>
            </p>
            <WebviewWindow
              href='https://steamgameidler.com/docs/settings/free-games#auto-redeem-free-games'
              className='text-xs text-dynamic hover:text-dynamic-hover duration-150'
            >
              {t('common.learnMore')}
            </WebviewWindow>
          </div>
          <div onClick={() => !isPro && setProModalOpen(true)}>
            <SettingsSwitch isProSetting type='general' name='autoRedeemFreeGames' />
          </div>
        </div>
      </div>
    </div>
  )
}
