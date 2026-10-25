import { FiRss } from 'react-icons/fi'
import PostCard from './_components/PostCard'
import FinalCta from '@/app/(marketing)/(home)/_components/landing/FinalCta'
import LandingFooter from '@/app/(marketing)/(home)/_components/landing/LandingFooter'
import LandingNav from '@/app/(marketing)/(home)/_components/landing/LandingNav'
import JsonLd from '@/app/lib/JsonLd'
import { absoluteUrl, getPublishedPosts, getReadingTime, SITE_URL } from '@/lib/blog'

const TITLE = 'Steam Game Idler Blog - Steam News, Guides & Tips'
const DESCRIPTION =
  'Steam news explained and what it means for idling, trading cards and achievements, plus in-depth guides from the team behind Steam Game Idler.'

export function generateMetadata() {
  const hasPosts = getPublishedPosts().length > 0

  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    // An empty listing is a thin page; keep it out of the index until the first post ships. Spread
    // rather than `robots: undefined`, which would still override (and blank) the layout's robots.
    ...(hasPosts ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      url: `${SITE_URL}/blog`,
      title: TITLE,
      description: DESCRIPTION,
      images: `${SITE_URL}/og-image.png`,
      type: 'website',
    },
    twitter: {
      title: TITLE,
      description: DESCRIPTION,
      images: `${SITE_URL}/og-image.png`,
    },
    alternates: {
      canonical: '/blog',
      types: { 'application/rss+xml': [{ url: '/blog/rss.xml', title: 'Steam Game Idler Blog' }] },
    },
  }
}

export default async function BlogIndexPage() {
  const posts = getPublishedPosts()
  const readingTimes = await Promise.all(posts.map(getReadingTime))
  const [featured, ...rest] = posts

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': `${SITE_URL}/blog#blog`,
      'name': 'Steam Game Idler Blog',
      'description': DESCRIPTION,
      'url': `${SITE_URL}/blog`,
      'inLanguage': 'en-US',
      'publisher': { '@type': 'Organization', 'name': 'Steam Game Idler', 'url': SITE_URL },
      'blogPost': posts.map(post => ({
        '@type': 'BlogPosting',
        'headline': post.data.title,
        'url': absoluteUrl(post.url),
        'datePublished': post.data.date,
        'dateModified': post.data.updated ?? post.data.date,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE_URL },
        { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': `${SITE_URL}/blog` },
      ],
    },
  ]

  return (
    <div className='landing min-h-screen bg-background'>
      <JsonLd data={schema} />
      <LandingNav />

      <main className='landing-container pb-28 pt-36 sm:pb-36 sm:pt-44'>
        <header className='page-enter mb-12 flex flex-col gap-6 sm:mb-16 sm:flex-row sm:items-end sm:justify-between'>
          <div className='max-w-2xl'>
            <h1 className='gradient-text w-fit mb-6 text-[clamp(2.6rem,5.6vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.04em]'>
              Steam news, explained.
            </h1>
            <p className='text-lg leading-relaxed text-text-muted'>
              What Steam&apos;s changes mean for idling, trading cards and achievements, plus guides
              from the people who build Steam Game Idler.
            </p>
          </div>
          <a
            href='/blog/rss.xml'
            className='btn-ghost shrink-0 self-start rounded-full px-5 py-2.5 sm:self-auto'
          >
            <FiRss className='h-4 w-4' aria-hidden='true' />
            RSS feed
          </a>
        </header>

        {featured ? (
          <>
            <div className='mb-8'>
              <PostCard post={featured} minutes={readingTimes[0].minutes} featured />
            </div>

            {rest.length > 0 && (
              <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                {rest.map((post, i) => (
                  <PostCard key={post.url} post={post} minutes={readingTimes[i + 1].minutes} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className='card px-6 py-16 text-center'>
            <p className='text-lg text-text-muted'>No posts yet. Check back soon.</p>
          </div>
        )}
      </main>

      {/* the articles' closing CTA (blog/[slug]/page.tsx), so the listing ends the same way */}
      <FinalCta />
      <LandingFooter />
    </div>
  )
}
