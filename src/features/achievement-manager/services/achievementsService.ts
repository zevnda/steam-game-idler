import type {
  Achievement,
  InvokeAchievementData,
  InvokeAchievementUnlock,
  InvokeStatUpdate,
  StatValue,
} from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import i18next from 'i18next'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'

export async function fetchAchievementData(
  steamId: string | undefined,
  appId: number | null,
  refetch: boolean,
) {
  const response = await invoke<InvokeAchievementData | string>('get_achievement_data', {
    steamId,
    appId,
    refetch,
  })
  if (typeof response === 'string') return null
  return response as InvokeAchievementData
}

export async function unlockAchievement(
  steamId: string | undefined,
  appId: number,
  achievementName: string,
  appName: string,
) {
  try {
    const response = await invoke<InvokeAchievementUnlock>('unlock_achievement', {
      appId,
      achievementId: achievementName,
    })
    await invoke<InvokeAchievementData>('get_achievement_data', { steamId, appId, refetch: true })
    const status = JSON.parse(String(response)) as InvokeAchievementUnlock
    if (status.success) {
      await logEvent(`[Achievement Manager] Unlocked ${achievementName} for ${appName} (${appId})`)
      return true
    }
    return false
  } catch (error) {
    await logEvent(`[Error] in (unlockAchievement): ${error}`)
    return false
  }
}

export async function lockAchievement(
  steamId: string | undefined,
  appId: number,
  achievementName: string,
  appName: string,
) {
  try {
    const response = await invoke<InvokeAchievementUnlock>('lock_achievement', {
      appId,
      achievementId: achievementName,
    })
    await invoke<InvokeAchievementData>('get_achievement_data', { steamId, appId, refetch: true })
    const status = JSON.parse(String(response)) as InvokeAchievementUnlock
    if (status.success) {
      await logEvent(`[Achievement Manager] Locked ${achievementName} for ${appName} (${appId})`)
      return true
    }
    return false
  } catch (error) {
    await logEvent(`[Error] in (lockAchievement): ${error}`)
    return false
  }
}

export async function toggleAchievementById(
  steamId: string | undefined,
  appId: number,
  achievementName: string,
  appName: string,
  type: string,
) {
  try {
    const response = await invoke<InvokeAchievementUnlock>('toggle_achievement', {
      appId,
      achievementId: achievementName,
    })
    await invoke('get_achievement_data', { steamId, appId, refetch: true })
    const status = JSON.parse(String(response)) as InvokeAchievementUnlock
    if (status.success) {
      toast.success(i18next.t('toast.toggle.success', { type, achievementName, appName }))
      await logEvent(`[Achievement Manager] ${type} ${achievementName} for ${appName} (${appId})`)
      return true
    } else {
      toast.danger(
        i18next.t('toast.toggle.error', {
          type: type.replace('ed', '').toLowerCase(),
          achievementName,
          appName,
        }),
      )
      return false
    }
  } catch (error) {
    await logEvent(`[Error] in (toggleAchievement): ${error}`)
    return false
  }
}

export async function unlockAllAchievements(
  steamId: string | undefined,
  appId: number,
  count: number,
  appName: string,
) {
  try {
    const response = await invoke<InvokeAchievementUnlock>('unlock_all_achievements', { appId })
    await invoke<InvokeAchievementData>('get_achievement_data', { steamId, appId, refetch: true })
    const status = JSON.parse(String(response)) as InvokeAchievementUnlock
    if (status.success)
      await logEvent(
        `[Achievement Manager] Unlocked ${count} achievements for ${appName} (${appId})`,
      )
    return status.success === 'true' || !!status.success
  } catch (error) {
    await logEvent(`[Error] in (unlockAllAchievements): ${error}`)
    return false
  }
}

