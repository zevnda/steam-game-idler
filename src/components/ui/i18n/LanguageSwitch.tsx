import type { ReactElement } from 'react'

import { cn, Select, SelectItem } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbLanguage } from 'react-icons/tb'

export default function LanguageSwitch({
  className,
  classNames,
}: {
  className?: string
  classNames?: Record<string, string[]>
}): ReactElement | null {
  const { i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  const languages = [
    { key: 'en-US', label: 'English' },
    { key: 'ru-RU', label: 'Русский' },
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
      className={cn('w-[250px]', className)}
      classNames={{
        listbox: 'p-0',
        value: 'text-sm !text-content',
        trigger: 'bg-input data-[hover=true]:!bg-inputhover data-[open=true]:!bg-input duration-100 rounded-lg',
        popoverContent: 'bg-input rounded-xl justify-start !text-content',
        ...classNames,
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
