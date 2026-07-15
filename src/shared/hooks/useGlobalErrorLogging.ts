import { useEffect } from 'react'
import { logFrontendError } from '@/shared/utils/frontendLogging'

// Catches what `ErrorBoundary` can't: exceptions thrown outside React's render (an event handler,
// a `setTimeout` callback, a promise nobody awaited) never unwind through a component tree, so
// `componentDidCatch` never sees them - the browser's global `error`/`unhandledrejection` events
// are the only place they surface. Mounted once in `_app.tsx`, same as this app's other root-level
// singletons (useZoomControls, useTheme).
export function useGlobalErrorLogging() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logFrontendError('window.error', event.message, {
        filename: event.filename,
        stack: event.error instanceof Error ? event.error.stack : undefined,
      })
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      logFrontendError(
        'window.unhandledrejection',
        reason instanceof Error ? reason.message : String(reason),
        {
          stack: reason instanceof Error ? reason.stack : undefined,
        },
      )
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])
}
