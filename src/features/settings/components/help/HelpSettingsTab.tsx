import type { HelpItem } from './helpSections'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbExternalLink, TbX } from 'react-icons/tb'
import { HELP_SECTIONS, TROUBLESHOOTING_URL } from './helpSections'
import { Button, InputGroup, Typography } from '@heroui/react'
import { FAQItem } from '@/shared/components/FAQItem'
import { searchFaq } from '@/shared/search/fuzzySearch'
import { openExternalLink } from '@/shared/utils/links'

// Settings > Help: the app's FAQ, sectioned by feature, with a search over its text. One answer stays
// open at a time, as in the Go Pro modal. The FAQ itself is English-only on purpose (see
// helpSections.ts), while the controls around it are translated like the rest of the app.
export const HelpSettingsTab = () => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const results = useMemo(
    () =>
      query.trim()
        ? searchFaq(
            HELP_SECTIONS.flatMap(section => section.items),
            query,
          )
        : null,
    [query],
  )

  const renderItem = (item: HelpItem) => (
    <FAQItem
      a={item.answer}
      footer={
        item.href && (
          <button
            className='mt-2 flex cursor-pointer items-center gap-1 text-accent duration-150 hover:text-accent/80'
            type='button'
            onClick={() => item.href && openExternalLink(item.href)}
          >
            {t('common.learnMore')}
            <TbExternalLink fontSize={12} />
          </button>
        )
      }
      isOpen={openId === item.id}
      key={item.id}
      q={item.question}
      variant='settings'
      onToggle={() => setOpenId(openId === item.id ? null : item.id)}
    />
  )

  return (
    <div className='flex flex-col gap-6'>
      {/* `flex-wrap` so a long translated button label drops below the search bar, not over it */}
      <div className='flex flex-wrap items-center gap-2'>
        <InputGroup className='min-w-48 flex-1 rounded-full'>
          <InputGroup.Prefix>
            <RiSearchLine className='text-muted' fontSize={16} />
          </InputGroup.Prefix>
          <InputGroup.Input
            aria-label={t('common.search.placeholder')}
            placeholder={t('common.search.placeholder')}
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          {query && (
            <InputGroup.Suffix>
              <button
                aria-label={t('common.actions.clear')}
                type='button'
                onClick={() => setQuery('')}
              >
                <TbX fontSize={16} />
              </button>
            </InputGroup.Suffix>
          )}
        </InputGroup>
        <Button
          className='inline-flex shrink-0 items-center gap-1.5'
          type='button'
          variant='secondary'
          onClick={() => openExternalLink(TROUBLESHOOTING_URL)}
        >
          {t('dashboard.settings.help.troubleshooting')}
          <TbExternalLink fontSize={14} />
        </Button>
      </div>

      {/* Search results are one list, best match first: which section an answer sits in stops
          mattering once the user has said what they're looking for. */}
      {results ? (
        results.length > 0 ? (
          <div className='flex flex-col gap-2'>{results.map(renderItem)}</div>
        ) : (
          <Typography className='py-8 text-center' color='muted' type='body-sm'>
            {t('common.search.noResults')}
          </Typography>
        )
      ) : (
        HELP_SECTIONS.map(section => (
          <section key={section.id} className='flex flex-col gap-2'>
            <Typography color='muted' type='body-xs' weight='semibold'>
              {section.title}
            </Typography>
            {section.items.map(renderItem)}
          </section>
        ))
      )}
    </div>
  )
}
