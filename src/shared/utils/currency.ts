import { STEAM_CURRENCY_ISO, ZERO_DECIMAL_CURRENCY_IDS } from '@/shared/constants'

export const getCurrentCurrencyId = () => {
  const stored = localStorage.getItem('currency')
  return stored && STEAM_CURRENCY_ISO[stored] ? stored : '1'
}

export const getCurrencyDecimalPlaces = (currencyId: string = getCurrentCurrencyId()) => {
  return ZERO_DECIMAL_CURRENCY_IDS.has(currencyId) ? 0 : 2
}

export const getCurrencyNumberFormatOptions = (currencyId?: string) => {
  const decimalPlaces = getCurrencyDecimalPlaces(currencyId)
  return {
    style: 'decimal' as const,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }
}

export const getCurrencyStep = (currencyId?: string) => {
  return getCurrencyDecimalPlaces(currencyId) === 0 ? 1 : 0.01
}

export const formatCurrency = (value: number, currencyId: string = getCurrentCurrencyId()) => {
  const iso = STEAM_CURRENCY_ISO[currencyId]
  if (!iso) return value.toFixed(2)
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: iso }).format(value)
  } catch {
    return value.toFixed(2)
  }
}

export const formatCurrencyNumber = (
  value: number,
  currencyId: string = getCurrentCurrencyId(),
) => {
  const decimalPlaces = getCurrencyDecimalPlaces(currencyId)
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value)
}
