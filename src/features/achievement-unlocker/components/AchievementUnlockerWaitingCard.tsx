import type { AchievementUnlockerWaiting } from '../types'
import { useTranslation } from 'react-i18next'
import { errorMessageKey } from '../utils/errorMessageKey'
import { ErrorDocsLink } from '@/shared/components/ErrorDocsLink'
import { useNow } from '@/shared/hooks/useNow'
import { formatDuration } from '@/shared/utils/formatDuration'

interface AchievementUnlockerWaitingCardProps {
  waiting: AchievementUnlockerWaiting
}

// Shown while a running session holds its queue because CLI mode's local Steam client couldn't
// load any queued game - Steam closed, signed out or still starting, or a family-shared game locked
// while its owner plays it. The games are still queued and get re-checked on the countdown (see
// achievement_unlocker::manager's DEFERRED_RESCAN_DELAY). Without this card the running screen sat
// on an unexplained "0 of 0". Same centred panel as the scan-progress card it takes the place of.
export const AchievementUnlockerWaitingCard = ({
  waiting,
}: AchievementUnlockerWaitingCardProps) => {
  const { t, i18n } = useTranslation()
  const now = useNow()
  const games = new Intl.ListFormat(i18n.language, { type: 'conjunction' }).format(
    waiting.games.map(game => game.name),
  )

  return (
    <div className='flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-8 py-14 text-center'>
      <h3 className='text-lg font-bold text-balance'>
        {t('dashboard.achievementUnlocker.progress.waitingForSteam')}
      </h3>
      <p className='max-w-lg text-sm text-balance'>
        {t(errorMessageKey(waiting.reason), { code: waiting.reason })}
      </p>
      {waiting.games.length > 0 && (
        <p className='max-w-lg text-sm text-balance text-muted'>
          {t('dashboard.achievementUnlocker.progress.waitingGames', {
            games,
            count: waiting.games.length,
          })}
        </p>
      )}
      <ErrorDocsLink code={waiting.reason} />
      <span className='text-sm tabular-nums text-muted'>
        {t('dashboard.achievementUnlocker.progress.retryingIn', {
          time: formatDuration(Math.max(0, waiting.retryAtMs - now) / 1000),
        })}
      </span>
    </div>
  )
}
