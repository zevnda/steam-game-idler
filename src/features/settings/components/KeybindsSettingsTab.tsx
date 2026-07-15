import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, Typography } from '@heroui/react'
import { Keybind } from '@/shared/components/Keybind'

interface KeybindSectionProps {
  title: string
  children: ReactNode
}

const KeybindSection = ({ title, children }: KeybindSectionProps) => (
  <div className='flex flex-col gap-2'>
    <Typography color='muted' type='body-xs' weight='semibold'>
      {title}
    </Typography>
    <div className='divide-y divide-border overflow-hidden rounded-lg border border-border'>
      {children}
    </div>
  </div>
)

interface KeybindRowProps {
  label: string
  keys: string[]
  altKeys?: string[]
}

const KeybindRow = ({ label, keys, altKeys }: KeybindRowProps) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 px-4 py-3',
      'odd:bg-field/40 transition-colors hover:bg-field-hover',
    )}
  >
    <Typography type='body-sm'>{label}</Typography>
    <div className='flex flex-col items-end gap-1.5'>
      <Keybind keys={keys} />
      {altKeys && <Keybind keys={altKeys} />}
    </div>
  </div>
)

// Every shortcut this rewrite actually implements - see `useZoomControls.ts` (mounted at the app
// root) and `useDashboardShortcuts.ts` (mounted in DashboardShell) for the real listeners this list
// documents. Read-only reference, not a remapping UI - matches `main`'s own `KeybindsSettings.tsx`,
// which is display-only too (no hotkey library on either side supports rebinding). `main`'s 9th
// shortcut, Ctrl+Shift+H (a Chatway help-desk widget toggle), is deliberately not listed - that
// widget is a `main`-only third-party embed with no equivalent here.
//
// Rows render as a bordered, alternating-shade table (`divide-y` + odd-row tint) rather than
// reusing `SettingsRow` (the divider-per-editable-row shell every other tab uses) - this list has
// no controls to edit, so it reads better as a dense reference table (closer to `main`'s own
// per-row-background KeybindsSettings.tsx) than as a stack of settings rows with nothing to act on.
export const KeybindsSettingsTab = () => {
  const { t } = useTranslation()

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-5'>
      <Typography type='h3' className='font-bold mb-4'>
        {t('dashboard.settings.keybinds.title')}
      </Typography>

      <div className='flex flex-col gap-5'>
        <KeybindSection title={t('dashboard.settings.keybinds.zoom')}>
          <KeybindRow
            altKeys={['Ctrl', t('dashboard.settings.keybinds.scrollUp')]}
            keys={['Ctrl', '+']}
            label={t('dashboard.settings.keybinds.zoomIn')}
          />
          <KeybindRow
            altKeys={['Ctrl', t('dashboard.settings.keybinds.scrollDown')]}
            keys={['Ctrl', '-']}
            label={t('dashboard.settings.keybinds.zoomOut')}
          />
          <KeybindRow keys={['Ctrl', '0']} label={t('dashboard.settings.keybinds.resetZoom')} />
        </KeybindSection>

        <KeybindSection title={t('dashboard.settings.keybinds.navigation')}>
          <KeybindRow keys={['Ctrl', ']']} label={t('dashboard.settings.keybinds.nextPage')} />
          <KeybindRow keys={['Ctrl', '[']} label={t('dashboard.settings.keybinds.prevPage')} />
          <KeybindRow keys={['/']} label={t('dashboard.settings.keybinds.openSearch')} />
          <KeybindRow
            keys={['Ctrl', ',']}
            label={t('dashboard.settings.keybinds.toggleSettings')}
          />
          <KeybindRow keys={['Ctrl', 'W']} label={t('dashboard.settings.keybinds.toggleSidebar')} />
        </KeybindSection>
      </div>
    </div>
  )
}
