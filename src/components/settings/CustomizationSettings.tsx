import type { InvokeSettings } from '@/types'
import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Button, cn, Divider, Input, Radio, RadioGroup } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useStateStore } from '@/stores/stateStore'
import { useUserStore } from '@/stores/userStore'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { TbChevronRight, TbEraser } from 'react-icons/tb'

import SettingsSwitch from '@/components/settings/SettingsSwitch'
import ProBadge from '@/components/ui/ProBadge'

interface Theme {
  key: string
  label: string
  isProTheme: boolean
}

export default function CustomizationSettings(): ReactElement | null {
  const { t } = useTranslation()
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const setProModalOpen = useStateStore(state => state.setProModalOpen)
  const userSummary = useUserStore(state => state.userSummary)
  const setUserSettings = useUserStore(state => state.setUserSettings)
  const isPro = useUserStore(state => state.isPro)

  // Themes
  const themes: Theme[] = [
    { key: 'dark', label: 'Default', isProTheme: false },
    { key: 'blue', label: 'Blue', isProTheme: true },
    { key: 'red', label: 'Red', isProTheme: true },
    { key: 'purple', label: 'Purple', isProTheme: true },
    { key: 'pink', label: 'Pink', isProTheme: true },
    { key: 'gold', label: 'Gold', isProTheme: true },
    { key: 'black', label: 'Black', isProTheme: true },
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUri = reader.result as string
      await invoke<InvokeSettings>('update_user_settings', {
        steamId: userSummary?.steamId,
        key: 'general.customBackground',
        value: dataUri,
      })
      setUserSettings(prev => ({
        ...prev,
        general: {
          ...prev?.general,
          customBackground: dataUri,
        },
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteBackground = async (): Promise<void> => {
    await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: 'general.customBackground',
      value: null,
    })
    setUserSettings(prev => ({
      ...prev,
      general: {
        ...prev?.general,
        customBackground: null,
      },
    }))
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

        <div className='flex justify-between items-start'>
          <div className='flex flex-col gap-2 w-1/2'>
            <div className='flex items-center'>
              <p className='text-sm text-content font-bold'>{t('settings.customization.backgroundImage')}</p>
              {!isPro && <ProBadge className='scale-65' />}
            </div>
            <p className='text-xs text-altwhite'>{t('settings.customization.backgroundImage.description')}</p>
          </div>

          <div className='flex flex-col gap-4 w-[250px]' onClick={() => !isPro && setProModalOpen(true)}>
            <Input
              type='file'
              accept='image/*'
              className='max-w-[250px]'
              isDisabled={!isPro}
              classNames={{
                base: '',
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover !cursor-pointer',
                  'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                ),
                input: ['!text-content cursor-pointer'],
              }}
              onChange={handleFileChange}
            />

            <div className='flex justify-end'>
              <Button
                size='sm'
                variant='light'
                radius='full'
                color='danger'
                onPress={handleDeleteBackground}
                startContent={<TbEraser size={20} />}
              >
                {t('common.clear')}
              </Button>
            </div>
          </div>
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
                <div key={theme.key} onClick={() => theme.isProTheme && !isPro && setProModalOpen(true)}>
                  <Radio
                    value={theme.key}
                    isDisabled={theme.isProTheme && !isPro}
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
                      {theme.isProTheme && !isPro && <ProBadge className='ml-2 scale-75' />}
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
