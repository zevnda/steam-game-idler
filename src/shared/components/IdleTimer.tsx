import { useEffect, useState } from 'react'
import { TbPlayerPauseFilled, TbPlayerPlayFilled } from 'react-icons/tb'
import { useIdlingStore } from '@/shared/stores/idlingStore'
import { pausedOverlapMs, usePlayingSessionStore } from '@/shared/stores/playingSessionStore'
import { useSessionStore } from '@/shared/stores/sessionStore'

interface IdleTimerProps {
  startTime: number
  // The idling game - lets the badge freeze while Steam Families holds just this game back (see
  // idlingStore's familyLockedSince). Optional for a badge with no real game behind it.
  appId?: number
}

const formatElapsed = (elapsedMs: number) => {
  const hours = Math.floor(elapsedMs / (1000 * 60 * 60))
  const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000)
  const pad = (n: number, width: number) => String(n).padStart(width, '0')

  if (hours <= 0) {
    return `${pad(minutes, 2)}:${pad(seconds, 2)}`
  }
  // Widens past the usual 1-digit hour count only once it actually matters, rather than always
  // reserving 2-3 digits of space.
  const hourWidth = hours >= 100 ? 3 : hours >= 10 ? 2 : 1
  return `${pad(hours, hourWidth)}:${pad(minutes, 2)}:${pad(seconds, 2)}`
}

// Elapsed-time badge for a currently-idling game card. `startTime` is a frontend-only timestamp
// (see idlingStore) - neither backend reports when idling actually started, only what's currently
// idling, so this can only ever measure "since this session last observed it idling," not true
// wall-clock idle duration across app restarts.
//
// Excludes any time the active account spent paused because another Steam session on it was
// playing a game (see playingSessionStore) - nothing is actually idling then, so the timer freezes
// with a pause icon and carries on from the same value once it resumes. Reads the active account's
// pauses directly rather than taking them as a prop: every game card rendering this timer belongs
// to the active account, and this keeps each card call site unaware of the pause mechanism.
//
// Freezes the same way for one game alone while Steam Families holds it back because someone else
// in the family is playing it (agent mode only - see idlingStore's familyLockedSince) - the rest of
// the account keeps idling normally.
export const IdleTimer = ({ startTime, appId }: IdleTimerProps) => {
  const [, forceUpdate] = useState(0)
  const activeKey = useSessionStore(state => state.activeAccountKey)
  const pauses = usePlayingSessionStore(state => (activeKey ? state.pauses[activeKey] : undefined))
  const isPaused = usePlayingSessionStore(state => Boolean(activeKey && state.entries[activeKey]))
  const familyLockedSince = useIdlingStore(state =>
    appId === undefined ? undefined : state.familyLockedSince[appId],
  )

  useEffect(() => {
    const intervalId = setInterval(() => forceUpdate(n => n + 1), 1000)
    return () => clearInterval(intervalId)
  }, [])

  // A family-locked game's time stops where the lock began (the store moves its start time forward
  // by the locked span once it lifts)
  const now = familyLockedSince ?? Date.now()
  const elapsedMs = Math.max(0, now - startTime - pausedOverlapMs(pauses ?? [], startTime, now))
  const isFamilyLocked = familyLockedSince !== undefined

  return (
    <div className='absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/70 py-px pr-2 pl-1 text-xs text-white'>
      {isPaused || isFamilyLocked ? (
        <TbPlayerPauseFilled size={14} />
      ) : (
        <TbPlayerPlayFilled size={14} />
      )}
      {formatElapsed(elapsedMs)}
    </div>
  )
}
