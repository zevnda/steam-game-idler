import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronRight } from 'react-icons/tb'
import { Keybind } from '@/shared/components'

interface KeybindRowProps {
  label: string
  keys: string[]
  altKeys?: string[]
}

const KeybindRow = ({ label, keys, altKeys }: KeybindRowProps) => (
  <div className='flex items-center justify-between px-4 py-3.5 bg-input/30 border-b border-border last:border-b-0'>
    <p className='text-sm text-content'>{label}</p>
    <div className='flex flex-col items-end gap-1.5'>
      <Keybind keys={keys} />
      {altKeys && <Keybind keys={altKeys} />}
    </div>
  </div>
)

interface KeybindSectionProps {
  title: string
  description?: string
  children: ReactNode
}

const KeybindSection = ({ title, description, children }: KeybindSectionProps) => (
  <div className='flex flex-col gap-3'>
    <div>
      <p className='text-sm font-bold text-content'>{title}</p>
      {description && <p className='text-xs text-altwhite mt-0.5'>{description}</p>}
    </div>
    <div className='rounded-lg overflow-hidden border border-border'>{children}</div>
  </div>
)

export const KeybindsSettings = () => {
  const { t } = useTranslation()

  return (
    <div className='relative flex flex-col gap-4 mt-9 pb-16 w-4/5'>
      <div className='flex flex-col gap-0 select-none'>
        <p className='flex items-center text-xs text-altwhite font-bold'>
          {t('settings.title')}
          <span>
            <TbChevronRight size={12} />
          </span>
        </p>
        <p className='text-3xl font-black'>{t('settings.keybinds.title')}</p>
      </div>

      <div className='flex flex-col gap-6 mt-4'>
        <KeybindSection title={t('settings.keybinds.zoom')}>
          <KeybindRow
            label={t('settings.keybinds.zoomIn')}
            keys={['Ctrl', '+']}
            altKeys={['Ctrl', 'Scroll ↑']}
          />
          <KeybindRow
            label={t('settings.keybinds.zoomOut')}
            keys={['Ctrl', '-']}
            altKeys={['Ctrl', 'Scroll ↓']}
          />
          <KeybindRow label={t('settings.keybinds.resetZoom')} keys={['Ctrl', '0']} />
        </KeybindSection>

        <KeybindSection title={t('settings.keybinds.navigation')}>
          <KeybindRow label={t('settings.keybinds.nextTab')} keys={['Ctrl', ']']} />
          <KeybindRow label={t('settings.keybinds.prevTab')} keys={['Ctrl', '[']} />
          <KeybindRow label={t('settings.keybinds.openSearch')} keys={['/']} />
          <KeybindRow label={t('settings.keybinds.openSettings')} keys={['Ctrl', ',']} />
          <KeybindRow label={t('settings.keybinds.toggleSidebar')} keys={['Ctrl', 'W']} />
          <KeybindRow label={t('settings.keybinds.openHelpDesk')} keys={['Ctrl', 'Shift', 'H']} />
        </KeybindSection>
      </div>
    </div>
  )
}
