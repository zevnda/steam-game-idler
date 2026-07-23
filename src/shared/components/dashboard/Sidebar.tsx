import type { TranslationKey } from '@/i18n'
import type { ComponentType } from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TbAward,
  TbBuildingStore,
  TbCards,
  TbDeviceGamepad2,
  TbGift,
  TbHeart,
  TbHourglassLow,
  TbPlayerPlay,
  TbSettings,
} from 'react-icons/tb'
import { SidebarItem } from './SidebarItem'
import { cn, Typography } from '@heroui/react'
import { AccountSwitcher } from '@/features/account-switcher/components/AccountSwitcher'
import { useFreeGames } from '@/features/free-games/hooks/useFreeGames'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { AdSlot } from '@/shared/components/pro/AdSlot'
import { TierBadge } from '@/shared/components/TierBadge'
import { useAchievementUnlockerStore } from '@/shared/stores/achievementUnlockerStore'
import { useCardFarmingStore } from '@/shared/stores/cardFarmingStore'
import { useIdlingStore } from '@/shared/stores/idlingStore'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { useSidebarStore } from '@/shared/stores/sidebarStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'

interface SidebarItemConfig {
  href: string
  icon: ComponentType<{ fontSize?: number; className?: string }>
  labelKey: TranslationKey
  // Driven by `idlingStore` (kept current by `useIdlingSync`, mounted in `DashboardShell`) - see
  // the `pulsing` render below.
  pulseWhenIdling?: boolean
  // Same idea as `pulseWhenIdling`, driven by `cardFarmingStore` (kept current by
  // `useCardFarmingSync`) - lets a user know a farming cycle is still running from any page,
  // without needing a separate persistent overlay widget (see DashboardShell's mount-point
  // comment for why card farming didn't end up needing one).
  pulseWhenFarming?: boolean
  // Same idea again, driven by `achievementUnlockerStore` (kept current by
  // `useAchievementUnlockerSync`) - the achievement-unlocker automation loop uses the same
  // sync-hook-plus-store shape card farming already proved, see DashboardShell's mount-point
  // comment.
  pulseWhenUnlocking?: boolean
  // Driven by `useFreeGames` (free games only) - golds just the icon when there's at least one
  // unowned free game still claimable, mirroring `main`'s sidebar highlight but scoped to the icon
  // rather than also recoloring the label.
  goldWhenClaimable?: boolean
}

interface SidebarSectionConfig {
  headerKey: TranslationKey
  items: SidebarItemConfig[]
}

// Data-driven, not an index-keyed header map like `main`'s fragile `{0: 'Games', 4: 'Automation',
// ...}` approach. Route paths match the real files under `src/pages/dashboard/`.
const sections: SidebarSectionConfig[] = [
  {
    headerKey: 'dashboard.sidebar.nav.games',
    items: [
      { href: '/dashboard', icon: TbDeviceGamepad2, labelKey: 'dashboard.sidebar.nav.games' },
      {
        href: '/dashboard/idling',
        icon: TbPlayerPlay,
        labelKey: 'dashboard.sidebar.nav.idling',
        pulseWhenIdling: true,
      },
      { href: '/dashboard/favorites', icon: TbHeart, labelKey: 'dashboard.sidebar.nav.favorites' },
      {
        href: '/dashboard/free-games',
        icon: TbGift,
        labelKey: 'dashboard.sidebar.nav.freeGames',
        goldWhenClaimable: true,
      },
    ],
  },
  {
    headerKey: 'dashboard.sidebar.section.automation',
    items: [
      {
        href: '/dashboard/card-farming',
        icon: TbCards,
        labelKey: 'dashboard.sidebar.nav.cardFarming',
        pulseWhenFarming: true,
      },
      {
        href: '/dashboard/achievement-unlocker',
        icon: TbAward,
        labelKey: 'dashboard.sidebar.nav.achievementUnlocker',
        pulseWhenUnlocking: true,
      },
      {
        href: '/dashboard/auto-idle',
        icon: TbHourglassLow,
        labelKey: 'dashboard.sidebar.nav.autoIdle',
      },
    ],
  },
  {
    headerKey: 'dashboard.sidebar.section.misc',
    items: [
      {
        href: '/dashboard/inventory-manager',
        icon: TbBuildingStore,
        labelKey: 'dashboard.sidebar.nav.inventoryManager',
      },
    ],
  },
]

