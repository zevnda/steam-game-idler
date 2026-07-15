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
// - deliberately does NOT track `sidebarStore.collapsed` the way the titlebar's sidebar-toggle/
// GoPro group does, so it stays put at one fixed position regardless of sidebar state.
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
          'pointer-events-auto flex h-10 w-72 items-center gap-2 rounded-full',
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
            aria-label='Clear search'
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
