import type { ReactElement } from 'react'

import { cn, Select, SelectItem } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { TbBrush } from 'react-icons/tb'

interface Theme {
  key: string
  label: string
}

export default function ThemeSwitch(): ReactElement | null {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const themes: Theme[] = [
    // { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
    // { key: 'slate', label: 'Slate' },
  ]

  useEffect(() => {
    setTheme('dark')
    setMounted(true)
  }, [setTheme])

  if (!mounted) return null

  return (
    <Select
      aria-label='theme'
      disallowEmptySelection
      radius='none'
      startContent={<TbBrush />}
      items={themes}
      className='w-[250px]'
      classNames={{
        listbox: ['p-0'],
        value: ['text-sm !text-content'],
        trigger: cn('bg-input data-[hover=true]:!bg-inputhover', 'data-[open=true]:!bg-input duration-100 rounded-lg'),
        popoverContent: ['bg-input rounded-xl justify-start !text-content'],
      }}
      defaultSelectedKeys={[resolvedTheme ?? 'dark']}
      onSelectionChange={e => {
        const selectedTheme = e.currentKey
        localStorage.setItem('theme', selectedTheme ?? 'dark')
        setTheme(selectedTheme ?? 'dark')
      }}
    >
      {theme => (
        <SelectItem
          classNames={{
            base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
          }}
        >
          {theme.label}
        </SelectItem>
      )}
    </Select>
  )
}
