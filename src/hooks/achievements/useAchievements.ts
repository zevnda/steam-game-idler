import type { Achievement, InvokeAchievementData, Statistic } from '@/types'
import type { Dispatch, SetStateAction } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useStateContext } from '@/components/contexts/StateContext'
import { useUserContext } from '@/components/contexts/UserContext'
import { checkSteamStatus, logEvent } from '@/utils/tasks'
import { showAccountMismatchToast, showDangerToast } from '@/utils/toasts'

interface UseAchievementsProps {
  windowInnerHeight: number
  setRefreshKey: Dispatch<SetStateAction<number>>
}

export default function useAchievements(
  setIsLoading: Dispatch<SetStateAction<boolean>>,
  setAchievements: Dispatch<SetStateAction<Achievement[]>>,
  setStatistics: Dispatch<SetStateAction<Statistic[]>>,
  setProtectedAchievements: Dispatch<SetStateAction<boolean>>,
  setProtectedStatistics: Dispatch<SetStateAction<boolean>>,
): UseAchievementsProps {
  const { t } = useTranslation()
  const { appId } = useStateContext()
  const { userSummary, setAchievementsUnavailable, setStatisticsUnavailable } = useUserContext()
  const [windowInnerHeight, setWindowInnerHeight] = useState(window.innerHeight)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const getAchievementData = async (): Promise<void> => {
      try {
        setIsLoading(true)
        // Make sure Steam client is running
        const isSteamRunning = checkSteamStatus(true)
        if (!isSteamRunning) return setIsLoading(false)

        // Fetch achievement data
        const response = await invoke<InvokeAchievementData | string>('get_achievement_data', {
          steamId: userSummary?.steamId,
          appId,
          refetch: refreshKey !== 0,
        })

        // Handle case where Steam API initialization failed
        // We already check if Steam client is running so usually account mismatch
        if (typeof response === 'string' && response.includes('Failed to initialize Steam API')) {
          setIsLoading(false)
          setAchievementsUnavailable(true)
          setStatisticsUnavailable(true)
          showAccountMismatchToast('danger')
          logEvent(`Error in (getAchievementData): ${response}`)
          return
        }

        const achievementData = response as InvokeAchievementData

        if (achievementData?.achievement_data?.achievements) {
          // Check if any achievements are marked as protected
          const hasProtectedAchievements = achievementData.achievement_data.achievements.some(
            achievement => achievement.protected_achievement === true,
          )
          if (hasProtectedAchievements) setProtectedAchievements(true)

          if (achievementData.achievement_data.achievements.length > 0) {
            // Sort achievements by percent initially - prevents button state flickering
            achievementData.achievement_data.achievements.sort((a, b) => b.percent - a.percent)
            setAchievements(achievementData.achievement_data.achievements)
            setAchievementsUnavailable(false)
          }
        }

        if (achievementData?.achievement_data?.stats) {
          // Check if any statistics are marked as protected
          const hasProtectedStatistics = achievementData.achievement_data.stats.some(
            achievement => achievement.protected_stat === true,
          )
          if (hasProtectedStatistics) setProtectedStatistics(true)

          if (achievementData.achievement_data.stats.length > 0) {
            setStatistics(achievementData.achievement_data.stats)
            setStatisticsUnavailable(false)
          }
        }

        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
        setAchievementsUnavailable(true)
        setStatisticsUnavailable(true)
        showDangerToast(t('toast.achievementData.error'))
        console.error('Error in (getAchievementData):', error)
        logEvent(`Error in (getAchievementData): ${error}`)
      }
    }

    getAchievementData()
  }, [
    userSummary?.steamId,
    appId,
    setAchievements,
    setIsLoading,
    setProtectedAchievements,
    setProtectedStatistics,
    setStatistics,
    setAchievementsUnavailable,
    setStatisticsUnavailable,
    refreshKey,
    t,
  ])

  useEffect(() => {
    const handleResize = (): void => {
      setWindowInnerHeight(window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return { windowInnerHeight, setRefreshKey }
}
