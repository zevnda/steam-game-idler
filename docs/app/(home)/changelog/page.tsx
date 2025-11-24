import { blog } from '../../../lib/source'
import { PathUtils } from 'fumadocs-core/source'
import { getMDXComponents } from 'mdx-components'
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
  // Load posts and their MDX bodies
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

  // Sort posts by date, then by semver (descending)
  posts.sort((a, b) => {
    const dateA = new Date(a.data.date ?? getName(a.path)).getTime()
    const dateB = new Date(b.data.date ?? getName(b.path)).getTime()
    if (dateB !== dateA) return dateB - dateA

    // If dates are equal, compare by semver (descending)
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
    <main className='min-h-screen bg-black text-gray-100'>
      {/* Home button */}
      <div className='absolute top-6 left-6'>
        <Link href='/' className='text-[#979797] hover:opacity-80 duration-150'>
          &larr; Home
        </Link>
      </div>

      <div className='max-w-4xl mx-auto px-6 py-16'>
        {/* Header */}
        <div className='mb-16 relative'>
          <h1 className='text-5xl font-extrabold mb-2'>Changelog</h1>
          <p className='text-[#979797] font-medium'>
            See what’s new, fixed, and improved in each release of Steam Game Idler.
          </p>
        </div>

        {/* Divider */}
        <div className='border-t border-[#212121] my-8' />

        {/* Posts */}
        <div className='space-y-16'>
          {posts.map(post => (
            <article
              key={post.url}
              className='flex flex-col md:flex-row items-start border-t border-[#212121] pt-12 first:border-t-0 first:pt-0'
            >
              {/* Date and Tags */}
              <div className='flex flex-col gap-3 mb-4 w-1/4 shrink-0'>
                <time className='text-xs text-[#979797]'>
                  {new Date(post.data.date ?? getName(post.path)).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>

                {post.data.tags && (
                  <div className='flex gap-2'>
                    {post.data.tags.map(tag => (
                      <span
                        key={tag}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                          tag === 'new'
                            ? 'bg-green-500/10 text-green-400'
                            : tag === 'fixed'
                              ? 'bg-blue-500/10 text-blue-400'
                              : tag === 'changed'
                                ? 'bg-purple-500/10 text-purple-400'
                                : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                {/* Title */}
                <h2 id={post.data.title} className='text-3xl font-bold mb-4'>
                  {post.data.title}
                </h2>

                {/* Rendered Markdown (MDX) */}
                <div className='prose text-gray-300 leading-relaxed mb-4'>
                  <post.Mdx components={getMDXComponents()} />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className='text-center py-16'>
            <p className='text-gray-400 text-lg'>No changelog entries yet.</p>
          </div>
        )}
      </div>
    </main>
  )
}
