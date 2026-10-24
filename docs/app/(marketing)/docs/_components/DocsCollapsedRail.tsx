'use client'

import { FiSearch, FiSidebar } from 'react-icons/fi'
import { useSidebar } from 'fumadocs-ui/components/sidebar/base'
import { useSearchContext } from 'fumadocs-ui/contexts/search'

/**
 * What's left on screen once the docs sidebar is collapsed (md+): a small floating glass pill with
 * an expand button and a full "Search ⌘K" trigger. It replaces Fumadocs' own collapsed panel (two
 * bare icons in a grey box, hidden in globals.css via [data-sidebar-panel]).
 *
 * Must render inside DocsLayout - both hooks read its providers. Fumadocs keeps the sidebar's
 * hover-peek state internal, so hiding the pill while the peeked sidebar covers it is done in CSS
 * off #nd-sidebar[data-hovered] instead.
 */
export default function DocsCollapsedRail() {
  const { collapsed, setCollapsed } = useSidebar()
  const { enabled, hotKey, setOpenSearch } = useSearchContext()

  return (
    <div className={`docs-rail ${collapsed ? 'docs-rail--on' : ''}`} inert={!collapsed}>
      <button
        type='button'
        className='docs-rail__btn'
        onClick={() => setCollapsed(false)}
        aria-label='Expand sidebar'
        title='Expand sidebar'
      >
        <FiSidebar className='w-4 h-4' aria-hidden='true' />
      </button>
      {enabled && (
        <>
          <span className='docs-rail__sep' aria-hidden='true' />
          <button type='button' className='docs-rail__search' onClick={() => setOpenSearch(true)}>
            <FiSearch className='w-4 h-4' aria-hidden='true' />
            Search
            <span className='docs-rail__keys' aria-hidden='true'>
              {hotKey.map((k, i) => (
                // a fixed list from the search provider that never reorders, and its keys can be
                // matcher functions rather than strings, so the position is the only stable id
                // eslint-disable-next-line react/no-array-index-key
                <kbd key={i}>{k.display}</kbd>
              ))}
            </span>
          </button>
        </>
      )}
    </div>
  )
}
