import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { showAccountMismatchToast, showDangerToast } from '@/shared/components'
import { useUserStore } from '@/shared/stores'
import type { InvokeUserSummary, InvokeUsers, UserSummary } from '@/shared/types'
import { checkSteamStatus, decrypt, isTauriRuntime, logEvent } from '@/shared/utils'

export function useSignIn(refreshKey: number) {
  const { t } = useTranslation()
  const userSettings = useUserStore(state => state.userSettings)
  const setUserSummary = useUserStore(state => state.setUserSummary)
  const [isLoading, setIsLoading] = useState(true)
  const [steamUsers, setSteamUsers] = useState<UserSummary[]>([])
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null)

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

      return []
    })
  }

  useEffect(() => {
    const getSteamUsers = async () => {
      setIsLoading(true)

      try {
        if (!isTauriRuntime) {
          const response = await fetch('/api/steam-users')
          const contentType = response.headers.get('content-type') || ''
          if (!contentType.includes('application/json')) {
            throw new Error('Invalid API response format')
          }

          const responseData = (await response.json()) as InvokeUsers
          const fallbackUsers = (responseData.users || [])
            .filter(user => user?.steamId)
            .map(user => ({
              steamId: String(user?.steamId),
              personaName: user?.personaName || 'Unknown User',
              avatar: '',
              mostRecent: user?.mostRecent ?? 0,
            }))

          fallbackUsers.sort((b, a) => (a?.mostRecent ?? 0) - (b?.mostRecent ?? 0))
          setSteamUsers(fallbackUsers)
          setUserSummaries(fallbackUsers)
          setIsLoading(false)
          return
        }

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
            const cachedUserSummaries = await invoke<InvokeUserSummary[]>('get_user_summary_cache')

            const steamUsersResult: UserSummary[] = []
            const uncachedUsers: UserSummary[] = []

            validUsers.forEach(user => {
              const cachedUserSummary = cachedUserSummaries.find(
                (summary: InvokeUserSummary) =>
                  summary?.response?.players?.[0]?.steamid === String(user?.steamId),
              )

              if (cachedUserSummary) {
                const player = cachedUserSummary.response.players[0]
                steamUsersResult.push({
                  steamId: player.steamid,
                  personaName: player.personaname,
                  avatar: player.avatar.replace('.jpg', '_full.jpg'),
                  mostRecent: user?.mostRecent ?? 0,
                })
              } else {
                uncachedUsers.push(user)
              }
            })

            if (uncachedUsers.length > 0) {
              const steamIds = uncachedUsers.map(user => String(user?.steamId)).join(',')
              const userSummaryResponse = await invoke<InvokeUserSummary>('get_user_summary', {
                steamId: steamIds,
                apiKey: apiKey ? decrypt(apiKey) : null,
              })

              const freshUsers = processUserSummaries(userSummaryResponse, uncachedUsers)
              steamUsersResult.push(...freshUsers)
            }

            steamUsersResult.sort((b, a) => (a?.mostRecent ?? 0) - (b?.mostRecent ?? 0))

            setSteamUsers(steamUsersResult)
            setUserSummaries(steamUsersResult)
            setIsLoading(false)
          } catch (error) {
            console.error('Error fetching user summaries:', error)

            const steamUsersFallback = validUsers.map(user => ({
              steamId: String(user?.steamId),
              personaName: user?.personaName || 'Unknown User',
              avatar: '',
              mostRecent: user?.mostRecent ?? 0,
            }))

            steamUsersFallback.sort((b, a) => (a?.mostRecent ?? 0) - (b?.mostRecent ?? 0))
            setSteamUsers(steamUsersFallback)
            setUserSummaries(steamUsersFallback)
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
      const userSummary = userSummaries[index]
      if (!userSummary) return

      if (!isTauriRuntime) {
        localStorage.setItem('userSummary', JSON.stringify(userSummary))
        setUserSummary(userSummary)
        return
      }

      const isSteamRunning = await checkSteamStatus(true)

      const devAccounts = ['76561198158912649', '76561198999797359']
      const isDev = await invoke('is_dev')

      if (!isSteamRunning && !isDev && !devAccounts.includes(userSummary?.steamId ?? '')) return

      setIsLoading(true)

      if (userSummary?.mostRecent !== 1) showAccountMismatchToast('warning')

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
