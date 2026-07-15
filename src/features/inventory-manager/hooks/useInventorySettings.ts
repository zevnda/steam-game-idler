import type { InventorySettings } from '../types'
import { useCallback, useState } from 'react'
import { useTabGatedLoad } from '@/features/settings/hooks/useTabGatedLoad'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

// Backs the inventory-manager tab in the (app-wide) SettingsModal - mirrors
// useAchievementUnlockerSettings.ts exactly, including why a per-account category lives inside an
// otherwise app-wide modal, and why this only loads while its own tab is active rather than
// whenever the modal is open (SettingsModal's
// TabPanels all stay mounted regardless of which tab is selected, so the load itself has to be the
// thing that's gated, not the render).
//
// The inventory-manager *page* itself also needs these values (to default-fill a price from the
// configured price preference and to enforce the sell-limit range before listing) - it fetches its
// own independent copy via `useInventory` rather than sharing this hook's state, since a plain
// two-copy read/edit split is simpler than a shared store for what's otherwise two genuinely
// different consumption patterns (tab-gated edit vs. mount-gated read). This modal is an overlay
// (see useSettingsModalStore's doc comment) that can be open while the page underneath stays
// mounted, so a save here alone would leave the page's copy stale - `useInventory`'s
// `refreshSettings` covers that by re-reading on the modal's close transition (see
// InventoryManagerPage.tsx's own effect), not by remounting.
export const useInventorySettings = () => {
  const isOpen = useSettingsModalStore(state => state.isOpen)
  const activeTab = useSettingsModalStore(state => state.activeTab)
  const account = useSessionStore(state => state.account)
  const [settings, setSettings] = useState<InventorySettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null)
  const [actionErrorCode, setActionErrorCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!account) return
    setIsLoading(true)
    setLoadErrorCode(null)
    try {
      setSettings(await invoke<InventorySettings>('get_inventory_settings', { account }))
    } catch (error) {
      console.error('Error in (get_inventory_settings):', error)
      setLoadErrorCode(String(error))
    } finally {
      setIsLoading(false)
    }
  }, [account])

  useTabGatedLoad(
    isOpen && activeTab === 'inventoryManager',
    account ? getAccountKey(account) : null,
    load,
  )

  const save = useCallback(
    async (next: InventorySettings) => {
      if (!account) return false
      setIsSaving(true)
      setActionErrorCode(null)
      try {
        setSettings(
          await invoke<InventorySettings>('set_inventory_settings', {
            account,
            settings: next,
          }),
        )
        const changedKeys = settings
          ? (Object.keys(next) as (keyof InventorySettings)[]).filter(k => next[k] !== settings[k])
          : Object.keys(next)
        logFrontendInfo('useInventorySettings', 'inventory settings saved', { changedKeys })
        return true
      } catch (error) {
        console.error('Error in (set_inventory_settings):', error)
        setActionErrorCode(String(error))
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [account, settings],
  )

  return {
    settings,
    isLoading,
    isSaving,
    loadErrorCode,
    actionErrorCode,
    refresh: load,
    save,
  }
}
