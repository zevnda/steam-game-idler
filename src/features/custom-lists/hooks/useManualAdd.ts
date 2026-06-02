import type { Game, InvokeCustomList } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUserStore } from '@/shared/stores'

export function useManualAdd(
  listName: string,
  setList: React.Dispatch<React.SetStateAction<Game[]>>,
) {
  const { t } = useTranslation()
  const userSummary = useUserStore(s => s.userSummary)
  const [appNameValue, setAppNameValue] = useState('')
  const [appIdValue, setAppIdValue] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const handleAdd = async (onClose: () => void) => {
    setIsLoading(true)
    try {
      const response = await invoke<InvokeCustomList>('add_game_to_custom_list', {
        steamId: userSummary?.steamId,
        game: { appid: Number(appIdValue), name: appNameValue },
        list: listName,
      })
      if (response.error) {
        toast.warning(response.error)
      } else {
        setList(response.list_data)
        setAppNameValue('')
        setAppIdValue(0)
        onClose()
      }
    } catch (error) {
      toast.danger(t('common.error'))
      await logEvent(`[Error] in (handleAdd): ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setAppNameValue(e.target.value || '')

  const handleIdChange = (e: number | React.ChangeEvent<HTMLInputElement>) => {
    const value = typeof e === 'number' ? e : Number(e.target.value)
    setAppIdValue(
      String(value).startsWith('0') ? Number(String(value).slice(1)) || 0 : Number(value) || 0,
    )
  }

  return {
    isLoading,
    appNameValue,
    appIdValue,
    setAppNameValue,
    setAppIdValue,
    handleNameChange,
    handleIdChange,
    handleAdd,
  }
}
