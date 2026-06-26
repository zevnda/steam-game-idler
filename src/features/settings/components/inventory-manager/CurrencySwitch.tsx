import { useEffect, useState } from 'react'
import { TbCurrencyDollar } from 'react-icons/tb'
import { cn, Select, SelectItem } from '@heroui/react'
import { STEAM_CURRENCY_ISO } from '@/shared/constants'
import { getCurrentCurrencyId } from '@/shared/utils'

const currencies = Object.entries(STEAM_CURRENCY_ISO)
  .map(([key, label]) => ({ key, label }))
  .sort((a, b) => a.label.localeCompare(b.label))

export const CurrencySwitch = () => {
  const [mounted, setMounted] = useState(false)
  const [currentCurrency, setCurrentCurrency] = useState(getCurrentCurrencyId())

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Select
      aria-label='language'
      disallowEmptySelection
      radius='none'
      startContent={<TbCurrencyDollar />}
      items={currencies}
      className='w-62.5'
      classNames={{
        listbox: ['p-0'],
        value: ['text-sm !text-content'],
        trigger: cn(
          'bg-input data-[hover=true]:!bg-inputhover',
          'data-[open=true]:!bg-input duration-100 rounded-lg',
        ),
        popoverContent: ['bg-input rounded-xl justify-start !text-content'],
      }}
      defaultSelectedKeys={[currentCurrency]}
      onSelectionChange={e => {
        const selectedCurrency = e.currentKey
        setCurrentCurrency(selectedCurrency || 'USD')
        localStorage.setItem('currency', selectedCurrency || 'USD')
      }}
    >
      {currency => (
        <SelectItem
          key={currency.key}
          classNames={{
            base: ['data-[hover=true]:!bg-item-hover data-[hover=true]:!text-content'],
          }}
        >
          {currency.label}
        </SelectItem>
      )}
    </Select>
  )
}
