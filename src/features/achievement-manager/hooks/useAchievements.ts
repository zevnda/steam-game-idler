import type { Achievement, Statistic } from '@/shared/types'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchAchievementData } from '@/features/achievement-manager/services/achievementsService'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUiStore, useUserStore } from '@/shared/stores'
import { checkSteamStatus, updateDiscordPresence } from '@/shared/utils'

export function useAchievements() {
  const { t } = useTranslation()
  const selectedGame = useUiStore(s => s.selectedGame)
  const userSummary = useUserStore(s => s.userSummary)
  const setAchievementsUnavailable = useUserStore(s => s.setAchievementsUnavailable)
  const setStatisticsUnavailable = useUserStore(s => s.setStatisticsUnavailable)

  const [isLoading, setIsLoading] = useState(true)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [statistics, setStatistics] = useState<Statistic[]>([])
  const [protectedAchievements, setProtectedAchievements] = useState(false)
  const [protectedStatistics, setProtectedStatistics] = useState(false)
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)
  const [refreshKey, setRefreshKey] = useState(0)

  const appId = selectedGame?.appid ?? null
  const appName = selectedGame?.name ?? null

  useEffect(() => {
    if (appName && achievements.length > 0) {
      updateDiscordPresence(appName, `Managing ${achievements.length} achievements`)
    }
    return () => {
      updateDiscordPresence()
    }
  }, [appName, achievements])

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const running = await checkSteamStatus(true)
        if (!running) return setIsLoading(false)

        const data = await fetchAchievementData(userSummary?.steamId, appId, refreshKey !== 0)

        if (!data) {
          setIsLoading(false)
          setAchievementsUnavailable(true)
          setStatisticsUnavailable(true)
          toast.accountMismatch('danger')
          await logEvent('Error in (getAchievementData): Failed to initialize Steam API')
          return
        }

        if (data?.achievement_data?.achievements?.length) {
          const hasProtected = data.achievement_data.achievements.some(a => a.protected_achievement)
          if (hasProtected) setProtectedAchievements(true)
          const sorted = [...data.achievement_data.achievements].sort(
            (a, b) => b.percent - a.percent,
          )
          setAchievements(sorted)
          setAchievementsUnavailable(false)
        }

        if (data?.achievement_data?.stats?.length) {
          const hasProtected = data.achievement_data.stats.some(s => s.protected_stat)
          if (hasProtected) setProtectedStatistics(true)
          setStatistics(data.achievement_data.stats)
          setStatisticsUnavailable(false)
        }

        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
        setAchievementsUnavailable(true)
        setStatisticsUnavailable(true)
        toast.danger(t('toast.achievementData.error'))
        console.error('Error in (getAchievementData):', error)
        await logEvent(`Error in (getAchievementData): ${error}`)
      }
    }
    load()
  }, [
    userSummary?.steamId,
    appId,
    refreshKey,
    setAchievementsUnavailable,
    setStatisticsUnavailable,
    t,
  ])

  return {
    isLoading,
    achievements,
    setAchievements,
    statistics,
    setStatistics,
    protectedAchievements,
    protectedStatistics,
    windowHeight,
    refreshKey,
    setRefreshKey,
    appId,
    appName,
  }
}
