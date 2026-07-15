import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'sgi.inventoryManager.lockedItems'

function readLockedItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch (error) {
    console.error('Error reading locked inventory items:', error)
    return []
  }
}

// Client-only "don't sell this by accident" bookkeeping, keyed by `assetid` - mirrors `main`'s own
// localStorage-backed lock list. Deliberately separate from `useInventory` (server data/actions)
// since this never touches the backend at all - pure UI state, same reasoning idling's frontend-only
// `startTimes` map or favorites' page-local filter state already established for feature-local,
// non-persisted-server concerns.
export const useLockedItems = () => {
  const [lockedIds, setLockedIds] = useState<string[]>([])

  useEffect(() => {
    setLockedIds(readLockedItems())
  }, [])

  const toggleLock = useCallback((assetid: string) => {
    setLockedIds(prev => {
      const next = prev.includes(assetid) ? prev.filter(id => id !== assetid) : [...prev, assetid]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (error) {
        console.error('Error persisting locked inventory items:', error)
      }
      return next
    })
  }, [])

  const isLocked = useCallback((assetid: string) => lockedIds.includes(assetid), [lockedIds])

  return { lockedIds, isLocked, toggleLock }
}
