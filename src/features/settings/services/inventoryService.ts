import type { InvokeSettings, UserSettings, UserSummary } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'

export async function handleSellOptionChange(
  key: string,
  userSummary: UserSummary,
  setUserSettings: (v: UserSettings | ((p: UserSettings) => UserSettings)) => void,
) {
  const res = await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'tradingCards.sellOptions',
    value: key,
  })
  setUserSettings(res.settings)
}

export async function handlePriceAdjustmentChange(
  value: number,
  userSummary: UserSummary,
  setUserSettings: (v: UserSettings | ((p: UserSettings) => UserSettings)) => void,
  setPriceAdjustment: React.Dispatch<React.SetStateAction<number>>,
) {
  setPriceAdjustment(value)
  const res = await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'tradingCards.priceAdjustment',
    value,
  })
  setUserSettings(res.settings)
}

export async function handleSellLimitMinChange(
  value: number,
  userSummary: UserSummary,
  setUserSettings: (v: UserSettings | ((p: UserSettings) => UserSettings)) => void,
  sellLimitMax: number,
  setSellLimitMin: React.Dispatch<React.SetStateAction<number>>,
) {
  setSellLimitMin(value)
  const res = await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'tradingCards.sellLimit',
    value: { min: value, max: sellLimitMax },
  })
  setUserSettings(res.settings)
}

export async function handleSellLimitMaxChange(
  value: number,
  userSummary: UserSummary,
  setUserSettings: (v: UserSettings | ((p: UserSettings) => UserSettings)) => void,
  sellLimitMin: number,
  setSellLimitMax: React.Dispatch<React.SetStateAction<number>>,
) {
  setSellLimitMax(value)
  const res = await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'tradingCards.sellLimit',
    value: { min: sellLimitMin, max: value },
  })
  setUserSettings(res.settings)
}

export async function handleSellDelayChange(
  value: number,
  userSummary: UserSummary,
  setUserSettings: (v: UserSettings | ((p: UserSettings) => UserSettings)) => void,
  setSellDelay: React.Dispatch<React.SetStateAction<number>>,
) {
  setSellDelay(value)
  const res = await invoke<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'tradingCards.sellDelay',
    value,
  })
  setUserSettings(res.settings)
}
