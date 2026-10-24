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
import { cn } from '@heroui/react'
import { AccountSwitcher } from '@/features/account-switcher/components/AccountSwitcher'
import { useFreeGames } from '@/features/free-games/hooks/useFreeGames'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { AdSlot } from '@/shared/components/pro/AdSlot'
import { GoPro } from '@/shared/components/pro/GoPro'
import { useAchievementUnlockerStore } from '@/shared/stores/achievementUnlockerStore'
import { useCardFarmingStore } from '@/shared/stores/cardFarmingStore'
import { useIdlingStore } from '@/shared/stores/idlingStore'
import { useSettingsModalStore } from '@/shared/stores/settingsModalStore'
import { NARROW_WINDOW_QUERY, useSidebarStore } from '@/shared/stores/sidebarStore'

interface SidebarItemConfig {
  href: string
  icon: ComponentType<{ fontSize?: number; className?: string; strokeWidth?: number }>
  labelKey: TranslationKey
  // Driven by `idlingStore` (kept current by `useIdlingSync`, mounted in `DashboardShell`) - shows
  // SidebarItem's running dot (see the `running` prop passed below).
  runningWhenIdling?: boolean
  // Same idea as `runningWhenIdling`, driven by `cardFarmingStore` (kept current by
  // `useCardFarmingSync`) - lets a user know a farming cycle is still running from any page,
  // without needing a separate persistent overlay widget (see DashboardShell's mount-point
  // comment for why card farming didn't end up needing one).
  runningWhenFarming?: boolean
  // Same idea again, driven by `achievementUnlockerStore` (kept current by
  // `useAchievementUnlockerSync`) - the achievement-unlocker automation loop uses the same
  // sync-hook-plus-store shape card farming already proved, see DashboardShell's mount-point
  // comment.
  runningWhenUnlocking?: boolean
  // Driven by `useFreeGames` (free games only) - golds just the icon when there's at least one
  // unowned free game still claimable, mirroring `main`'s sidebar highlight but scoped to the icon
  // rather than also recoloring the label.
  goldWhenClaimable?: boolean
}

interface SidebarSectionConfig {
  id: string
  items: SidebarItemConfig[]
}

