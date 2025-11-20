import type { ReactElement } from 'react'

export default function ProBadge(): ReactElement {
  return (
    <span
      className='rounded-full px-2 ml-1 font-black text-white italic'
      style={{
        backgroundImage: 'linear-gradient(120deg, #700084ff 0%, #7e15ffff 40%, #0095ffff 85%, #00a2c3ff 100%)',
      }}
    >
      PRO
    </span>
  )
}
