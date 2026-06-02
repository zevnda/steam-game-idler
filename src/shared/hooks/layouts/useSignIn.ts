import type { InvokeUsers, InvokeUserSummary, UserSummary } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUserStore } from '@/shared/stores'
import { checkSteamStatus, decrypt } from '@/shared/utils'

export function useSignIn(refreshKey: number) {
  const { t } = useTranslation()
  const userSettings = useUserStore(s => s.userSettings)
  const setUserSummary = useUserStore(s => s.setUserSummary)
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  const [steamUsers, setSteamUsers] = useState<UserSummary[]>([])
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null)

  const processUserSummaries = (response: InvokeUserSummary, users: UserSummary[]) => {
    const players = response.response.players || []
    return users.flatMap(userData => {
      const player = players.find(p => p.steamid === userData?.steamId)
      if (!player) return []
      return {
        steamId: player.steamid,
        personaName: player.personaname,
        avatar: player.avatar.replace('.jpg', '_full.jpg'),
        mostRecent: userData?.mostRecent ?? 0,
      }
    })
  }

  useEffect(() => {
    const getSteamUsers = async () => {
      setIsLoading(true)
      try {
        const response = await invoke<InvokeUsers>('get_users')
        if (!response.users?.length) {
          setSteamUsers([])
          setUserSummaries([])
          setIsLoading(false)
          return
        }

        const apiKey = userSettings.general?.apiKey
        const validUsers = response.users.filter(u => u?.steamId)
        if (!validUsers.length) {
          setSteamUsers([])
          setUserSummaries([])
          setIsLoading(false)
          return
        }

        try {
          const cached = await invoke<InvokeUserSummary[]>('get_user_summary_cache')
          const resolved: UserSummary[] = []
          const uncached: UserSummary[] = []

          for (const user of validUsers) {
            const hit = cached.find(
              s => s?.response?.players?.[0]?.steamid === String(user?.steamId),
            )
            if (hit) {
              const p = hit.response.players[0]
              resolved.push({
                steamId: p.steamid,
                personaName: p.personaname,
                avatar: p.avatar.replace('.jpg', '_full.jpg'),
                mostRecent: user?.mostRecent ?? 0,
              })
            } else {
              uncached.push(user)
            }
          }

          if (uncached.length > 0) {
            const steamIds = uncached.map(u => String(u?.steamId)).join(',')
            const res = await invoke<InvokeUserSummary>('get_user_summary', {
              steamId: steamIds,
              apiKey: apiKey ? decrypt(apiKey) : null,
            })
            resolved.push(...processUserSummaries(res, uncached))
          }

          resolved.sort((a, b) => (b?.mostRecent ?? 0) - (a?.mostRecent ?? 0))
          setSteamUsers(resolved)
          setUserSummaries(resolved)
        } catch {
          const fallback = validUsers.map(u => ({
            steamId: String(u?.steamId),
            personaName: u?.personaName || 'Unknown User',
            avatar: '',
            mostRecent: u?.mostRecent ?? 0,
          }))
          fallback.sort((a, b) => (b?.mostRecent ?? 0) - (a?.mostRecent ?? 0))
          setSteamUsers(fallback)
          setUserSummaries(fallback)
        }
      } catch {
        setSteamUsers([])
        setUserSummaries([])
      } finally {
        setIsLoading(false)
      }
    }
    getSteamUsers()
  }, [userSettings.general?.apiKey, refreshKey])

  const handleSelectUser = async (user: UserSummary) => {
    setSelectedUser(user)
    if (user?.mostRecent !== 1) {
      try {
        await invoke('prepare_steam_account_switch', { steamId: user?.steamId })
      } catch (error) {
        await logEvent(`[Error] in (prepare_steam_account_switch): ${error}`)
      }
    }
  }

  const handleLogin = async (index: number) => {
    try {
      const user = userSummaries[index]
      const isSwitchingAccount = user?.mostRecent !== 1
      const devAccounts = ['76561198158912649', '76561198999797359']
      const isDev = await invoke('is_dev')
      const isDevAccount = devAccounts.includes(user?.steamId ?? '')

      setIsLoading(true)

      if (isSwitchingAccount && !isDev && !isDevAccount) {
        setIsSwitching(true)
        try {
          await invoke('switch_steam_account')
        } catch (e) {
          await logEvent(`[Error] switch_steam_account: ${e}`)
        }
        setIsSwitching(false)
      } else if (!isDev && !isDevAccount) {
        const running = await checkSteamStatus(false)
        if (!running) {
          try {
            await invoke('launch_steam')
          } catch (e) {
            await logEvent(`[Error] launch_steam: ${e}`)
          }
        }
      }

      localStorage.setItem('userSummary', JSON.stringify(user))
      setUserSummary(user)
      setIsLoading(false)
      await logEvent(`[System] Logged in as ${user?.personaName}`)
    } catch (error) {
      setIsLoading(false)
      toast.danger(t('common.error'))
      console.error('Error in handleLogin:', error)
      await logEvent(`[Error] in (handleLogin): ${error}`)
    }
  }

  const getRandomAvatarUrl = () => {
    const seed = Math.random().toString(36).substring(7)
    return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seed}`
  }

  return {
    isLoading,
    isSwitching,
    userSummaries,
    handleLogin,
    handleSelectUser,
    steamUsers,
    selectedUser,
    getRandomAvatarUrl,
  }
}
