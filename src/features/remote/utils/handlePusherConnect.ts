import type * as PusherTypes from 'pusher-js'
import Pusher from 'pusher-js'
import { handleParseData, handlePusherCommand } from '@/features/remote'
import { useRemoteStore, useUserStore } from '@/shared/stores'

export const handlePusherConnect = (
  isEnabled: boolean,
  remoteCode: string,
  setPusherClient: (
    value:
      | PusherTypes.default
      | null
      | ((prev: PusherTypes.default | null) => PusherTypes.default | null),
  ) => void,
  setPusherChannel: (
    value:
      | PusherTypes.Channel
      | null
      | ((prev: PusherTypes.Channel | null) => PusherTypes.Channel | null),
  ) => void,
) => {
  try {
    if (!isEnabled) {
      const { userSummary, gamesList } = useUserStore.getState()

      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint:
          process.env.NODE_ENV === 'development'
            ? process.env.NEXT_PUBLIC_ENDPOINT
            : process.env.NEXT_PUBLIC_ENDPOINT,
      })

      const channel = pusher.subscribe(`private-device-${remoteCode}`)

      setPusherClient(pusher)
      setPusherChannel(channel)

      channel.bind('pusher:subscription_succeeded', () => {})

      // Handle handshake
      channel.bind('client-handshake', () => {
        console.debug('Handshake received from remote!')
        channel.trigger('client-handshake-ack', {})
      })

      // Send required data
      channel.bind('client-request-data', () => {
        console.debug('Game list request received from remote!')
        handleParseData(channel, userSummary, gamesList)
      })

      // Handle commands
      channel.bind('client-command', (data: { command: string }) => {
        handlePusherCommand(data)
      })
    } else {
      const { pusherClient } = useRemoteStore.getState()
      if (pusherClient) {
        pusherClient.unsubscribe(`private-device-${remoteCode}`)
        pusherClient.disconnect()
        setPusherClient(null)
      }
    }
  } catch (error) {
    console.error('Error handling Pusher connection:', error)
  }
}

// pusher.unsubscribe(`private-device-${remoteCode}`)
// pusher.disconnect()

// Desktop App Strategy:
// 1. Generate code on app start (PRO users only)
// 2. DON'T connect to Pusher immediately
// 3. Only connect when user clicks "Enable Remote Control" button
// 4. Stay connected until user clicks "Disable Remote Control" or app closes
// 5. Code remains valid for entire session while connected
// 6. Dropdown can be opened/closed freely - connection stays active in background

// Remote App Strategy:
// 1. Connect when user enters code
// 2. Start 5 minute inactivity timer
// 3. Reset timer to 5 minutes whenever user clicks any button
// 4. If timer reaches 0, disconnect
// 5. Show warning at 30 seconds remaining
// 6. User can reconnect anytime with same code (desktop still listening)
