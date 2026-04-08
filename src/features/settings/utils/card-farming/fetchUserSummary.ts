import type { InvokeUserSummary } from '@/shared/types'
import { decrypt, invokeSafe } from '@/shared/utils'

export const fetchUserSummary = async (steamId: string, apiKey: string | null) => {
  const res = await invokeSafe<InvokeUserSummary>('get_user_summary', {
    steamId,
    apiKey: apiKey ? decrypt(apiKey) : null,
  })

  const player = res?.response?.players?.[0]

  return {
    steamId: player?.steamid,
    personaName: player?.personaname,
    avatar: player?.avatar?.replace('.jpg', '_full.jpg'),
  }
}
