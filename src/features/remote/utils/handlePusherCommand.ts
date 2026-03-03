import { useRemoteStore } from '@/shared/stores'
import { startAchievementUnlocker, startAutoIdleGames, startCardFarming } from '@/shared/utils'

export const handlePusherCommand = (data: { command: string }, callback?: () => void) => {
  const { pusherChannel } = useRemoteStore.getState()

  if (!pusherChannel?.name) return

  console.debug('Received command:', data.command)

  if (data.command === 'start-card-farming') {
    startCardFarming()
    pusherChannel.trigger('client-state-update', {
      state: {
        cardFarming: true,
      },
    })
  }

  if (data.command === 'stop-card-farming') {
    callback?.()
  }

  if (data.command === 'start-achievement-unlocker') {
    startAchievementUnlocker()
    pusherChannel.trigger('client-state-update', {
      state: {
        achievementUnlocker: true,
      },
    })
  }

  if (data.command === 'stop-achievement-unlocker') {
    callback?.()
  }

  if (data.command === 'start-auto-idle') {
    startAutoIdleGames()
  }
}
