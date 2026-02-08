import type {
  AchievementUnlockerSettings,
  CardFarmingSettings,
  GeneralSettings,
} from '@/shared/types'
import { cn, Switch } from '@heroui/react'
import {
  handleCheckboxChange,
  handleRunAtStartupChange,
  useAchievementSettings,
  useCardSettings,
  useGeneralSettings,
} from '@/features/settings'
import { useUserStore } from '@/shared/stores'
import { antiAwayStatus } from '@/shared/utils'

interface SettingsCheckboxProps {
  type: 'general' | 'cardFarming' | 'achievementUnlocker'
  name: string
  isProSetting?: boolean
}

export const SettingsSwitch = ({ type, name, isProSetting = false }: SettingsCheckboxProps) => {
  const userSummary = useUserStore(state => state.userSummary)
  const userSettings = useUserStore(state => state.userSettings)
  const setUserSettings = useUserStore(state => state.setUserSettings)
  const isPro = useUserStore(state => state.isPro)
  const { startupState, setStartupState } = useGeneralSettings()

  useCardSettings()
  useAchievementSettings()

  const isSettingEnabled = () => {
    if (!userSettings) return false

    if (type === 'general') {
      return Boolean((userSettings.general as GeneralSettings)[name as keyof GeneralSettings])
    }
    if (type === 'cardFarming') {
      return Boolean(
        (userSettings.cardFarming as CardFarmingSettings)[name as keyof CardFarmingSettings],
      )
    }
    if (type === 'achievementUnlocker') {
      return Boolean(
        (userSettings.achievementUnlocker as AchievementUnlockerSettings)[
          name as keyof AchievementUnlockerSettings
        ],
      )
    }
    return false
  }

  if (name === 'antiAway') {
    return (
      <Switch
        size='sm'
        name={name}
        isSelected={isSettingEnabled()}
        classNames={{
          wrapper: cn('group-data-[selected=true]:!bg-dynamic !bg-switch'),
        }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          handleCheckboxChange(e, 'general', userSummary?.steamId, setUserSettings)
          antiAwayStatus(isSettingEnabled() ? null : undefined)
        }}
      />
    )
  }

  if (name === 'runAtStartup') {
    return (
      <Switch
        size='sm'
        name={name}
        isSelected={startupState || false}
        classNames={{
          wrapper: cn('group-data-[selected=true]:!bg-dynamic !bg-switch'),
        }}
        onChange={() => handleRunAtStartupChange(setStartupState)}
      />
    )
  }

  return (
    <Switch
      size='sm'
      name={name}
      isSelected={isSettingEnabled()}
      isDisabled={isProSetting && !isPro}
      classNames={{
        wrapper: cn('group-data-[selected=true]:!bg-dynamic !bg-switch'),
      }}
      onChange={e => {
        if (type === 'general') {
          handleCheckboxChange(e, 'general', userSummary?.steamId, setUserSettings)
        } else if (type === 'cardFarming') {
          handleCheckboxChange(e, 'cardFarming', userSummary?.steamId, setUserSettings)
        } else {
          handleCheckboxChange(e, 'achievementUnlocker', userSummary?.steamId, setUserSettings)
        }
      }}
    />
  )
}
