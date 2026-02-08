import type { InvokeUserSummary } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { decrypt } from '@/shared/utils'

export const fetchUserSummary = async (steamId: string, apiKey: string | null) => {
  const res = await invoke<InvokeUserSummary>('get_user_summary', {
    steamId,
    apiKey: apiKey ? decrypt(apiKey) : null,
  })
  return {
    steamId: res.response.players[0]?.steamid,
    personaName: res.response.players[0]?.personaname,
    avatar: res.response.players[0]?.avatar.replace('.jpg', '_full.jpg'),
  }
}
