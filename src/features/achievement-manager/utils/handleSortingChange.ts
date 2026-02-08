import type { Achievement } from '@/shared/types'

export const handleSortingChange = (
  currentKey: string | undefined,
  achievements: Achievement[],
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>,
) => {
  if (!currentKey) return

  // Convert event selection to array and get first value
  const sortedAchievements = [...achievements]

  // Sort achievements based on user selection
  switch (currentKey) {
    case 'percent':
      // Sort by completion percentage (highest first)
      sortedAchievements.sort((b, a) => (a.percent || 0) - (b.percent || 0))
      break
    case 'title':
      // Alphabetical sort by achievement name
      sortedAchievements.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'unlocked':
      // Show unlocked achievements first
      sortedAchievements.sort((b, a) => (a.achieved === b.achieved ? 0 : a.achieved ? 1 : -1))
      break
    case 'locked':
      // Show locked achievements first
      sortedAchievements.sort((a, b) => (a.achieved === b.achieved ? 0 : a.achieved ? 1 : -1))
      break
    case 'protected':
      // Show protected achievements first
      sortedAchievements.sort((b, a) => {
        if (a.protected_achievement && !b.protected_achievement) return 1
        if (!a.protected_achievement && b.protected_achievement) return -1
        return 0
      })
      break
    case 'unprotected':
      // Show unprotected achievements first
      sortedAchievements.sort((a, b) => {
        if (a.protected_achievement && !b.protected_achievement) return 1
        if (!a.protected_achievement && b.protected_achievement) return -1
        return 0
      })
      break
    default:
      break
  }

  setAchievements(sortedAchievements)
}
