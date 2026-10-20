'use client'

import type { TOCItemType } from 'fumadocs-core/toc'
import { AnchorProvider, TOCItem } from 'fumadocs-core/toc'

/**
 * Desktop-only "On this page" rail with scroll-spy (Fumadocs' AnchorProvider marks the heading in
 * view with `data-active`). Mobile gets the collapsible InlineTOC above the article instead - see
 * `[slug]/page.tsx`.
 */
export default function TableOfContents({ items }: { items: TOCItemType[] }) {
  return (
    <AnchorProvider toc={items} single>
      <nav aria-label='On this page'>
        <p className='mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted'>
          On this page
        </p>
        <ul className='space-y-1 border-l border-border'>
          {items.map(item => (
            <li key={item.url}>
              <TOCItem
                href={item.url}
                className='-ml-px block border-l border-transparent py-1 text-sm leading-snug text-text-muted transition-colors duration-150 hover:text-text-primary data-[active=true]:border-accent data-[active=true]:text-text-primary'
                style={{ paddingLeft: `${0.75 + (item.depth - 2) * 0.75}rem` }}
              >
                {item.title}
              </TOCItem>
            </li>
          ))}
        </ul>
      </nav>
    </AnchorProvider>
  )
}
