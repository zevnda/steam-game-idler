import { FiArrowRight } from 'react-icons/fi'
import SectionHeading from './SectionHeading'
import Link from 'next/link'
import PostCard from '@/app/(marketing)/blog/_components/PostCard'
import { getPublishedPosts, getReadingTime } from '@/lib/blog'

// Grid sized to the number of posts, so one or two posts sit centered instead of leaving empty
// columns. Literal class strings so Tailwind generates them.
const GRID_BY_COUNT: Record<number, string> = {
  1: 'max-w-md mx-auto',
  2: 'sm:grid-cols-2 max-w-4xl mx-auto',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
}

/**
 * "From the blog" - the three newest posts, near the bottom of the home page.
 *
 * Here for discovery, not for the home page's own ranking: the home page is the site's most
 * crawled and strongest page, so linking new posts from it gets them found and ranking sooner than
 * leaving them two clicks deep under /blog. Server-rendered (a server component) so the links are
 * in the static HTML, placed after the FAQ so nothing the home page ranks for moves, and it renders
 * nothing at all while there are no posts.
 */
export default async function LatestPosts() {
  const posts = getPublishedPosts().slice(0, 3)
  if (posts.length === 0) return null
  const readingTimes = await Promise.all(posts.map(getReadingTime))

  return (
    <section aria-labelledby='blog-heading' className='landing-section'>
      <div className='landing-container'>
        <SectionHeading
          id='blog-heading'
          title={
            <>
              Steam news, <span className='gradient-text'>explained.</span>
            </>
          }
          sub="What Steam's changes mean for idling, trading cards and achievements."
        />

        <div className={`mt-12 grid gap-6 ${GRID_BY_COUNT[posts.length]}`}>
          {posts.map((post, i) => (
            <PostCard
              key={post.url}
              post={post}
              minutes={readingTimes[i].minutes}
              headingLevel='h3'
            />
          ))}
        </div>

        <div className='mt-10 text-center'>
          <Link prefetch={false} href='/blog' className='btn-ghost px-5 py-2.5 rounded-full'>
            All posts
            <FiArrowRight className='h-4 w-4' aria-hidden='true' />
          </Link>
        </div>
      </div>
    </section>
  )
}
