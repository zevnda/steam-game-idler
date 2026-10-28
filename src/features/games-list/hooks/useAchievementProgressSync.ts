import type { SignedInAccount } from '@/shared/stores/sessionStore'
import { listen } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { useGamesListStore } from '@/shared/stores/gamesListStore'
import { getAccountKey } from '@/shared/stores/sessionStore'

// Matches src-tauri/src/games/achievement_progress.rs's ACHIEVEMENT_PROGRESS_EVENT.
const ACHIEVEMENT_PROGRESS_EVENT = 'achievement-progress-updated'

// Mirrors `achievement_progress::ProgressEvent` - `account` is the same tagged `GamesAccount` shape
// every command takes, so it maps straight onto an `AccountKey`. Only games whose counts actually
// changed are included.
interface AchievementProgressEventPayload {
  account: SignedInAccount
  progress: { appId: number; unlocked: number; total: number }[]
}

// Patches achievement completion counts into `gamesListStore` as the backend refreshes them -
// after an Achievement Manager edit, each achievement-unlocker unlock, a finished agent-mode play
// session, or the background library-wide refresh `get_owned_games` kicks off. Mounted once from
// DashboardShell (next to `useGamesListSync`), so every page reading the store (games list,
// favorites, achievement unlocker, auto-idle) re-sorts live without refetching the list. An event
// for an account with no loaded entry yet is dropped - that account's first fetch reads the same
// counts from the backend's cache.
export const useAchievementProgressSync = () => {
  useEffect(() => {
    const unlisten = listen<AchievementProgressEventPayload>(
      ACHIEVEMENT_PROGRESS_EVENT,
      ({ payload }) => {
        const key = getAccountKey(payload.account)
        const { entries, updateEntry } = useGamesListStore.getState()
        const entry = entries[key]
        if (!entry || entry.games.length === 0) return

        const byAppId = new Map(payload.progress.map(progress => [progress.appId, progress]))
        updateEntry(key, {
          games: entry.games.map(game => {
            const progress = byAppId.get(game.appId)
            return progress
              ? {
                  ...game,
                  achievementsUnlocked: progress.unlocked,
                  achievementsTotal: progress.total,
                }
              : game
          }),
        })
      },
    )

    return () => {
      unlisten.then(stop => stop())
    }
  }, [])
}
