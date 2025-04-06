import type { ReactElement } from 'react'

import { Button, cn, Input, Spinner } from '@heroui/react'
import Image from 'next/image'
import { Trans, useTranslation } from 'react-i18next'
import { TbEraser, TbRefresh, TbUpload } from 'react-icons/tb'

import { useUserContext } from '@/components/contexts/UserContext'
import SettingsCheckbox from '@/components/settings/SettingsCheckbox'
import ExtLink from '@/components/ui/ExtLink'
import { fetchGamesWithDropsData, handleClear, handleSave, useCardSettings } from '@/hooks/settings/useCardSettings'

export default function CardSettings(): ReactElement {
  const { t } = useTranslation()
  const { userSummary, userSettings, setUserSettings } = useUserContext()
  const cardSettings = useCardSettings()

  return (
    <div className='relative flex flex-col gap-4'>
      {cardSettings.cardFarmingUser && (
        <div className='border border-border rounded-lg bg-titlebar w-fit'>
          <div className='flex justify-between items-start gap-2 h-full p-2'>
            <div className='flex gap-2 items-center'>
              <Image
                src={cardSettings.cardFarmingUser.avatar}
                height={40}
                width={40}
                alt='user avatar'
                className='w-[40px] h-[40px] rounded-full'
                priority
              />
              <div className='w-[150px]'>
                <p className='font-bold truncate'>{cardSettings.cardFarmingUser.personaName}</p>
                <p className='text-sm text-altwhite truncate'>{cardSettings.cardFarmingUser.steamId}</p>
              </div>
            </div>
            <div className='flex flex-col bg-input border border-border rounded-lg p-2'>
              {!cardSettings.isCFDataLoading ? (
                <>
                  <div className='flex justify-between items-center gap-6'>
                    <p className='text-sm truncate'>
                      {t('settings.cardFarming.gamesWithDrops')}
                      <span className='text-dynamic ml-1'>{userSettings.cardFarming.gamesWithDrops || 0}</span>
                    </p>
                    <p className='text-sm truncate'>
                      {t('settings.cardFarming.totalDrops')}
                      <span className='text-dynamic ml-1'>{userSettings.cardFarming.totalDropsRemaining || 0}</span>
                    </p>
                  </div>
                  <div className='flex justify-center items-center mt-2'>
                    <div
                      className={cn(
                        'flex justify-center items-center gap-1 cursor-pointer',
                        'w-fit text-altwhite hover:text-content',
                      )}
                      onClick={() =>
                        fetchGamesWithDropsData(
                          userSummary,
                          cardSettings.sidValue,
                          cardSettings.slsValue,
                          cardSettings?.smaValue,
                          cardSettings.setIsCFDataLoading,
                          setUserSettings,
                        )
                      }
                    >
                      <p className='text-xs'>Refresh</p>
                      <TbRefresh size={14} />
                    </div>
                  </div>
                </>
              ) : (
                <div className='flex items-center justify-center gap-2'>
                  <Spinner size='sm' variant='simple' />
                  <p className='text-xs text-altwhite'>Loading data..</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className='flex flex-col gap-4 border border-border rounded-lg p-3 bg-titlebar'>
        <p className='font-bold'>{t('common.options')}</p>

        <SettingsCheckbox type='cardFarming' name='listGames' content={t('settings.cardFarming.listGames')} />

        <SettingsCheckbox type='cardFarming' name='allGames' content={t('settings.cardFarming.allGames')} />
      </div>

      <div className='border border-border rounded-lg p-3 bg-titlebar'>
        <p className='font-bold'>{t('settings.cardFarming.steamCredentialsTitle')}</p>
        <p className='text-xs text-altwhite'>
          <Trans i18nKey='settings.cardFarming.steamCredentials'>
            Steam credentials are required in order to use the Card Farming feature.&nbsp;
            <ExtLink
              href='https://steamgameidler.vercel.app/steam-credentials'
              className='text-link hover:text-linkhover'
            >
              Learn more
            </ExtLink>
          </Trans>
        </p>
        <div className='flex flex-col mt-4'>
          <div className='flex flex-col gap-2'>
            <div className='flex gap-6 flex-wrap'>
              <Input
                isRequired
                size='sm'
                label='sessionid'
                labelPlacement='outside'
                placeholder='sessionid'
                className='max-w-[290px]'
                classNames={{
                  inputWrapper: cn(
                    'bg-input border border-border hover:!bg-inputhover',
                    'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                  ),
                  label: ['!text-content font-bold'],
                  input: ['!text-content placeholder:text-altwhite/50'],
                }}
                value={cardSettings.sidValue}
                onChange={e => cardSettings.setSidValue(e.target.value)}
                type='password'
              />
              <Input
                isRequired
                size='sm'
                label='steamLoginSecure'
                labelPlacement='outside'
                placeholder='steamLoginSecure'
                className='max-w-[290px]'
                classNames={{
                  inputWrapper: cn(
                    'bg-input border border-border hover:!bg-inputhover',
                    'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                  ),
                  label: ['!text-content font-bold'],
                  input: ['!text-content placeholder:text-altwhite/50'],
                }}
                value={cardSettings.slsValue}
                onChange={e => cardSettings.setSlsValue(e.target.value)}
                type='password'
              />
              <Input
                size='sm'
                label={
                  <p>
                    steamParental/steamMachineAuth <span className='italic'>(optional)</span>
                  </p>
                }
                labelPlacement='outside'
                placeholder='steamParental/steamMachineAuth'
                className='max-w-[290px]'
                classNames={{
                  inputWrapper: cn(
                    'bg-input border border-border hover:!bg-inputhover',
                    'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                  ),
                  label: ['!text-content font-bold'],
                  input: ['!text-content placeholder:text-altwhite/50'],
                }}
                value={cardSettings.smaValue}
                onChange={e => cardSettings.setSmaValue(e.target.value)}
                type='password'
              />
            </div>
            <div className='flex gap-2 mt-2'>
              <Button
                size='sm'
                isDisabled={cardSettings.hasCookies || !cardSettings.sidValue || !cardSettings.slsValue}
                className='font-semibold rounded-lg bg-dynamic text-button-text'
                onPress={() =>
                  handleSave(
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
              <Button
                size='sm'
                color='danger'
                isDisabled={!cardSettings.hasCookies}
                className='font-semibold rounded-lg'
                onPress={() =>
                  handleClear(
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
