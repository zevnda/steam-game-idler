import type { TranslationKey } from '@/i18n'
import type { SettingsTab } from '@/shared/stores/settingsModalStore'
import type { ReactNode } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronRight } from 'react-icons/tb'
import { useSettingsModal } from '../hooks/useSettingsModal'
import { useSteamCredentialsSettings } from '../hooks/useSteamCredentialsSettings'
import { CustomizationSettingsTab } from './CustomizationSettingsTab'
import { DebugSettingsTab } from './DebugSettingsTab'
import { FreeGamesSettingsTab } from './FreeGamesSettingsTab'
import { GameSettingsTab } from './game-settings/GameSettingsTab'
import { GeneralSettingsTab } from './GeneralSettingsTab'
import { KeybindsSettingsTab } from './KeybindsSettingsTab'
import { SteamCredentialsTab } from './SteamCredentialsTab'
import { SubscriptionSettingsTab } from './SubscriptionSettingsTab'
import {
  cn,
  Modal,
  Tab,
  TabList,
  TabListContainer,
  TabPanel,
  TabsRoot,
  Typography,
} from '@heroui/react'
import { AchievementUnlockerSettingsTab } from '@/features/achievement-unlocker/components/AchievementUnlockerSettingsTab'
import { useAchievementUnlockerSettings } from '@/features/achievement-unlocker/hooks/useAchievementUnlockerSettings'
import { CardFarmingSettingsTab } from '@/features/card-farming/components/CardFarmingSettingsTab'
import { useCardFarmingSettings } from '@/features/card-farming/hooks/useCardFarmingSettings'
import { useFreeGamesSettings } from '@/features/free-games/hooks/useFreeGamesSettings'
import { InventorySettingsTab } from '@/features/inventory-manager/components/InventorySettingsTab'
import { useInventorySettings } from '@/features/inventory-manager/hooks/useInventorySettings'
import { SocialButtons } from '@/shared/components/SocialButtons'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'

// Data-driven tab list, in `main`'s category order - extending this array plus `SettingsTab`
// (settingsModalStore.ts) is how each feature adds its own settings category once it exists, no
// restructuring needed. Mirrors Sidebar.tsx's data-driven `sections` array for the same reason.
// 'cardFarming'/'freeGames'/'achievementUnlocker'/'inventoryManager' reuse the sidebar's own nav
// labels rather than duplicating the same English string under a second key - 'achievementUnlocker'/
// 'inventoryManager' are also genuinely per-account categories living inside this otherwise
// app-wide modal (see useAchievementUnlockerSettings.ts's doc comment for why).
const TABS: { key: SettingsTab; labelKey: TranslationKey }[] = [
  { key: 'general', labelKey: 'dashboard.settings.general.title' },
  { key: 'subscription', labelKey: 'dashboard.settings.subscription.title' },
  { key: 'customization', labelKey: 'dashboard.settings.customization.title' },
  { key: 'steamCredentials', labelKey: 'dashboard.settings.steamCredentials.title' },
  { key: 'cardFarming', labelKey: 'dashboard.sidebar.nav.cardFarming' },
  { key: 'achievementUnlocker', labelKey: 'dashboard.sidebar.nav.achievementUnlocker' },
  { key: 'inventoryManager', labelKey: 'dashboard.sidebar.nav.inventoryManager' },
  { key: 'freeGames', labelKey: 'dashboard.sidebar.nav.freeGames' },
  { key: 'gameSettings', labelKey: 'dashboard.settings.gameSettings.title' },
  { key: 'keybinds', labelKey: 'dashboard.settings.keybinds.title' },
  { key: 'debug', labelKey: 'dashboard.settings.debug.title' },
]

// One `TabPanel` + a `main`-style "Settings >" breadcrumb, shared by every category below instead
// of each tab component rendering its own breadcrumb - each tab still owns its own `Typography
// type='h3'` page title (see e.g. GeneralSettingsTab.tsx), this only adds the muted trail above it.
//
// `fill` (default false) swaps the usual "column grows to content height, the whole panel scrolls"
// shape for "column stretches to the modal's own height, a child manages its own internal scroll" -
// only Debug's log viewer needs this (see DebugSettingsTab.tsx), so every other category is
// unaffected.
const SettingsPanel = ({
  id,
  fill = false,
  children,
}: {
  id: SettingsTab
  fill?: boolean
  children: ReactNode
}) => {
  const { t } = useTranslation()
  return (
    <TabPanel
      className={cn(
        'min-h-0 flex-1 py-8',
        fill ? 'flex flex-col overflow-hidden' : 'overflow-y-auto',
      )}
      id={id}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-4xl flex-col px-10 py-8',
          fill && 'min-h-0 flex-1',
        )}
      >
        <Typography
          className='flex items-center gap-1'
          color='muted'
          type='body-xs'
          weight='semibold'
        >
          {t('dashboard.settings.title')}
          <TbChevronRight fontSize={12} />
        </Typography>
        {children}
      </div>
    </TabPanel>
  )
}

