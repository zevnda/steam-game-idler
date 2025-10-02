import type { ReactElement } from 'react'

import { cn, Select, SelectItem } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbLanguage } from 'react-icons/tb'

export default function LanguageSwitch(): ReactElement | null {
  const { i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  const languages = [
    { key: 'bg-BG', label: 'Български' },
    { key: 'zh-CN', label: '简体中文' },
    { key: 'zh-TW', label: '繁體中文' },
    { key: 'ja-JP', label: '日本語' },
    { key: 'cs-CZ', label: 'Čeština' },
    { key: 'da-DK', label: 'Dansk' },
    { key: 'de-DE', label: 'Deutsch' },
    { key: 'el-GR', label: 'Ελληνικά' },
    { key: 'en-US', label: 'English' },
    { key: 'es-ES', label: 'Español' },
    { key: 'fi-FI', label: 'Suomi' },
    { key: 'fr-FR', label: 'Français' },
    { key: 'he-IL', label: 'עברית' },
    { key: 'hi-IN', label: 'हिन्दी' },
    { key: 'hu-HU', label: 'Magyar' },
    { key: 'id-ID', label: 'Bahasa Indonesia' },
    { key: 'it-IT', label: 'Italiano' },
    { key: 'ko-KR', label: '한국어' },
    { key: 'nl-NL', label: 'Nederlands' },
    { key: 'no-NO', label: 'Norsk' },
    { key: 'pl-PL', label: 'Polski' },
    { key: 'pt-BR', label: 'Português (Brazil)' },
    { key: 'pt-PT', label: 'Português (Portugal)' },
    { key: 'ro-RO', label: 'Română' },
    { key: 'ru-RU', label: 'Русский' },
    { key: 'sv-SE', label: 'Svenska' },
    { key: 'th-TH', label: 'ไทย' },
    { key: 'tr-TR', label: 'Türkçe' },
    { key: 'uk-UA', label: 'Українська' },
    { key: 'vi-VN', label: 'Tiếng Việt' },
  ]

  useEffect(() => {
    setMounted(true)
  }, [i18n])

  if (!mounted) return null

  const currentLanguage = languages.find(lang => lang.key === i18n.language) ? i18n.language : 'en-US'

  return (
    <Select
      aria-label='language'
      disallowEmptySelection
      radius='none'
      startContent={<TbLanguage />}
      items={languages}
      className='w-[250px]'
      classNames={{
        listbox: ['p-0'],
        value: ['text-sm !text-content'],
        trigger: cn('bg-input data-[hover=true]:!bg-inputhover', 'data-[open=true]:!bg-input duration-100 rounded-lg'),
        popoverContent: ['bg-input rounded-xl justify-start !text-content'],
      }}
      defaultSelectedKeys={[currentLanguage]}
      onSelectionChange={e => {
        const selectedLanguage = e.currentKey
        i18n.changeLanguage(selectedLanguage)
      }}
    >
      {language => (
        <SelectItem
          classNames={{
            base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
          }}
        >
          {language.label}
        </SelectItem>
      )}
    </Select>
  )
}
