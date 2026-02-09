import type { InvokeSteamCredentials } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { Trans, useTranslation } from 'react-i18next'
import { TbChevronRight, TbEraser, TbUpload } from 'react-icons/tb'
import { Button, cn, Divider, Input, Spinner, useDisclosure } from '@heroui/react'
import Image from 'next/image'
import {
  fetchGamesWithDropsData,
  handleClearCredentials,
  useCardSettings,
} from '@/features/settings'
import { handleSaveCredentials } from '@/features/settings/utils/steam-credentials/handleSteamCredentials'
import { CustomModal, ExtLink, ProBadge, showDangerToast } from '@/shared/components'
import { useStateStore, useUserStore } from '@/shared/stores'
import { logEvent } from '@/shared/utils'

export const SteamCredentials = () => {
  const { t } = useTranslation()
  const setProModalOpen = useStateStore(state => state.setProModalOpen)
  const userSummary = useUserStore(state => state.userSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const setUserSettings = useUserStore(state => state.setUserSettings)
  const isPro = useUserStore(state => state.isPro)
  const cardSettings = useCardSettings()
  const { isOpen, onOpenChange } = useDisclosure()

  const handleShowSteamLoginWindow = async () => {
    const result = await invoke<InvokeSteamCredentials>('open_steam_login_window')

    if (!result || result.success === false) {
      showDangerToast(t('common.error'))
      logEvent(`[Error] in (handleShowSteamLoginWindow): ${result?.message || 'Unknown error'}`)
      return
    }

    if (result.success) {
      handleSaveCredentials(
        result.sessionid,
        result.steamLoginSecure,
        undefined,
        cardSettings.setHasCookies,
        cardSettings.setCardFarmingUser,
        userSummary,
        userSettings,
        setUserSettings,
        cardSettings.setIsCFDataLoading,
        cardSettings.setGamesWithDropsData,
      )
    }
  }

  const handleSignOutCurrentUser = async () => {
    const result = await invoke<InvokeSteamCredentials>('delete_login_window_cookies')

    if (!result || result.success === false) {
      showDangerToast(t('common.error'))
      logEvent(
        `[Error] in (handleSignOutCurrentUser) this error can occur if you are not already signed in: ${result?.message || 'Unknown error'}`,
      )
      return
    }

    handleClearCredentials(
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

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    ;(event.target as HTMLImageElement).src = '/fallback.webp'
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
              <p className='text-sm text-content font-bold'>
                {t('settings.steamCredentials.automated')}
              </p>
              {!isPro && <ProBadge className='scale-65' />}
            </div>
            <p className='text-xs text-altwhite'>
              {t('settings.steamCredentials.automated.description')}
            </p>
            <ExtLink
              href='https://steamgameidler.com/docs/steam-credentials#automated-method'
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
              onPress={handleShowSteamLoginWindow}
            >
              {cardSettings.hasCookies ? t('common.reauthenticate') : t('common.signInSteam')}
            </Button>
            <Button
              size='sm'
              variant='light'
              radius='full'
              color='danger'
              isDisabled={!isPro}
              onPress={handleSignOutCurrentUser}
            >
              {t('common.signOut')}
            </Button>
          </div>
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-start'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.steamCredentials.manual')}
            </p>
            <p className='text-xs text-altwhite'>
              <Trans i18nKey='settings.cardFarming.steamCredentials'>
                Steam credentials are required in order to use the Card Farming and Trading Card
                Manager features.&nbsp;
                <ExtLink
                  href='https://steamgameidler.com/docs/steam-credentials#manual-method'
                  className='text-dynamic hover:text-dynamic-hover duration-150'
                >
                  Learn more
                </ExtLink>
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
                  <div className='flex-col'>
                    <div className='flex justify-center items-center gap-3'>
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
                          <p className='text-sm text-altwhite font-bold mr-2'>
                            {t('settings.cardFarming.gamesWithDrops')}
                          </p>
                          <p className='text-sm text-dynamic font-bold'>
                            {userSettings.cardFarming.gamesWithDrops || 0}
                          </p>
                        </div>
                        <div className='flex gap-1'>
                          <p className='text-sm text-altwhite font-bold mr-2'>
                            {t('settings.cardFarming.totalDrops')}
                          </p>
                          <p className='text-sm text-dynamic font-bold'>
                            {userSettings.cardFarming.totalDropsRemaining || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='flex justify-center gap-2 mt-3'>
                      <Button
                        size='sm'
                        className='bg-btn-secondary text-btn-text font-bold'
                        radius='full'
                        fullWidth
                        onPress={() => {
                          if (cardSettings.gamesWithDropsData.length === 0) {
                            fetchGamesWithDropsData(
                              userSummary,
                              cardSettings.setIsCFDataLoading,
                              setUserSettings,
                              cardSettings.setGamesWithDropsData,
                            )
                          }
                          onOpenChange()
                        }}
                      >
                        {t('common.viewList')}
                      </Button>
                      <Button
                        size='sm'
                        className='bg-btn-secondary text-btn-text font-bold'
                        radius='full'
                        fullWidth
                        onPress={() =>
                          fetchGamesWithDropsData(
                            userSummary,
                            cardSettings.setIsCFDataLoading,
                            setUserSettings,
                            cardSettings.setGamesWithDropsData,
                          )
                        }
                      >
                        {t('common.refresh')}
                      </Button>
                    </div>
                  </div>
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
                  handleClearCredentials(
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
                isDisabled={
                  cardSettings.hasCookies || !cardSettings.sidValue || !cardSettings.slsValue
                }
                onPress={() =>
                  handleSaveCredentials(
                    cardSettings.sidValue,
                    cardSettings.slsValue,
                    cardSettings.smaValue,
                    cardSettings.setHasCookies,
                    cardSettings.setCardFarmingUser,
                    userSummary,
                    userSettings,
                    setUserSettings,
                    cardSettings.setIsCFDataLoading,
                    cardSettings.setGamesWithDropsData,
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

      <CustomModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        classNames={{
          body: '!p-0 !max-h-[60vh] !min-h-[60vh]',
          base: 'max-w-xl bg-base/85 backdrop-blur-sm',
        }}
        title={
          <div className='flex justify-between items-center'>
            <p className='truncate capitalize'>{t('settings.cardFarming.gamesWithDrops')}</p>
          </div>
        }
        body={
          <div className='overflow-x-hidden overflow-y-auto relative'>
            {cardSettings.isCFDataLoading ? (
              <div className='flex justify-center items-center w-full p-4'>
                <Spinner />
              </div>
            ) : cardSettings.gamesWithDropsData.length === 0 ? (
              <div className='flex justify-center items-center w-full p-4'>
                <p className='text-center text-content'>
                  {t('customLists.cardFarming.drops', { count: 0 })}
                </p>
              </div>
            ) : (
              <div className='flex flex-col'>
                {cardSettings.gamesWithDropsData.map(item => (
                  <div
                    className='flex items-center gap-3 hover:bg-item-hover px-3 py-1 duration-150 select-none'
                    key={item.id}
                  >
                    <Image
                      src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.id}/header.jpg`}
                      className='aspect-62/29 rounded-sm'
                      width={62}
                      height={29}
                      alt={`${item.name} image`}
                      priority={true}
                      onError={handleImageError}
                    />
                    <ExtLink
                      className='text-sm max-w-1/2 text-dynamic hover:text-dynamic-hover duration-150'
                      href={`https://steamcommunity.com/my/gamecards/${item.id}`}
                    >
                      <p className='truncate'>{item.name}</p>
                    </ExtLink>
                    <p className='grow text-right'>
                      {t('customLists.cardFarming.drops', { count: item.remaining || 0 })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        }
        buttons={
          <Button
            size='sm'
            color='danger'
            variant='light'
            radius='full'
            className='font-semibold'
            onPress={onOpenChange}
          >
            {t('common.close')}
          </Button>
        }
      />
    </div>
  )
}
