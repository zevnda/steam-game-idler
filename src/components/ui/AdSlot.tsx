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
      'supported-games/subnautica',
      'supported-games/no-mans-sky',
      'supported-games/borderlands-3',
      'supported-games/the-forest',
      'supported-games/phasmophobia',
      'supported-games/satisfactory',
      'supported-games/factorio',
      'supported-games/rimworld',
      'supported-games/hades',
      'supported-games/slay-the-spire',
      'supported-games/celeste',
      'supported-games/hollow-knight',
      'supported-games/dark-souls-3',
      'supported-games/elden-ring',
      'supported-games/monster-hunter-world',
      'supported-games/deep-rock-galactic',
      'supported-games/payday-3',
      'supported-games/forza-horizon-5',
      'supported-games/fifa-23',
      'supported-games/nba-2k23',
      'supported-games/madden-nfl-23',
      'supported-games/football-manager-2024',
      'supported-games/civilization-vi',
      'supported-games/total-war-warhammer-3',
      'supported-games/crusader-kings-3',
      'supported-games/euro-truck-simulator-2',
      'supported-games/american-truck-simulator',
      'supported-games/flight-simulator',
      'supported-games/planet-coaster',
      'supported-games/cities-skylines',
      'supported-games/planet-zoo',
      'supported-games/the-sims-4',
      'supported-games/simcity',
      'supported-games/lego-star-wars',
      'supported-games/star-wars-jedi-survivor',
      'supported-games/lego-harry-potter',
      'supported-games/hogwarts-legacy',
      'supported-games/marvels-spider-man',
      'supported-games/batman-arkham-knight',
      'supported-games/red-dead-redemption-2',
      'supported-games/far-cry-6',
      'supported-games/assassins-creed-valhalla',
      'supported-games/watch-dogs-legion',
      'supported-games/ghostrunner',
      'supported-games/doom-eternal',
      'supported-games/quake-champions',
      'supported-games/overwatch-2',
      'supported-games/paladins',
      'supported-games/smite',
      'supported-games/league-of-legends',
      'supported-games/valorant',
    ],
    [],
  )

  // const randomSlug = gameSlugs[Math.floor(Math.random() * gameSlugs.length)]
  // // const gameUrl = `http://localhost:3001/${randomSlug}`
  // const gameUrl = `https://steamgameidler.com/${randomSlug}`

  const [gameUrl, setGameUrl] = useState(() => {
    const randomSlug = gameSlugs[Math.floor(Math.random() * gameSlugs.length)]
    // return `http://localhost:3001/${randomSlug}`
    return `https://steamgameidler.com/${randomSlug}`
  })

  useEffect(() => {
    const timer = setTimeout(
      () => {
        const randomSlug = gameSlugs[Math.floor(Math.random() * gameSlugs.length)]
        // setGameUrl(`http://localhost:3001/${randomSlug}`)
        setGameUrl(`https://steamgameidler.com/${randomSlug}`)
        setReloadKey(key => key + 1)
      },
      30 * 60 * 1000,
    )

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
