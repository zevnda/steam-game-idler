import type { ReactElement } from 'react'

import Image from 'next/image'

export default function Logo(): ReactElement {
  return (
    <div className='flex items-center gap-2'>
      <Image src='/logo.png' alt='Logo' width={32} height={32} />
      <p className='font-semibold text-lg'>Steam Game Idler</p>
    </div>
  )
}
