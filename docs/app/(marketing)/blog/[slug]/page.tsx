import { FiArrowLeft, FiChevronRight, FiGithub } from 'react-icons/fi'
import { getBlogMDXComponents } from '../_components/mdx'
import PostCard from '../_components/PostCard'
import TableOfContents from '../_components/TableOfContents'
import { InlineTOC } from 'fumadocs-ui/components/inline-toc'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import FinalCta from '@/app/(marketing)/(home)/_components/landing/FinalCta'
import LandingFooter from '@/app/(marketing)/(home)/_components/landing/LandingFooter'
import LandingNav from '@/app/(marketing)/(home)/_components/landing/LandingNav'
import JsonLd from '@/app/lib/JsonLd'
import {
  absoluteUrl,
  formatDate,
  getAuthor,
  getPost,
  getPostImage,
  getPublishedPosts,
  getReadingTime,
  getRelatedPosts,
  getSlug,
  SITE_URL,
} from '@/lib/blog'

interface PageProps {
  params: Promise<{ slug: string }>
}

// `output: 'export'` fails the whole build when a dynamic route generates zero pages, which is
// the state whenever every post is still a draft. The placeholder resolves to notFound() below
// (getPost finds nothing) and is excluded from the sitemap in next-sitemap.config.mjs.
const EMPTY_BLOG_PLACEHOLDER = '_no-posts'

export function generateStaticParams() {
  const params = getPublishedPosts().map(post => ({ slug: getSlug(post) }))
  return params.length > 0 ? params : [{ slug: EMPTY_BLOG_PLACEHOLDER }]
}

export async function generateMetadata(props: PageProps) {
  const { slug } = await props.params
  const post = getPost(slug)
  if (!post) notFound()

  const { title, seoTitle, description, date, updated, keywords, tags, category } = post.data
  const shareTitle = seoTitle ?? title
  const image = getPostImage(post)
  const author = getAuthor(post.data.author)

  return {
    // An explicit search title is already complete, so it skips the layout's
    // "%s | Steam Game Idler" template - same rule as the docs pages.
    title: seoTitle ? { absolute: seoTitle } : title,
    description,
    keywords,
    authors: [{ name: author.name, url: author.url }],
    openGraph: {
      url: `${SITE_URL}${post.url}`,
      title: shareTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: post.data.imageAlt ?? title }],
      type: 'article',
      publishedTime: date,
      modifiedTime: updated ?? date,
      authors: [author.url],
      section: category,
      tags,
    },
    twitter: {
      title: shareTitle,
      description,
      images: image,
    },
    alternates: {
      canonical: post.url,
      types: { 'application/rss+xml': [{ url: '/blog/rss.xml', title: 'Steam Game Idler Blog' }] },
    },
  }
}

