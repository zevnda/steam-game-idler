import type { InvokeCustomList } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useStateStore, useUserStore } from '@/shared/stores'
import { getAllGamesWithDrops, hasGamerAccess, logEvent, startCardFarming } from '@/shared/utils'

export const handleAutoFarmCards = async () => {
  const { userSettings, userSummary, subscriptionTier } = useUserStore.getState()
  const { isCardFarming } = useStateStore.getState()

  if (!userSettings.cardFarming.autoFarmCards) return
  if (!hasGamerAccess(subscriptionTier)) return
  if (isCardFarming) return

  const credentials = userSettings.cardFarming.credentials
  if (!credentials?.sid || !credentials?.sls) return

  try {
    const gamesWithDrops = await getAllGamesWithDrops(
      userSummary?.steamId,
      credentials.sid,
      credentials.sls,
      credentials.sma,
    )

    if (!gamesWithDrops.length) return

    const { skipNoPlaytime, farmUnplayedOnly, blacklist } = userSettings.cardFarming
    let eligibleGames = gamesWithDrops
    if (skipNoPlaytime) eligibleGames = eligibleGames.filter(g => g.playtime > 0)
    if (farmUnplayedOnly) eligibleGames = eligibleGames.filter(g => g.playtime === 0)
    if (blacklist?.length) eligibleGames = eligibleGames.filter(g => !blacklist.includes(g.id))

    if (!eligibleGames.length) return

    await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: 'cardFarmingList',
      newList: eligibleGames.map(g => ({ appid: g.id, name: g.name })),
    })

    await startCardFarming()
  } catch (error) {
    console.error('Error in (handleAutoFarmCards):', error)
    logEvent(`[Error] in (handleAutoFarmCards): ${error}`)
  }
}
