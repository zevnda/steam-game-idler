import type {
  GameSettings,
  GameWithRemainingDrops,
  InvokeCustomList,
  InvokeSettings,
  UserSummary,
} from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { startFarmIdle, stopFarmIdle } from '@/features/idle'
import { logEvent } from '@/shared/services/logService'
import { checkDrops, getAllGamesWithDrops } from '@/shared/utils/automation'
import { FARMING_DELAYS, MAX_IDLE_PROCESSES } from '@/shared/utils/constants'

export interface GameForFarming {
  appid: number
  name: string
  dropsToCount: number
  initialDrops: number
}

type SetGames = React.Dispatch<React.SetStateAction<Set<GameForFarming>>>
type SetNumber = React.Dispatch<React.SetStateAction<number>>

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('aborted'))
      return
    }
    const checkMs = 1000
    let elapsed = 0
    const id = setInterval(() => {
      if (signal.aborted) {
        clearInterval(id)
        reject(new Error('aborted'))
        return
      }
      elapsed += checkMs
      if (elapsed >= ms) {
        clearInterval(id)
        resolve()
      }
    }, checkMs)
    signal.addEventListener('abort', () => {
      clearInterval(id)
      reject(new Error('aborted'))
    })
  })
}

async function getUserContext() {
  const userSummary = JSON.parse(localStorage.getItem('userSummary') || '{}') as UserSummary
  const res = await invoke<InvokeSettings>('get_user_settings', { steamId: userSummary?.steamId })
  return { userSummary, settings: res.settings }
}

async function removeFromFarmingList(gameId: number) {
  try {
    const { userSummary } = await getUserContext()
    const list = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId: userSummary?.steamId,
      list: 'cardFarmingList',
    })
    await invoke<InvokeCustomList>('update_custom_list', {
      steamId: userSummary?.steamId,
      list: 'cardFarmingList',
      newList: list.list_data.filter(g => g.appid !== gameId),
    })
  } catch (error) {
    await logEvent(`[Error] in removeFromFarmingList: ${error}`)
  }
}

function processGamesWithDrops(
  gamesWithDrops: GameWithRemainingDrops[],
  gamesSet: Set<GameForFarming>,
  gameSettings: GameSettings,
  blacklist: number[],
  skipNoPlaytime: boolean,
  farmUnplayedOnly: boolean,
  sortByHighestDrops: boolean,
  sortByLowestDrops: boolean,
) {
  let totalDrops = 0
  const sorted = [...gamesWithDrops]
  if (sortByHighestDrops) sorted.sort((a, b) => (b.remaining ?? 0) - (a.remaining ?? 0))
  else if (sortByLowestDrops) sorted.sort((a, b) => (a.remaining ?? 0) - (b.remaining ?? 0))

  for (const game of sorted) {
    if (gamesSet.size >= MAX_IDLE_PROCESSES) break
    const id = game.id || 0
    const remaining = game.remaining || 0
    const playtime = game.playtime || 0

    if (blacklist.includes(id)) {
      logEvent(`[Card Farming] Skipping ${game.name} (blacklisted)`).catch(() => {})
      continue
    }
    if (skipNoPlaytime && playtime <= 0) continue
    if (farmUnplayedOnly && playtime > 0) continue

    const gs = gameSettings[id]
    const maxCardDrops =
      typeof gs === 'object' && gs !== null && !Array.isArray(gs)
        ? (gs.maxCardDrops ?? remaining)
        : remaining
    const dropsToCount = Math.min(remaining, maxCardDrops)

    gamesSet.add({ appid: id, name: game.name, dropsToCount, initialDrops: remaining })
    totalDrops += dropsToCount
    logEvent(`[Card Farming] ${dropsToCount} drops remaining for ${game.name} - starting`).catch(
      () => {},
    )
  }
  return totalDrops
}

