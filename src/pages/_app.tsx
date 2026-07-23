import type { AppProps } from 'next/app'
import { Toast } from '@heroui/react'
import { useRouter } from 'next/router'
import Script from 'next/script'
import { ChangelogModal } from '@/shared/components/ChangelogModal'
import { DashboardShell } from '@/shared/components/dashboard/DashboardShell'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { FullscreenLoader } from '@/shared/components/FullscreenLoader'
import { LinuxResizeHandles } from '@/shared/components/LinuxResizeHandles'
import { GoProModal } from '@/shared/components/pro/GoProModal'
import { Titlebar } from '@/shared/components/titlebar/Titlebar'
import { UpdateLoader } from '@/shared/components/UpdateLoader'
import { useAppReady } from '@/shared/hooks/useAppReady'
import { useCheckForUpdates } from '@/shared/hooks/useCheckForUpdates'
import { useContextMenu } from '@/shared/hooks/useContextMenu'
import { useGlobalErrorLogging } from '@/shared/hooks/useGlobalErrorLogging'
import { useLegacyMigrationCleanup } from '@/shared/hooks/useLegacyMigrationCleanup'
import { usePlatform } from '@/shared/hooks/usePlatform'
import { useSessionBootstrap } from '@/shared/hooks/useSessionBootstrap'
import { useTraySync } from '@/shared/hooks/useTraySync'
import { useZoomControls } from '@/shared/hooks/useZoomControls'
import { useUpdateStore } from '@/shared/stores/updateStore'
import { useFont } from '@/shared/theme/useFont'
import { useTheme } from '@/shared/theme/useTheme'
import '@/styles/globals.css'
import '@/i18n'

const App = ({ Component, pageProps }: AppProps) => {
  const router = useRouter()
  const isDashboard = router.pathname.startsWith('/dashboard')
  useAppReady()
  useGlobalErrorLogging()
  // Runs before everything else that might read/hydrate from localStorage - see its own doc
  // comment for why this is a separate one-off check rather than piggybacking on
  // useCheckForUpdates' `is_major` path.
  useLegacyMigrationCleanup()
  // Root-mounted so the pre-dashboard sign-in landing page (the first consumer - hiding CLI-mode
  // sign-in on Linux) has the OS available as early as possible. See usePlatform's own doc comment.
  usePlatform()
  // Root-mounted (not just on the sign-in landing page) so a hard reload landing directly on a
  // `/dashboard/*` URL re-validates the session before that route's own `if (!account)` guard gets
  // a chance to run - see useSessionBootstrap's own doc comment for the freeze/false-sign-out this
  // fixes. `bootstrapPhase` gates the routed content below the same way pages/index.tsx used to
  // gate itself alone.
  const bootstrapPhase = useSessionBootstrap()
  // Mounted here rather than in pages/index.tsx so it keeps running (and can still show
  // UpdateLoader) regardless of which route the user is currently on - a signed-in user parked on
  // /dashboard/* for hours must still get a silent major/first-check update, not just users still
  // sitting on the pre-sign-in screen.
  useCheckForUpdates()
  // Same root-level reasoning as above but for zoom - `main` mounts its equivalent unconditionally
  // on `pages/index.tsx`, so the pre-dashboard sign-in screens can be zoomed too, not just
  // `/dashboard/*` (unlike every other shortcut this rewrite has - see `useDashboardShortcuts.ts`'s
  // doc comment for why those are scoped to DashboardShell instead).
  useZoomControls()
  // Same root-level reasoning as useZoomControls above - theme is an app-wide preference visible
  // on the pre-dashboard sign-in screens too, not just /dashboard/*. See useTheme.ts's own doc
  // comment for how it avoids flashing to `default` before subscription tier is confirmed.
  useTheme()
  // Same root-level reasoning as useTheme above, for the app-wide font choice - see useFont.ts's
  // own doc comment.
  useFont()
  // Blocks window refresh (which would desync the frontend from server-side idling/automation
  // state) and replaces the native right-click menu with a Copy/Paste-only one - see
  // useContextMenu.ts's own doc comment for the full reasoning. Root-mounted for the same reason as
  // useZoomControls/useTheme above: pre-dashboard sign-in flows need this too, not just /dashboard/*.
  useContextMenu()
  // Same root-level reasoning as useZoomControls/useTheme/useContextMenu above - the tray is
  // process-wide, not scoped to /dashboard/*, so its labels need to be in sync with the user's
  // chosen language even while parked on a pre-dashboard sign-in screen. See useTraySync.ts's own
  // doc comment for why the sync has to be pushed from the frontend at all.
  useTraySync()
  const isUpdating = useUpdateStore(state => state.isUpdating)

  if (isUpdating) {
    // Titlebar still mounts here (unlike the plain `<UpdateLoader />` this used to early-return),
    // in its minimal (window-controls-only) mode - see Titlebar's `minimal` prop doc comment for
    // why a full-viewport SplashScreen instance needs the titlebar rendered above it rather than
    // hidden entirely. Everything else this early return already skipped (scripts, toasts, modals,
    // the routed page) stays skipped - none of it is meaningful mid-update.
    return (
      <>
        <LinuxResizeHandles />
        <Titlebar minimal />
        <UpdateLoader />
      </>
    )
  }

  return (
    <>
      {/* Chatway live-chat widget (see HelpDesk.tsx, the only trigger UI for it) - injected
          unconditionally, same as `main`'s `Layout.tsx`, since the widget's own container/script
          load state has to exist before any Casual-tier gate is even checked. The second script
          hides Chatway's own default floating icon on load, matching `main` exactly - `$chatwayOnLoad`
          is a global callback name Chatway's own script looks for, not one either codebase defines
          the calling convention for. */}
      <Script id='chatway' src='https://cdn.chatway.app/widget.js?id=1F2cY0TT2RKh' />
      <Script id='chatway-hide-icon' strategy='afterInteractive'>
        {`
          window.$chatwayOnLoad = function() {
            if (window.$chatway && typeof window.$chatway.hideChatwayIcon === 'function') {
              window.$chatway.hideChatwayIcon();
            }
          };
        `}
      </Script>

      {/* Mounted at the root, not inside DashboardShell - pre-dashboard flows (sign-in errors,
          the sign-out redirect) can fire toasts too, not just /dashboard/* routes. HeroUI's
          `toast.*` singleton (imported directly wherever a toast is fired) works from anywhere
          once this is mounted once; no context/provider prop-drilling needed. */}
      <Toast.Provider />
      <LinuxResizeHandles />
      <Titlebar minimal={bootstrapPhase === 'checking'} />
      <ChangelogModal />
      <GoProModal />
      {/* Blocks the routed page (dashboard or pre-dashboard) until useSessionBootstrap has
          re-validated any persisted session - see that hook's doc comment. Everything above this
          (Titlebar, toasts, the Chatway widget) stays mounted through the check since none of it
          depends on session state. */}
      <FullscreenLoader visible={bootstrapPhase === 'checking'} />
      {bootstrapPhase === 'checking' ? null : isDashboard ? (
        // ErrorBoundary wraps only the routed page, not DashboardShell itself - a crash in one
        // page's rendering shouldn't unmount the shell and kill long-running features (card
        // farming, idling) that survive navigation across /dashboard/* routes.
        <DashboardShell>
          <ErrorBoundary>
            <Component {...pageProps} />
          </ErrorBoundary>
        </DashboardShell>
      ) : (
        <ErrorBoundary>
          <Component {...pageProps} />
        </ErrorBoundary>
      )}
    </>
  )
}

export default App
