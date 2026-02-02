import type { InvokeUsers, InvokeUserSummary, UserSummary } from '@/shared/types'
import { useSettings, useUserStore } from '@/shared/stores'
import { invoke } from '@tauri-apps/api/core'
import { decrypt, logEvent } from '@/shared/utils'

const processUserSummaries = (response: InvokeUserSummary, steamUsersData: UserSummary[]) => {
  const players = response.response.players || []

  return steamUsersData.flatMap(userData => {
    const player = players.find(p => p.steamid === userData?.steamId)

    if (player) {
      return {
        steamId: player.steamid,
        personaName: player.personaname,
        avatar: player.avatar.replace('.jpg', '_full.jpg'),
        mostRecent: userData?.mostRecent ?? 0,
      }
    }

    // Don't include users without proper data
    return []
  })
}

const fetchUncachedUsers = async (apiKey: string | null, uncachedUsers: UserSummary[]) => {
  const steamIds = uncachedUsers.map(user => user?.steamId).join(',')
  const userSummaryResponse = await invoke<InvokeUserSummary>('get_user_summary', {
    steamId: steamIds,
    apiKey: apiKey ? decrypt(apiKey) : null,
  })

  const freshUsers = processUserSummaries(userSummaryResponse, uncachedUsers)
  return freshUsers
}

export const getSteamUsers = async () => {
  try {
    const response = await invoke<InvokeUsers>('get_users')
    const { userSettings } = useSettings.getState()

    if (response?.users?.length > 0) {
      const { apiKey } = userSettings.general
      const validUsers = response.users.filter(user => user?.steamId)

      if (validUsers.length > 0) {
        // Check for cached user summaries first
        const cachedUserSummaries = await invoke<InvokeUserSummary[]>('get_user_summary_cache')

        const steamUsers: UserSummary[] = []
        const uncachedUsers: UserSummary[] = []

        // Process each user - use cache if available, otherwise collect for API call
        for (const user of validUsers) {
          const cachedUserSummary = cachedUserSummaries.find(
            summary => summary?.response?.players?.[0].steamid === user.steamId,
          )

          if (cachedUserSummary) {
            const player = cachedUserSummary.response.players[0]
            steamUsers.push({
              steamId: player.steamid,
              personaName: player.personaname,
              avatar: player.avatar.replace('.jpg', '_full.jpg'),
              mostRecent: user?.mostRecent ?? 0,
            })
          } else {
            // User not in cache, collect for API fetch
            uncachedUsers.push(user)
          }
        }

        // Fetch uncached users from Steam API
        if (uncachedUsers.length > 0) {
          const freshUsers = await fetchUncachedUsers(apiKey, uncachedUsers)
          steamUsers.push(...freshUsers)
        }

        // Sort users by last logged in to Steam client - most recent first
        steamUsers.sort((b, a) => (a?.mostRecent ?? 0) - (b?.mostRecent ?? 0))

        // Update the global store with the fetched and processed users
        useUserStore.getState().setSteamUsers(steamUsers)
      }
    }
  } catch (error) {
    useUserStore.getState().setSteamUsers([])
    console.error('[Error] in (getSteamUsers):', error)
    logEvent(`[Error] in (getSteamUsers): ${error}`)
  }
}
