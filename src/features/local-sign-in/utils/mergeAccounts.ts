import type {
  LocalSteamUser,
  SteamAccount,
  SteamPlayerSummary,
  SteamPlayerSummaryResponse,
} from '../types'

// Steam only serves a small thumbnail by default - `main` upgrades to the full-resolution image
// the same way, by swapping the filename suffix.
const toFullResAvatar = (avatar: string) => avatar.replace('.jpg', '_full.jpg')

// Steam Web API responses (both the cache file and a fresh `get_user_summary` call) are always
// this `{ response: { players: [...] } }` shape, one or many entries - flatten every source into
// a single lookup by steam ID regardless of which one a player summary came from.
const indexPlayersBySteamId = (responses: SteamPlayerSummaryResponse[]) => {
  const players = new Map<string, SteamPlayerSummary>()
  for (const entry of responses) {
    for (const player of entry.response?.players ?? []) {
      players.set(player.steamid, player)
    }
  }
  return players
}

export const mergeAccounts = (
  users: LocalSteamUser[],
  summaryResponses: SteamPlayerSummaryResponse[],
) => {
  const players = indexPlayersBySteamId(summaryResponses)

  const accounts: SteamAccount[] = users.map(user => {
    const player = players.get(user.steamId)
    return {
      steamId: user.steamId,
      personaName: player?.personaname || user.personaName,
      avatarUrl: player?.avatar ? toFullResAvatar(player.avatar) : null,
      mostRecent: user.mostRecent,
    }
  })

  // Most-recently-signed-in account first, matching the order the local Steam client itself
  // would default to.
  return accounts.sort((a, b) => Number(b.mostRecent) - Number(a.mostRecent))
}