export default async function BlogPostPage(props: PageProps) {
  const { slug } = await props.params
  const post = getPost(slug)
  if (!post) notFound()

  const { title, description, date, updated, category, tags, keywords } = post.data
  const MDX = post.data.body
  const toc = post.data.toc.filter(item => item.depth <= 3)
  const author = getAuthor(post.data.author)
  const { minutes, words } = await getReadingTime(post)
  const related = getRelatedPosts(post)
  const relatedTimes = await Promise.all(related.map(getReadingTime))
  const url = absoluteUrl(post.url)

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      'headline': title,
      description,
      'image': [getPostImage(post)],
      'datePublished': date,
      'dateModified': updated ?? date,
      'author': { '@type': 'Person', 'name': author.name, 'url': author.url },
      'publisher': {
        '@type': 'Organization',
        'name': 'Steam Game Idler',
        'url': SITE_URL,
        'logo': { '@type': 'ImageObject', 'url': `${SITE_URL}/logo.png` },
      },
      'mainEntityOfPage': { '@type': 'WebPage', '@id': url },
      url,
      'isPartOf': { '@type': 'Blog', '@id': `${SITE_URL}/blog#blog` },
      'articleSection': category,
      'keywords': [...new Set([...tags, ...(keywords ?? [])])].join(', '),
      'wordCount': words,
      'inLanguage': 'en-US',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE_URL },
        { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': `${SITE_URL}/blog` },
        { '@type': 'ListItem', 'position': 3, 'name': title, 'item': url },
      ],
    },
  ]

  return (
    <div className='landing min-h-screen bg-background'>
      <JsonLd data={schema} />
      <LandingNav />

      <main className='landing-container pb-20 pt-28 sm:pt-32'>
        <nav aria-label='Breadcrumb' className='mb-8'>
          <ol className='flex flex-wrap items-center gap-1.5 text-sm text-text-muted'>
            <li>
              <Link prefetch={false} href='/' className='hover:text-text-primary'>
                Home
              </Link>
            </li>
            <li className='flex items-center gap-1.5'>
              <FiChevronRight className='h-3.5 w-3.5' aria-hidden='true' />
              <Link prefetch={false} href='/blog' className='hover:text-text-primary'>
                Blog
              </Link>
            </li>
            <li aria-current='page' className='flex items-center gap-1.5 text-text-primary'>
              <FiChevronRight className='h-3.5 w-3.5 text-text-muted' aria-hidden='true' />
              {category}
            </li>
          </ol>
        </nav>

        <header className='page-enter mx-auto mb-10 max-w-3xl lg:mx-0'>
          <div className='mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted'>
            <span className='rounded-md bg-accent/10 px-2 py-0.5 font-medium text-accent'>
              {category}
            </span>
            <time dateTime={date}>{formatDate(date)}</time>
            {updated && (
              <>
                <span aria-hidden='true'>·</span>
                <span>
                  Updated <time dateTime={updated}>{formatDate(updated)}</time>
                </span>
              </>
            )}
            <span aria-hidden='true'>·</span>
            <span>{minutes} min read</span>
          </div>

          <h1 className='gradient-text w-fit mb-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl'>
            {title}
          </h1>
          <p className='text-lg leading-relaxed text-text-muted sm:text-xl'>{description}</p>

          <p className='mt-6 text-sm text-text-muted'>
            By{' '}
            <a
              href={author.url}
              target='_blank'
              rel='author noopener noreferrer'
              className='font-medium text-text-primary hover:text-accent'
            >
              {author.name}
            </a>
          </p>
        </header>

        {post.data.image && (
          // The cover is the LCP element whenever a post has one: load it eagerly at high priority.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.data.image}
            alt={post.data.imageAlt ?? ''}
            width={1200}
            height={630}
            fetchPriority='high'
            decoding='async'
            className='mb-12 aspect-1200/630 w-full rounded-2xl border border-border object-cover'
          />
        )}

        <div className='grid gap-12 lg:grid-cols-[minmax(0,1fr)_14rem]'>
          <article className='min-w-0 max-w-3xl'>
            {toc.length > 0 && <InlineTOC items={toc} className='mb-10 lg:hidden' />}

            <div className='prose prose-blog max-w-none'>
              {/* eslint-disable-next-line */}
              <MDX components={getBlogMDXComponents()} />
            </div>

            {tags.length > 0 && (
              <ul className='mt-12 flex flex-wrap gap-2' aria-label='Tags'>
                {tags.map(tag => (
                  <li
                    key={tag}
                    className='rounded-md border border-border px-2.5 py-1 text-xs text-text-muted'
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}

            <section
              aria-label='About the author'
              className='card mt-4 flex items-start gap-4 p-5 hover:border-border'
            >
              <FiGithub className='mt-0.5 h-6 w-6 shrink-0 text-text-muted' aria-hidden='true' />
              <div>
                <p className='font-semibold text-text-primary'>
                  <a href={author.url} target='_blank' rel='author noopener noreferrer'>
                    {author.name}
                  </a>
                </p>
                <p className='text-sm text-text-muted'>{author.bio}</p>
              </div>
            </section>

            <Link
              prefetch={false}
              href='/blog'
              className='mt-10 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary'
            >
              <FiArrowLeft className='h-4 w-4' aria-hidden='true' />
              All posts
            </Link>
          </article>

          {toc.length > 0 && (
            <aside className='hidden lg:block'>
              <div className='sticky top-24'>
                <TableOfContents items={toc} />
              </div>
            </aside>
          )}
        </div>

        {related.length > 0 && (
          <section aria-labelledby='related-heading' className='mt-20'>
            <h2
              id='related-heading'
              className='mb-6 text-2xl font-bold tracking-tight text-text-primary'
            >
              Keep reading
            </h2>
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {related.map((other, i) => (
                <PostCard
                  key={other.url}
                  post={other}
                  minutes={relatedTimes[i].minutes}
                  headingLevel='h3'
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <FinalCta />
      <LandingFooter />
    </div>
  )
}
