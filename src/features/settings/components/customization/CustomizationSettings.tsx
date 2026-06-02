import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronRight, TbEraser } from 'react-icons/tb'
import { Button, cn, Divider, Input, Radio, RadioGroup } from '@heroui/react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import {
  handleBackgroundDelete,
  handleBackgroundSave,
  handleThemeChange,
} from '@/features/settings/services/generalService'
import { ProBadge } from '@/shared/components/pro/ProBadge'
import { SettingsSwitch } from '@/shared/components/SettingsSwitch'
import { useUiStore, useUserStore } from '@/shared/stores'
import { hasGamerFeature } from '@/shared/utils'

const THEMES = [
  { key: 'dark', label: 'Default', isPro: false },
  { key: 'blue', label: 'Blue', isPro: true },
  { key: 'red', label: 'Red', isPro: true },
  { key: 'purple', label: 'Purple', isPro: true },
  { key: 'pink', label: 'Pink', isPro: true },
  { key: 'gold', label: 'Gold', isPro: true },
  { key: 'black', label: 'Black', isPro: true },
]

export function CustomizationSettings() {
  const { t } = useTranslation()
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const proTier = useUserStore(s => s.proTier)
  const setProModalRequiredTier = useUiStore(s => s.setProModalRequiredTier)
  const setProModalOpen = useUiStore(s => s.setProModalOpen)
  const setUserSettings = useUserStore(s => s.setUserSettings)
  const isPro = useUserStore(s => s.isPro)

  useEffect(() => {
    const t = localStorage.getItem('theme')
    if (!t) {
      localStorage.setItem('theme', 'dark')
      setTheme('dark')
    } else {
      setTheme(t)
    }
    setMounted(true)
  }, [setTheme])

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
            <p className='text-sm text-content font-bold'>
              {t('settings.general.disableTooltips')}
            </p>
            <p className='text-xs text-altwhite'>
              {t('settings.general.disableTooltips.description')}
            </p>
          </div>
          <SettingsSwitch type='general' name='disableTooltips' />
        </div>
        <Divider className='bg-border/70 my-4' />
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.general.showRecommendedCarousel')}
            </p>
            <p className='text-xs text-altwhite'>
              {t('settings.general.showRecommendedCarousel.description')}
            </p>
          </div>
          <SettingsSwitch type='general' name='showRecommendedCarousel' />
        </div>
        <Divider className='bg-border/70 my-4' />
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.general.showRecentCarousel')}
            </p>
            <p className='text-xs text-altwhite'>
              {t('settings.general.showRecentCarousel.description')}
            </p>
          </div>
          <SettingsSwitch type='general' name='showRecentCarousel' />
        </div>
        <Divider className='bg-border/70 my-4' />
        <div className='flex justify-between items-center'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>
              {t('settings.general.showCardDropsCarousel')}
            </p>
            <p className='text-xs text-altwhite'>
              {t('settings.general.showCardDropsCarousel.description')}
            </p>
          </div>
          <SettingsSwitch type='general' name='showCardDropsCarousel' />
        </div>
        <Divider className='bg-border/70 my-4' />
        <div className='flex justify-between items-start'>
          <div className='flex flex-col gap-2 w-1/2'>
            <div className='flex items-center'>
              <p className='text-sm text-content font-bold'>
                {t('settings.customization.backgroundImage')}
              </p>
              {!isPro && <ProBadge className='scale-65' />}
            </div>
            <p className='text-xs text-altwhite'>
              {t('settings.customization.backgroundImage.description')}
            </p>
          </div>
          <div
            className='flex flex-col gap-4 w-62.5'
            onClick={() => {
              if (!hasGamerFeature(proTier)) {
                setProModalRequiredTier('casual')
                setProModalOpen(true)
              }
            }}
          >
            <Input
              type='file'
              accept='image/*'
              className='max-w-62.5'
              isDisabled={!isPro}
              classNames={{
                inputWrapper: cn(
                  'bg-input data-[hover=true]:!bg-inputhover !cursor-pointer rounded-lg group-data-[focus-within=true]:!bg-inputhover',
                ),
                input: ['!text-content cursor-pointer'],
              }}
              onChange={e => handleBackgroundSave(e, setUserSettings)}
            />
            <div className='flex justify-end'>
              <Button
                size='sm'
                variant='light'
                radius='full'
                color='danger'
                onPress={() => handleBackgroundDelete(setUserSettings)}
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
            onValueChange={value => handleThemeChange(value, setTheme)}
          >
            <div className='grid grid-cols-5 space-x-2 space-y-4'>
              {THEMES.map(theme => (
                <div
                  key={theme.key}
                  onClick={() => {
                    if (theme.isPro && !hasGamerFeature(proTier)) {
                      setProModalRequiredTier('casual')
                      setProModalOpen(true)
                    }
                  }}
                >
                  <Radio
                    value={theme.key}
                    isDisabled={theme.isPro && !isPro}
                    classNames={{ base: 'items-end gap-0' }}
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
                    </div>
                    <div className='flex items-center translate-y-0.5'>
                      <p className='text-altwhite'>{theme.label}</p>
                      {theme.isPro && !isPro && <ProBadge className='ml-2 scale-75' />}
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
