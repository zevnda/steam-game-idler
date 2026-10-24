'use client'

import { useDocsLayout } from 'fumadocs-ui/layouts/docs'

/**
 * The docs' search button inside the shared LandingNav bar on phones (the docs' sections are in
 * LandingNav's own menu sheet - see DocsSheetTree). It replaces Fumadocs' own mobile header (the
 * docs layout hands its header slot to LandingNav), so the trigger has to be read from the layout
 * context - which is why this lives under DocsLayout rather than in LandingNav itself.
 */
export default function DocsNavActions() {
  const { slots } = useDocsLayout()
  const SearchTrigger = slots.searchTrigger ? slots.searchTrigger.sm : null

  return SearchTrigger ? (
    <SearchTrigger
      hideIfDisabled
      className='p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors'
    />
  ) : null
}
