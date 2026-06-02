import { useTranslation } from 'react-i18next'
import { Divider } from '@heroui/react'
import { Keybind } from '@/shared/components/Key'

function KeybindRow({
  label,
  keys,
  altKeys,
}: {
  label: string
  keys: string[]
  altKeys?: string[]
}) {
  return (
    <div className='flex items-center justify-between py-1'>
      <p className='text-sm text-content'>{label}</p>
      <div className='flex flex-col items-end gap-1'>
        <Keybind keys={keys} />
        {altKeys && <Keybind keys={altKeys} />}
      </div>
    </div>
  )
}

export function KeybindsSettings() {
  const { t } = useTranslation()
  return (
    <div className='relative flex flex-col gap-4 pb-16 w-4/5'>
      <div className='flex flex-col gap-0 select-none mb-3'>
        <p className='text-[10px] uppercase tracking-widest text-altwhite/40 font-black mb-1'>
          {t('settings.title')}
        </p>
        <p className='text-2xl font-black'>{t('settings.keybinds.title')}</p>
      </div>
      <div className='flex flex-col gap-3 mt-4'>
        <p className='text-xs text-altwhite font-bold uppercase tracking-widest'>
          {t('settings.keybinds.zoom')}
        </p>
        <KeybindRow
          label={t('settings.keybinds.zoomIn')}
          keys={['Ctrl', '+']}
          altKeys={['Ctrl', 'Scroll ↑']}
        />
        <Divider className='bg-border/15' />
        <KeybindRow
          label={t('settings.keybinds.zoomOut')}
          keys={['Ctrl', '-']}
          altKeys={['Ctrl', 'Scroll ↓']}
        />
        <Divider className='bg-border/15' />
        <KeybindRow label={t('settings.keybinds.resetZoom')} keys={['Ctrl', '0']} />
      </div>
      <div className='flex flex-col gap-3 mt-4'>
        <p className='text-xs text-altwhite font-bold uppercase tracking-widest'>
          {t('settings.keybinds.navigation')}
        </p>
        <KeybindRow label={t('settings.keybinds.nextTab')} keys={['Ctrl', ']']} />
        <Divider className='bg-border/15' />
        <KeybindRow label={t('settings.keybinds.prevTab')} keys={['Ctrl', '[']} />
        <Divider className='bg-border/15' />
        <KeybindRow label={t('settings.keybinds.openSearch')} keys={['/']} />
        <Divider className='bg-border/15' />
        <KeybindRow label={t('settings.keybinds.openSettings')} keys={['Ctrl', ',']} />
        <Divider className='bg-border/15' />
        <KeybindRow label={t('settings.keybinds.toggleSidebar')} keys={['Ctrl', 'W']} />
        <Divider className='bg-border/15' />
        <KeybindRow label={t('settings.keybinds.openHelpDesk')} keys={['Ctrl', 'Shift', 'H']} />
      </div>
    </div>
  )
}
