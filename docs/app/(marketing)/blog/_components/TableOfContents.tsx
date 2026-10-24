'use client'

import type { TOCItemType } from 'fumadocs-core/toc'
import { TOCProvider, TOCScrollArea } from 'fumadocs-ui/components/toc'
import { TOCItem, TOCItems } from 'fumadocs-ui/components/toc/clerk'
import { Text } from 'lucide-react'

/**
 * Desktop-only "On this page" rail, built from the same Fumadocs pieces as the docs' TOC (the
 * "clerk" style the docs layout picks in docs/[[...slug]]/page.tsx): a rail that bends with heading
 * depth and an active trace that follows the reader. The docs' restyle of it in globals.css is
 * shared through `.blog-toc`, so the two stay identical. Mobile gets the collapsible InlineTOC
 * above the article instead - see `[slug]/page.tsx`.
 */
export default function TableOfContents({ items }: { items: TOCItemType[] }) {
  return (
    <TOCProvider toc={items}>
      <nav
        aria-labelledby='blog-toc-title'
        className='blog-toc flex flex-col max-h-[calc(100svh-8rem)]'
      >
        {/* a <p>, not the docs' <h3>: a heading here would join the article's own outline */}
        <p id='blog-toc-title' className='blog-toc__title inline-flex items-center gap-1.5 text-sm'>
          <Text className='size-4' aria-hidden='true' />
          On this page
        </p>
        <TOCScrollArea>
          <TOCItems>
            {items.map(item => (
              <TOCItem key={item.url} item={item} />
            ))}
          </TOCItems>
        </TOCScrollArea>
      </nav>
    </TOCProvider>
  )
}
