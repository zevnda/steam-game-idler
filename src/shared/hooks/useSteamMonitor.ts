import type { Game, InvokeRunningProcess } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { useSessionStore, useUiStore, useUserStore } from '@/shared/stores'

export function useSteamMonitor() {
  const userSummary = useUserStore(s => s.userSummary)
  const setIsCardFarming = useSessionStore(s => s.setIsCardFarming)
  const setIsAchievementUnlocker = useSessionStore(s => s.setIsAchievementUnlocker)
  const setShowSteamWarning = useUiStore(s => s.setShowSteamWarning)
  const setIdleGamesList = useSessionStore(s => s.setIdleGamesList)

  useEffect(() => {
    const unlistenPromise = listen<boolean>('steam_status_changed', event => {
      if (!event.payload && userSummary) {
        invoke('kill_all_steamutil_processes')
        setIsCardFarming(false)
        setIsAchievementUnlocker(false)
        setShowSteamWarning(true)
      }
    })
    return () => {
      unlistenPromise.then(u => u())
    }
  }, [userSummary, setIsCardFarming, setIsAchievementUnlocker, setShowSteamWarning])

  useEffect(() => {
    const unlistenPromise = listen('running_processes_changed', event => {
      const { processes } = event.payload as InvokeRunningProcess

      setIdleGamesList((prevList: Game[]) => {
        if (prevList.length !== processes.length) {
          return processes.map(proc => {
            const existing = prevList.find(g => g.appid === proc.appid)
            return { ...proc, startTime: existing?.startTime || Date.now() }
          })
        }
        const prevMap = new Map(prevList.map(g => [g.appid, g]))
        const newMap = new Map(processes.map(g => [g.appid, g]))
        if (
          prevList.some(g => !newMap.has(g.appid)) ||
          processes.some(g => !prevMap.has(g.appid))
        ) {
          return processes
        }
        return prevList
      })
    })
    return () => {
      unlistenPromise.then(u => u())
    }
  }, [setIdleGamesList])
}
