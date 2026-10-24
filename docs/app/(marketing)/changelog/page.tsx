import ChangelogClient from './client'
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
  alternates: { canonical: '/changelog' },
}

function getName(path: string) {
  return PathUtils.basename(path, PathUtils.extname(path))
}

export default async function Page() {
  const posts = await Promise.all(
    changelog.getPages().map(async post => {
      const { body: Mdx } = await post.data.load()
      return {
        ...post,
        data: {
          ...post.data,
          tags: (post.data as BlogData).tags,
        } as BlogData,
        Mdx,
      }
    }),
  )

  posts.sort((a, b) => {
    const dateA = new Date(a.data.date ?? getName(a.path)).getTime()
    const dateB = new Date(b.data.date ?? getName(b.path)).getTime()
    if (dateB !== dateA) return dateB - dateA

    const semverA = getName(a.path)
    const semverB = getName(b.path)
    const parse = (v: string) => v.split('.').map(Number)
    const [ma, mi, pa] = parse(semverA)
    const [mb, miB, paB] = parse(semverB)
    if (mb !== ma) return mb - ma
    if (miB !== mi) return miB - mi
    return paB - pa
  })

  return (
    <div className='landing min-h-screen bg-background'>
      <LandingNav />

      <main className='landing-container [--container-max:68rem] pt-36 sm:pt-44 pb-28 sm:pb-36'>
        <header className='page-enter mb-16 max-w-2xl'>
          <h1 className='text-[clamp(2.6rem,5.6vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-text-primary'>
            Changelog
          </h1>
          <p className='mt-6 text-lg text-text-muted leading-relaxed'>
            What&apos;s new, improved and fixed in every release of Steam Game Idler, newest first.
          </p>
        </header>

        {/* Posts */}
        <ChangelogClient totalPosts={posts.length}>
          {posts.map((post, index) => (
            <article
              key={post.url}
              data-index={index}
              id={post.data.title}
              className='changelog-entry flex flex-col md:flex-row gap-4 items-start'
            >
              {/* Date and Tags */}
              <div className='flex flex-row-reverse md:flex-col items-center justify-between md:items-start gap-3 mb-4 w-full md:w-45 shrink-0'>
                <time className='text-sm text-text-muted'>
                  {new Date(post.data.date ?? getName(post.path)).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>

                {post.data.tags && (
                  <div className='flex gap-2 flex-wrap'>
                    {post.data.tags.map(tag => (
                      <span
                        key={tag}
                        className={`text-[13px] px-2.5 py-1 rounded-full font-medium ${
                          tag === 'New'
                            ? 'bg-green-500/15 text-green-400'
                            : tag === 'Improved'
                              ? 'bg-purple-500/15 text-purple-400'
                              : tag === 'Fixed'
                                ? 'bg-cyan-500/15 text-cyan-400'
                                : 'bg-white/8 text-text-muted'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Link href={`/changelog/${post.data.title}`} prefetch={false}>
                  <h2 className='text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-text-primary mb-4 hover:text-text-muted transition-colors duration-150'>
                    v{post.data.title}
                  </h2>
                </Link>

                <div className='prose max-w-[68ch] text-text-muted leading-relaxed mb-4'>
                  <post.Mdx components={getMDXComponents()} />
                </div>
              </div>
            </article>
          ))}
        </ChangelogClient>

        {posts.length === 0 && (
          <div className='text-center py-16'>
            <p className='text-text-muted text-lg'>No changelog entries yet.</p>
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  )
}
