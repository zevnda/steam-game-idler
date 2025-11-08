'use client'

import type { ReactElement } from 'react'

import { Analytics } from '@vercel/analytics/next'
import { usePathname } from 'next/navigation'

export default function TelemetryLoader(): ReactElement | null {
  const pathname = usePathname()

  if (pathname.includes('/supported-games')) {
    return null
  }

  return <Analytics />
}
