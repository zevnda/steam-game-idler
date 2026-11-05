import type { SignedInAccount } from '@/shared/stores/sessionStore'
import type { SetStateAction } from 'react'
import { useCallback, useState } from 'react'
import { getAccountKey } from '@/shared/stores/sessionStore'

// The last-known copy of each per-account game list (Favorites, the Auto Idle and Achievement
// Unlocker queues, Card Farming's whitelist/blacklist), kept for the session. Those lists live in
// page-scoped hooks that remount on every navigation, and each used to start empty and "loading"
// until its fetch returned - so a tab's count chip (and the list itself) blinked in a moment after
// every page switch, mid-crossfade. Starting from this copy shows them straight away; the hook
// still refetches on mount and replaces it.
const cache = new Map<string, unknown[]>()

const cacheKey = (name: string, account: SignedInAccount | null) =>
  account ? `${name}:${getAccountKey(account)}` : null

export const readCachedList = <T>(name: string, account: SignedInAccount | null) => {
  const key = cacheKey(name, account)
  return key === null ? undefined : (cache.get(key) as T[] | undefined)
}

// `useState` for one of those lists, starting from the cached copy for `account` and writing every
// update back to it, so any later mount starts from the latest value. A mutation made while the
// page is unmounted (the game-card context menu adding a favorite, say) isn't seen here, but the
// refetch on the next mount corrects it within a moment.
export const useCachedListState = <T>(name: string, account: SignedInAccount | null) => {
  const key = cacheKey(name, account)
  const [list, setListState] = useState<T[]>(() => readCachedList<T>(name, account) ?? [])

  const setList = useCallback(
    (next: SetStateAction<T[]>) => {
      setListState(prev => {
        const value = typeof next === 'function' ? next(prev) : next
        if (key !== null) cache.set(key, value)
        return value
      })
    },
    [key],
  )

  return [list, setList] as const
}
