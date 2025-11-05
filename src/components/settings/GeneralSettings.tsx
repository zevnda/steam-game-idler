import type { ReactElement } from 'react'

import { Button, cn, Divider, Input, Slider, Spinner } from '@heroui/react'
import Image from 'next/image'
import { Trans, useTranslation } from 'react-i18next'
import { TbChevronRight, TbEraser, TbRefresh, TbUpload } from 'react-icons/tb'

import { useUserContext } from '@/components/contexts/UserContext'
import SettingsSwitch from '@/components/settings/SettingsSwitch'
import ExtLink from '@/components/ui/ExtLink'
import CurrencySwitch from '@/components/ui/i18n/CurrencySwitch'
import LanguageSwitch from '@/components/ui/i18n/LanguageSwitch'
import WebviewWindow from '@/components/ui/WebviewWindow'
import {
  fetchGamesWithDropsData,
  handleCredentialsClear,
  handleCredentialsSave,
  useCardSettings,
} from '@/hooks/settings/useCardSettings'
import { handleClear, handleKeySave, handleSliderChange, useGeneralSettings } from '@/hooks/settings/useGeneralSettings'

export default function GeneralSettings(): ReactElement {
  const { t } = useTranslation()
  const { userSummary, userSettings, setUserSettings } = useUserContext()
  const { keyValue, setKeyValue, hasKey, setHasKey, sliderLabel, setSliderLabel } = useGeneralSettings()
  const cardSettings = useCardSettings()

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
        <div className='flex items-center gap-4 w-fit group'>
          <Image
            src={userSummary?.avatar || ''}
            height={64}
            width={64}
            alt='user avatar'
            className='w-[64px] h-[64px] rounded-full blur-[3px] group-hover:blur-none transition-all duration-200'
            priority
          />
          <div className='flex flex-col gap-1'>
            <p className='text-xs text-altwhite font-bold'>{t('settings.general.displayName')}</p>
            <p className='py-1.5 px-2 bg-input rounded-lg text-content text-sm font-semibold w-64'>
              <span className='blur-[3px] group-hover:blur-none transition-all duration-200'>
                {userSummary?.personaName}
              </span>
            </p>
          </div>
          <div className='flex flex-col gap-1'>
            <p className='text-xs text-altwhite font-bold'>{t('settings.general.steamId')}</p>
            <p className='py-1.5 px-2 bg-input rounded-lg text-content text-sm font-semibold w-64'>
              <span className='blur-[3px] group-hover:blur-none transition-all duration-200'>
                {userSummary?.steamId}
              </span>
            </p>
          </div>
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
            <p className='text-sm text-content font-bold'>{t('settings.general.freeGameNotifications')}</p>
            <p className='text-xs text-altwhite'>{t('settings.general.freeGameNotifications.description')}</p>
          </div>
          <SettingsSwitch type='general' name='freeGameNotifications' />
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
            <p className='text-sm text-content font-bold'>{t('settings.general.disableTooltips')}</p>
            <p className='text-xs text-altwhite'>{t('settings.general.disableTooltips.description')}</p>
          </div>
          <SettingsSwitch type='general' name='disableTooltips' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.runAtStartup')}</p>
            <p className='text-xs text-altwhite'>{t('settings.general.runAtStartup.description')}</p>
          </div>
          <SettingsSwitch type='general' name='runAtStartup' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.startMinimized')}</p>
            <p className='text-xs text-altwhite'>{t('settings.general.startMinimized.description')}</p>
          </div>
          <SettingsSwitch type='general' name='startMinimized' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.chatSounds')}</p>
            <p className='text-xs text-altwhite'>{sliderLabel}</p>
          </div>
          <Slider
            size='md'
            step={0.15}
            minValue={0}
            maxValue={3}
            defaultValue={userSettings?.general?.chatSounds || 1}
            hideValue
            className='mt-2 w-[350px]'
            classNames={{
              track: 'bg-input',
              filler: 'bg-dynamic',
              thumb: 'bg-dynamic',
            }}
            onChangeEnd={e => handleSliderChange(e, userSummary, setUserSettings)}
            onChange={e => {
              const getPercent = (val: number): number => Math.round((val / 3) * 100)
              if (Array.isArray(e)) {
                setSliderLabel(
                  t('settings.general.chatSounds.description', {
                    value: `${getPercent(e[0])}%`,
                  }),
                )
              }
            }}
          />
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
            <p className='text-sm text-content font-bold'>{t('settings.cardFarming.steamCredentialsTitle')}</p>
            <p className='text-xs text-altwhite'>
              <Trans i18nKey='settings.cardFarming.steamCredentials'>
                Steam credentials are required in order to use the Card Farming feature.&nbsp;
                <WebviewWindow
                  href='https://steamgameidler.com/docs/steam-credentials'
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
                      className='w-[38px] h-[38px] rounded-full'
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
          <div className='flex flex-col gap-4 w-[250px]'>
            <Input
              isRequired
              label='sessionid'
              labelPlacement='outside'
              placeholder='sessionid'
              className='max-w-[290px]'
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
              className='max-w-[290px]'
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
              className='max-w-[290px]'
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

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-start'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.webApi')}</p>
            <p className='text-xs text-altwhite'>
              <Trans i18nKey='settings.general.webApi.description'>
                Use your own Steam Web API Key.&nbsp;
                <WebviewWindow
                  href='https://steamgameidler.com/docs/settings/general#steam-web-api-key'
                  className='text-dynamic hover:text-dynamic-hover duration-150'
                >
                  Learn more
                </WebviewWindow>
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
          <div className='flex flex-col gap-4 w-[250px]'>
            <Input
              placeholder={t('settings.general.webApi')}
              className='max-w-[250px]'
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
                onPress={() => handleClear(userSummary?.steamId, setKeyValue, setHasKey, setUserSettings)}
                startContent={<TbEraser size={20} />}
              >
                {t('common.clear')}
              </Button>
              <Button
                size='sm'
                className='bg-btn-secondary text-btn-text font-bold'
                radius='full'
                isDisabled={hasKey || !keyValue}
                onPress={() => handleKeySave(userSummary?.steamId, keyValue, setHasKey, setUserSettings)}
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
