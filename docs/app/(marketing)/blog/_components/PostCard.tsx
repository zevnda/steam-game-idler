import type { BlogPost } from '@/lib/blog'
import Link from 'next/link'
import { formatDate } from '@/lib/blog'

interface PostCardProps {
  post: BlogPost
  minutes: number
  // The newest post on the listing page: a wide two-column card instead of a grid tile.
  featured?: boolean
  headingLevel?: 'h2' | 'h3'
}

function Cover({ post, featured }: { post: BlogPost; featured: boolean }) {
  return (
    <div
      className={`relative overflow-hidden bg-surface-raised ${
        featured ? 'aspect-1200/630 md:aspect-auto md:h-full' : 'aspect-1200/630'
      }`}
    >
      {post.data.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.data.image}
          alt={post.data.imageAlt ?? ''}
          width={1200}
          height={630}
          // The featured card is above the fold on the listing page, so it's the LCP candidate.
          loading={featured ? 'eager' : 'lazy'}
          fetchPriority={featured ? 'high' : undefined}
          decoding='async'
          className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]'
        />
      ) : (
        // Posts without a cover get a quiet branded panel rather than an empty box.
        <div className='blog-cover-fallback flex h-full w-full items-end p-5'>
          <span className='text-xs font-semibold uppercase tracking-wider text-white/70'>
            {post.data.category}
          </span>
        </div>
      )}
    </div>
  )
}

export default function PostCard({
  post,
  minutes,
  featured = false,
  headingLevel = 'h2',
}: PostCardProps) {
  const Heading = headingLevel

  return (
    <article
      className={`card group relative flex h-full overflow-hidden ${
        featured ? 'flex-col md:grid md:grid-cols-2' : 'flex-col'
      }`}
    >
      <Cover post={post} featured={featured} />

      <div className={`flex flex-1 flex-col ${featured ? 'p-6 sm:p-8 md:justify-center' : 'p-5'}`}>
        <div className='mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted'>
          <span className='rounded-md bg-accent/10 px-2 py-0.5 font-medium text-accent'>
            {post.data.category}
          </span>
          <time dateTime={post.data.date}>{formatDate(post.data.date)}</time>
          <span aria-hidden='true'>·</span>
          <span>{minutes} min read</span>
        </div>

        <Heading
          className={`font-bold leading-snug tracking-tight text-text-primary ${
            featured ? 'mb-3 text-2xl sm:text-3xl' : 'mb-2 text-lg'
          }`}
        >
          {/* The whole card is clickable through this link's ::after overlay, so there is exactly
              one link per card (one anchor text for crawlers, one tab stop for keyboards). */}
          <Link
            prefetch={false}
            href={post.url}
            className='after:absolute after:inset-0 group-hover:text-white'
          >
            {post.data.title}
          </Link>
        </Heading>

        <p
          className={`text-sm leading-relaxed text-text-muted ${featured ? 'sm:text-base' : 'line-clamp-3'}`}
        >
          {post.data.description}
        </p>
      </div>
    </article>
  )
}
