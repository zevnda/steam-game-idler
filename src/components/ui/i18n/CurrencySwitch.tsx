import type { ReactElement } from 'react'

import { Select, SelectItem } from '@heroui/react'
import { useEffect, useState } from 'react'
import { TbCurrencyDollar } from 'react-icons/tb'

export default function CurrencySwitch(): ReactElement | null {
  const [mounted, setMounted] = useState(false)
  const [currentCurrency, setCurrentCurrency] = useState(localStorage.getItem('currency') || '1')

  const currencies = [
    { key: '32', label: 'AED' },
    { key: '34', label: 'ARS' },
    { key: '21', label: 'AUD' },
    { key: '42', label: 'BGN' },
    { key: '7', label: 'BRL' },
    { key: '36', label: 'BYN' },
    { key: '20', label: 'CAD' },
    { key: '4', label: 'CHF' },
    { key: '25', label: 'CLP' },
    { key: '23', label: 'CNY' },
    { key: '27', label: 'COP' },
    { key: '40', label: 'CRC' },
    { key: '44', label: 'CZK' },
    { key: '45', label: 'DKK' },
    { key: '3', label: 'EUR' },
    { key: '2', label: 'GBP' },
    { key: '29', label: 'HKD' },
    { key: '43', label: 'HRK' },
    { key: '46', label: 'HUF' },
    { key: '10', label: 'IDR' },
    { key: '35', label: 'ILS' },
    { key: '24', label: 'INR' },
    { key: '8', label: 'JPY' },
    { key: '16', label: 'KRW' },
    { key: '38', label: 'KWD' },
    { key: '37', label: 'KZT' },
    { key: '19', label: 'MXN' },
    { key: '11', label: 'MYR' },
    { key: '9', label: 'NOK' },
    { key: '9001', label: 'NXP' },
    { key: '22', label: 'NZD' },
    { key: '26', label: 'PEN' },
    { key: '12', label: 'PHP' },
    { key: '6', label: 'PLN' },
    { key: '39', label: 'QAR' },
    { key: '9000', label: 'RMB' },
    { key: '47', label: 'RON' },
    { key: '5', label: 'RUB' },
    { key: '31', label: 'SAR' },
    { key: '33', label: 'SEK' },
    { key: '13', label: 'SGD' },
    { key: '14', label: 'THB' },
    { key: '17', label: 'TRY' },
    { key: '30', label: 'TWD' },
    { key: '18', label: 'UAH' },
    { key: '1', label: 'USD' },
    { key: '41', label: 'UYU' },
    { key: '15', label: 'VND' },
    { key: '28', label: 'ZAR' },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Select
      size='sm'
      aria-label='language'
      disallowEmptySelection
      radius='none'
      startContent={<TbCurrencyDollar />}
      items={currencies}
      classNames={{
        listbox: ['p-0'],
        value: ['text-sm !text-content'],
        trigger: [
          'bg-input border border-border duration-100 rounded-lg',
          'data-[hover=true]:!bg-inputhover data-[open=true]:!bg-inputhover',
        ],
        popoverContent: ['bg-titlebar border border-border rounded-lg justify-start !text-content'],
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
            base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'],
          }}
        >
          {currency.label}
        </SelectItem>
      )}
    </Select>
  )
}
