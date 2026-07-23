'use client'

import type { CSSProperties } from 'react'
import { FaLinux, FaWindows } from 'react-icons/fa6'
import Link from 'next/link'
import { useGlobalStore } from '@/app/lib/globalStore'

interface DownloadButtonProps {
  label?: string
  className?: string
  iconClassName?: string
  style?: CSSProperties
  onClick?: () => void
}

/**
 * Single source of truth for every CTA that links to the /download page. Icon follows the
 * detected/selected platform (`globalStore`'s `selectedOS`, set by `OSDetector.tsx`) - the actual
 * per-platform download links (and the "no Linux release yet" fallback) live on the /download
 * page itself (`DownloadHero.tsx`), this is just a generic entry point.
 */
export default function DownloadButton({
  label = 'Go to Downloads',
  className = '',
  iconClassName = 'w-4 h-4',
  style,
  onClick,
}: DownloadButtonProps) {
  const selectedOS = useGlobalStore(state => state.selectedOS)

  return (
    <Link
      prefetch={false}
      href='/download'
      className={`btn-download ${className}`.trim()}
      style={style}
      onClick={onClick}
    >
      {selectedOS === 'linux' ? (
        <FaLinux className={iconClassName} />
      ) : (
        <FaWindows className={iconClassName} />
      )}
      {label}
    </Link>
  )
}
