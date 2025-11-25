import path from 'node:path'

import { blog } from '../../../../lib/source'
import { getMDXComponents } from 'mdx-components'
import { notFound } from 'next/navigation'

function getName(p: string) {
  return path.basename(p, path.extname(p))
}

export default async function Page(props: PageProps<'/changelog/[slug]'>) {
  const params = await props.params
  const page = blog.getPage([params.slug])

  if (!page) notFound()
  const { body: Mdx } = await page.data.load()
  const data = page.data as {
    title: string
    date: string | Date
    tags?: string[]
  }

  return (
    <main
      className='changelog-scroll h-screen text-gray-100 overflow-auto'
      style={{
        backgroundImage: 'linear-gradient(to bottom, #1d1d1dff 0%, #000000ff 100%)',
      }}
    >
      <div className='max-w-4xl mx-auto px-6 pt-12 pb-4'>
        {/* Single Post */}
        <article className='flex flex-col md:flex-row items-start'>
          {/* Date and Tags */}
          <div className='flex flex-row-reverse md:flex-col items-center justify-between md:items-start gap-3 mb-4 w-full md:w-[180px] shrink-0'>
            <time className='text-xs text-[#979797]'>
              {new Date(data.date ?? getName(page.path)).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>

            {data.tags && (
              <div className='flex gap-2 flex-wrap'>
                {data.tags.map(tag => (
                  <span
                    key={tag}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                      tag === 'New'
                        ? 'bg-green-500/15 text-green-400'
                        : tag === 'Improved'
                          ? 'bg-purple-500/15 text-purple-400'
                          : tag === 'Fixed'
                            ? 'bg-cyan-500/15 text-cyan-400'
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
            <h2 id={data.title} className='text-3xl font-bold mb-4'>
              v{data.title}
            </h2>

            {/* Rendered Markdown (MDX) */}
            <div className='prose text-gray-300 leading-relaxed mb-4'>
              <Mdx components={getMDXComponents()} />
            </div>
          </div>
        </article>
      </div>
    </main>
  )
}

export function generateStaticParams(): { slug: string }[] {
  return blog.getPages().map(page => ({
    slug: page.slugs[0],
  }))
}
