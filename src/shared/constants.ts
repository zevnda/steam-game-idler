export const CDN_BASE_URL = 'https://pub-ca47df86597c4ccbb6ddf4366ca7f733.r2.dev'

// Steam currency ID -> ISO 4217 code
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

// Steam currency IDs with no minor unit. IDR is intentionally excluded: despite being
// used colloquially without decimals, Steam stores it in hundredths like USD/EUR.
// Must stay in sync with `is_zero_decimal_currency` in src-tauri/src/trading_cards.rs
export const ZERO_DECIMAL_CURRENCY_IDS = new Set(['8', '15', '16', '25'])
