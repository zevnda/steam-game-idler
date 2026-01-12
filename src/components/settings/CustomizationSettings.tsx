import type { InvokeSettings } from '@/types'
import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Divider, Radio, RadioGroup } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useUserStore } from '@/stores/userStore'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { TbChevronRight } from 'react-icons/tb'

import SettingsSwitch from '@/components/settings/SettingsSwitch'

interface Theme {
  key: string
  label: string
}

export default function CustomizationSettings(): ReactElement | null {
  const { t } = useTranslation()
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const userSummary = useUserStore(state => state.userSummary)

  // Themes
  const themes: Theme[] = [
    { key: 'dark', label: 'Default' },
    { key: 'black', label: 'Black' },
  ]

  useEffect(() => {
    const localTheme = localStorage.getItem('theme')
    if (!localTheme) {
      localStorage.setItem('theme', 'dark')
      setTheme('dark')
    } else {
      setTheme(localTheme)
    }
    setMounted(true)
  }, [setTheme])

  const handleThemeChange = async (themeKey: string): Promise<void> => {
    localStorage.setItem('theme', themeKey)
    setTheme(themeKey)
    await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'general.theme',
      value: themeKey,
    })
  }

  if (!mounted) return null

  return (
    <div className='relative flex flex-col gap-4 mt-9 pb-16 w-4/5'>
      <div className='flex flex-col gap-0 select-none'>
        <p className='flex items-center text-xs text-altwhite font-bold'>
          {t('settings.title')}
          <span>
            <TbChevronRight size={12} />
          </span>
        </p>
        <p className='text-3xl font-black'>{t('settings.customization.title')}</p>
      </div>

      <div className='flex flex-col gap-3 mt-4'>
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
            <p className='text-sm text-content font-bold'>{t('settings.general.showRecommendedCarousel')}</p>
            <p className='text-xs text-altwhite'>{t('settings.general.showRecommendedCarousel.description')}</p>
          </div>
          <SettingsSwitch type='general' name='showRecommendedCarousel' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.showRecentCarousel')}</p>
            <p className='text-xs text-altwhite'>{t('settings.general.showRecentCarousel.description')}</p>
          </div>
          <SettingsSwitch type='general' name='showRecentCarousel' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.general.showCardDropsCarousel')}</p>
            <p className='text-xs text-altwhite'>{t('settings.general.showCardDropsCarousel.description')}</p>
          </div>
          <SettingsSwitch type='general' name='showCardDropsCarousel' />
        </div>

        <Divider className='bg-border/70 my-4' />

        <div className='flex flex-col justify-between gap-6'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.customization.theme')}</p>
            <p className='text-xs text-altwhite'>{t('settings.customization.theme.description')}</p>
          </div>

          <RadioGroup
            orientation='horizontal'
            defaultValue={resolvedTheme}
            onValueChange={value => handleThemeChange(value)}
          >
            <div className='grid grid-cols-5 space-x-2 space-y-4'>
              {themes.map(theme => (
                <div key={theme.key}>
                  <Radio
                    value={theme.key}
                    classNames={{
                      base: 'items-end gap-0',
                    }}
                    size='sm'
                  >
                    <div className='relative cursor-pointer'>
                      <Image
                        src={`/themes/${theme.key}.webp`}
                        alt={theme.label}
                        width={147}
                        height={45}
                        className='rounded-lg border border-border object-cover -translate-x-6 mb-2'
                      />
                      <div
                        className='pointer-events-none -translate-x-6 absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150'
                        style={{ boxShadow: 'inset 0 0 0 2px hsl(var(--heroui-dynamic))' }}
                      />
                    </div>
                    <div className='flex items-center translate-y-0.5'>
                      <p className='text-altwhite'>{theme.label}</p>
                    </div>
                  </Radio>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  )
}
