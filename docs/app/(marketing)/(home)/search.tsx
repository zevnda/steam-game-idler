'use client'

import type { SharedProps } from 'fumadocs-ui/components/dialog/search'
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
