import type { InvokeSettings, UserSettings, UserSummary } from '@/shared/types'
import { invokeSafe } from '@/shared/utils'

export const handleSellOptionChange = async (
  key: string,
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void,
) => {
  const updateResponse = await invokeSafe<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'tradingCards.sellOptions',
    value: key,
  })

  if (updateResponse) {
    setUserSettings(updateResponse.settings)
  }
}

export const handlePriceAdjustmentChange = async (
  value: number,
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void,
  setPriceAdjustment: React.Dispatch<React.SetStateAction<number>>,
) => {
  setPriceAdjustment(value)
  const updateResponse = await invokeSafe<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'tradingCards.priceAdjustment',
    value,
  })

  if (updateResponse) {
    setUserSettings(updateResponse.settings)
  }
}

export const handleSellLimitMinChange = async (
  value: number,
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void,
  sellLimitMax: number,
  setSellLimitMin: React.Dispatch<React.SetStateAction<number>>,
) => {
  setSellLimitMin(value)
  const updateResponse = await invokeSafe<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'tradingCards.sellLimit',
    value: {
      min: value,
      max: sellLimitMax,
    },
  })

  if (updateResponse) {
    setUserSettings(updateResponse.settings)
  }
}

export const handleSellLimitMaxChange = async (
  value: number,
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void,
  sellLimitMin: number,
  setSellLimitMax: React.Dispatch<React.SetStateAction<number>>,
) => {
  setSellLimitMax(value)
  const updateResponse = await invokeSafe<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'tradingCards.sellLimit',
    value: {
      min: sellLimitMin,
      max: value,
    },
  })

  if (updateResponse) {
    setUserSettings(updateResponse.settings)
  }
}

export const handleSellDelayChange = async (
  value: number,
  userSummary: UserSummary,
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void,
  setSellDelay: React.Dispatch<React.SetStateAction<number>>,
) => {
  setSellDelay(value)
  const updateResponse = await invokeSafe<InvokeSettings>('update_user_settings', {
    steamId: userSummary?.steamId,
    key: 'tradingCards.sellDelay',
    value,
  })

  if (updateResponse) {
    setUserSettings(updateResponse.settings)
  }
}
