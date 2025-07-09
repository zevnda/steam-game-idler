import type { GameSpecificSettings, InvokeSettings } from '@/types'
import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Button, cn, NumberInput } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useStateContext } from '@/components/contexts/StateContext'
import { useUserContext } from '@/components/contexts/UserContext'
import CustomModal from '@/components/ui/CustomModal'

interface GameSettingsProps {
  isOpen: boolean
  onOpenChange: () => void
}

export default function GameSettings({ isOpen, onOpenChange }: GameSettingsProps): ReactElement {
  const { t } = useTranslation()
  const { userSummary, userSettings, setUserSettings } = useUserContext()
  const { appId, appName, setIsGameSettingsOpen } = useStateContext()
  const [maxIdleTime, setMaxIdleTime] = useState(0)
  const [maxCardDrops, setMaxCardDrops] = useState(0)
  const [maxAchievementUnlocks, setMaxAchievementUnlocks] = useState(0)

  useEffect(() => {
    const fetchGameSettings = async (): Promise<void> => {
      const gameSettings: GameSpecificSettings =
        (userSettings.gameSettings && appId && userSettings.gameSettings[appId]) || {}
      setMaxIdleTime(gameSettings.maxIdleTime || 0)
      setMaxCardDrops(gameSettings.maxCardDrops || 0)
      setMaxAchievementUnlocks(gameSettings.maxAchievementUnlocks || 0)
    }
    fetchGameSettings()
  }, [appId, userSettings.gameSettings])

  const handleSave = async (): Promise<void> => {
    if (!appId) return

    const gameSettings = userSettings.gameSettings || {}

    gameSettings[appId] = {
      ...gameSettings[appId],
      maxIdleTime: maxIdleTime || 0,
      maxCardDrops: maxCardDrops || 0,
      maxAchievementUnlocks: maxAchievementUnlocks || 0,
    }

    const updateResponse = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'gameSettings',
      value: gameSettings,
    })
    setUserSettings(updateResponse.settings)
  }

  const handleMaxIdleTimeChange = (value: number): void => {
    setMaxIdleTime(value || 0)
  }

  const handleMaxAchievementUnlocksChange = (value: number): void => {
    setMaxAchievementUnlocks(value || 0)
  }

  const handleMaxCardDropsChange = (value: number): void => {
    setMaxCardDrops(value || 0)
  }

  const isSaveDisabled = (): boolean => {
    return (
      maxIdleTime === (userSettings.gameSettings?.maxIdleTime || '') &&
      maxCardDrops === (userSettings.gameSettings?.maxCardDrops || '') &&
      maxAchievementUnlocks === (userSettings.gameSettings?.maxAchievementUnlocks || '')
    )
  }

  const handleModalClose = (): void => {
    setIsGameSettingsOpen(false)
    onOpenChange()
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onOpenChange={handleModalClose}
      title={
        <p className='truncate'>
          {t('settings.title')} - {appName}
        </p>
      }
      body={
        <div className='grid grid-cols-2 gap-4 w-full my-4'>
          <div className='flex flex-col gap-2 w-full'>
            <p className='text-sm'>{t('gameSettings.idle')}</p>
            <NumberInput
              hideStepper
              value={maxIdleTime || 0}
              maxValue={99999}
              formatOptions={{ useGrouping: false }}
              aria-label='max idle'
              className='max-w-[80px]'
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover',
                  'group-data-[focus-within=true]:!bg-inputhover h-8',
                ),
                input: ['!text-content'],
              }}
              onValueChange={handleMaxIdleTimeChange}
            />
          </div>

          <div className='flex flex-col gap-2 w-full'>
            <p className='text-sm'>{t('gameSettings.drops')}</p>
            <NumberInput
              hideStepper
              value={maxCardDrops || 0}
              maxValue={99999}
              formatOptions={{ useGrouping: false }}
              aria-label='max drops'
              className='max-w-[80px]'
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover',
                  'group-data-[focus-within=true]:!bg-inputhover h-8',
                ),
                input: ['!text-content'],
              }}
              onValueChange={handleMaxCardDropsChange}
            />
          </div>

          <div className='flex flex-col gap-2 w-full'>
            <p className='text-sm'>{t('gameSettings.achievements')}</p>
            <NumberInput
              hideStepper
              value={maxAchievementUnlocks || 0}
              maxValue={99999}
              formatOptions={{ useGrouping: false }}
              aria-label='max unlocks'
              className='max-w-[80px]'
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover',
                  'group-data-[focus-within=true]:!bg-inputhover h-8',
                ),
                input: ['!text-content'],
              }}
              onValueChange={handleMaxAchievementUnlocksChange}
            />
          </div>
        </div>
      }
      buttons={
        <>
          <Button
            size='sm'
            color='danger'
            variant='light'
            radius='full'
            className='font-semibold'
            onPress={() => {
              onOpenChange()
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size='sm'
            className='bg-btn-secondary text-btn-text font-bold'
            radius='full'
            isDisabled={isSaveDisabled()}
            onPress={() => {
              handleSave()
              onOpenChange()
            }}
          >
            {t('common.save')}
          </Button>
        </>
      }
    />
  )
}
