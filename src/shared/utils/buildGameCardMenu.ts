import type { IdleSetResult } from '@/features/idling/types'
import type { TranslationKey } from '@/i18n'
import type { ContextMenuEntry } from '@/shared/stores/contextMenuStore'
import type { SignedInAccount } from '@/shared/stores/sessionStore'
import type { GameListName } from '@/shared/utils/gameListsBus'
import type { TFunction } from 'i18next'
import type { IconType } from 'react-icons'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { SiSteam, SiSteamdb } from 'react-icons/si'
import {
  TbArrowsSort,
  TbAward,
  TbBan,
  TbCards,
  TbCheck,
  TbCopy,
  TbHeart,
  TbHourglassLow,
  TbListCheck,
  TbPlayerPlayFilled,
  TbPlayerStopFilled,
  TbTrophyFilled,
} from 'react-icons/tb'
import { toast } from '@heroui/react'
import { errorMessageKey } from '@/features/idling/utils/errorMessageKey'
import { useAchievementManagerStore } from '@/shared/stores/achievementManagerStore'
import { useAchievementOrderStore } from '@/shared/stores/achievementOrderStore'
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

interface GameList {
  name: GameListName
  label: TranslationKey
  // Each list's sidebar/page icon, swapped for a tick while the game is in the list
  icon: IconType
  get: string
  add: string
  remove: string
  // Extra fields the list's entry needs beyond appId/name
  extra?: Record<string, unknown>
  // A list the game comes off when added to this one. A game can't be both whitelisted and
  // blacklisted for Card Farming, matching the page's ban button (CardFarmingPage's
  // `handleBlacklist`).
  excludes?: GameListName
}

// In the order the Lists submenu shows them.
const GAME_LISTS: GameList[] = [
  {
    name: 'favorites',
    label: 'dashboard.sidebar.nav.favorites',
    icon: TbHeart,
    get: 'get_favorites',
    add: 'add_favorite',
    remove: 'remove_favorite',
  },
  {
    name: 'cardFarmingWhitelist',
    label: 'dashboard.sidebar.nav.cardFarming',
    icon: TbCards,
    get: 'get_card_farming_whitelist',
    add: 'add_to_card_farming_whitelist',
    remove: 'remove_from_card_farming_whitelist',
    excludes: 'cardFarmingBlacklist',
  },
  {
    name: 'cardFarmingBlacklist',
    label: 'common.gameCardMenu.cardFarmingBlacklist',
    icon: TbBan,
    get: 'get_card_farming_blacklist',
    add: 'add_to_card_farming_blacklist',
    remove: 'remove_from_card_farming_blacklist',
    excludes: 'cardFarmingWhitelist',
  },
  {
    name: 'achievementUnlockerQueue',
    label: 'dashboard.sidebar.nav.achievementUnlocker',
    icon: TbAward,
    get: 'get_achievement_unlocker_queue',
    add: 'add_to_achievement_unlocker_queue',
    remove: 'remove_from_achievement_unlocker_queue',
  },
  {
    name: 'autoIdleList',
    label: 'dashboard.sidebar.nav.autoIdle',
    icon: TbHourglassLow,
    get: 'get_auto_idle_list',
    add: 'add_to_auto_idle_list',
    remove: 'remove_from_auto_idle_list',
    extra: { enabled: true },
  },
]

// Which lists the game is already in, read fresh each time the menu opens: the lists live in
// page-scoped hooks, so there's no app-wide copy to read instead. All five are small local file
// reads run in parallel, so this doesn't noticeably delay the menu. A list that fails to read
// shows as unticked, and ticking it just adds the game (adds are idempotent on the backend).
async function readMemberships(account: SignedInAccount, appId: number) {
  const results = await Promise.allSettled(
    GAME_LISTS.map(list => invoke<{ appId: number }[]>(list.get, { account })),
  )
  return GAME_LISTS.map((list, index) => {
    const result = results[index]
    if (result.status === 'rejected') {
      console.error(`Error in (${list.get}) [game card menu]:`, result.reason)
      return false
    }
    return result.value.some(entry => entry.appId === appId)
  })
}