export async function checkGamesForDrops() {
  const { userSummary, settings } = await getUserContext()
  const gameSettings = settings.gameSettings ?? {}
  const {
    allGames,
    credentials,
    skipNoPlaytime = false,
    farmUnplayedOnly = false,
    sortByHighestDrops = false,
    sortByLowestDrops = false,
  } = settings.cardFarming
  const blacklist = settings.cardFarming.blacklist ?? []

  const gamesSet = new Set<GameForFarming>()
  let totalDrops = 0

  if (allGames) {
    const drops = await getAllGamesWithDrops(
      userSummary?.steamId,
      credentials?.sid,
      credentials?.sls,
      credentials?.sma,
    )
    totalDrops = processGamesWithDrops(
      drops,
      gamesSet,
      gameSettings,
      blacklist,
      skipNoPlaytime,
      farmUnplayedOnly,
      sortByHighestDrops,
      sortByLowestDrops,
    )
  } else {
    const list = await invoke<InvokeCustomList>('get_custom_lists', {
      steamId: userSummary?.steamId,
      list: 'cardFarmingList',
    })
    const TIMEOUT = 30000

    await Promise.all(
      list.list_data.map(async game => {
        if (gamesSet.size >= MAX_IDLE_PROCESSES) return
        if (blacklist.includes(game.appid)) return

        try {
          const drops = await Promise.race<number>([
            checkDrops(
              userSummary?.steamId,
              game.appid,
              credentials?.sid,
              credentials?.sls,
              credentials?.sma,
            ),
            new Promise<number>((_, reject) => setTimeout(reject, TIMEOUT)),
          ])
          if (drops > 0) {
            const gs = gameSettings[game.appid]
            const maxCardDrops =
              typeof gs === 'object' && gs !== null && !Array.isArray(gs)
                ? (gs.maxCardDrops ?? drops)
                : drops
            const dropsToCount = Math.min(Number(drops), Number(maxCardDrops))
            gamesSet.add({ appid: game.appid, name: game.name, dropsToCount, initialDrops: drops })
            totalDrops += dropsToCount
          } else {
            removeFromFarmingList(game.appid)
          }
        } catch {
          /* timeout or error, skip */
        }
      }),
    )
  }

  return { totalDrops, gamesSet }
}

async function checkDropsRemaining(gameSet: Set<GameForFarming>) {
  const { userSummary, settings } = await getUserContext()
  const credentials = settings.cardFarming.credentials
  const updated = new Set<GameForFarming>()

  await Promise.all(
    Array.from(gameSet).map(async game => {
      try {
        const drops = await checkDrops(
          userSummary?.steamId,
          game.appid,
          credentials?.sid,
          credentials?.sls,
          credentials?.sma,
        )
        if (drops <= 0) {
          removeFromFarmingList(Number(game.appid))
          await logEvent(`[Card Farming] Farmed all drops for ${game.name}`)
        } else if (game.initialDrops - drops >= game.dropsToCount) {
          removeFromFarmingList(Number(game.appid))
          await logEvent(`[Card Farming - maxCardDrops] Done for ${game.name}`)
        } else {
          updated.add(game)
        }
      } catch {
        updated.add(game)
      }
    }),
  )

  return updated
}

export async function beginFarmingCycle(
  gamesSet: Set<GameForFarming>,
  signal: AbortSignal,
  setGamesWithDrops: SetGames,
  setTotalDropsRemaining: SetNumber,
) {
  if (signal.aborted || gamesSet.size < 1) return false

  const steps: Array<{ action: typeof startFarmIdle; delay: number }> = [
    { action: startFarmIdle, delay: FARMING_DELAYS.long },
    { action: stopFarmIdle, delay: FARMING_DELAYS.medium },
    { action: startFarmIdle, delay: FARMING_DELAYS.short },
    { action: stopFarmIdle, delay: FARMING_DELAYS.medium },
    { action: startFarmIdle, delay: FARMING_DELAYS.farming },
    { action: stopFarmIdle, delay: FARMING_DELAYS.medium },
    { action: startFarmIdle, delay: FARMING_DELAYS.short },
    { action: stopFarmIdle, delay: FARMING_DELAYS.medium },
  ]

  try {
    for (const step of steps) {
      if (signal.aborted) return false
      const success = await step.action(gamesSet)
      if (!success) return false
      await sleep(step.delay, signal)

      if (step.action === stopFarmIdle) {
        gamesSet = await checkDropsRemaining(gamesSet)
        setGamesWithDrops(new Set(gamesSet))

        if (gamesSet.size < MAX_IDLE_PROCESSES) {
          const { gamesSet: refreshed } = await checkGamesForDrops()
          for (const g of refreshed) {
            if (gamesSet.size >= MAX_IDLE_PROCESSES) break
            if (![...gamesSet].some(existing => existing.appid === g.appid)) gamesSet.add(g)
          }
          const totalDrops = Array.from(gamesSet).reduce((sum, g) => sum + g.dropsToCount, 0)
          setTotalDropsRemaining(totalDrops)
        }
      }
    }
    return true
  } catch {
    await stopFarmIdle(gamesSet).catch(() => {})
    return false
  }
}

export async function checkForNextTask() {
  try {
    const { settings } = await getUserContext()
    const { nextTaskCheckbox, nextTask } = settings.cardFarming
    if (!nextTaskCheckbox || !nextTask) return { shouldStart: false, task: null }
    return { shouldStart: true, task: nextTask }
  } catch {
    return { shouldStart: false, task: null }
  }
}
