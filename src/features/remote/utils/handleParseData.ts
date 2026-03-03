import type { Game, InvokeCustomList, UserSummary } from '@/shared/types'
import type * as PusherTypes from 'pusher-js'
import { invoke } from '@tauri-apps/api/core'
import { useRemoteStore } from '@/shared/stores'

const chunkSize = 50

const sendChunked = (channel: PusherTypes.Channel, eventName: string, list: Game[]) => {
  if (list.length === 0) {
    channel.trigger(eventName, {
      chunk: [],
      index: 0,
      total: 0,
    })
    return
  }
  const chunks = []
  for (let i = 0; i < list.length; i += chunkSize) {
    chunks.push(list.slice(i, i + chunkSize))
  }
  chunks.forEach((chunk, index) => {
    channel.trigger(eventName, {
      chunk,
      index,
      total: chunks.length,
    })
  })
}

export async function handleParseData(
  channel: PusherTypes.Channel,
  userSummary: UserSummary,
  gamesList: Game[],
) {
  const cardFarmingList = await invoke<InvokeCustomList>('get_custom_lists', {
    steamId: userSummary?.steamId,
    list: 'cardFarmingList',
  })

  const achievementUnlockerList = await invoke<InvokeCustomList>('get_custom_lists', {
    steamId: userSummary?.steamId,
    list: 'achievementUnlockerList',
  })

  const autoIdleList = await invoke<InvokeCustomList>('get_custom_lists', {
    steamId: userSummary?.steamId,
    list: 'autoIdleList',
  })

  channel.trigger('client-user-summary', {
    userSummary,
  })

  sendChunked(channel, 'client-games-list', gamesList)
  sendChunked(channel, 'client-card-farming-list', cardFarmingList.list_data)
  sendChunked(channel, 'client-achievement-unlocker-list', achievementUnlockerList.list_data)
  sendChunked(channel, 'client-auto-idle-list', autoIdleList.list_data)
}

export async function handleSendUpdatedData(listName: string, steamId: string) {
  const { pusherChannel } = useRemoteStore.getState()

  if (!pusherChannel?.name) return

  if (listName === 'cardFarmingList') {
    const cardFarmingList = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId,
      list: 'cardFarmingList',
    })
    sendChunked(pusherChannel, 'client-card-farming-list', cardFarmingList.list_data)
  }

  if (listName === 'achievementUnlockerList') {
    const achievementUnlockerList = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId,
      list: 'achievementUnlockerList',
    })
    sendChunked(
      pusherChannel,
      'client-achievement-unlocker-list',
      achievementUnlockerList.list_data,
    )
  }

  if (listName === 'autoIdleList') {
    const autoIdleList = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId,
      list: 'autoIdleList',
    })
    sendChunked(pusherChannel, 'client-auto-idle-list', autoIdleList.list_data)
  }
}
