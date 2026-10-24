import { FiRss } from 'react-icons/fi'
import ChangelogClient from './client'
import { compareReleases, stripHeadingIds } from './releases'
import { tagClass } from './tags'
import { PathUtils } from 'fumadocs-core/source'
import Link from 'next/link'
import LandingFooter from '@/app/(marketing)/(home)/_components/landing/LandingFooter'
import LandingNav from '@/app/(marketing)/(home)/_components/landing/LandingNav'
import { changelog } from '@/lib/source'
import { getMDXComponents } from '@/mdx-components'

interface BlogData {
  title: string
  date: string | Date
  tags?: string[]
}

// Without its own metadata this page inherited the home page's title and description, so it
// showed up in brand searches as a duplicate of the home page and drew no clicks.
const TITLE = 'Steam Game Idler Changelog - Updates & Release Notes'
const DESCRIPTION =
  "Every Steam Game Idler release, newest first: what's new, improved and fixed in card farming, achievements, idling and more."

export const metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: {
    url: 'https://steamgameidler.com/changelog',
    title: TITLE,
    description: DESCRIPTION,
    images: 'https://steamgameidler.com/og-image.png',
    type: 'website',
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
    images: 'https://steamgameidler.com/og-image.png',
  },
  alternates: {
    canonical: '/changelog',
    types: {
      'application/rss+xml': [{ url: '/changelog/rss.xml', title: 'Steam Game Idler Changelog' }],
    },
  },
}

function getName(path: string) {
  return PathUtils.basename(path, PathUtils.extname(path))
}

export default async function Page() {
  const entries = await Promise.all(
    changelog.getPages().map(async post => {
      const data = post.data as BlogData
      const version = getName(post.path)
      const { body: Mdx } = await post.data.load()
      const markdown = stripHeadingIds(await post.data.getText('processed'))
      return {
        version,
        date: new Date(data.date ?? version),
        tags: data.tags ?? [],
        // what the search box matches against: the version and the notes, minus markdown syntax
        searchText: `${version} ${markdown.replace(/[#*`[\]()_>-]/g, ' ')}`
          .replace(/\s+/g, ' ')
          .toLowerCase(),
        Mdx,
      }
    }),
  )

  entries.sort(compareReleases)

  return (
    <div className='landing min-h-screen bg-background'>
      <LandingNav />

      <main className='landing-container pt-36 sm:pt-44 pb-28 sm:pb-36'>
        {/* the /blog header's shape: title + sub, the feed link opposite */}
        <header className='page-enter mb-12 flex flex-col gap-6 sm:mb-16 sm:flex-row sm:items-end sm:justify-between'>
          <div className='max-w-2xl'>
            <h1 className='gradient-text w-fit mb-6 text-[clamp(2.6rem,5.6vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.04em]'>
              Every change, archived.
            </h1>
            <p className='text-lg text-text-muted leading-relaxed'>
              What&apos;s new, improved and fixed in every release of Steam Game Idler, newest
              first.
            </p>
          </div>
          <a
            href='/changelog/rss.xml'
            className='btn-ghost shrink-0 self-start rounded-full px-5 py-2.5 sm:self-auto'
          >
            <FiRss className='h-4 w-4' aria-hidden='true' />
            RSS feed
          </a>
        </header>

        {entries.length > 0 ? (
          <ChangelogClient
            entries={entries.map(entry => ({
              version: entry.version,
              tags: entry.tags,
              searchText: entry.searchText,
              node: (
                <article
                  id={entry.version}
                  className='changelog-entry grid md:grid-cols-[var(--cl-meta)_minmax(0,1fr)] md:gap-x-[var(--cl-gap)]'
                >
                  {/* sits on the timeline rail, level with the version title */}
                  <span className='changelog-entry__node' aria-hidden='true' />

                  {/* Date and Tags */}
                  {/* md+: a column the height of the release; justify-start keeps the tags right under
                      the date instead of spread to the column's bottom */}
                  <div className='flex flex-row-reverse md:flex-col items-center justify-between md:justify-start md:items-start gap-3 mb-4 md:mb-0'>
                    <time className='text-sm text-text-muted'>
                      {entry.date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>

                    {entry.tags.length > 0 && (
                      <div className='flex gap-2 flex-wrap'>
                        {entry.tags.map(tag => (
                          <span key={tag} className={`changelog-tag ${tagClass(tag)}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className='min-w-0'>
                    <Link href={`/changelog/${entry.version}`} prefetch={false}>
                      <h2 className='text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-text-primary mb-4 hover:text-text-muted transition-colors duration-150'>
                        v{entry.version}
                      </h2>
                    </Link>

                    <div className='prose max-w-[68ch] text-text-muted leading-relaxed mb-4'>
                      <entry.Mdx components={getMDXComponents()} />
                    </div>
                  </div>
                </article>
              ),
            }))}
          />
        ) : (
          <div className='text-center py-16'>
            <p className='text-text-muted text-lg'>No changelog entries yet.</p>
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  )
}
