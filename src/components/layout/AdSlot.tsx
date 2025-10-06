import type { ReactElement } from 'react'

import { cn, Spinner } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useStateContext } from '@/components/contexts/StateContext'

export default function AdSlot(): ReactElement {
  const { sidebarCollapsed } = useStateContext()
  const { activePage } = useNavigationContext()
  const [reloadKey, setReloadKey] = useState(0)

  const gameSlugs = useMemo(
    () => [
      'supported-games/scum',
      'supported-games/dayz',
      'supported-games/arma-3',
      'supported-games/miscreated',
      'supported-games/rust',
      'supported-games/counter-strike-2',
      'supported-games/dota-2',
      'supported-games/team-fortress-2',
      'supported-games/grand-theft-auto-v',
      'supported-games/apex-legends',
      'supported-games/destiny-2',
      'supported-games/warframe',
      'supported-games/dead-by-daylight',
      'supported-games/rainbow-six-siege',
      'supported-games/garry-mod',
      'supported-games/left-4-dead-2',
      'supported-games/portal-2',
      'supported-games/half-life-2',
      'supported-games/cyberpunk-2077',
      'supported-games/the-witcher-3',
      'supported-games/skyrim',
      'supported-games/fallout-4',
      'supported-games/terraria',
      'supported-games/stardew-valley',
      'supported-games/among-us',
      'supported-games/valheim',
      'supported-games/sea-of-thieves',
      'supported-games/rocket-league',
      'supported-games/payday-2',
      'supported-games/pubg',
      // 'docs/get-started/install',
      // 'docs/get-started/how-to-sign-in',
      // 'docs/get-started/build-it-yourself',
      // 'docs/features/card-farming',
      // 'docs/features/achievement-unlocker',
      // 'docs/features/achievement-manager',
      // 'docs/features/trading-card-manager',
      // 'docs/features/playtime-booster',
      // 'docs/features/auto-idler',
      // 'docs/features/task-scheduling',
      // 'docs/features/free-games',
      // 'docs/settings/general',
      // 'docs/settings/card-farming',
      // 'docs/settings/achievement-unlocker',
      // 'docs/settings/trading-card-manager',
      // 'docs/settings/game-settings',
      // 'docs/steam-credentials',
      // 'docs/troubleshooting',
      // 'docs/faq',
    ],
    [],
  )

  const [gameUrl, setGameUrl] = useState(() => {
    const randomSlug = gameSlugs[Math.floor(Math.random() * gameSlugs.length)]
    // return `http://localhost:3001/${randomSlug}`
    return `https://steamgameidler.com/${randomSlug}`
  })

  useEffect(() => {
    // const timeout = Math.floor(Math.random() * (10 * 60 * 1000 + 1)) + 5 * 60 * 1000 // 5 to 10 minutes
    const timeout = Math.floor(Math.random() * (60 * 60 * 1000 - 30 * 60 * 1000 + 1)) + 30 * 60 * 1000 // 30 to 60 minutes

    const timer = setTimeout(() => {
      const randomSlug = gameSlugs[Math.floor(Math.random() * gameSlugs.length)]
      // setGameUrl(`http://localhost:3001/${randomSlug}`)
      setGameUrl(`https://steamgameidler.com/${randomSlug}`)
      setReloadKey(key => key + 1)
    }, timeout)

    return () => clearTimeout(timer)
  }, [gameSlugs, reloadKey])

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
          className='overflow-scroll rounded-lg -mt-[352px] -ml-[301px] z-1'
          src={gameUrl}
          width='600'
          height='600'
          title='External Website'
          sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation'
        />
        <Spinner className='absolute inset-0 m-auto z-0' />
      </div>
    </div>
  )
}
