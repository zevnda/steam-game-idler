import { useTranslation } from 'react-i18next'
import { AccountStatusModal } from './AccountStatusModal'
import { Button } from '@heroui/react'
import { useGamesListStore } from '@/shared/stores/gamesListStore'
import { usePlayingSessionStore } from '@/shared/stores/playingSessionStore'
import { useSessionStore } from '@/shared/stores/sessionStore'

// Opens by itself when the active account pauses because another Steam session on it (usually the
// user's real Steam client) started playing a game, and closes by itself once it resumes - so
// someone who never looked at the app (e.g. SGI running on a remote server) comes back to a normal
// window, not a stale popup. Purely informational, unlike ReauthModal: nothing to reconnect, the
// daemon/Rust host resume everything on their own (see src-tauri/src/steam_agent/playing.rs).
// Closing it only hides it for the rest of *this* pause (playingSessionStore's `dismissed`); the
// account switcher's "Paused" badge stays up as the lasting indicator.
//
// Active account only - a background account's pause shows as just its switcher badge, since
// accounts pausing independently (every play session, per account) would otherwise stack popups.
// Switching to a still-paused account whose popup was never closed shows it then.
//
// Names the game when it's in this account's own library (it usually is - it's the same account);
// the other session's game can be one it doesn't own (family sharing, free weekend), and right
// after the kick Steam hasn't said which game yet, hence the generic fallback.
export const PlayingElsewhereModal = () => {
  const { t } = useTranslation()
  const activeKey = useSessionStore(state => state.activeAccountKey)
  const session = usePlayingSessionStore(state =>
    activeKey ? state.entries[activeKey] : undefined,
  )
  const isDismissed = usePlayingSessionStore(state =>
    Boolean(activeKey && session?.sinceMs && state.dismissed[activeKey] === session.sinceMs),
  )
  const dismiss = usePlayingSessionStore(state => state.dismiss)
  const gameName = useGamesListStore(state => {
    if (!activeKey || !session?.appId) return undefined
    return state.entries[activeKey]?.games.find(game => game.appId === session.appId)?.name
  })

  const close = () => {
    if (activeKey) dismiss(activeKey)
  }

  return (
    <AccountStatusModal
      isOpen={Boolean(session) && !isDismissed}
      title={t('dashboard.playingElsewhere.title')}
      onClose={close}
    >
      <div className='flex flex-col items-center gap-4'>
        <p className='text-center text-sm text-muted'>
          {gameName
            ? t('dashboard.playingElsewhere.descriptionWithGame', { game: gameName })
            : t('dashboard.playingElsewhere.description')}
        </p>
        <Button className='w-full' onPress={close}>
          {t('common.actions.ok')}
        </Button>
      </div>
    </AccountStatusModal>
  )
}
