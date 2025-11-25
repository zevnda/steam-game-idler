import type { ReactElement } from 'react'

import { Divider, Radio, RadioGroup } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { TbChevronRight } from 'react-icons/tb'

interface Theme {
  key: string
  label: string
}

export default function CustomizationSettings(): ReactElement | null {
  const { t } = useTranslation()
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const themes: Theme[] = [
    { key: 'dark', label: 'Default' },
    { key: 'dark-alt1', label: 'Dark Alt 1' },
    { key: 'dark-alt2', label: 'Dark Alt 2' },
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
        <p className='text-3xl font-black'>{t('common.customization')}</p>
      </div>

      <div className='flex flex-col gap-3 mt-4'>
        <div className='flex flex-col justify-between gap-6'>
          <div className='flex flex-col gap-2 w-1/2'>
            <p className='text-sm text-content font-bold'>{t('settings.customization.theme')}</p>
            <p className='text-xs text-altwhite'>{t('settings.customization.theme.description')}</p>
          </div>

          <RadioGroup
            orientation='horizontal'
            classNames={{ wrapper: 'items-end gap-6' }}
            defaultValue={resolvedTheme}
            onValueChange={value => {
              const selectedTheme = value
              localStorage.setItem('theme', selectedTheme ?? 'dark')
              setTheme(selectedTheme ?? 'dark')
            }}
          >
            {themes.map(theme => (
              <div key={theme.key} className='flex flex-col gap-2'>
                <Image
                  src='/themes/default.png'
                  alt={theme.label}
                  width={150}
                  height={45}
                  className='rounded-lg border border-border object-cover'
                />
                <Radio value={theme.key}>
                  <p className='text-altwhite'>{theme.label}</p>
                </Radio>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Divider className='bg-border/70 my-4' />
      </div>
    </div>
  )
}
