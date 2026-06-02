export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

export type SortStyleValue = 'a-z' | 'z-a' | '1-0' | '0-1' | 'recent' | string

export interface SortOption {
  key: string
  label: string
}

export interface LogEntry {
  timestamp: string
  message: string
}

interface Platforms {
  [key: string]: { signature: string; url: string }
}

export interface LatestData {
  version: string
  major: boolean
  platforms: Platforms
}
