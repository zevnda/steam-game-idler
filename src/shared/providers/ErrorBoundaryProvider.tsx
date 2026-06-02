import type { ErrorInfo } from 'react'
import { Component } from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundaryProvider extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex flex-col items-center justify-center h-screen text-content'>
          <p className='text-xl font-bold mb-2'>Something went wrong</p>
          <p className='text-sm text-altwhite'>{this.state.error?.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
