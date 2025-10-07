'use client'

import { Analytics } from '@vercel/analytics/next'
import { usePathname } from 'next/navigation'

export default function AnalyticsLoader() {
  const pathname = usePathname()

  if (pathname.includes('/supported-games')) {
    return null
  }

  return <Analytics />
}
