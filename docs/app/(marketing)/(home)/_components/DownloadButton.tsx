'use client'

import type { CSSProperties } from 'react'
import { FaWindows } from 'react-icons/fa6'
import Link from 'next/link'

interface DownloadButtonProps {
  label?: string
  className?: string
  iconClassName?: string
  style?: CSSProperties
  onClick?: () => void
}

/** Single source of truth for every CTA that links to the /download page. */
export default function DownloadButton({
  label = 'Go to Downloads',
  className = '',
  iconClassName = 'w-4 h-4',
  style,
  onClick,
}: DownloadButtonProps) {
  return (
    <Link
      prefetch={false}
      href='/download'
      className={`btn-download ${className}`.trim()}
      style={style}
      onClick={onClick}
    >
      <FaWindows className={iconClassName} />
      {label}
    </Link>
  )
}