// Data-driven groups (games / automation / misc). Deliberately headerless - groups are separated
// only by the gap between them. Route paths match the real files under `src/pages/dashboard/`.
const sections: SidebarSectionConfig[] = [
  {
    id: 'games',
    items: [
      { href: '/dashboard', icon: TbDeviceGamepad2, labelKey: 'dashboard.sidebar.nav.games' },
      {
        href: '/dashboard/idling',
        icon: TbPlayerPlay,
        labelKey: 'dashboard.sidebar.nav.idling',
        runningWhenIdling: true,
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
    id: 'automation',
    items: [
      {
        href: '/dashboard/card-farming',
        icon: TbCards,
        labelKey: 'dashboard.sidebar.nav.cardFarming',
        runningWhenFarming: true,
      },
      {
        href: '/dashboard/achievement-unlocker',
        icon: TbAward,
        labelKey: 'dashboard.sidebar.nav.achievementUnlocker',
        runningWhenUnlocking: true,
      },
      {
        href: '/dashboard/auto-idle',
        icon: TbHourglassLow,
        labelKey: 'dashboard.sidebar.nav.autoIdle',
      },
    ],
  },
  {
    id: 'misc',
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
  const collapsed = useSidebarStore(state => state.collapsed)
  const hydrated = useSidebarStore(state => state.hydrated)

  useEffect(() => {
    const { hydrate, setNarrow } = useSidebarStore.getState()
    hydrate()
    // Auto-collapse below the `lg` breakpoint - see sidebarStore's `setNarrow`/`toggle` for how
    // this interacts with the user's persisted preference.
    const query = window.matchMedia(NARROW_WINDOW_QUERY)
    const onChange = (event: MediaQueryListEvent) => setNarrow(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return (
    <nav
      className={cn(
        'relative flex h-screen shrink-0 flex-col border-r border-border bg-background',
        hydrated && 'transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Plain h-10 spacer - keeps nav content clear of the global Titlebar's drag region (h-10,
          full window width, z-50), which now renders the brand/logo itself (see Titlebar.tsx). */}
      <div className='h-10 shrink-0' data-tauri-drag-region />
      <div
        className={cn(
          'flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-2 pt-6 pb-2',
        )}
      >
        {sections.map(section => (
          <div key={section.id} className='flex flex-col gap-1'>
            {section.items.map(item => (
              <SidebarItem
                key={item.href}
                collapsed={collapsed}
                href={item.href}
                icon={item.icon}
                iconHighlighted={item.goldWhenClaimable && hasClaimableFreeGames}
                label={t(item.labelKey)}
                running={
                  (item.runningWhenIdling && isIdling) ||
                  (item.runningWhenFarming && isFarming) ||
                  (item.runningWhenUnlocking && isUnlocking)
                }
              />
            ))}
          </div>
        ))}
      </div>

      {process.env.NODE_ENV === 'production' && (
        <div className='flex shrink-0 items-center justify-center overflow-hidden px-2 mb-5'>
          <AdSlot />
        </div>
      )}

      <GoPro collapsed={collapsed} />

      <div className='shrink-0 p-2'>
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

      <SidebarEdgeToggle collapsed={collapsed} />
    </nav>
  )
}

// TEMP (design trial, replacing the titlebar's sidebar-toggle button - see Titlebar.tsx's
// `SHOW_TITLEBAR_SIDEBAR_TOGGLE`): a Stripe-style collapse control living on the sidebar's own
// right border. A small pill always sits centred on the border; pointing at it folds the pill
// itself into a chevron of the same thickness (left = collapse, right = expand). No tooltip - the
// chevron's direction already says what it does, and `aria-label` covers assistive tech. Only the 24px handle is
// clickable, so brushing the border while reaching for page content can't toggle the sidebar by
// accident. `z-30` keeps it above `<main>` (DashboardShell's next sibling, unpositioned) but below
// every modal (`z-50`).
const SidebarEdgeToggle = ({ collapsed }: { collapsed: boolean }) => {
  const { t } = useTranslation()
  const toggle = useSidebarStore(state => state.toggle)
  const label = t('dashboard.settings.keybinds.toggleSidebar')

  return (
    <div className='absolute inset-y-14 -right-2 z-30 flex w-4 items-center justify-center'>
      <button
        aria-label={label}
        className='group/handle flex h-8 w-6 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-focus'
        type='button'
        onClick={toggle}
      >
        {/* The pill IS the arrow: two 14px halves (overlapping 4px - one cap's diameter - so the
            joint is seamless at rest and reads as one 24px pill) that each rotate about that
            shared joint on hover, folding the same bar into a chevron. Pivots sit at the centre of
            each half's inner cap (2px in from its end), so the two arms stay joined at the tip
            mid-rotation. The wrapper nudges the folded chevron back toward centre, since its tip
            stays on the border line while the arms swing out to one side. The resting fade is
            `opacity` on the wrapper, never alpha on each half - a translucent half paints twice
            where the two overlap, leaving a brighter dot at the joint; wrapper opacity composites
            both halves as one layer first. */}
        <span
          aria-hidden
          className={cn(
            'flex flex-col items-center opacity-50 transition-[translate,opacity] duration-200',
            'group-hover/handle:opacity-100 group-focus-visible/handle:opacity-100',
            collapsed
              ? 'group-hover/handle:translate-x-0.5 group-focus-visible/handle:translate-x-0.5'
              : 'group-hover/handle:-translate-x-0.5 group-focus-visible/handle:-translate-x-0.5',
          )}
        >
          <span
            className={cn(
              'h-3.5 w-1 origin-[50%_calc(100%-2px)] rounded-full bg-muted transition-[rotate,background-color] duration-200',
              'group-hover/handle:bg-foreground group-focus-visible/handle:bg-foreground',
              collapsed
                ? 'group-hover/handle:-rotate-35 group-focus-visible/handle:-rotate-35'
                : 'group-hover/handle:rotate-35 group-focus-visible/handle:rotate-35',
            )}
          />
          <span
            className={cn(
              '-mt-1 h-3.5 w-1 origin-[50%_2px] rounded-full bg-muted transition-[rotate,background-color] duration-200',
              'group-hover/handle:bg-foreground group-focus-visible/handle:bg-foreground',
              collapsed
                ? 'group-hover/handle:rotate-35 group-focus-visible/handle:rotate-35'
                : 'group-hover/handle:-rotate-35 group-focus-visible/handle:-rotate-35',
            )}
          />
        </span>
      </button>
    </div>
  )
}
