'use client'

import { Analytics } from '@vercel/analytics/next'
import { usePathname } from 'next/navigation'

export default function AnalyticsLoader() {
  const pathname = usePathname()

  if (pathname.includes('/supported-games') || pathname.includes('/ad-page')) {
    return null
  }

  return <Analytics />
}
