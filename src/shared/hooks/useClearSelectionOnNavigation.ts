import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useGameSelectionStore } from '@/shared/stores/gameSelectionStore'
import { useSessionStore } from '@/shared/stores/sessionStore'

// A multi-select made on one route/account's card set shouldn't silently keep applying once the
// user navigates away or switches accounts - selection is a transient "what's currently on screen"
// concern (see `gameSelectionStore.ts`), not something that should survive either change. Each
// feature page's own tab switch (browse/list/queue/blacklist) additionally clears on its own tab
// change, since those don't trigger a route change.
export const useClearSelectionOnNavigation = () => {
  const { pathname } = useRouter()
  const activeAccountKey = useSessionStore(state => state.activeAccountKey)

  useEffect(() => {
    useGameSelectionStore.getState().clear()
  }, [pathname, activeAccountKey])
}
