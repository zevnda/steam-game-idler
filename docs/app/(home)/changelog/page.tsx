import { blog } from '../../../lib/source'
import { getMDXComponents } from '../../../mdx-components'
import ChangelogClient from './client'
import FooterSection from '@docs/components/home/FooterSection'
import NavBar from '@docs/components/home/NavBar'
import { PathUtils } from 'fumadocs-core/source'
import Link from 'next/link'

interface BlogData {
  title: string
  date: string | Date
  tags?: string[]
}

function getName(path: string) {
  return PathUtils.basename(path, PathUtils.extname(path))
}

export default async function Page() {
  const posts = await Promise.all(
    blog.getPages().map(async post => {
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
    <div className='min-h-screen bg-background'>
      <NavBar />

      <div className='max-w-4xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-24'>
        {/* Header */}
        <div className='mb-16'>
          <h1 className='text-4xl sm:text-5xl font-bold text-text-primary mb-4 leading-tight tracking-tight'>
            Changelog
          </h1>
          <p className='text-text-muted'>
            See what&apos;s new, improved, and fixed in each release of Steam Game Idler.
          </p>
        </div>

        {/* Posts */}
        <ChangelogClient totalPosts={posts.length}>
          {posts.map((post, index) => (
            <article
              key={post.url}
              data-index={index}
              id={post.data.title}
              className='flex flex-col md:flex-row gap-4 items-start pt-12'
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              {/* Date and Tags */}
              <div className='flex flex-row-reverse md:flex-col items-center justify-between md:items-start gap-3 mb-4 w-full md:w-45 shrink-0'>
                <time className='text-xs text-text-muted'>
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
                        className={`text-xs px-2.5 py-1 rounded-md font-medium ${
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
                <Link href={`/changelog/${post.data.title}`}>
                  <h2 className='text-3xl font-bold text-text-primary mb-4 hover:text-text-muted transition-colors duration-150'>
                    v{post.data.title}
                  </h2>
                </Link>

                <div className='prose text-text-muted leading-relaxed mb-4'>
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
      </div>

      <div className='section-divider' />
      <FooterSection />
    </div>
  )
}
