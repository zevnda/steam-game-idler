import type {
  AchievementUnlockerSettings,
  CardFarmingSettings,
  GeneralSettings,
} from '@/shared/types'
import { cn, Switch } from '@heroui/react'
import { useUserStore } from '@/shared/stores'

interface SettingsSwitchProps {
  type: 'general' | 'cardFarming' | 'achievementUnlocker'
  name: string
  isProSetting?: boolean
}

export function SettingsSwitch({ type, name, isProSetting = false }: SettingsSwitchProps) {
  const userSummary = useUserStore(s => s.userSummary)
  const userSettings = useUserStore(s => s.userSettings)
  const setUserSettings = useUserStore(s => s.setUserSettings)
  const isPro = useUserStore(s => s.isPro)

  const isEnabled = () => {
    if (!userSettings) return false
    if (type === 'general')
      return Boolean((userSettings.general as GeneralSettings)[name as keyof GeneralSettings])
    if (type === 'cardFarming')
      return Boolean(
        (userSettings.cardFarming as CardFarmingSettings)[name as keyof CardFarmingSettings],
      )
    if (type === 'achievementUnlocker')
      return Boolean(
        (userSettings.achievementUnlocker as AchievementUnlockerSettings)[
          name as keyof AchievementUnlockerSettings
        ],
      )
    return false
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { handleCheckboxChange } = await import('@/features/settings')
    handleCheckboxChange(e, type, userSummary?.steamId, setUserSettings)
  }

  if (name === 'antiAway') {
    return (
      <Switch
        size='sm'
        name={name}
        isSelected={isEnabled()}
        classNames={{ wrapper: cn('group-data-[selected=true]:!bg-dynamic !bg-switch') }}
        onChange={async e => {
          const { antiAwayStatus } = await import('@/shared/utils/system')
          const { handleCheckboxChange } = await import('@/features/settings')
          handleCheckboxChange(e, 'general', userSummary?.steamId, setUserSettings)
          antiAwayStatus(isEnabled() ? null : undefined)
        }}
      />
    )
  }

  if (name === 'runAtStartup') {
    return (
      <Switch
        size='sm'
        name={name}
        isSelected={isEnabled()}
        classNames={{ wrapper: cn('group-data-[selected=true]:!bg-dynamic !bg-switch') }}
        onChange={async () => {
          const { handleRunAtStartupChange } = await import('@/features/settings')
          handleRunAtStartupChange()
        }}
      />
    )
  }

  return (
    <Switch
      size='sm'
      name={name}
      isSelected={isEnabled()}
      isDisabled={isProSetting && !isPro}
      classNames={{ wrapper: cn('group-data-[selected=true]:!bg-dynamic !bg-switch') }}
      onChange={handleChange}
    />
  )
}
