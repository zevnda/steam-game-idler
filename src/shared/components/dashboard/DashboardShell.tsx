import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { AddAccountModal } from '@/features/account-switcher/components/AddAccountModal'
import { useAgentAccountCapEnforcement } from '@/features/account-switcher/hooks/useAgentAccountCapEnforcement'
import { AchievementManagerOverlay } from '@/features/achievement-manager/components/AchievementManagerOverlay'
import { AchievementOrderOverlay } from '@/features/achievement-unlocker/components/AchievementOrderOverlay'
import { useAchievementUnlockerSync } from '@/features/achievement-unlocker/hooks/useAchievementUnlockerSync'
import { useAutoIdleStartup } from '@/features/auto-idle/hooks/useAutoIdleStartup'
import { useAutoFarmCards } from '@/features/card-farming/hooks/useAutoFarmCards'
import { useCardFarmingSync } from '@/features/card-farming/hooks/useCardFarmingSync'
import { useFreeGameClaimCorrections } from '@/features/free-games/hooks/useFreeGameClaimCorrections'
import { useFreeGamesWatcher } from '@/features/free-games/hooks/useFreeGamesWatcher'
import { useGamesListSync } from '@/features/games-list/hooks/useGamesListSync'
import { useIdlingSync } from '@/features/idling/hooks/useIdlingSync'
import { SettingsModal } from '@/features/settings/components/SettingsModal'
import { Banner } from '@/shared/components/Banner'
import { CustomBackground } from '@/shared/components/CustomBackground'
import { GlobalSearchModal } from '@/shared/components/search/GlobalSearchModal'
import { SteamWarning } from '@/shared/components/SteamWarning'
import { useAccountSummaries } from '@/shared/hooks/useAccountSummaries'
import { useAchievementUnlockerConcurrencyGuard } from '@/shared/hooks/useAchievementUnlockerConcurrencyGuard'
import { useAntiAwayStatus } from '@/shared/hooks/useAntiAwayStatus'
import { useAutoUpdateGamesListStatus } from '@/shared/hooks/useAutoUpdateGamesListStatus'
import { useCarouselSettingsSync } from '@/shared/hooks/useCarouselSettingsSync'
import { useCheckSubscription } from '@/shared/hooks/useCheckSubscription'
import { useDashboardShortcuts } from '@/shared/hooks/useDashboardShortcuts'
import { useDisableTooltipsSync } from '@/shared/hooks/useDisableTooltipsSync'
import { useGlobalSearchShortcut } from '@/shared/hooks/useGlobalSearchShortcut'
import { usePresenceProGuard } from '@/shared/hooks/usePresenceProGuard'
import { useSortPreferencesSync } from '@/shared/hooks/useSortPreferencesSync'
import { useSteamCookiesSync } from '@/shared/hooks/useSteamCookiesSync'
import { useSteamMonitor } from '@/shared/hooks/useSteamMonitor'
import { useSubscriptionCacheSync } from '@/shared/hooks/useSubscriptionCacheSync'

interface DashboardShellProps {
  children: ReactNode
}

// Persistent wrapper for every route under /dashboard/* - mounted once in `_app.tsx` and never
// unmounted by route changes within /dashboard/*, so anything mounted here as a sibling of
// `children` keeps its state/timers untouched by navigation between routed pages. This is what
// lets card farming / achievement unlocker keep running when the user navigates away and back.
export const DashboardShell = ({ children }: DashboardShellProps) => {
  // Mounted here, not inside the idling/games-list pages themselves, so they keep running (and
  // their stores stay current) regardless of which /dashboard/* route is active - see each sync
  // hook's own doc comment.
  useIdlingSync()
  useGamesListSync()
  useCardFarmingSync()
  useAutoFarmCards()
  useAchievementUnlockerSync()
  useAutoIdleStartup()
  useSubscriptionCacheSync()
  useCheckSubscription()
  useAgentAccountCapEnforcement()
  usePresenceProGuard()
  useAchievementUnlockerConcurrencyGuard()
  useGlobalSearchShortcut()
  useDashboardShortcuts()
  useAccountSummaries()
  useAntiAwayStatus()
  useAutoUpdateGamesListStatus()
  useFreeGamesWatcher()
  useFreeGameClaimCorrections()
  useDisableTooltipsSync()
  useCarouselSettingsSync()
  useSteamMonitor()
  useSteamCookiesSync()
  useSortPreferencesSync()

  return (
    <div className='flex h-screen w-screen'>
      <CustomBackground />
      <Sidebar />
      {/* pt-10 mirrors Sidebar's own top spacer - keeps routed page content out from under the
          global Titlebar's drag region. No `bg-background` here (unlike Sidebar, which stays
          solid regardless of a custom background) - `CustomBackground` is the sole owner of this
          area's canvas, whether that's a plain solid layer or a Casual-tier image, see its own
          doc comment. */}
      <main className='min-w-0 flex-1 overflow-y-auto pt-16'>{children}</main>

      <SettingsModal />
      <AddAccountModal />
      <AchievementManagerOverlay />
      <AchievementOrderOverlay />
      <GlobalSearchModal />
      <SteamWarning />
      <Banner />

      {/*
        No achievement-unlocker running-state overlay here - card farming already proved the
        simpler shape below works for "a long-running backend
        process whose progress must survive route changes," so this step applied it instead of
        building a second, different mechanism for the same problem. `useAchievementUnlockerSync`
        above keeps a running session's progress current in `achievementUnlockerStore` regardless
        of route, and `/dashboard/achievement-unlocker` (`AchievementUnlockerPage`) reads that
        store directly - the queue/config editor overlay above (`AchievementOrderOverlay`) is a
        different, separately-shipped concern (per-game order/skip/delay editing), not the
        running-state display this comment used to describe as still-pending.
      */}
    </div>
  )
}
