// Mirrors src-tauri/src/achievement_unlocker/manager.rs::INITIAL_DELAY (fixed 10s) - not sent over
// the wire since it never changes, same reasoning as main's GameRow.tsx hardcoding it.
export const INITIAL_DELAY_MS = 10_000

// Digital mm:ss (or h:mm:ss once past an hour) countdown, matching main's `formatTime` display -
// used for both the initial-delay clock and each upcoming achievement's ticking timer.
export const formatCountdown = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.round(remainingMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}
