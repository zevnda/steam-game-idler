import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, ListBox, Select } from '@heroui/react'
import { openExternalLink } from '@/shared/utils/links'

// Locale code -> native display name, ported from `main`'s `LanguageSwitch.tsx`. Must stay in sync
// with `.github/crowdin.yml`'s locale set and `src/i18n/index.ts`'s `resources` map - Crowdin only
// ever syncs the locales this list offers. Every locale but `en-US`/`zh-CN` starts as an empty `{}`
// translation file (see `src/i18n/index.ts`'s doc comment) and has no real translators yet, so
// they're shown dimmed/non-selectable below rather than selectable-but-empty.
const LANGUAGES = [
  { id: 'en-US', label: 'English' },
  { id: 'fr-FR', label: 'Français' },
  { id: 'it-IT', label: 'Italiano' },
  { id: 'pt-BR', label: 'Português (Brazil)' },
  { id: 'ru-RU', label: 'Русский' },
  { id: 'sl-SI', label: 'Slovenščina' },
  { id: 'tr-TR', label: 'Türkçe' },
  { id: 'zh-CN', label: '简体中文' },
] as const

// Locales with a real, complete translation and thus selectable - everything else in LANGUAGES is
// shown dimmed and routes to TRANSLATION_HELP_URL instead of switching.
const ENABLED_LANGUAGES: ReadonlySet<string> = new Set(['en-US', 'zh-CN', 'it-IT'])

// Where a click on a not-yet-translated language goes instead of switching - the community
// translation discussion, so interested users can see how to help rather than landing on a
// half-English UI.
const TRANSLATION_HELP_URL = 'https://github.com/zevnda/steam-game-idler/discussions/148'

export const LanguageSwitch = () => {
  const { t, i18n } = useTranslation()
  // `output: 'export'` (next.config.ts) means this always server-renders as if no language were
  // detected yet - gating the real value behind a mount effect avoids a hydration mismatch against
  // whatever `i18next-browser-languagedetector` picks up client-side from localStorage/navigator,
  // matching main's own LanguageSwitch.tsx for the same reason.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const currentLanguage =
    LANGUAGES.some(lang => lang.id === i18n.language) && ENABLED_LANGUAGES.has(i18n.language)
      ? i18n.language
      : 'en-US'

  return (
    <Select.Root
      aria-label={t('dashboard.settings.general.language.label')}
      className='w-62.5'
      selectedKey={currentLanguage}
      onSelectionChange={key => {
        const id = String(key)
        // Not `disabledKeys` on the untranslated items below - react-aria's `disabledKeys` stops
        // `onSelectionChange` from firing at all for that key, which would break this intercept
        // (same reasoning as SteamCookiesConnectPanel.tsx's gated tab). Leaving `currentLanguage`
        // untouched for a not-yet-enabled id snaps the Select's displayed value back to the real
        // current language instead of showing a language that was never actually switched to.
        if (ENABLED_LANGUAGES.has(id)) {
          i18n.changeLanguage(id)
        } else {
          void openExternalLink(TRANSLATION_HELP_URL)
        }
      }}
    >
      <Select.Trigger className='border-none'>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox items={LANGUAGES}>
          {item => (
            <ListBox.Item
              className={cn(
                'w-full justify-between',
                !ENABLED_LANGUAGES.has(item.id) && 'opacity-40',
              )}
              id={item.id}
              textValue={item.label}
            >
              <span className='truncate'>{item.label}</span>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </Select.Popover>
    </Select.Root>
  )
}
