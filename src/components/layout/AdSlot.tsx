import type { ReactElement } from 'react'

import { cn, Spinner } from '@heroui/react'
import { useState } from 'react'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useStateContext } from '@/components/contexts/StateContext'

export default function AdSlot(): ReactElement {
  const { sidebarCollapsed } = useStateContext()
  const { activePage } = useNavigationContext()

  const gameSlugs = [
    'scum',
    'dayz',
    'arma-3',
    'miscreated',
    'rust',
    'counter-strike-2',
    'dota-2',
    'team-fortress-2',
    'grand-theft-auto-v',
    'apex-legends',
    'destiny-2',
    'warframe',
    'dead-by-daylight',
    'rainbow-six-siege',
    'garry-mod',
    'left-4-dead-2',
    'portal-2',
    'half-life-2',
    'cyberpunk-2077',
    'the-witcher-3',
    'skyrim',
    'fallout-4',
    'terraria',
    'stardew-valley',
    'among-us',
    'valheim',
    'sea-of-thieves',
    'rocket-league',
    'payday-2',
    'pubg',
  ]

  const [gameUrl] = useState(() => {
    const randomSlug = gameSlugs[Math.floor(Math.random() * gameSlugs.length)]
    return `https://steamgameidler.com/supported-games/${randomSlug}`
  })

  return (
    <div
      className={cn(
        'bg-sidebar/80 border border-border/70 p-2 rounded-lg -mb-6 transition-all ease-in-out',
        sidebarCollapsed && activePage !== 'settings' ? 'scale-[.160]' : 'scale-[.75]',
        sidebarCollapsed ? 'duration-100' : 'duration-450',
      )}
    >
      <div className='relative flex justify-center items-center overflow-hidden rounded-lg'>
        <iframe
          key={gameUrl}
          className='overflow-scroll rounded-lg -mt-[351px] -ml-[300px] z-[1]'
          src={gameUrl}
          width='600'
          height='600'
          title='External Website'
          sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation'
        />
        <Spinner className='absolute inset-0 m-auto z-[0]' />
      </div>
    </div>
  )
}
