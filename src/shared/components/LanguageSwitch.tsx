import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbLanguage } from 'react-icons/tb'
import { cn, Select, SelectItem } from '@heroui/react'

const LANGUAGES = [
  { key: 'de-DE', label: 'Deutsch' },
  { key: 'en-US', label: 'English' },
  { key: 'es-ES', label: 'Español' },
  { key: 'fr-FR', label: 'Français' },
  { key: 'id-ID', label: 'Bahasa Indonesia' },
  { key: 'it-IT', label: 'Italiano' },
  { key: 'mk-MK', label: 'Македонски' },
  { key: 'pl-PL', label: 'Polski' },
  { key: 'pt-BR', label: 'Português (Brazil)' },
  { key: 'ro-RO', label: 'Română' },
  { key: 'ru-RU', label: 'Русский' },
  { key: 'tr-TR', label: 'Türkçe' },
  { key: 'uk-UA', label: 'Українська' },
  { key: 'zh-CN', label: '简体中文' },
]

export function LanguageSwitch({
  className,
  classNames,
}: {
  className?: string
  classNames?: Record<string, string[]>
}) {
  const { i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [i18n])
  if (!mounted) return null

  const current = LANGUAGES.find(l => l.key === i18n.language) ? i18n.language : 'en-US'

  return (
    <Select
      aria-label='language'
      disallowEmptySelection
      radius='none'
      startContent={<TbLanguage />}
      items={LANGUAGES}
      className={cn('w-62.5', className)}
      classNames={{
        listbox: 'p-0',
        value: 'text-sm !text-content',
        trigger:
          'bg-input data-[hover=true]:!bg-inputhover data-[open=true]:!bg-input duration-100 rounded-lg',
        popoverContent: 'bg-input rounded-xl justify-start !text-content',
        ...classNames,
      }}
      defaultSelectedKeys={[current]}
      onSelectionChange={e => {
        i18n.changeLanguage(e.currentKey)
      }}
    >
      {lang => (
        <SelectItem
          classNames={{
            base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
          }}
        >
          {lang.label}
        </SelectItem>
      )}
    </Select>
  )
}
