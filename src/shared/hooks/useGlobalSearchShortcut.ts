import { useEffect } from 'react'
import { useActiveSearchScope } from '@/shared/search/scopes'
import { useSearchStore } from '@/shared/stores/searchStore'

// Single-purpose `/`-opens-search shortcut - kept separate from `useDashboardShortcuts` (which now
// covers tab-cycling/settings-toggle/sidebar-collapse) since it has its own search-scope guard
// `main`'s bundled `useKeyboardShortcuts.ts` handled with a hardcoded page-name check instead; no
// need to fold the two together just because both are global keydown listeners. Mounted once in
// `DashboardShell` so it works from any `/dashboard/*` route, matching every other sync hook there.
export const useGlobalSearchShortcut = () => {
  const scope = useActiveSearchScope()
  const open = useSearchStore(state => state.open)

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      if (!scope) return

      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return

      e.preventDefault()
      open(scope.id)
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [scope, open])
}
