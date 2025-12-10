'use client'

import type { ReactNode } from 'react'

import { useEffect, useRef, useState } from 'react'

interface ChangelogClientProps {
  children: ReactNode
  totalPosts: number
}

export default function ChangelogClient({ children, totalPosts }: ChangelogClientProps) {
  const [visibleCount, setVisibleCount] = useState(10)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Only set up observer if there are more posts to load
    if (visibleCount >= totalPosts) return

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 5, totalPosts))
        }
      },
      {
        rootMargin: '200px',
      },
    )

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [visibleCount, totalPosts])

  useEffect(() => {
    // Hide posts beyond the visible count
    if (!containerRef.current) return

    const articles = containerRef.current.querySelectorAll('article[data-index]')
    articles.forEach((article, index) => {
      const el = article as HTMLElement
      if (index < visibleCount) {
        el.style.display = ''
      } else {
        el.style.display = 'none'
      }
    })
  }, [visibleCount])

  return (
    <>
      <div className='space-y-16' ref={containerRef}>
        {children}
      </div>

      {/* Pagination sentinel */}
      {visibleCount < totalPosts && <div ref={sentinelRef} className='h-px w-full' aria-hidden='true' />}

      {/* Loading indicator */}
      {visibleCount < totalPosts && (
        <div className='text-center py-8'>
          <p className='text-gray-400 text-sm'>Loading more changelogs...</p>
        </div>
      )}
    </>
  )
}
