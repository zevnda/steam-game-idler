import type { AchievementUnlockerSettings } from '@/features/achievement-unlocker/types'
import type { CardFarmingSettings } from '@/features/card-farming/types'
import type { FreeGamesSettings } from '@/features/free-games/types'
import type { InventorySettings } from '@/features/inventory-manager/types'
import type { TranslationKey } from '@/i18n'
import type { SignedInAccount } from '@/shared/stores/sessionStore'
import type {
  LibraryBulkSetResult,
  LibraryRunProgress,
  ResetSettingsResult,
  Settings,
  SystemInfo,
} from '../types'
import { getVersion } from '@tauri-apps/api/app'
import { listen } from '@tauri-apps/api/event'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { debugErrorMessageKey, errorMessageKey } from '../utils/errorMessageKey'
import { toast } from '@heroui/react'
import { useRouter } from 'next/router'
import { fetchGamesList } from '@/features/games-list/hooks/useGamesListSync'
import { signOutAccount } from '@/shared/hooks/signOutAccount'
import { useAntiAwayStore } from '@/shared/stores/antiAwayStore'
import { useAutoUpdateGamesListStore } from '@/shared/stores/autoUpdateGamesListStore'
import { useCarouselSettingsStore } from '@/shared/stores/carouselSettingsStore'
import { useCustomBackgroundStore } from '@/shared/stores/customBackgroundStore'
import { useDisableTooltipsStore } from '@/shared/stores/disableTooltipsStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { applyFont, FONT_STORAGE_KEY } from '@/shared/theme/applyFont'
import { applyThemePreset, THEME_STORAGE_KEY } from '@/shared/theme/applyTheme'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'
import { preserveKeysAndClearData } from '@/shared/utils/update'

const LOG_LINES_LIMIT = 500

// Matches src-tauri/src/achievements/commands.rs's LIBRARY_RUN_PROGRESS_EVENT constant.
const LIBRARY_RUN_PROGRESS_EVENT = 'library-achievement-run-progress'

const LOCK_ALL_RESULT_KEYS: Record<'success' | 'partial', TranslationKey> = {
  success: 'dashboard.settings.debug.lockAllAchievements.success',
  partial: 'dashboard.settings.debug.lockAllAchievements.partial',
}
const UNLOCK_ALL_RESULT_KEYS: Record<'success' | 'partial', TranslationKey> = {
  success: 'dashboard.settings.debug.unlockAllAchievements.success',
  partial: 'dashboard.settings.debug.unlockAllAchievements.partial',
}
const LOG_POLL_INTERVAL_MS = 1000

// Session/identity-adjacent keys deliberately left out of an exported settings snapshot - mirrors
// `main`'s ExportSettings.tsx excluding `apiKey`/`steamCookies` for the same "don't leak
// account-identifying data into a bug-report paste" reason. `sgi.session.accounts` isn't a
// "setting" anyway (it's login state, already covered by `account`/`isPortable` context above it).
const EXCLUDED_LOCAL_STORAGE_KEYS = [
  'sgi.session.accounts',
  'sgi.session.account',
  'licenseKey',
  'cachedSubscription',
]

function collectLocalStorageSnapshot() {
  const snapshot: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || EXCLUDED_LOCAL_STORAGE_KEYS.includes(key)) continue
    const value = localStorage.getItem(key)
    if (value === null) continue
    try {
      snapshot[key] = JSON.parse(value)
    } catch {
      snapshot[key] = value
    }
  }
  return snapshot
}

interface UseDebugSettingsArgs {
  account: SignedInAccount | null
  // Re-fetch callbacks for the other tabs' own hook instances (SettingsModal already owns these) -
  // `resetSettings` calls these after a successful reset so General/Achievement Unlocker/Inventory
  // Manager/Card Farming's currently-mounted state doesn't go stale (every SettingsModal TabPanel
  // stays mounted regardless of which tab is selected, see useAchievementUnlockerSettings.ts's doc
  // comment).
  refreshGeneralSettings: () => void
  refreshAchievementUnlockerSettings: () => void
  refreshInventorySettings: () => void
  refreshCardFarmingSettings: () => void
  refreshFreeGamesSettings: () => void
  refreshOwnershipSettings: () => void
}

