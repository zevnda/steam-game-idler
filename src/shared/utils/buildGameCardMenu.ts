import type { IdleSetResult } from '@/features/idling/types'
import type { SignedInAccount } from '@/shared/stores/sessionStore'
import type { GameListName } from '@/shared/utils/gameListsBus'
import type { TFunction } from 'i18next'
import { MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu'
import { toast } from '@heroui/react'
import { errorMessageKey } from '@/features/idling/utils/errorMessageKey'
import { useAchievementManagerStore } from '@/shared/stores/achievementManagerStore'
import { useIdlingStore } from '@/shared/stores/idlingStore'
import { emitGameListChange } from '@/shared/utils/gameListsBus'
import { invoke } from '@/shared/utils/invoke'
import { openExternalLink } from '@/shared/utils/links'

interface GameCardTargetGame {
  appId: number
  name: string
}

interface BuildGameCardMenuArgs {
  games: GameCardTargetGame[]
  account: SignedInAccount
  t: TFunction
}

function reportFailure(t: TFunction, code: string) {
  toast.danger(t(errorMessageKey(code), { code }))
}

// Single-game path keeps calling the original `toggle_manual_idle` command unchanged; a selection
// of more than one game goes through `toggle_manual_idle_bulk`, which decides start-vs-stop **per
// app id** on the backend so a mixed selection (some already idling, some not) resolves correctly
// in one call rather than needing the frontend to pre-split the selection.
async function toggleIdling(games: GameCardTargetGame[], account: SignedInAccount, t: TFunction) {
  try {
    const result =
      games.length === 1
        ? await invoke<IdleSetResult>('toggle_manual_idle', {
            account,
            appId: games[0].appId,
            name: games[0].name,
          })
        : await invoke<IdleSetResult>('toggle_manual_idle_bulk', {
            account,
            targets: games,
          })
    const failure = result.failures[0]?.error
    if (failure) reportFailure(t, failure)
  } catch (error) {
    console.error('Error in (toggle_manual_idle):', error)
    reportFailure(t, String(error))
  }
}

// Idempotent on the backend (each `add_*`/`add_to_*_queue` command dedupes by appId - see
// favorites/achievement_unlocker/auto_idle/card_farming's own `cache.rs`/`queue.rs`), so this can
// fire unconditionally without checking current membership first - checking would mean 4 extra
// round trips before the menu could even open. No card-farming drops-eligibility check either,
// mirroring the existing "Manual Add" button (CardFarmingPageHeader.tsx), which already allows
// queuing any app id regardless of drops.
//
// Loops the single-game command across `games` rather than a new bulk Tauri command - each command
// already returns the full updated list, so the last successfully-resolved one is authoritative;
// a per-game failure is logged and otherwise ignored, matching the single-game call site's own
// silent-on-error behavior (no toast today for this action).
async function addToList(
  command: string,
  list: GameListName,
  account: SignedInAccount,
  games: GameCardTargetGame[],
) {
  const results = await Promise.allSettled(
    games.map(game => invoke<unknown[]>(command, { account, game })),
  )
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error(`Error in (${command}):`, result.reason)
    }
  }
  const lastFulfilled = results.findLast(
    (result): result is PromiseFulfilledResult<unknown[]> => result.status === 'fulfilled',
  )
  if (lastFulfilled) emitGameListChange(list, lastFulfilled.value)
}

export async function buildGameCardMenu({ games, account, t }: BuildGameCardMenuArgs) {
  const isBulk = games.length > 1
  const idlingAppIds = useIdlingStore.getState().appIds
  const idlingCount = games.filter(game => idlingAppIds.includes(game.appId)).length

  const toggleIdleLabel = isBulk
    ? idlingCount === 0
      ? t('common.gameCardMenu.startIdlingSelected', { count: games.length })
      : idlingCount === games.length
        ? t('common.gameCardMenu.stopIdlingSelected', { count: games.length })
        : t('common.gameCardMenu.toggleIdlingSelected', { count: games.length })
    : idlingAppIds.includes(games[0].appId)
      ? t('common.gameCardMenu.stopIdling')
      : t('common.gameCardMenu.startIdling')

  const addToSubmenu = await Submenu.new({
    id: 'game-card-add-to',
    text: t('common.gameCardMenu.addTo'),
    items: [
      await MenuItem.new({
        id: 'game-card-add-to-favorites',
        text: t('dashboard.sidebar.nav.favorites'),
        action: () => addToList('add_favorite', 'favorites', account, games),
      }),
      await MenuItem.new({
        id: 'game-card-add-to-card-farming',
        text: t('dashboard.sidebar.nav.cardFarming'),
        action: () => addToList('add_to_card_farming_queue', 'cardFarmingQueue', account, games),
      }),
      await MenuItem.new({
        id: 'game-card-add-to-achievement-unlocker',
        text: t('dashboard.sidebar.nav.achievementUnlocker'),
        action: () =>
          addToList(
            'add_to_achievement_unlocker_queue',
            'achievementUnlockerQueue',
            account,
            games,
          ),
      }),
      await MenuItem.new({
        id: 'game-card-add-to-auto-idle',
        text: t('dashboard.sidebar.nav.autoIdle'),
        action: () =>
          addToList(
            'add_to_auto_idle_list',
            'autoIdleList',
            account,
            games.map(game => ({ ...game, enabled: true })),
          ),
      }),
    ],
  })

  return [
    await MenuItem.new({
      id: 'game-card-toggle-idle',
      text: toggleIdleLabel,
      action: () => toggleIdling(games, account, t),
    }),
    await MenuItem.new({
      id: 'game-card-manage-achievements',
      text: t('common.gameCardMenu.manageAchievements'),
      enabled: !isBulk,
      action: () => useAchievementManagerStore.getState().open(games[0].appId, games[0].name),
    }),
    await PredefinedMenuItem.new({ item: 'Separator' }),
    await MenuItem.new({
      id: 'game-card-view-on-steam',
      text: t('common.gameCardMenu.viewOnSteam'),
      enabled: !isBulk,
      action: () => openExternalLink(`https://store.steampowered.com/app/${games[0].appId}`),
    }),
    await PredefinedMenuItem.new({ item: 'Separator' }),
    addToSubmenu,
  ]
}
