'use client'

import { useEffect, useRef, useState } from 'react'
import { FaQuoteRight } from 'react-icons/fa6'
import SpotlightCard from '@/app/(marketing)/(home)/_components/SpotlightCard'

function TestimonialCard({
  content,
  username,
  platform,
}: {
  content: string
  username: string
  platform: string
}) {
  return (
    <SpotlightCard className='h-full'>
      <div className='flex flex-col h-full p-6'>
        <p className='text-text-primary text-sm leading-relaxed flex-1 mb-5'>{content}</p>
        <div className='flex items-center justify-end'>
          <div className='flex flex-col items-end gap-0.5'>
            <span className='text-text-primary text-xs'>{username}</span>
            <span className='text-text-muted text-xs'>{platform}</span>
          </div>
        </div>
        <FaQuoteRight
          className='absolute bottom-3 left-3 w-16 h-16 text-white/4 select-none pointer-events-none'
          aria-hidden='true'
        />
      </div>
    </SpotlightCard>
  )
}

const testimonials = [
  {
    content:
      "All the other idlers cost more — monthly and yearly — while SGI is free and includes features that others either don't offer or lock behind paywalls.",
    username: 'Proxii',
    platform: 'Discord',
  },
  {
    content: "Just hopping in to say that @zevnda ... you are doing the lord's work!",
    username: 'DrSadistic',
    platform: 'Discord',
  },
  {
    content:
      'I am always looking forward to any and all new features being added. SGI is great btw.',
    username: 'Spectro',
    platform: 'Discord',
  },
  {
    content: 'I supported with PRO purely just to auto-claim free games.',
    username: 'Zayne',
    platform: 'Discord',
  },
  {
    content: "Thanks for this app — well done, it's brilliant work",
    username: 'B N Y',
    platform: 'Discord',
  },
  {
    content:
      'Thank you to all the developers (or just one) and contributors that have made SGI into a reality. SO many people appreciate what you guys do <3',
    username: '*✦bunnish',
    platform: 'Discord',
  },
  {
    content:
      'Steam Game Idler is perfect if you want to customize your profile or be that one person with thousands of hours on a joke game. Runs smoothly in the background. Simple, convenient, and works great.',
    username: 'dlyay',
    platform: 'Discord',
  },
  {
    content:
      'Switched from Idle Master Extended after it broke with newer titles, and I was always put off by the setup process of ArchiSteamFarm — I love your app, it looks really modern and is working for the newer games.',
    username: 'Deathwalker',
    platform: 'Discord',
  },
  {
    content:
      "Thank you so much! So far, I've found the Trading Card Manager to be very useful. Thank you for working on this all-in-one software. It's an amazing tool, all the better for being open source.",
    username: 'Raggart',
    platform: 'steamgifts.com',
  },
  {
    content:
      'I have 2,903 games and farmed 1,600 of them in 2 weeks — made around $150 from card sales and grabbed Stellar Blade Complete Edition for free. Better than nothing!',
    username: 'Mazewaliztli47',
    platform: 'steamgifts.com',
  },
  {
    content:
      'This is a great utility. It makes the nightmare of managing steam cards actually managable.',
    username: 'Nogift4u',
    platform: 'steamgifts.com',
  },
  {
    content:
      "Downloaded and idling cards with this for about 24 hours so far. I've used ASF in the past, but this is friendlier and I like it so far.",
    username: 'DrR0Ck',
    platform: 'steamgifts.com',
  },
  {
    content:
      'Thanks for the tool. Being able to simultaneously idle up to 32 games is great; only took a few days to get through all my remaining card drops.',
    username: 'BarbaricGenie',
    platform: 'steamgifts.com',
  },
  {
    content: 'Thank you very much! A very good alternative with a ton of useful features.',
    username: 'rashka',
    platform: 'steamgifts.com',
  },
]

const SCROLL_SPEED = 0.5
const RESUME_DELAY = 1000

function wrapPos(pos: number, halfWidth: number) {
  pos = pos % halfWidth
  if (pos > 0) pos -= halfWidth
  return pos
}

export default function TestimonialsSlider() {
  const [shuffled, setShuffled] = useState(testimonials)
  useEffect(() => {
    setShuffled([...testimonials].sort(() => Math.random() - 0.5))
  }, [])
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const isPausedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartPosRef = useRef(0)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)
  const [dragging, setDragging] = useState(false)

  function scheduleResume() {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => {
      isPausedRef.current = false
    }, RESUME_DELAY)
  }

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const tick = () => {
      if (!isPausedRef.current) {
        const halfWidth = track.scrollWidth / 2
        if (halfWidth > 0) {
          posRef.current = wrapPos(posRef.current - SCROLL_SPEED, halfWidth)
          track.style.transform = `translateX(${posRef.current}px)`
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [])

  const startDrag = (clientX: number) => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    isPausedRef.current = true
    isDraggingRef.current = true
    dragStartXRef.current = clientX
    dragStartPosRef.current = posRef.current
    setDragging(true)
  }

  const moveDrag = (clientX: number) => {
    if (!isDraggingRef.current || !trackRef.current) return
    const delta = clientX - dragStartXRef.current
    const halfWidth = trackRef.current.scrollWidth / 2
    posRef.current = wrapPos(dragStartPosRef.current + delta, halfWidth)
    trackRef.current.style.transform = `translateX(${posRef.current}px)`
  }

  const endDrag = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setDragging(false)
    scheduleResume()
  }

  return (
    <div
      className='w-full overflow-hidden mt-16 sm:mt-20 select-none'
      style={{
        maskImage:
          'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={e => startDrag(e.clientX)}
      onMouseMove={e => moveDrag(e.clientX)}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchStart={e => startDrag(e.touches[0].clientX)}
      onTouchMove={e => moveDrag(e.touches[0].clientX)}
      onTouchEnd={endDrag}
    >
      <div
        ref={trackRef}
        className='flex items-stretch gap-5 w-max'
        style={{ willChange: 'transform' }}
      >
        {shuffled.map(t => (
          <div key={t.username} className='w-72 shrink-0'>
            <TestimonialCard content={t.content} username={t.username} platform={t.platform} />
          </div>
        ))}
        {shuffled.map(t => (
          <div key={`dup-${t.username}`} aria-hidden='true' className='w-72 shrink-0'>
            <TestimonialCard content={t.content} username={t.username} platform={t.platform} />
          </div>
        ))}
      </div>
    </div>
  )
}
