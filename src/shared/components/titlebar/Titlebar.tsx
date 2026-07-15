import { useTranslation } from 'react-i18next'
import { TbLayoutSidebar, TbLayoutSidebarFilled } from 'react-icons/tb'
import {
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize,
  VscChromeRestore,
} from 'react-icons/vsc'
import { Button, cn, Separator } from '@heroui/react'
import { Unbounded } from 'next/font/google'
import { useRouter } from 'next/router'
import { Logo } from '@/shared/components/dashboard/Logo'
import { GoPro } from '@/shared/components/pro/GoPro'
import { GlobalSearchBar } from '@/shared/components/search/GlobalSearchBar'
import { HelpDesk } from '@/shared/components/titlebar/HelpDesk'
import { Menu } from '@/shared/components/titlebar/Menu'
import { Notifications } from '@/shared/components/titlebar/Notifications'
import { useTitlebar } from '@/shared/hooks/useTitlebar'
import { useSidebarStore } from '@/shared/stores/sidebarStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'

const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
})

interface TitlebarProps {
  // True while a full-viewport SplashScreen (FullscreenLoader's boot check, or UpdateLoader's
  // self-update) is on screen. The splash covers the whole window including this titlebar's own
  // normal content, so this strips everything down to just the window controls - the drag region
  // and minimize/maximize/close are the only things a user should be able to reach mid-splash, and
  // showing the logo/search/menu underneath a splash that's actively hiding the rest of the app
  // would look broken. Titlebar's z-index is kept above SplashScreen's (see className below) so the
  // controls actually stay clickable instead of being covered by the splash itself.
  minimal?: boolean
}

// Global app-shell chrome, mounted once in `_app.tsx` so it's present on every screen (sign-in
// included) - a frameless/transparent window (see tauri.conf.json's `decorations: false`) has no
// OS-drawn title bar, so this is the only way the window can be moved, minimized, maximized, or
// closed at all.
export const Titlebar = ({ minimal = false }: TitlebarProps) => {
  const { t } = useTranslation()
  const { isMaximized, minimize, toggleMaximize, close } = useTitlebar()
  const router = useRouter()
  const isDashboard = router.pathname.startsWith('/dashboard')
  const collapsed = useSidebarStore(state => state.collapsed)
  const hydrated = useSidebarStore(state => state.hydrated)
  const toggleSidebar = useSidebarStore(state => state.toggle)
  // GoPro is gated on `isSubscribed !== null` too, not just `isDashboard` - `useCheckSubscription`
  // (mounted in DashboardShell) needs a moment to resolve on first mount, and showing the upsell
  // pill before that would flash it for a Gamer-tier user who should never see it at all.
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)

  return (
    <div
      // Only bumped to z-9999 (one above SplashScreen's z-9998) while `minimal` (a splash is
      // actually on screen) - the rest of the time this stays at the original z-50 so modals
      // (SettingsModal, GoProModal, etc, all z-50 too) still stack above it via DOM order like
      // before. Raising it unconditionally made the titlebar render on top of every modal.
      // The opaque bg/border are dropped while `minimal` too, so SplashScreen's full-window
      // `loader.webm` (itself `fixed inset-0 h-screen w-screen`) shows through the window-controls
      // strip instead of being covered by it.
      className={cn(
        'fixed left-0 top-0 h-14 w-screen select-none',
        minimal ? 'z-9999 bg-transparent' : 'z-50 border-b border-border bg-background',
      )}
      data-tauri-drag-region
    >
      <div className='flex h-14 w-full items-center' data-tauri-drag-region>
        {!minimal && (
          <>
            {/* Brand/logo, leftmost in the titlebar itself now that Titlebar paints an opaque
                `bg-background` over the full window width - it used to be Sidebar's own Brand strip
                showing through a transparent Titlebar, which stopped working once Titlebar became
                opaque. Sized to match the sidebar's current width (`w-16`/`w-64`) so it stays visually
                anchored above the sidebar and collapses in step with it. `hydrated` gates the
                transition the same way Sidebar.tsx's own width transition does, off the same store
                field, so a returning collapsed user's first paint doesn't visibly animate from
                expanded. */}
            <div
              className={cn(
                'flex h-14 shrink-0 items-center',
                isDashboard && hydrated && 'transition-[width] duration-200',
                isDashboard
                  ? collapsed
                    ? 'w-16 justify-center'
                    : 'w-64 justify-start pl-4'
                  : 'justify-start pl-4',
              )}
              data-tauri-drag-region
            >
              <Logo />
              {(!isDashboard || !collapsed) && (
                <p
                  className={cn(
                    unbounded.className,
                    'ml-3 truncate text-sm font-semibold text-foreground',
                  )}
                  data-tauri-drag-region
                >
                  Steam Game Idler
                </p>
              )}
            </div>

            <div className='flex h-14 shrink-0 items-center'>
              {isDashboard && (
                <Button
                  isIconOnly
                  aria-label={t('dashboard.settings.keybinds.toggleSidebar')}
                  className='h-14 w-12 rounded-none'
                  variant='ghost'
                  onPress={toggleSidebar}
                >
                  {collapsed ? (
                    <TbLayoutSidebarFilled fontSize={18} />
                  ) : (
                    <TbLayoutSidebar fontSize={18} />
                  )}
                </Button>
              )}
              {isDashboard && isSubscribed !== null && <GoPro />}
            </div>
          </>
        )}

        <div className='flex-1' data-tauri-drag-region />

        <div className='flex h-14 shrink-0 items-center justify-end'>
          {!minimal && (
            <>
              <HelpDesk />
              <Notifications />
              <Menu />

              <Separator orientation='vertical' />
            </>
          )}

          <Button
            isIconOnly
            aria-label='Minimize'
            className='h-14 w-12 rounded-none'
            variant='ghost'
            onPress={minimize}
          >
            <VscChromeMinimize fontSize={16} />
          </Button>
          <Button
            isIconOnly
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
            className='h-14 w-12 rounded-none'
            variant='ghost'
            onPress={toggleMaximize}
          >
            {isMaximized ? <VscChromeRestore fontSize={16} /> : <VscChromeMaximize fontSize={16} />}
          </Button>
          <Button
            isIconOnly
            aria-label='Close'
            className='h-14 w-12 rounded-none hover:bg-danger'
            variant='ghost'
            onPress={close}
          >
            <VscChromeClose fontSize={16} />
          </Button>
        </div>
      </div>

      {!minimal && <GlobalSearchBar />}
    </div>
  )
}
