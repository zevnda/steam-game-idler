import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbX } from 'react-icons/tb'
import { cn } from '@heroui/react'
import { useActiveSearchScope } from '@/shared/search/scopes'
import { useSearchStore } from '@/shared/stores/searchStore'

// Mounted inside Titlebar's drag-region strip. Renders nothing on a route with no registered
// search scope (idling, free games, sign-in, placeholders) - a hidden affordance is clearer than a
// disabled one that still looks clickable. Always centered on the full window width via
// `left-1/2 -translate-x-1/2`
// - deliberately does NOT track `sidebarStore.collapsed` the way the titlebar's sidebar-toggle
// group does, so it stays put at one fixed position regardless of sidebar state.
//
// Narrower (`w-56`) below the `lg` breakpoint (1024px) rather than collapsing to an icon-only
// trigger - an icon-only form was only needed while the titlebar's left group also held the Go Pro
// pill (since moved to the sidebar, see GoPro.tsx). Sized for the worst case: at the window's
// `minWidth` (920px, tauri.conf.json) with the sidebar expanded (it auto-collapses at this same
// breakpoint - see sidebarStore's `NARROW_WINDOW_QUERY` - but can still be expanded manually), the
// left group is 304px
// (`w-64` brand + 48px toggle) and the right group up to 337px (update/help/notifications/menu +
// separator + 3 window controls, all `w-12`), so a centered pill must stay under ~230px to clear
// the right group. Long query/placeholder text truncates inside the pill either way.
export const GlobalSearchBar = () => {
  const { t } = useTranslation()
  const scope = useActiveSearchScope()
  const query = useSearchStore(state => (scope ? (state.queries[scope.id] ?? '') : ''))
  const open = useSearchStore(state => state.open)
  const clearQuery = useSearchStore(state => state.clearQuery)

  if (!scope) return null

  return (
    <div className='pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center justify-center'>
      {/* No `data-tauri-drag-region` here - Titlebar's own window-control buttons already prove a
          plain clickable element nested inside the drag-region strip works fine without one. */}
      <div
        className={cn(
          'pointer-events-auto flex h-10 w-56 items-center gap-2 rounded-full lg:w-72',
          'bg-surface px-1 text-sm text-muted transition-colors hover:bg-surface-hover',
        )}
      >
        <button
          className='flex h-full min-w-0 flex-1 items-center gap-2 px-3 text-left cursor-pointer'
          type='button'
          onClick={() => open(scope.id)}
        >
          <RiSearchLine className='shrink-0' fontSize={16} />
          <span className={cn('flex-1 truncate', query && 'text-foreground')}>
            {query || t('common.search.placeholder')}
          </span>
        </button>
        {query && (
          <button
            className='mr-1 shrink-0 rounded-full p-1 hover:bg-surface-hover cursor-pointer'
            type='button'
            onClick={() => clearQuery(scope.id)}
          >
            <TbX fontSize={14} />
          </button>
        )}
      </div>
    </div>
  )
}
