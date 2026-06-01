'use client'

import { usePathname } from 'next/navigation'

export default function HelpDesk() {
  const pathname = usePathname()
  if (pathname.includes('/supported-games/') || pathname.includes('/changelog')) return null

  return <script id='chatway' src='https://cdn.chatway.app/widget.js?id=1F2cY0TT2RKh' />
}
