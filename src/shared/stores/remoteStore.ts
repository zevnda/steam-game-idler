import type * as PusherTypes from 'pusher-js'
import { create } from 'zustand'

interface RemoteStore {
  remoteCode: string
  setRemoteCode: (value: string | ((prev: string) => string)) => void
  pusherClient: PusherTypes.default | null
  setPusherClient: (
    value:
      | PusherTypes.default
      | null
      | ((prev: PusherTypes.default | null) => PusherTypes.default | null),
  ) => void
  pusherChannel: PusherTypes.Channel | null
  setPusherChannel: (
    value:
      | PusherTypes.Channel
      | null
      | ((prev: PusherTypes.Channel | null) => PusherTypes.Channel | null),
  ) => void
}

export const useRemoteStore = create<RemoteStore>(set => ({
  remoteCode: '',
  setRemoteCode: value =>
    set(state => ({
      remoteCode: typeof value === 'function' ? value(state.remoteCode) : value,
    })),
  pusherClient: null,
  setPusherClient: value =>
    set(state => ({
      pusherClient: typeof value === 'function' ? value(state.pusherClient) : value,
    })),
  pusherChannel: null,
  setPusherChannel: value =>
    set(state => ({
      pusherChannel: typeof value === 'function' ? value(state.pusherChannel) : value,
    })),
}))
