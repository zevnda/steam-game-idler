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

interface BuildGameCardMenuArgs {
  appId: number
  name: string
  account: SignedInAccount
  t: TFunction
}

function reportFailure(t: TFunction, code: string) {
  toast.danger(t(errorMessageKey(code), { code }))
}

async function toggleIdling(appId: number, name: string, account: SignedInAccount, t: TFunction) {
  try {
    const result = await invoke<IdleSetResult>('toggle_manual_idle', { account, appId, name })
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
async function addToList(
  command: string,
  list: GameListName,
  account: SignedInAccount,
  game: Record<string, unknown>,
) {
  try {
    const result = await invoke<unknown[]>(command, { account, game })
    emitGameListChange(list, result)
  } catch (error) {
    console.error(`Error in (${command}):`, error)
  }
}

export async function buildGameCardMenu({ appId, name, account, t }: BuildGameCardMenuArgs) {
  const isIdling = useIdlingStore.getState().appIds.includes(appId)

  const addToSubmenu = await Submenu.new({
    id: 'game-card-add-to',
    text: t('common.gameCardMenu.addTo'),
    items: [
      await MenuItem.new({
        id: 'game-card-add-to-favorites',
        text: t('dashboard.sidebar.nav.favorites'),
        action: () => addToList('add_favorite', 'favorites', account, { appId, name }),
      }),
      await MenuItem.new({
        id: 'game-card-add-to-card-farming',
        text: t('dashboard.sidebar.nav.cardFarming'),
        action: () =>
          addToList('add_to_card_farming_queue', 'cardFarmingQueue', account, { appId, name }),
      }),
      await MenuItem.new({
        id: 'game-card-add-to-achievement-unlocker',
        text: t('dashboard.sidebar.nav.achievementUnlocker'),
        action: () =>
          addToList('add_to_achievement_unlocker_queue', 'achievementUnlockerQueue', account, {
            appId,
            name,
          }),
      }),
      await MenuItem.new({
        id: 'game-card-add-to-auto-idle',
        text: t('dashboard.sidebar.nav.autoIdle'),
        action: () =>
          addToList('add_to_auto_idle_list', 'autoIdleList', account, {
            appId,
            name,
            enabled: true,
          }),
      }),
    ],
  })

  return [
    await MenuItem.new({
      id: 'game-card-toggle-idle',
      text: isIdling ? t('common.gameCardMenu.stopIdling') : t('common.gameCardMenu.startIdling'),
      action: () => toggleIdling(appId, name, account, t),
    }),
    await MenuItem.new({
      id: 'game-card-manage-achievements',
      text: t('common.gameCardMenu.manageAchievements'),
      action: () => useAchievementManagerStore.getState().open(appId, name),
    }),
    await PredefinedMenuItem.new({ item: 'Separator' }),
    await MenuItem.new({
      id: 'game-card-view-on-steam',
      text: t('common.gameCardMenu.viewOnSteam'),
      action: () => openExternalLink(`https://store.steampowered.com/app/${appId}`),
    }),
    await PredefinedMenuItem.new({ item: 'Separator' }),
    addToSubmenu,
  ]
}
