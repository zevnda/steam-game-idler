import type { InvokeSteamCredentials } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import { TbEraser, TbUpload } from 'react-icons/tb'
import { Button, cn, Divider, Input, Spinner, useDisclosure } from '@heroui/react'
import Image from 'next/image'
import { useCardSettings } from '@/features/settings/hooks/card-farming/useCardSettings'
import {
  fetchGamesWithDropsData,
  handleClearCredentials,
  handleSaveCredentials,
} from '@/features/settings/services/credentialsService'
import { CustomModal } from '@/shared/components/CustomModal'
import { ExtLink } from '@/shared/components/ExtLink'
import { OpenDocs } from '@/shared/components/OpenDocs'
import { ProBadge } from '@/shared/components/pro/ProBadge'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUiStore, useUserStore } from '@/shared/stores'
import { hasGamerFeature } from '@/shared/utils'

export function SteamCredentials() {
  const { t } = useTranslation()
  const setProModalOpen = useUiStore(s => s.setProModalOpen)
  const setProModalRequiredTier = useUiStore(s => s.setProModalRequiredTier)
  const userSummary = useUserStore(s => s.userSummary)
  const userSettings = useUserStore(s => s.userSettings)
  const setUserSettings = useUserStore(s => s.setUserSettings)
  const proTier = useUserStore(s => s.proTier)
  const cs = useCardSettings()
  const { isOpen, onOpenChange } = useDisclosure()

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    ;(e.target as HTMLImageElement).src = '/fallback.webp'
  }

  const handleShowLoginWindow = async () => {
    const result = await invoke<InvokeSteamCredentials>('open_steam_login_window')
    if (!result || !result.success) {
      toast.danger(t('common.error'))
      await logEvent(
        `[Error] in (handleShowSteamLoginWindow): ${result?.message || 'Unknown error'}`,
      )
      return
    }
    handleSaveCredentials(
      result.sessionid,
      result.steamLoginSecure,
      undefined,
      cs.setHasCookies,
      cs.setCardFarmingUser,
      userSummary,
      userSettings,
      setUserSettings,
      cs.setIsCFDataLoading,
      cs.setGamesWithDropsData,
    )
  }

  const handleSignOut = async () => {
    const result = await invoke<InvokeSteamCredentials>('delete_login_window_cookies')
    if (!result || !result.success) {
      toast.danger(t('common.error'))
      return
    }
    handleClearCredentials(
      cs.setHasCookies,
      cs.setSidValue,
      cs.setSlsValue,
      cs.setSmaValue,
      cs.setCardFarmingUser,
      userSummary,
      setUserSettings,
      cs.setGamesWithDrops,
      cs.setTotalDropsRemaining,
    )
  }

  return (
    <div className='relative flex flex-col gap-4 pb-16 w-4/5'>
      <div className='flex flex-col gap-0 select-none mb-3'>
        <p className='text-[10px] uppercase tracking-widest text-altwhite/40 font-black mb-1'>
          {t('settings.title')}
        </p>
        <p className='text-2xl font-black'>{t('settings.cardFarming.steamCredentialsTitle')}</p>
      </div>
      <div className='flex flex-col gap-3 mt-4'>
        {/* Automated method */}
        <div className='flex justify-between items-start'>
          <div className='flex flex-col gap-2 w-1/2'>
            <div className='flex items-center'>
              <p className='flex items-center gap-2 text-sm text-content font-bold'>
                {t('settings.steamCredentials.automated')}
                <OpenDocs path='/steam-credentials#automated-method' />
              </p>
              {!hasGamerFeature(proTier) && <ProBadge className='scale-65' requiredTier='gamer' />}
            </div>
            <p className='text-[11px] text-altwhite/60 leading-relaxed'>
              {t('settings.steamCredentials.automated.description')}
            </p>
          </div>
          <div
            className='flex flex-col gap-2'
            onClick={() => {
              if (!hasGamerFeature(proTier)) {
                setProModalRequiredTier('gamer')
                setProModalOpen(true)
              }
            }}
          >
            <div className='flex items-start gap-4'>
              <div className='flex flex-col gap-2'>
                {cs.cardFarmingUser && (
                  <div className='flex items-center gap-2 mb-2'>
                    <Image
                      src={cs.cardFarmingUser.avatar}
                      alt='avatar'
                      width={32}
                      height={32}
                      className='rounded-full bg-white'
                      onError={handleImageError}
                    />
                    <div>
                      <p className='text-sm font-semibold'>{cs.cardFarmingUser.personaName}</p>
                      {cs.gamesWithDrops > 0 && (
                        <p
                          className='text-xs text-altwhite cursor-pointer hover:text-content duration-150'
                          onClick={onOpenChange}
                        >
                          {t('settings.cardFarming.gamesWithDrops')}: {cs.gamesWithDrops} (
                          {cs.totalDropsRemaining} drops)
                        </p>
                      )}
                    </div>
                    {!cs.isCFDataLoading && (
                      <Button
                        size='sm'
                        className='bg-btn-secondary text-btn-text font-semibold'
                        radius='full'
                        onPress={() =>
                          fetchGamesWithDropsData(
                            userSummary,
                            cs.setIsCFDataLoading,
                            setUserSettings,
                            cs.setGamesWithDropsData,
                          )
                        }
                      >
                        {t('common.refresh')}
                      </Button>
                    )}
                    {cs.isCFDataLoading && (
                      <div className='flex items-center gap-2'>
                        <Spinner size='sm' variant='simple' />
                        <p className='text-[11px] text-altwhite/60 leading-relaxed'>
                          {t('settings.cardFarming.loading')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    className='bg-btn-secondary text-btn-text font-semibold'
                    radius='full'
                    isDisabled={!hasGamerFeature(proTier)}
                    onPress={handleShowLoginWindow}
                  >
                    {t('common.signInSteam')}
                  </Button>
                  <Button
                    size='sm'
                    variant='light'
                    radius='full'
                    color='danger'
                    isDisabled={!hasGamerFeature(proTier) || !cs.hasCookies}
                    onPress={handleSignOut}
                  >
                    {t('common.signOut')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Divider className='bg-border/15 my-5' />
        {/* Manual method */}
        <div className='flex justify-between items-start'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='flex items-center gap-2 text-sm text-content font-bold'>
              {t('settings.steamCredentials.manual')}
              <OpenDocs path='/steam-credentials#manual-method' />
            </p>
            <p className='text-[11px] text-altwhite/60 leading-relaxed'>
              {t('settings.cardFarming.steamCredentials')}
            </p>
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
                  'bg-input data-[hover=true]:!bg-inputhover rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                ),
                label: ['text-xs !text-altwhite font-bold'],
                input: ['!text-content placeholder:text-altwhite/50'],
              }}
              value={cs.sidValue}
              onChange={e => cs.setSidValue(e.target.value)}
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
                  'bg-input data-[hover=true]:!bg-inputhover rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                ),
                label: ['text-xs !text-altwhite font-bold'],
                input: ['!text-content placeholder:text-altwhite/50'],
              }}
              value={cs.slsValue}
              onChange={e => cs.setSlsValue(e.target.value)}
              type='password'
            />
            <Input
              label={<p>steamParental / steamMachineAuth</p>}
              labelPlacement='outside'
              placeholder='steamParental / steamMachineAuth'
              className='max-w-72.5'
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                ),
                label: ['text-xs !text-altwhite font-bold'],
                input: ['!text-content placeholder:text-altwhite/50'],
              }}
              value={cs.smaValue}
              onChange={e => cs.setSmaValue(e.target.value)}
              type='password'
            />
            <div className='flex justify-end gap-2'>
              <Button
                size='sm'
                variant='light'
                radius='full'
                color='danger'
                isDisabled={!cs.hasCookies}
                onPress={() =>
                  handleClearCredentials(
                    cs.setHasCookies,
                    cs.setSidValue,
                    cs.setSlsValue,
                    cs.setSmaValue,
                    cs.setCardFarmingUser,
                    userSummary,
                    setUserSettings,
                    cs.setGamesWithDrops,
                    cs.setTotalDropsRemaining,
                  )
                }
                startContent={<TbEraser size={20} />}
              >
                {t('common.clear')}
              </Button>
              <Button
                size='sm'
                className='bg-btn-secondary text-btn-text font-semibold'
                radius='full'
                isDisabled={cs.hasCookies || !cs.sidValue || !cs.slsValue}
                onPress={() =>
                  handleSaveCredentials(
                    cs.sidValue,
                    cs.slsValue,
                    cs.smaValue,
                    cs.setHasCookies,
                    cs.setCardFarmingUser,
                    userSummary,
                    userSettings,
                    setUserSettings,
                    cs.setIsCFDataLoading,
                    cs.setGamesWithDropsData,
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
        title={<p>{t('settings.cardFarming.gamesWithDrops')}</p>}
        body={
          <div className='overflow-x-hidden overflow-y-auto relative'>
            {cs.isCFDataLoading ? (
              <div className='flex justify-center p-4'>
                <Spinner />
              </div>
            ) : cs.gamesWithDropsData.length === 0 ? (
              <div className='flex justify-center p-4'>
                <p className='text-center text-content'>
                  {t('customLists.cardFarming.drops', { count: 0 })}
                </p>
              </div>
            ) : (
              <div className='flex flex-col'>
                {cs.gamesWithDropsData.map(item => (
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
                      priority
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