// Mounted once in DashboardShell, driven entirely by settingsModalStore - decoupled from routing,
// so opening it never hijacks a page slot.
export const SettingsModal = () => {
  const { t } = useTranslation()
  const isOpen = useSettingsModalStore(state => state.isOpen)
  const activeTab = useSettingsModalStore(state => state.activeTab)
  const setActiveTab = useSettingsModalStore(state => state.setActiveTab)
  const close = useSettingsModalStore(state => state.close)
  const {
    settings,
    isLoading,
    isSaving,
    loadErrorCode,
    actionErrorCode,
    refresh,
    saveSteamWebApiKey,
    saveAntiAway,
    saveStartMinimized,
    saveCloseToTray,
    saveAutoUpdateGamesList,
    saveFreeGameNotifications,
    saveTheme,
    saveFont,
    saveDisableTooltips,
    saveShowRecommendedCarousel,
    saveShowRecentCarousel,
    saveCustomBackground,
    clearCustomBackground,
  } = useSettingsModal()
  const achievementUnlocker = useAchievementUnlockerSettings()
  const inventoryManager = useInventorySettings()
  const cardFarming = useCardFarmingSettings()
  const steamCredentials = useSteamCredentialsSettings()
  const freeGames = useFreeGamesSettings()
  const [appVersion, setAppVersion] = useState<string | null>(null)

  // Structural parity with `main`'s sidebar footer (a version string below the tab list).
  // `getVersion()` is a core `@tauri-apps/api` call (reads tauri.conf.json's `version` field), no
  // plugin or Rust command needed.
  useEffect(() => {
    if (isOpen) {
      getVersion().then(setAppVersion)
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onOpenChange={open => !open && close()}>
      <Modal.Backdrop>
        <Modal.Container size='cover'>
          {/* No visible `Modal.Header` bar - matches `main`'s look, a full-bleed sidebar+content
              split with only a floating dismiss button (see GoProModal's identical structural
              deviation for the established precedent). `Modal.Heading` still renders (visually
              hidden) so the dialog keeps a real accessible name for screen readers. */}
          <Modal.Dialog className='overflow-hidden p-0'>
            <Modal.Heading className='sr-only'>{t('dashboard.settings.title')}</Modal.Heading>
            <Modal.CloseTrigger className='absolute left-5 top-5 z-50 h-8 w-8 bg-field text-muted duration-150 hover:bg-field-hover rounded-full' />

            <Modal.Body className='flex h-full min-h-0 overflow-hidden p-0'>
              <TabsRoot
                className='flex h-full min-h-0 w-full'
                orientation='vertical'
                selectedKey={activeTab}
                onSelectionChange={key => setActiveTab(key as SettingsTab)}
              >
                {/* Fixed-width, non-scrolling nav column - `pt-16` clears the floating close
                    button above it, `border-r`/`bg-background` match Sidebar.tsx's own dashboard
                    nav column for visual consistency with the rest of the app's chrome. */}
                <div className='flex h-full w-64 shrink-0 flex-col border-r border-border bg-background pt-16'>
                  <TabListContainer className='min-h-0 flex-1 overflow-y-auto bg-transparent px-3'>
                    <TabList className='gap-0.5 p-0'>
                      {TABS.map(tab => (
                        <Tab
                          className={cn(
                            'w-full justify-start rounded-lg px-3 py-2 text-left text-sm font-medium',
                            'text-muted hover:text-foreground data-[selected=true]:font-semibold ',
                            'data-[selected=true]:text-foreground',
                          )}
                          id={tab.key}
                          key={tab.key}
                        >
                          {t(tab.labelKey)}
                        </Tab>
                      ))}
                    </TabList>
                  </TabListContainer>

                  <div className='shrink-0 pb-4 pt-2'>
                    <SocialButtons />

                    {appVersion && (
                      <Typography className='px-5 pt-2 text-center' color='muted' type='body-xs'>
                        {t('dashboard.settings.footer.version', { version: appVersion })}
                      </Typography>
                    )}
                  </div>
                </div>

                {/* Scrollable content column - each category is a `SettingsPanel` (breadcrumb +
                    its own page title/body), the only child that scrolls within this split. */}
                <SettingsPanel id='general'>
                  <GeneralSettingsTab
                    actionErrorCode={actionErrorCode}
                    closeToTray={settings?.closeToTray ?? true}
                    isLoading={isLoading}
                    isSaving={isSaving}
                    loadErrorCode={loadErrorCode}
                    startMinimized={settings?.startMinimized ?? false}
                    steamWebApiKey={settings?.steamWebApiKey ?? null}
                    onRefresh={refresh}
                    onSave={saveSteamWebApiKey}
                    onSaveAntiAway={saveAntiAway}
                    onSaveAutoUpdateGamesList={saveAutoUpdateGamesList}
                    onSaveCloseToTray={saveCloseToTray}
                    onSaveStartMinimized={saveStartMinimized}
                  />
                </SettingsPanel>

                <SettingsPanel id='subscription'>
                  <SubscriptionSettingsTab />
                </SettingsPanel>

                <SettingsPanel id='customization'>
                  <CustomizationSettingsTab
                    actionErrorCode={actionErrorCode}
                    isLoading={isLoading}
                    loadErrorCode={loadErrorCode}
                    settings={settings}
                    onClearCustomBackground={clearCustomBackground}
                    onRefresh={refresh}
                    onSaveCustomBackground={saveCustomBackground}
                    onSaveDisableTooltips={saveDisableTooltips}
                    onSaveShowRecentCarousel={saveShowRecentCarousel}
                    onSaveShowRecommendedCarousel={saveShowRecommendedCarousel}
                    onSaveTheme={saveTheme}
                    onSaveFont={saveFont}
                  />
                </SettingsPanel>

                <SettingsPanel id='steamCredentials'>
                  <SteamCredentialsTab
                    actionErrorCode={steamCredentials.actionErrorCode}
                    isAcquiring={steamCredentials.isAcquiring}
                    isLoading={steamCredentials.isLoading}
                    isSaving={steamCredentials.isSaving}
                    loadErrorCode={steamCredentials.loadErrorCode}
                    onAcquire={steamCredentials.acquire}
                    onRefresh={steamCredentials.refresh}
                    onSave={steamCredentials.save}
                  />
                </SettingsPanel>

                <SettingsPanel id='cardFarming'>
                  <CardFarmingSettingsTab
                    actionErrorCode={cardFarming.actionErrorCode}
                    isLoading={cardFarming.isLoading}
                    isSaving={cardFarming.isSaving}
                    loadErrorCode={cardFarming.loadErrorCode}
                    settings={cardFarming.settings}
                    onRefresh={cardFarming.refresh}
                    onSave={cardFarming.save}
                  />
                </SettingsPanel>

                <SettingsPanel id='achievementUnlocker'>
                  <AchievementUnlockerSettingsTab
                    actionErrorCode={achievementUnlocker.actionErrorCode}
                    isLoading={achievementUnlocker.isLoading}
                    isSaving={achievementUnlocker.isSaving}
                    loadErrorCode={achievementUnlocker.loadErrorCode}
                    settings={achievementUnlocker.settings}
                    onRefresh={achievementUnlocker.refresh}
                    onSave={achievementUnlocker.save}
                  />
                </SettingsPanel>

                <SettingsPanel id='inventoryManager'>
                  <InventorySettingsTab
                    actionErrorCode={inventoryManager.actionErrorCode}
                    isLoading={inventoryManager.isLoading}
                    isSaving={inventoryManager.isSaving}
                    loadErrorCode={inventoryManager.loadErrorCode}
                    settings={inventoryManager.settings}
                    onRefresh={inventoryManager.refresh}
                    onSave={inventoryManager.save}
                  />
                </SettingsPanel>

                <SettingsPanel id='freeGames'>
                  <FreeGamesSettingsTab
                    actionErrorCode={freeGames.actionErrorCode}
                    isEstablishingSession={freeGames.isEstablishingSession}
                    isClearingSession={freeGames.isClearingSession}
                    isLoading={freeGames.isLoading}
                    loadErrorCode={freeGames.loadErrorCode}
                    notificationsActionErrorCode={actionErrorCode}
                    settings={freeGames.settings}
                    onClearSession={freeGames.clearSession}
                    onEstablishSession={freeGames.establishSession}
                    onRefresh={freeGames.refresh}
                    onSaveFreeGameNotifications={saveFreeGameNotifications}
                    onToggleAutoRedeem={freeGames.toggleAutoRedeem}
                  />
                </SettingsPanel>

                {/* Self-contained, unlike the tabs above - `useGameSettings` isn't lifted here even
                    though `debug::commands::reset_settings` *does* wipe the per-game override maps/
                    auto-stop caps this tab reads/writes. Rather than adding a fifth refresh callback
                    to DebugSettingsTab, `useGameSettings`'s own tab-reactivation gating (`isActive`
                    in its per-game load effect) already re-fetches fresh values whenever this panel
                    becomes active again, so a reset while parked on another tab can't leave this
                    one showing stale data. */}
                <SettingsPanel id='gameSettings'>
                  <GameSettingsTab />
                </SettingsPanel>

                {/* Self-contained, like gameSettings above - a static reference list backed by
                    `useZoomControls`/`useDashboardShortcuts` (both mounted elsewhere), nothing here
                    needs lifting into this modal's own state. */}
                <SettingsPanel id='keybinds'>
                  <KeybindsSettingsTab />
                </SettingsPanel>

                <SettingsPanel fill id='debug'>
                  <DebugSettingsTab
                    refreshAchievementUnlockerSettings={achievementUnlocker.refresh}
                    refreshCardFarmingSettings={cardFarming.refresh}
                    refreshFreeGamesSettings={freeGames.refresh}
                    refreshGeneralSettings={refresh}
                    refreshInventorySettings={inventoryManager.refresh}
                  />
                </SettingsPanel>
              </TabsRoot>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
