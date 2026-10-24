'use client'

import type { SheetGroup } from './sheetTree'
import { useState } from 'react'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * The docs' sections inside LandingNav's phone menu sheet (passed as its `sheetLead`), so docs
 * pages have the same single phone menu as every other page rather than a second, differently
 * styled Fumadocs drawer. Built from the sheet's own pieces - group label, `.sheet-group` card,
 * `.sheet-link` rows - so it reads as more of the same menu. Folders expand in place; the one
 * holding the current page starts open. LandingNav closes the sheet on any link click inside it.
 */
export default function DocsSheetTree({ groups }: { groups: SheetGroup[] }) {
  const pathname = usePathname()
  // only folders the reader has toggled; the rest follow "open if it holds the current page"
  const [toggled, setToggled] = useState<Record<string, boolean>>({})
  const current = (url?: string) => (url && pathname === url ? 'page' : undefined)

  return groups.map(group => (
    <div key={group.label ?? 'top'} className='mb-5'>
      {group.label && (
        <p className='px-2 mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-text-muted'>
          {group.label}
        </p>
      )}
      <ul className='sheet-group'>
        {group.rows.map(row => {
          // `'pages' in row` narrows to a folder (SheetPage has no pages)
          if (!('pages' in row)) {
            return (
              <li key={row.url}>
                <Link
                  prefetch={false}
                  href={row.url}
                  aria-current={current(row.url)}
                  className='sheet-link'
                >
                  {row.name}
                  <FiChevronRight className='sheet-link__chevron' aria-hidden='true' />
                </Link>
              </li>
            )
          }

          const key = row.url ?? row.name
          const holdsCurrent = row.url === pathname || row.pages.some(p => p.url === pathname)
          const open = toggled[key] ?? holdsCurrent
          const toggle = () => setToggled(t => ({ ...t, [key]: !open }))
          const chevron = (
            <FiChevronDown
              className={`sheet-link__chevron transition-transform ${open ? '' : '-rotate-90'}`}
              aria-hidden='true'
            />
          )

          return (
            <li key={key}>
              {/* a folder with its own page: the name goes there, the chevron only toggles */}
              {row.url ? (
                <div className='flex'>
                  <Link
                    prefetch={false}
                    href={row.url}
                    aria-current={current(row.url)}
                    className='sheet-link flex-1'
                  >
                    {row.name}
                  </Link>
                  <button
                    type='button'
                    onClick={toggle}
                    aria-expanded={open}
                    aria-label={`${open ? 'Collapse' : 'Expand'} ${row.name}`}
                    className='sheet-folder__toggle'
                  >
                    {chevron}
                  </button>
                </div>
              ) : (
                <button
                  type='button'
                  onClick={toggle}
                  aria-expanded={open}
                  className='sheet-link w-full'
                >
                  {row.name}
                  {chevron}
                </button>
              )}

              {open && (
                <ul className='sheet-sub'>
                  {row.pages.map(page => (
                    <li key={page.url}>
                      <Link
                        prefetch={false}
                        href={page.url}
                        aria-current={current(page.url)}
                        className='sheet-link sheet-link--sub'
                      >
                        {page.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  ))
}