// Every change is pushed through the bus so whichever list page is mounted updates straight away
// (see gameListsBus.ts).
async function toggleListMembership(
  list: GameList,
  isMember: boolean,
  account: SignedInAccount,
  appId: number,
  name: string,
) {
  try {
    if (isMember) {
      emitGameListChange(list.name, await invoke<unknown[]>(list.remove, { account, appId }))
      return
    }
    emitGameListChange(
      list.name,
      await invoke<unknown[]>(list.add, { account, game: { appId, name, ...list.extra } }),
    )
    const excluded = GAME_LISTS.find(other => other.name === list.excludes)
    if (excluded) {
      emitGameListChange(
        excluded.name,
        await invoke<unknown[]>(excluded.remove, { account, appId }),
      )
    }
  } catch (error) {
    console.error(`Error in (${isMember ? list.remove : list.add}) [game card menu]:`, error)
  }
}

async function copyAppId(appId: number, t: TFunction) {
  try {
    await writeText(String(appId))
    toast.success(t('common.gameCardMenu.appIdCopied'))
  } catch (error) {
    console.error('Error in (writeText) [copy app id]:', error)
  }
}

// The game card's right-click menu, as data for ContextMenu.tsx (see useContextMenu.ts).
export async function buildGameCardMenu({ appId, name, account, t }: BuildGameCardMenuArgs) {
  const isIdling = useIdlingStore.getState().appIds.includes(appId)
  const memberships = await readMemberships(account, appId)

  const entries: ContextMenuEntry[] = [
    {
      kind: 'item',
      id: 'toggle-idle',
      label: isIdling ? t('common.gameCardMenu.stopIdling') : t('common.gameCardMenu.startIdling'),
      icon: isIdling ? TbPlayerStopFilled : TbPlayerPlayFilled,
      onAction: () => toggleIdling(appId, name, account, t),
    },
    {
      kind: 'item',
      id: 'manage-achievements',
      label: t('common.gameCardMenu.manageAchievements'),
      icon: TbTrophyFilled,
      onAction: () => useAchievementManagerStore.getState().open(appId, name),
    },
    // The order is saved per game, not per queue entry, so it can be set up before the game is
    // queued. The overlay is mounted by DashboardShell, so this works from any page.
    {
      kind: 'item',
      id: 'custom-order',
      label: t('common.gameCardMenu.customOrder'),
      icon: TbArrowsSort,
      onAction: () => useAchievementOrderStore.getState().open(appId, name),
    },
    { kind: 'separator', id: 'separator-lists' },
    {
      kind: 'submenu',
      id: 'lists',
      label: t('common.gameCardMenu.lists'),
      icon: TbListCheck,
      // A list the game is already in shows a tick in place of its icon; clicking an item adds or
      // removes it.
      items: GAME_LISTS.map((list, index) => ({
        kind: 'item',
        id: `list-${list.name}`,
        label: t(list.label),
        icon: memberships[index] ? TbCheck : list.icon,
        onAction: () => toggleListMembership(list, memberships[index], account, appId, name),
      })),
    },
    { kind: 'separator', id: 'separator-links' },
    {
      kind: 'item',
      id: 'view-on-steam',
      label: t('common.gameCardMenu.viewOnSteam'),
      icon: SiSteam,
      onAction: () => openExternalLink(`https://store.steampowered.com/app/${appId}`),
    },
    {
      kind: 'item',
      id: 'view-on-steamdb',
      label: t('dashboard.achievements.header.viewOnSteamDb'),
      icon: SiSteamdb,
      onAction: () => openExternalLink(`https://steamdb.info/app/${appId}/`),
    },
    {
      kind: 'item',
      id: 'copy-app-id',
      label: t('common.gameCardMenu.copyAppId'),
      icon: TbCopy,
      onAction: () => copyAppId(appId, t),
    },
  ]
  return entries
}
