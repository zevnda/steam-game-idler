import type { ActiveGameProgress } from '../types'
import { useEffect, useState } from 'react'
import { AchievementUnlockerCurrentGamePanel } from './AchievementUnlockerCurrentGamePanel'
import { AchievementUnlockerUpcomingPanel } from './AchievementUnlockerUpcomingPanel'

interface AchievementUnlockerActiveRowProps {
  entry: ActiveGameProgress
}

// Ticks once a second while mounted, purely to force this row's panels to re-derive their
// countdown displays from render time - the backend only sends absolute timestamps (see
// `UpcomingAchievement.unlockAtMs`'s doc comment in src-tauri/src/achievement_unlocker/mod.rs for
// why it doesn't re-emit a ticking value itself).
const useNowTick = () => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])
  return now
}

// One running game's row within the achievement-unlocker page's running-state view - two side-by-
// side panels mirroring `main`'s GameRow.tsx + UpcomingAchievementsList.tsx pair (current game/
// cover art/remaining count on the left, the next up to 5 achievements with live countdowns on the
// right), stacked vertically when `worker_count` > 1 puts more than one game active at once.
export const AchievementUnlockerActiveRow = ({ entry }: AchievementUnlockerActiveRowProps) => {
  const now = useNowTick()

  return (
    <div className='flex flex-col gap-4 sm:flex-row'>
      <AchievementUnlockerCurrentGamePanel entry={entry} now={now} />
      <AchievementUnlockerUpcomingPanel
        achievements={entry.upcoming}
        appId={entry.appId}
        now={now}
      />
    </div>
  )
}
