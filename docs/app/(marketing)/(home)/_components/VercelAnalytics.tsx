'use client'

import { Analytics } from '@vercel/analytics/next'
import { usePathname } from 'next/navigation'

export default function TelemetryLoader() {
  const pathname = usePathname()

  // Supported-games pages are programmatic SEO landing pages, not real marketing/docs
  // traffic — exclude them from analytics so they don't skew engagement metrics.
  if (pathname?.startsWith('/supported-games')) {
    return null
  }

  return <Analytics />
}
