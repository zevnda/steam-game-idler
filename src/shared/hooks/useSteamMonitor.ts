import type { Game, InvokeRunningProcess } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { useIdleStore, useStateStore, useUserStore } from '@/shared/stores'

export function useSteamMonitor() {
  const userSummary = useUserStore(state => state.userSummary)
  const setIsCardFarming = useStateStore(state => state.setIsCardFarming)
  const setIsAchievementUnlocker = useStateStore(state => state.setIsAchievementUnlocker)
  const setShowSteamWarning = useStateStore(state => state.setShowSteamWarning)
  const setIdleGamesList = useIdleStore(state => state.setIdleGamesList)

  // Listen for Steam status changes
  useEffect(() => {
    const unlistenPromise = listen<boolean>('steam_status_changed', event => {
      const isSteamRunning = event.payload
      if (!isSteamRunning && userSummary) {
        invoke('kill_all_steamutil_processes')
        setIsCardFarming(false)
        setIsAchievementUnlocker(false)
        setShowSteamWarning(true)
      }
    })

    return () => {
      unlistenPromise.then(unlisten => unlisten())
    }
  }, [userSummary, setIsAchievementUnlocker, setIsCardFarming, setShowSteamWarning])

  // Listen for running processes changes
  useEffect(() => {
    const unlistenPromise = listen('running_processes_changed', event => {
      const response = event.payload as InvokeRunningProcess
      const processes = response?.processes

      setIdleGamesList((prevList: Game[]) => {
        if (prevList.length !== processes.length) {
          return processes.map(process => {
            const existingGame = prevList.find(game => game.appid === process.appid)
            return {
              ...process,
              // Track start time for idle timer
              startTime: existingGame?.startTime || Date.now(),
            }
          })
        }

        // Only update if the list of games has actually changed
        const prevMap = new Map(prevList.map(item => [item.appid, item]))
        const newMap = new Map(processes.map(item => [item.appid, item]))

        if (
          prevList.some(item => !newMap.has(item.appid)) ||
          processes.some(item => !prevMap.has(item.appid))
        ) {
          return processes
        }

        return prevList
      })
    })

    return () => {
      unlistenPromise.then(unlisten => unlisten())
    }
  }, [setIdleGamesList])
}
