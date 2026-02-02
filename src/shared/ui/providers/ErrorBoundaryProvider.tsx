import { ErrorBoundary } from 'react-error-boundary'
import { CustomErrorFallback } from '../error-boundaries/CustomErrorFallback'

interface ErrorInfo {
  componentStack?: string | null
}

function onError(_: unknown, info: ErrorInfo) {
  window.lastComponentStack = info.componentStack ?? ''
}

export function ErrorBoundaryProvider({ children }: React.PropsWithChildren) {
  return (
    <ErrorBoundary FallbackComponent={CustomErrorFallback} onError={onError}>
      {children}
    </ErrorBoundary>
  )
}