// Collapse state comes from `sidebarStore` (toggled by Ctrl+W - see useDashboardShortcuts.ts),
// hydrated from `localStorage` on mount here rather than at module init since that API doesn't
// exist during Next.js's SSR pass. `hydrated` (also read by Titlebar.tsx, which animates its own
// margin off the same `collapsed` value) gates the transition class so the very first paint -
// which may already be collapsed, for a returning user - never animates; only a toggle that
// happens after mount should animate.
export const Sidebar = () => {
  const { t } = useTranslation()
  const isIdling = useIdlingStore(state => state.appIds.length > 0)
  const isFarming = useCardFarmingStore(state => state.state.isFarming)
  const isUnlocking = useAchievementUnlockerStore(state => state.state.isRunning)
  const { freeGames } = useFreeGames()
  const hasClaimableFreeGames = freeGames.length > 0
  const openSettings = useSettingsModalStore(state => state.open)
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)
  const collapsed = useSidebarStore(state => state.collapsed)
  const hydrated = useSidebarStore(state => state.hydrated)

  useEffect(() => {
    useSidebarStore.getState().hydrate()
  }, [])

  return (
    <nav
      className={cn(
        'flex h-screen shrink-0 flex-col border-r border-border bg-background',
        hydrated && 'transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Plain h-10 spacer - keeps nav content clear of the global Titlebar's drag region (h-10,
          full window width, z-50), which now renders the brand/logo itself (see Titlebar.tsx). */}
      <div className='h-10 shrink-0' data-tauri-drag-region />
      <div
        className={cn(
          'flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-2 pb-2',
          collapsed ? ' pt-6' : ' pt-9',
        )}
      >
        {sections.map(section => (
          <div key={section.headerKey} className='flex flex-col gap-0.5'>
            {!collapsed && (
              <Typography
                className='px-3 pb-1 uppercase tracking-wide'
                color='muted'
                type='body-xs'
                weight='semibold'
              >
                {t(section.headerKey)}
              </Typography>
            )}
            {section.items.map(item => (
              <SidebarItem
                key={item.href}
                collapsed={collapsed}
                href={item.href}
                icon={item.icon}
                iconHighlighted={item.goldWhenClaimable && hasClaimableFreeGames}
                label={t(item.labelKey)}
                pulsing={
                  (item.pulseWhenIdling && isIdling) ||
                  (item.pulseWhenFarming && isFarming) ||
                  (item.pulseWhenUnlocking && isUnlocking)
                }
              />
            ))}
          </div>
        ))}
      </div>

      <div className='flex shrink-0 items-center justify-center overflow-hidden px-2 mb-2'>
        <AdSlot />
      </div>

      <div className='shrink-0 border-t border-border p-2'>
        {/* Tier indicator - clickable for `casual` only (the one tier with somewhere left to
            upgrade to), opening GoProModal pre-scrolled to the Gamer tier card via
            `openWithTier('gamer')` (see GoProModal's `requiredTier` scroll effect). `gamer` is
            already the max tier so its badge stays a static label, matching the titlebar GoPro
            button being hidden entirely at `gamer` (see GoPro.tsx). `free` (`null`) also stays
            static here since the titlebar's GoPro button is that tier's CTA. Hidden until the
            subscription check actually reports a result, so it never flashes an incorrect tier
            before `useCheckSubscription` (mounted in `DashboardShell`) resolves. Dropped entirely
            while collapsed - there's no room for a label+badge row at icon-rail width, and the
            badge alone with no label would misread as a nav item. */}
        {isSubscribed !== null &&
          !collapsed &&
          (subscriptionTier === 'casual' ? (
            <button
              aria-label='Upgrade plan'
              className='flex w-full items-center justify-between rounded-lg px-3 py-2 cursor-pointer outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus'
              type='button'
              onClick={() => openProModalWithTier('gamer')}
            >
              <Typography color='muted' type='body-xs' weight='semibold'>
                {t('dashboard.sidebar.tier.label')}
              </Typography>
              <TierBadge tier={subscriptionTier} />
            </button>
          ) : (
            <div className='flex items-center justify-between rounded-lg px-3 py-2'>
              <Typography color='muted' type='body-xs' weight='semibold'>
                {t('dashboard.sidebar.tier.label')}
              </Typography>
              <TierBadge tier={subscriptionTier} />
            </div>
          ))}
        {/* Discord-style user bar: the account switcher's avatar/name is its own popover trigger,
            Settings sits beside it as a plain icon button - not a separate full-width row. Sign-out
            no longer has a dedicated row here at all; AccountSwitcher is the app's one sign-out
            entry point now (a row per account, including the active one), so a standalone button
            that only ever signed out the active account was pure duplication. */}
        <div className={cn('flex items-center gap-1', collapsed && 'flex-col')}>
          <AccountSwitcher compact={collapsed} />
          {collapsed ? (
            <AppTooltip.Root delay={300}>
              <AppTooltip.Trigger>
                <button
                  aria-label={t('common.actions.settings')}
                  className='shrink-0 rounded-lg p-2.5 text-foreground outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus'
                  type='button'
                  onClick={() => openSettings()}
                >
                  <TbSettings fontSize={18} />
                </button>
              </AppTooltip.Trigger>
              <AppTooltip.Content placement='right'>
                {t('common.actions.settings')}
              </AppTooltip.Content>
            </AppTooltip.Root>
          ) : (
            <button
              aria-label={t('common.actions.settings')}
              className='shrink-0 rounded-lg p-2.5 text-foreground outline-none cursor-pointer transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus'
              type='button'
              onClick={() => openSettings()}
            >
              <TbSettings fontSize={18} />
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
