import type { InvokeUsers, InvokeUserSummary, UserSummary } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserStore } from '@/shared/stores'
import { showAccountMismatchToast, showDangerToast } from '@/shared/ui'
import { checkSteamStatus, decrypt, logEvent } from '@/shared/utils'

export function useSignIn(refreshKey: number) {
  const { t } = useTranslation()
  const userSettings = useUserStore(state => state.userSettings)
  const setUserSummary = useUserStore(state => state.setUserSummary)
  const [isLoading, setIsLoading] = useState(true)
  const [steamUsers, setSteamUsers] = useState<UserSummary[]>([])
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null)

  // Process user summary data from API response
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

  useEffect(() => {
    // Get all steam users
    const getSteamUsers = async () => {
      setIsLoading(true)

      // Simulate loading time for better UX
      // await new Promise(resolve => setTimeout(resolve, 1000))

      try {
        const response = await invoke<InvokeUsers>('get_users')

        if (response.users && response.users.length > 0) {
          const apiKey = userSettings.general?.apiKey
          const validUsers = response.users.filter(user => user?.steamId)

          if (validUsers.length === 0) {
            setSteamUsers([])
            setUserSummaries([])
            setIsLoading(false)
            return
          }

          try {
            // Check for cached user summaries first
            const cachedUserSummaries = await invoke<InvokeUserSummary[]>('get_user_summary_cache')

            const steamUsers: UserSummary[] = []
            const uncachedUsers: UserSummary[] = []

            // Process each user - use cache if available, otherwise collect for API call
            validUsers.forEach(user => {
              const cachedUserSummary = cachedUserSummaries.find(
                (summary: InvokeUserSummary) =>
                  summary?.response?.players?.[0]?.steamid === String(user?.steamId),
              )

              if (cachedUserSummary) {
                // Use cached data
                const player = cachedUserSummary.response.players[0]
                steamUsers.push({
                  steamId: player.steamid,
                  personaName: player.personaname,
                  avatar: player.avatar.replace('.jpg', '_full.jpg'),
                  mostRecent: user?.mostRecent ?? 0,
                })
              } else {
                // Collect for API call
                uncachedUsers.push(user)
              }
            })

            // If there are uncached users, make API call for them
            if (uncachedUsers.length > 0) {
              const steamIds = uncachedUsers.map(user => String(user?.steamId)).join(',')
              const userSummaryResponse = await invoke<InvokeUserSummary>('get_user_summary', {
                steamId: steamIds,
                apiKey: apiKey ? decrypt(apiKey) : null,
              })

              const freshUsers = processUserSummaries(userSummaryResponse, uncachedUsers)
              steamUsers.push(...freshUsers)
            }

            // Sort users by last logged in to Steam client - most recent first
            steamUsers.sort((b, a) => (a?.mostRecent ?? 0) - (b?.mostRecent ?? 0))

            setSteamUsers(steamUsers)
            setUserSummaries(steamUsers)
            setIsLoading(false)
          } catch (error) {
            console.error('Error fetching user summaries:', error)

            // Fallback: create basic user summaries without API data
            const steamUsers = validUsers.map(user => ({
              steamId: String(user?.steamId),
              personaName: user?.personaName || 'Unknown User',
              avatar: '',
              mostRecent: user?.mostRecent ?? 0,
            }))

            steamUsers.sort((b, a) => (a?.mostRecent ?? 0) - (b?.mostRecent ?? 0))
            setSteamUsers(steamUsers)
            setUserSummaries(steamUsers)
            setIsLoading(false)
          }
        } else {
          setSteamUsers([])
          setUserSummaries([])
        }
      } catch (error) {
        console.error('Error in getSteamUsers:', error)
        setSteamUsers([])
        setUserSummaries([])
      } finally {
        setIsLoading(false)
      }
    }
    getSteamUsers()
  }, [userSettings.general?.apiKey, refreshKey])

  const handleLogin = async (index: number) => {
    try {
      // Make sure Steam is running
      const isSteamRunning = await checkSteamStatus(true)

      const devAccounts = ['76561198158912649', '76561198999797359']
      const isDev = await invoke('is_dev')

      if (!isSteamRunning && !isDev && !devAccounts.includes(userSummaries[index]?.steamId ?? ''))
        return

      setIsLoading(true)
      const userSummary = userSummaries[index]

      // mostRecent !== 1 means this isn't the account that's currently logged in to Steam
      // so show a warning to the user when they log in
      if (userSummaries[index]?.mostRecent !== 1) showAccountMismatchToast('warning')

      // Save selected user to localStorage and context for app-wide access
      localStorage.setItem('userSummary', JSON.stringify(userSummary))

      setUserSummary(userSummary)
      setIsLoading(false)
      logEvent(`[System] Logged in as ${userSummary?.personaName}`)
    } catch (error) {
      setIsLoading(false)
      showDangerToast(t('common.error'))
      console.error('Error in (handleLogin):', error)
      logEvent(`[Error] in (handleLogin): ${error}`)
    }
  }

  const getRandomAvatarUrl = () => {
    const randomSeed = Math.random().toString(36).substring(7)
    const avatarUrl = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${randomSeed}`
    return avatarUrl
  }

  return {
    isLoading,
    userSummaries,
    handleLogin,
    steamUsers,
    selectedUser,
    setSelectedUser,
    getRandomAvatarUrl,
  }
}
