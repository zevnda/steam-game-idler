// Steam currency ID -> ISO 4217 code, ported from `main`'s `src/shared/constants.ts` (that file
// no longer exists - constants/locales were stripped and rebuilt per-feature). Scoped to this
// feature rather than a new `src/shared/constants.ts` since nothing else needs a currency list yet.
export const STEAM_CURRENCY_ISO: Record<string, string> = {
  '1': 'USD',
  '2': 'GBP',
  '3': 'EUR',
  '4': 'CHF',
  '5': 'RUB',
  '6': 'PLN',
  '7': 'BRL',
  '8': 'JPY',
  '9': 'NOK',
  '10': 'IDR',
  '11': 'MYR',
  '12': 'PHP',
  '13': 'SGD',
  '14': 'THB',
  '15': 'VND',
  '16': 'KRW',
  '18': 'UAH',
  '19': 'MXN',
  '20': 'CAD',
  '21': 'AUD',
  '22': 'NZD',
  '23': 'CNY',
  '24': 'INR',
  '25': 'CLP',
  '26': 'PEN',
  '27': 'COP',
  '28': 'ZAR',
  '29': 'HKD',
  '30': 'TWD',
  '31': 'SAR',
  '32': 'AED',
  '35': 'ILS',
  '37': 'KZT',
  '38': 'KWD',
  '39': 'QAR',
  '40': 'CRC',
  '41': 'UYU',
}

// Currency IDs Steam stores with no minor unit - must stay in sync with `is_zero_decimal_currency`
// in src-tauri/src/inventory/market.rs (IDR is intentionally excluded there for the same reason).
const ZERO_DECIMAL_CURRENCY_IDS = new Set(['8', '15', '16', '25'])

// `{ id, label }` pairs for a currency picker, sorted by ISO code - mirrors `main`'s
// `CurrencySwitch.tsx` sort order.
export const CURRENCY_OPTIONS = Object.entries(STEAM_CURRENCY_ISO)
  .map(([id, label]) => ({ id, label }))
  .sort((a, b) => a.label.localeCompare(b.label))

export const getCurrencyDecimalPlaces = (currencyId: string) =>
  ZERO_DECIMAL_CURRENCY_IDS.has(currencyId) ? 0 : 2

export const getCurrencyStep = (currencyId: string) =>
  getCurrencyDecimalPlaces(currencyId) === 0 ? 1 : 0.01

// Plain-decimal formatting for editable price inputs (no currency symbol, just the right number
// of decimal places) - mirrors `main`'s `getCurrencyNumberFormatOptions`.
export const getCurrencyNumberFormatOptions = (currencyId: string) => {
  const decimalPlaces = getCurrencyDecimalPlaces(currencyId)
  return {
    style: 'decimal' as const,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }
}

// Symbol-bearing formatting for read-only price displays (the order-book table) - mirrors `main`'s
// `formatCurrency`. Falls back to a plain decimal string for a currency ID this map doesn't know
// about, rather than throwing.
export const formatCurrency = (value: number, currencyId: string) => {
  const iso = STEAM_CURRENCY_ISO[currencyId]
  if (!iso) return value.toFixed(2)
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: iso }).format(value)
  } catch {
    return value.toFixed(2)
  }
}
