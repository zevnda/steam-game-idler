import path from 'node:path'
import { notFound } from 'next/navigation'
import { changelog } from '@/lib/source'
import { getMDXComponents } from '@/mdx-components'

interface PageProps {
  params: {
    slug: string
  }
}

// One page per release, loaded by the desktop app's ChangelogModal iframe. Every entry is already
// on /changelog in full, so these are kept out of search (noindex here, excluded from the sitemap
// in next-sitemap.config.mjs) to avoid ~100 thin duplicates. `follow` still lets links count.
export const metadata = {
  robots: { index: false, follow: true },
}

// Same soft-tint pill as the app's own status chips (bg-<color>/10 + text-<color>); the colors
// live in globals.css (`.changelog-tag--*`) so they can shift for the light scheme.
const TAG_CLASSES: Record<string, string> = {
  New: 'changelog-tag--new',
  Improved: 'changelog-tag--improved',
  Fixed: 'changelog-tag--fixed',
}

function getName(p: string) {
  return path.basename(p, path.extname(p))
}

export default async function Page(props: PageProps) {
  const params = await props.params
  const page = changelog.getPage([params.slug])

  if (!page) notFound()
  const { body: Mdx } = await page.data.load()
  const data = page.data as {
    title: string
    date: string | Date
    tags?: string[]
  }

  // Fixed-height column: the title/date/tags header stays put and only the notes list scrolls.
  // The colors come from `.changelog-embed` in globals.css (the app's own theme tokens, no
  // background of its own - see that rule's comment).
  return (
    <main className='changelog-embed flex h-screen flex-col'>
      <header className='shrink-0 border-b border-(--cl-separator) px-4 pt-1 pb-4'>
        <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
          <h2 id={data.title} className='text-2xl font-semibold tracking-tight'>
            v{data.title}
          </h2>

          <time className='text-xs text-(--cl-muted)'>
            {new Date(data.date ?? getName(page.path)).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>

        {data.tags && (
          <div className='mt-3 flex flex-wrap gap-2'>
            {data.tags.map(tag => (
              <span
                key={tag}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold changelog-tag ${TAG_CLASSES[tag] ?? ''}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* `relative` is load-bearing: the MDX output contains absolutely-positioned `sr-only`
          spans, and without a positioned ancestor they resolve against <body>, escape this scroll
          container, and stretch the document - giving the app's iframe a second, outer
          scrollbar. `min-h-0` lets this flex child shrink below its content so it scrolls. */}
      <div className='changelog-embed__scroll relative min-h-0 flex-1 overflow-auto px-4 py-4'>
        <div className='prose leading-relaxed'>
          <Mdx components={getMDXComponents()} />
        </div>
      </div>
    </main>
  )
}

export function generateStaticParams() {
  return changelog.getPages().map(page => ({
    slug: page.slugs[0],
  }))
}