export async function lockAllAchievements(
  steamId: string | undefined,
  appId: number,
  count: number,
  appName: string,
) {
  try {
    const response = await invoke<InvokeAchievementUnlock>('lock_all_achievements', { appId })
    await invoke<InvokeAchievementData>('get_achievement_data', { steamId, appId, refetch: true })
    const status = JSON.parse(String(response)) as InvokeAchievementUnlock
    if (status.success)
      await logEvent(`[Achievement Manager] Locked ${count} achievements for ${appName} (${appId})`)
    return status.success === 'true' || !!status.success
  } catch (error) {
    await logEvent(`[Error] in (lockAllAchievements): ${error}`)
    return false
  }
}

export async function updateStats(
  steamId: string | undefined,
  appId: number | null,
  appName: string | null,
  valuesArr: StatValue[],
) {
  try {
    const response = await invoke<InvokeStatUpdate>('update_stats', {
      appId,
      statsArr: JSON.stringify(valuesArr),
    })
    const statusStr = String(response).split(/(?<=})\s*(?={)/)[0]
    const status = JSON.parse(statusStr) as InvokeStatUpdate
    const newData = await invoke<InvokeAchievementData>('get_achievement_data', {
      steamId,
      appId,
      refetch: true,
    })
    if (status.success)
      await logEvent(
        `[Statistics Manager] Updated ${valuesArr.length} stats for ${appName} (${appId})`,
      )
    return { success: !!status.success, achievements: newData?.achievement_data?.achievements }
  } catch (error) {
    await logEvent(`[Error] in (updateStats): ${error}`)
    return { success: false, achievements: [] as Achievement[] }
  }
}

export async function resetAllStats(
  steamId: string | undefined,
  appId: number | null,
  appName: string | null,
) {
  try {
    await invoke('reset_all_stats', { appId })
    await invoke<InvokeAchievementData>('get_achievement_data', { steamId, appId, refetch: true })
    await logEvent(`[Statistics Manager] Reset all stats for ${appName} (${appId})`)
    return true
  } catch (error) {
    await logEvent(`[Error] in (resetAllStats): ${error}`)
    return false
  }
}

export function sortAchievements(achievements: Achievement[], sortKey: string) {
  const sorted = [...achievements]
  switch (sortKey) {
    case 'percent':
      sorted.sort((a, b) => (b.percent || 0) - (a.percent || 0))
      break
    case 'title':
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'unlocked':
      sorted.sort((a, b) => (a.achieved === b.achieved ? 0 : a.achieved ? -1 : 1))
      break
    case 'locked':
      sorted.sort((a, b) => (a.achieved === b.achieved ? 0 : a.achieved ? 1 : -1))
      break
    case 'protected':
      sorted.sort((a, b) => (a.protected_achievement ? -1 : b.protected_achievement ? 1 : 0))
      break
    case 'unprotected':
      sorted.sort((a, b) => (a.protected_achievement ? 1 : b.protected_achievement ? -1 : 0))
      break
  }
  return sorted
}

export async function applyAchievementChanges(
  steamId: string | undefined,
  appId: number,
  appName: string,
  selectedToUnlock: Set<string>,
  selectedToLock: Set<string>,
  achievements: Achievement[],
) {
  let unlockCount = 0
  let lockCount = 0

  for (const a of achievements.filter(a => selectedToUnlock.has(a.id))) {
    const ok = await unlockAchievement(steamId, appId, a.id, appName)
    if (ok) unlockCount++
  }
  for (const a of achievements.filter(a => selectedToLock.has(a.id))) {
    const ok = await lockAchievement(steamId, appId, a.id, appName)
    if (ok) lockCount++
  }

  if (unlockCount > 0 || lockCount > 0) {
    const parts: string[] = []
    if (unlockCount > 0)
      parts.push(i18next.t('toast.unlockAll.success', { count: unlockCount, appName }))
    if (lockCount > 0) parts.push(i18next.t('toast.lockAll.success', { count: lockCount, appName }))
    toast.success(parts.join(' · '))
    return { unlocked: selectedToUnlock, locked: selectedToLock }
  } else {
    toast.accountMismatch('danger')
    return null
  }
}
