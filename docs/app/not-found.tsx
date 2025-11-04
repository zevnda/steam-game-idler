'use client'

import type { ReactElement } from 'react'

import { useTheme } from 'next-themes'
import Link from 'next/link'
import { NotFoundPage } from 'nextra-theme-docs'

export default function NotFound(): ReactElement {
  const { resolvedTheme } = useTheme()

  const styles = {
    background: resolvedTheme === 'dark' ? 'white' : 'black',
    color: resolvedTheme === 'dark' ? 'black' : 'white',
  }

  return (
    <NotFoundPage content='Report this issue on GitHub' labels='broken-link'>
      <p className='text-2xl font-semibold'>Uh-oh!</p>
      <p>The page you&apos;re looking for doesn&apos;t exist</p>
      <Link
        prefetch={false}
        className='mt-5'
        style={{
          ...styles,
          padding: 6,
          borderRadius: 4,
          fontWeight: 500,
        }}
        href='#'
        onClick={() => window.history.back()}
      >
        Go back
      </Link>
    </NotFoundPage>
  )
}
