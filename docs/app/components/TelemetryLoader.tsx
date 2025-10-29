'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { usePathname } from 'next/navigation'

export default function TelemetryLoader() {
  const pathname = usePathname()

  if (pathname.includes('/supported-games')) {
    return null
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
