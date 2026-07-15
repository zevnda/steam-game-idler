import { listen } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@heroui/react'
import { fetchGamesList } from '@/features/games-list/hooks/useGamesListSync'
import { useFreeGamesStore } from '@/shared/stores/freeGamesStore'
import { useSessionStore } from '@/shared/stores/sessionStore'

type FreeGameClaimCorrectionPayload =
  | { mode: 'agent'; username: string; appId: number }
  | { mode: 'local'; steamId: string; appId: number }

// Matches src-tauri/src/free_games/mod.rs's FREE_GAME_CLAIM_CORRECTED_EVENT constant.
const FREE_GAME_CLAIM_CORRECTED_EVENT = 'free-game-claim-corrected'

// Mounted once in DashboardShell alongside the other global sync hooks - a correction can arrive
// minutes after `claim_free_game` already returned `Failed` to whichever component called it (see
// local_steam::free_game_claim::claim_via_store_page's doc comment), long after any per-card claim
// UI that made the original call may have unmounted, so this can't live inside useClaimFreeGame
// itself.
//
// Fires for both sign-in modes now - agent mode's RequestFreeLicense fast path never needs one,
// but its store-page fallback (steam_agent::AgentManager::request_free_license,
// claim_via_agent_session) shares the exact same propagation-lag ambiguity CLI mode's claim always
// has. Tagged the same way as GamesAccount/SignedInAccount so a correction can be matched back to
// the right signed-in account regardless of mode - agent-mode accounts have no SteamID64 on the
// frontend at all (see useGamesListSync.ts's doc comment), only `username`. Matches against every
// signed-in account of the right mode, not just the currently active one - a backgrounded
// account's library should self-correct too.
export const useFreeGameClaimCorrections = () => {
  const { t } = useTranslation()

  useEffect(() => {
    const unlisten = listen<FreeGameClaimCorrectionPayload>(
      FREE_GAME_CLAIM_CORRECTED_EVENT,
      event => {
        const { payload } = event
        const { appId } = payload
        const account = Object.values(useSessionStore.getState().accounts).find(candidate =>
          payload.mode === 'local'
            ? candidate.mode === 'local' && candidate.steamId === payload.steamId
            : candidate.mode === 'agent' && candidate.username === payload.username,
        )
        if (!account) return

        const name =
          useFreeGamesStore.getState().games.find(game => game.appId === appId)?.name ??
          String(appId)
        toast.success(t('dashboard.freeGames.correction.granted', { name }))

        // Corrects the account's owned-games cache now that ownership is confirmed - the per-card
        // "Failed" state on FreeGamesPage stays stale if that page happens to be mounted (its
        // outcome state is component-local, see useClaimFreeGame's doc comment), but the game
        // correctly shows up as owned everywhere else (games list, idling) without waiting on that
        // cache's own staleness window.
        fetchGamesList(account)
      },
    )

    return () => {
      unlisten.then(fn => fn())
    }
  }, [t])
}
