import Fuse from 'fuse.js'

// Structural, not `OwnedGame` specifically - favorites/achievement-unlocker queue entries
// (`FavoriteEntry`/`AchievementUnlockerEntry`, Step 2) have the same `appId`/`name` shape but
// aren't the same nominal type, so this is generic over anything that looks like a game rather
// than requiring a full `OwnedGame` (which also carries `playtimeForeverMinutes` neither of those
// entry types has).
interface Searchable {
  appId: number
  name?: string | null
}

// One shared config for every game-shaped search target (games list, favorites/achievement-
// unlocker queues) - matches on the display name and the AppID (as a string, so a partial/exact
// numeric query still ranks via the same relevance scoring instead of needing a separate
// exact-match code path). `ignoreLocation` means a match counts regardless of where in the string
// it falls (a mid-title word, not just a prefix); `threshold` is tuned loose enough to tolerate a
// typo or two but not so loose that unrelated titles surface - Fuse's own scoring already ranks
// exact/prefix matches above looser fuzzy ones, so this rewrite doesn't need separate "exact vs
// fuzzy" tiers of logic the way a plain substring check would.
function buildIndex<T extends Searchable>(games: T[]) {
  return new Fuse(games, {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'appIdStr', weight: 0.3 },
    ],
    getFn: (game, path) => {
      const key = Array.isArray(path) ? path[0] : path
      if (key === 'appIdStr') return String(game.appId)
      return game.name ?? ''
    },
    threshold: 0.35,
    ignoreLocation: true,
  })
}

export function searchGames<T extends Searchable>(games: T[], query: string) {
  const trimmed = query.trim()
  if (!trimmed) return games
  return buildIndex(games)
    .search(trimmed)
    .map(result => result.item)
}
