import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'
import { ErrorBoundaryFallback } from '@/shared/components/ErrorBoundaryFallback'
import { logFrontendError } from '@/shared/utils/frontendLogging'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

// React only offers a class-component API for catching render-time errors (a component that
// throws while rendering) - no hook equivalent exists. Catches what `useGlobalErrorLogging` can't:
// that hook's `window.error`/`unhandledrejection` listeners never fire for an error React itself
// intercepts to unmount the broken subtree. Logs to the backend's log file before showing the
// fallback so a user's bug report reliably captures the crash, instead of only the browser
// devtools console React would otherwise print to.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logFrontendError('react-error-boundary', error.message, {
      stack: error.stack,
      componentStack: info.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorBoundaryFallback onRetry={() => this.setState({ hasError: false })} />
    }

    return this.props.children
  }
}
