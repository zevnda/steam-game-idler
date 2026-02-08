import { Trans, useTranslation } from 'react-i18next'
import { TbChevronRight, TbEraser, TbUpload } from 'react-icons/tb'
import { Button, cn, Divider, Input } from '@heroui/react'
import Image from 'next/image'
import {
  CurrencySwitch,
  handleSteamWebAPIKeyClear,
  handleSteamWebAPIKeySave,
  useGeneralSettings,
} from '@/features/settings'
import { ExtLink, LanguageSwitch, SettingsSwitch } from '@/shared/components'
import { useUserStore } from '@/shared/stores'

export const GeneralSettings = () => {
  const { t } = useTranslation()
  const userSummary = useUserStore(state => state.userSummary)
  const setUserSettings = useUserStore(state => state.setUserSettings)
  const isPro = useUserStore(state => state.isPro)
  const { keyValue, setKeyValue, hasKey, setHasKey } = useGeneralSettings()

  return (
    <div className='relative flex flex-col gap-4 mt-9 pb-16 w-4/5'>
      <div className='flex flex-col gap-0 select-none'>
        <p className='flex items-center text-xs text-altwhite font-bold'>
          {t('settings.title')}
          <span>
            <TbChevronRight size={12} />
          </span>
        </p>
        <p className='text-3xl font-black'>{t('settings.general.title')}</p>
      </div>

      <div className='flex flex-col gap-3 mt-4'>
        <div className='flex items-end gap-4 w-fit group'>
          <Image
            src={userSummary?.avatar || ''}
            height={64}
            width={64}
            alt='user avatar'
            className='w-16 h-16 rounded-full transition-all duration-200'
            priority
          />
          <div className='flex flex-col gap-1'>
            <p className='text-xs text-altwhite font-bold'>{t('settings.general.displayName')}</p>
            <p className='py-1.5 px-2 bg-input rounded-lg text-content text-sm font-semibold w-64'>
              <span className='transition-all duration-200'>{userSummary?.personaName}</span>
            </p>
          </div>
          <div className='flex flex-col gap-1'>
            <p className='text-xs text-altwhite font-bold'>{t('settings.general.steamId')}</p>
            <p className='py-1.5 px-2 bg-input rounded-lg text-content text-sm font-semibold w-64'>
              <span className='transition-all duration-200'>{userSummary?.steamId}</span>
            </p>
          </div>
          {isPro && (
            <ExtLink href='https://billing.stripe.com/p/login/8x23cwf8CeNE6PLaAecbC00'>
              <div
                className={cn(
                  'flex justify-center items-center w-full rounded-full',
                  'text-black bg-white font-semibold text-xs py-2 px-3',
                )}
              >
                {t('settings.general.manageSubscription')}
              </div>
            </ExtLink>
          )}
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.antiAway')}</p>
            <p className='text-xs text-altwhite'>{t('settings.general.antiAway.description')}</p>
          </div>
          <SettingsSwitch type='general' name='antiAway' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.useBeta')}</p>
            <p className='text-xs text-altwhite'>{t('settings.general.useBeta.description')}</p>
          </div>
          <SettingsSwitch type='general' name='useBeta' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.runAtStartup')}</p>
            <p className='text-xs text-altwhite'>
              {t('settings.general.runAtStartup.description')}
            </p>
          </div>
          <SettingsSwitch type='general' name='runAtStartup' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.startMinimized')}</p>
            <p className='text-xs text-altwhite'>
              {t('settings.general.startMinimized.description')}
            </p>
          </div>
          <SettingsSwitch type='general' name='startMinimized' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.closeToTray')}</p>
            <p className='text-xs text-altwhite'>{t('settings.general.closeToTray.description')}</p>
          </div>
          <SettingsSwitch type='general' name='closeToTray' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.language')}</p>
            <p className='text-xs text-altwhite'>
              <Trans i18nKey='settings.general.helpTranslate'>
                Help translate SGI.&nbsp;
                <ExtLink
                  href='https://github.com/zevnda/steam-game-idler/discussions/148'
                  className='text-dynamic hover:text-dynamic-hover duration-150'
                >
                  Learn more
                </ExtLink>
              </Trans>
            </p>
          </div>
          <LanguageSwitch />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.currency')}</p>
            <p className='text-xs text-altwhite'>{t('settings.general.currency.description')}</p>
          </div>
          <CurrencySwitch />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-start'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.webApi')}</p>
            <p className='text-xs text-altwhite'>
              <Trans i18nKey='settings.general.webApi.description'>
                Use your own Steam Web API Key.&nbsp;
                <ExtLink
                  href='https://steamgameidler.com/docs/settings/general#steam-web-api-key'
                  className='text-dynamic hover:text-dynamic-hover duration-150'
                >
                  Learn more
                </ExtLink>
              </Trans>
            </p>
            <p className='text-xs text-altwhite'>
              <Trans i18nKey='settings.general.webApi.descriptionTwo'>
                Get your Steam Web API key from.&nbsp;
                <ExtLink
                  href='https://steamcommunity.com/dev/apikey'
                  className='text-dynamic hover:text-dynamic-hover duration-150'
                >
                  https://steamcommunity.com/dev/apikey
                </ExtLink>
              </Trans>
            </p>
          </div>
          <div className='flex flex-col gap-4 w-62.5'>
            <Input
              placeholder={t('settings.general.webApi')}
              className='max-w-62.5'
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover',
                  'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                ),
                input: ['!text-content placeholder:text-altwhite/50'],
              }}
              value={keyValue}
              onChange={e => setKeyValue(e.target.value)}
              type='password'
            />
            <div className='flex justify-end gap-2'>
              <Button
                size='sm'
                variant='light'
                radius='full'
                color='danger'
                isDisabled={!hasKey}
                onPress={() =>
                  handleSteamWebAPIKeyClear(
                    userSummary?.steamId,
                    setKeyValue,
                    setHasKey,
                    setUserSettings,
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
                isDisabled={hasKey || !keyValue}
                onPress={() =>
                  handleSteamWebAPIKeySave(
                    userSummary?.steamId,
                    keyValue,
                    setHasKey,
                    setUserSettings,
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
