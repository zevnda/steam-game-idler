'use client'

import { useState } from 'react'
import { FaYoutube } from 'react-icons/fa6'

interface YouTubeProps {
  id: string
  title: string
  caption?: string
}

/**
 * A click-to-load YouTube embed. A plain `<iframe>` pulls ~1 MB of player JS on page load, which
 * hurts LCP/INP on every post that has a video; this shows the thumbnail until the reader asks for
 * the player. The thumbnail is a real link to the video, so crawlers and no-JS readers still get
 * it, and the player uses youtube-nocookie.com so nothing is set before the reader opts in.
 */
export default function YouTube({ id, title, caption }: YouTubeProps) {
  const [active, setActive] = useState(false)

  return (
    <figure className='not-prose my-8'>
      <div className='relative aspect-video overflow-hidden rounded-xl border border-border bg-surface'>
        {active ? (
          <iframe
            className='absolute inset-0 h-full w-full'
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          />
        ) : (
          <a
            href={`https://www.youtube.com/watch?v=${id}`}
            onClick={e => {
              e.preventDefault()
              setActive(true)
            }}
            className='group absolute inset-0 block'
            aria-label={`Play video: ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=''
              loading='lazy'
              decoding='async'
              className='h-full w-full object-cover opacity-80 transition-opacity duration-200 group-hover:opacity-100'
            />
            <span className='absolute inset-0 flex items-center justify-center'>
              <FaYoutube className='h-16 w-16 text-[#ff0033] drop-shadow-lg transition-transform duration-200 group-hover:scale-110' />
            </span>
          </a>
        )}
      </div>
      <figcaption className='mt-3 text-center text-sm text-text-muted'>
        {caption ?? title}
      </figcaption>
    </figure>
  )
}
