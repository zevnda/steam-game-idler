import { useRemoteStore } from '@/shared/stores'

export const handlePusherStateUpdate = (key: string, value: boolean) => {
  const { pusherChannel } = useRemoteStore.getState()

  if (!pusherChannel?.name) return

  pusherChannel?.trigger('client-state-update', {
    state: {
      [key]: value,
    },
  })
}
