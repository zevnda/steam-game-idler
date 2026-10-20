import type { ReactNode } from 'react'
import { FiZap } from 'react-icons/fi'
import YouTube from './YouTube'
import { ImageZoom } from 'fumadocs-ui/components/image-zoom'
import { Step, Steps } from 'fumadocs-ui/components/steps'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { getMDXComponents } from '@/mdx-components'

interface FigureProps {
  src: string
  alt: string
  caption?: ReactNode
  // Intrinsic size. Required so the browser reserves the space before the image loads (no layout
  // shift - CLS is a ranking signal), and so Google Images gets real dimensions.
  width: number
  height: number
}

/**
 * An image with a visible caption. Prefer this over bare markdown images in posts: captions are
 * read far more than body text, and the caption plus alt text is what Google Images and AI answer
 * engines use to understand the picture.
 */
function Figure({ src, alt, caption, width, height }: FigureProps) {
  return (
    <figure className='not-prose my-8'>
      <ImageZoom
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading='lazy'
        decoding='async'
        className='w-full h-auto rounded-xl border border-border'
      />
      {caption && (
        <figcaption className='mt-3 text-center text-sm text-text-muted'>{caption}</figcaption>
      )}
    </figure>
  )
}

/**
 * A short "what you need to know" summary near the top of a post. Answer engines (AI Overviews,
 * ChatGPT, Perplexity) quote self-contained summary passages like this far more often than
 * conclusions buried at the end.
 */
function KeyTakeaways({
  title = 'Key takeaways',
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <aside className='not-prose my-8 rounded-xl border border-accent/25 bg-accent/5 p-5 sm:p-6'>
      <p className='mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent'>
        <FiZap className='h-4 w-4' aria-hidden='true' />
        {title}
      </p>
      <div className='blog-takeaways text-[0.95rem] leading-relaxed text-text-primary'>
        {children}
      </div>
    </aside>
  )
}

// Everything a post can use without an import. The create-blog-post skill documents these in
// `.claude/skills/create-blog-post/references/post-format.md` - keep that table in sync.
export function getBlogMDXComponents() {
  return getMDXComponents({ Figure, KeyTakeaways, YouTube, Steps, Step, Tabs, Tab })
}
