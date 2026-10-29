'use client'

import type { SharedProps } from 'fumadocs-ui/components/dialog/search'
import { useEffect, useRef } from 'react'
import { useDocsSearch } from 'fumadocs-core/search/client'
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
} from 'fumadocs-ui/components/dialog/search'
import { useI18n } from 'fumadocs-ui/contexts/i18n'
import { trackEvent } from '@/app/lib/analytics'

// how long the query has to sit unchanged before it counts as a search, not a keystroke on the way
const SEARCH_SETTLE_MS = 1200

export default function DefaultSearchDialog(props: SharedProps) {
  const { locale } = useI18n() // (optional) for i18n
  // No custom `initDB`: fumadocs-core 16.14+ switched its static search engine from Orama to
  // ZBSearch, and its built-in default (`create({ schema: { _: 'string' } })`, English tokenizer)
  // is exactly what this used to configure by hand. A hand-built DB must come from `zbsearch` to
  // match the index `app/api/search/route.ts` exports — an `@orama/orama` one no longer loads it.
  const { search, setSearch, query } = useDocsSearch({
    type: 'static',
    locale,
  })

  // One `search` event per settled query, with its result count - a 0 is a question the docs
  // don't answer yet, which is the point of tracking this. Deduped so reopening the dialog on the
  // same query doesn't count it again.
  const lastTracked = useRef('')
  const term = search.trim()
  const results = query.data === 'empty' || !query.data ? 0 : query.data.length
  useEffect(() => {
    if (query.isLoading || term.length < 2 || term === lastTracked.current) return
    const timer = setTimeout(() => {
      lastTracked.current = term
      trackEvent('search', { search_term: term, results_count: results })
    }, SEARCH_SETTLE_MS)
    return () => clearTimeout(timer)
  }, [term, results, query.isLoading])

  return (
    <SearchDialog search={search} onSearchChange={setSearch} isLoading={query.isLoading} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== 'empty' ? query.data : null} />
      </SearchDialogContent>
    </SearchDialog>
  )
}