// Backs the Debug tab: a live-polling log viewer, reveal-in-Explorer for the log/settings files, a
// clipboard JSON export, a settings reset, and a full local data wipe - none of this is a
// mechanical port of `main`'s own Debug tab. Log lines/system info only load while this tab is
// actually active (isOpen && activeTab
// === 'debug'), same tab-gating convention useAchievementUnlockerSettings/useInventorySettings use.
export function useDebugSettings({
  account,
  refreshGeneralSettings,
  refreshAchievementUnlockerSettings,
  refreshInventorySettings,
  refreshCardFarmingSettings,
  refreshFreeGamesSettings,
  refreshOwnershipSettings,
}: UseDebugSettingsArgs) {
  const { t } = useTranslation()
  const router = useRouter()
  const isOpen = useSettingsModalStore(state => state.isOpen)
  const activeTab = useSettingsModalStore(state => state.activeTab)
  const closeSettingsModal = useSettingsModalStore(state => state.close)
  const isActive = isOpen && activeTab === 'debug'

  const [logLines, setLogLines] = useState<string[]>([])
  const [logsErrorCode, setLogsErrorCode] = useState<string | null>(null)
  const [isClearingLogs, setIsClearingLogs] = useState(false)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [isPortable, setIsPortable] = useState<boolean | null>(null)
  const [appVersion, setAppVersion] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isClearingData, setIsClearingData] = useState(false)
  const [isViewingLogFile, setIsViewingLogFile] = useState(false)
  const [isViewingSettingsFile, setIsViewingSettingsFile] = useState(false)
  // Which library-wide achievement run (if any) this tab started, and its latest progress event -
  // drive the confirmation dialog's locked-open running state. The backend independently refuses
  // overlapping runs, see `library_run.rs`.
  const [libraryRun, setLibraryRun] = useState<'lock' | 'unlock' | null>(null)
  const [libraryRunProgress, setLibraryRunProgress] = useState<LibraryRunProgress | null>(null)

  const loadLogs = useCallback(async () => {
    try {
      setLogLines(await invoke<string[]>('get_log_lines', { limit: LOG_LINES_LIMIT }))
      setLogsErrorCode(null)
    } catch (error) {
      console.error('Error in (get_log_lines):', error)
      setLogsErrorCode(String(error))
    }
  }, [])

  useEffect(() => {
    if (!isActive) return
    loadLogs()
    const intervalId = setInterval(loadLogs, LOG_POLL_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [isActive, loadLogs])

  useEffect(() => {
    if (!isActive) return
    invoke<SystemInfo>('get_system_info')
      .then(setSystemInfo)
      .catch(error => console.error('Error in (get_system_info):', error))
    invoke<boolean>('is_portable')
      .then(setIsPortable)
      .catch(error => console.error('Error in (is_portable):', error))
    getVersion().then(setAppVersion)
  }, [isActive])

  const viewLogFile = useCallback(async () => {
    setIsViewingLogFile(true)
    try {
      const path = await invoke<string>('get_log_file_path')
      await revealItemInDir(path)
    } catch (error) {
      console.error('Error in (viewLogFile):', error)
      toast.danger(t(debugErrorMessageKey(String(error)), { code: String(error) }))
    } finally {
      setIsViewingLogFile(false)
    }
  }, [t])

  const viewSettingsFile = useCallback(async () => {
    setIsViewingSettingsFile(true)
    try {
      const path = await invoke<string>('get_settings_file_path')
      await revealItemInDir(path)
    } catch (error) {
      console.error('Error in (viewSettingsFile):', error)
      toast.danger(t(errorMessageKey(String(error)), { code: String(error) }))
    } finally {
      setIsViewingSettingsFile(false)
    }
  }, [t])

  const clearLogs = useCallback(async () => {
    setIsClearingLogs(true)
    try {
      await invoke('clear_log_file')
      await loadLogs()
      toast.success(t('dashboard.settings.debug.logs.cleared'))
    } catch (error) {
      console.error('Error in (clearLogs):', error)
      toast.danger(t(debugErrorMessageKey(String(error)), { code: String(error) }))
    } finally {
      setIsClearingLogs(false)
    }
  }, [loadLogs, t])

  const exportSettings = useCallback(async () => {
    setIsExporting(true)
    try {
      const [version, exportedSystemInfo, exportedIsPortable, appSettings] = await Promise.all([
        getVersion(),
        invoke<SystemInfo>('get_system_info'),
        invoke<boolean>('is_portable'),
        invoke<Settings>('get_settings'),
      ])

      let achievementUnlockerSettings: AchievementUnlockerSettings | null = null
      let inventorySettings: InventorySettings | null = null
      let cardFarmingSettings: CardFarmingSettings | null = null
      let freeGamesSettings: FreeGamesSettings | null = null
      if (account) {
        ;[achievementUnlockerSettings, inventorySettings, cardFarmingSettings, freeGamesSettings] =
          await Promise.all([
            invoke<AchievementUnlockerSettings>('get_achievement_unlocker_settings', { account }),
            invoke<InventorySettings>('get_inventory_settings', { account }),
            invoke<CardFarmingSettings>('get_card_farming_settings', { account }),
            invoke<FreeGamesSettings>('get_free_games_settings', { account }),
          ])
      }

      const exportData = {
        version,
        system: { ...exportedSystemInfo, isPortable: exportedIsPortable },
        // The API key itself is sensitive - only note whether one is set, same redaction main's
        // ExportSettings.tsx applies to its own `general.apiKey` field.
        settings: {
          ...appSettings,
          steamWebApiKey: appSettings.steamWebApiKey ? '<redacted>' : null,
        },
        achievementUnlockerSettings,
        inventorySettings,
        cardFarmingSettings,
        freeGamesSettings,
        localStorage: collectLocalStorageSnapshot(),
      }

      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
      toast.success(t('dashboard.settings.debug.exportSettings.success'))
    } catch (error) {
      console.error('Error in (exportSettings):', error)
      toast.danger(t('dashboard.settings.debug.exportSettings.error'))
    } finally {
      setIsExporting(false)
    }
  }, [account, t])

  const resetSettings = useCallback(async () => {
    setIsResetting(true)
    try {
      await invoke<ResetSettingsResult>('reset_settings', { account })
      refreshGeneralSettings()
      if (account) {
        refreshAchievementUnlockerSettings()
        refreshInventorySettings()
        refreshCardFarmingSettings()
        refreshFreeGamesSettings()
      }
      if (account?.mode === 'agent') {
        // Ownership settings reset back to its default (games-only) alongside every other
        // per-account setting above - unlike those, a changed scope also changes what
        // `get_owned_games` itself returns, so the games list needs an explicit refetch, not just
        // this modal's own displayed value refreshing.
        refreshOwnershipSettings()
        fetchGamesList(account, { showLoadingState: true })
      }

      // `refreshGeneralSettings()` only updates this modal's own local snapshot - every denormalized
      // live-sync store (theme/font/tooltips/carousels/background/anti-away/auto-update-games-list)
      // is hydrated once on app boot (see e.g. useTheme.ts) and otherwise only reacts when its own
      // settings tab's save handler writes it directly. Without this, a reset would silently persist
      // to defaults on disk while the running app kept showing/using the old values until the next
      // relaunch - mirror every individual save handler's own instant-apply call here instead.
      applyThemePreset('default')
      localStorage.setItem(THEME_STORAGE_KEY, 'default')
      applyFont(null)
      localStorage.setItem(FONT_STORAGE_KEY, 'inter')
      useDisableTooltipsStore.getState().setDisabled(false)
      useCarouselSettingsStore.getState().setShowRecommended(true)
      useCarouselSettingsStore.getState().setShowRecent(true)
      useCustomBackgroundStore.getState().setDataUrl(null)
      useAntiAwayStore.getState().setEnabled(false)
      useAutoUpdateGamesListStore.getState().setEnabled(false)
      useAutoUpdateGamesListStore.getState().setHasCustomApiKey(false)

      logFrontendInfo('useDebugSettings', 'settings reset to defaults', {
        hadActiveAccount: !!account,
      })
      toast.success(t('dashboard.settings.debug.resetSettings.success'))
    } catch (error) {
      console.error('Error in (resetSettings):', error)
      toast.danger(t(debugErrorMessageKey(String(error)), { code: String(error) }))
    } finally {
      setIsResetting(false)
    }
  }, [
    account,
    refreshGeneralSettings,
    refreshAchievementUnlockerSettings,
    refreshInventorySettings,
    refreshCardFarmingSettings,
    refreshFreeGamesSettings,
    refreshOwnershipSettings,
    t,
  ])

  // Full local reset: signs every account out (not just the active one - a partial wipe doesn't
  // make sense given recent-searches/locked-items are already global, not per-account), clears
  // logs and the entire
  // on-disk cache directory (every account's cached games/achievements/inventory/card-farming
  // state - mirrors main's delete_all_cache_files), then wipes remaining localStorage via the same
  // `preserveKeysAndClearData` the major-update relaunch path already uses (keeps a small QoL
  // allowlist - theme, dismissed banners, etc.).
  const clearData = useCallback(async () => {
    setIsClearingData(true)
    try {
      const accountKeys = Object.keys(useSessionStore.getState().accounts)
      for (const key of accountKeys) {
        await signOutAccount(key)
      }
      try {
        await invoke('clear_log_file')
      } catch (error) {
        console.error('Error in (clear_log_file) during clearData:', error)
      }
      try {
        await invoke('clear_all_cache_files')
      } catch (error) {
        console.error('Error in (clear_all_cache_files) during clearData:', error)
      }
      logFrontendInfo('useDebugSettings', 'full local data wipe initiated', {
        accountsSignedOut: accountKeys.length,
      })
      await preserveKeysAndClearData()
      closeSettingsModal()
      await router.replace('/')
    } catch (error) {
      console.error('Error in (clearData):', error)
      toast.danger(t(debugErrorMessageKey(String(error)), { code: String(error) }))
    } finally {
      setIsClearingData(false)
    }
  }, [closeSettingsModal, router, t])

  // Locks or unlocks every achievement in every owned game for the active account. The whole
  // library run (concurrency, skipping achievement-less titles, per-game failure handling and
  // logging, refusing to overlap the achievement unlocker) lives in
  // `set_all_owned_games_achievements` - this only reports its summary.
  const setAllAchievements = useCallback(
    async (unlock: boolean) => {
      if (!account) return
      setLibraryRun(unlock ? 'unlock' : 'lock')
      setLibraryRunProgress(null)
      // Subscribed before invoking so the backend's initial 0-of-N event can't be missed. Not
      // filtered by `steamId`: the confirmation dialog stays modal for the whole run, so this tab
      // can't have started a second one for another account in the meantime.
      let unlisten: (() => void) | undefined
      try {
        unlisten = await listen<LibraryRunProgress>(LIBRARY_RUN_PROGRESS_EVENT, event => {
          setLibraryRunProgress(event.payload)
        })
        const result = await invoke<LibraryBulkSetResult>('set_all_owned_games_achievements', {
          account,
          unlock,
        })
        const values = {
          achievements: result.achievementsChanged,
          games: result.gamesChanged,
          failed: result.gamesFailed,
        }
        const keys = unlock ? UNLOCK_ALL_RESULT_KEYS : LOCK_ALL_RESULT_KEYS
        if (result.gamesFailed > 0) {
          toast.warning(t(keys.partial, values))
        } else {
          toast.success(t(keys.success, values))
        }
      } catch (error) {
        console.error('Error in (setAllAchievements):', error)
        toast.danger(t(debugErrorMessageKey(String(error)), { code: String(error) }))
      } finally {
        unlisten?.()
        setLibraryRun(null)
        setLibraryRunProgress(null)
      }
    },
    [account, t],
  )

  return {
    logLines,
    logsErrorCode,
    isClearingLogs,
    systemInfo,
    isPortable,
    appVersion,
    isExporting,
    isResetting,
    isClearingData,
    isViewingLogFile,
    isViewingSettingsFile,
    libraryRun,
    libraryRunProgress,
    viewLogFile,
    viewSettingsFile,
    clearLogs,
    exportSettings,
    resetSettings,
    clearData,
    setAllAchievements,
  }
}
