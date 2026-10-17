import type { AchievementDto, AchievementGroup } from '../types'

// The implicit base-game set never appears in the schema's `groups` list (see
// libs/SteamUtility/Core/Models/AchievementGroupDto.cs), so it gets this sentinel key instead.
export const BASE_GAME_SECTION_KEY = 0

// A DLC set this account is known not to own. Steam rejects unlocking any of its achievements
// (EResult.InvalidParam, seen live on ETS2), so the UI treats them as unlockable-never. `owned`
// missing (non-DLC set, or a failed ownership lookup) counts as owned - same fail-open rule as
// Rust's AchievementData::unowned_dlc_group_ids, which the unlocker/bulk-unlock paths use.
export const isUnownedDlcGroup = (group: AchievementGroup) =>
  group.dlcAppId !== undefined && group.owned === false

export const unownedDlcGroupIdsOf = (groups: AchievementGroup[]) =>
  new Set(groups.filter(isUnownedDlcGroup).map(group => group.id))

// Ids of the sets that come from a DLC (owned or not) - for views that keep one flat list (the
// achievement unlocker's order editor) and only tag DLC achievements instead of sectioning them.
export const dlcGroupIdsOf = (groups: AchievementGroup[]) =>
  new Set(groups.filter(group => group.dlcAppId !== undefined).map(group => group.id))

export const isInGroups = (achievement: AchievementDto, groupIds: Set<number>) =>
  achievement.groupId !== undefined && groupIds.has(achievement.groupId)

export interface AchievementSection<T extends AchievementDto = AchievementDto> {
  key: number
  // `null` = the base-game set.
  group: AchievementGroup | null
  isUnownedDlc: boolean
  // Progress always counts the whole set (the sidebar nav's per-set counts and progress lines).
  unlocked: number
  total: number
  visible: T[]
}

// Splits an already sorted/filtered achievement list into Steam Achievement Set sections: base game
// first, then each schema group in its listed order, with unowned DLC sets moved to the very end
// (they're the ones a user can't act on, so they shouldn't sit between sets they can). A `groupId`
// that points at no listed group falls back to the base game rather than disappearing. Sections
// with nothing visible (e.g. filtered out by search) are dropped. Returns `[]` for a game without
// sets, so callers can keep rendering their flat, header-less list unchanged.
export const groupAchievementsBySet = <T extends AchievementDto>(
  all: AchievementDto[],
  visible: T[],
  groups: AchievementGroup[],
) => {
  if (groups.length === 0) return [] as AchievementSection<T>[]

  const knownIds = new Set(groups.map(group => group.id))
  const sectionKeyOf = (achievement: AchievementDto) =>
    achievement.groupId !== undefined && knownIds.has(achievement.groupId)
      ? achievement.groupId
      : BASE_GAME_SECTION_KEY

  const orderedGroups = [
    ...groups.filter(group => !isUnownedDlcGroup(group)),
    ...groups.filter(isUnownedDlcGroup),
  ]
  const sections: AchievementSection<T>[] = [
    {
      key: BASE_GAME_SECTION_KEY,
      group: null,
      isUnownedDlc: false,
      unlocked: 0,
      total: 0,
      visible: [],
    },
    ...orderedGroups.map(group => ({
      key: group.id,
      group,
      isUnownedDlc: isUnownedDlcGroup(group),
      unlocked: 0,
      total: 0,
      visible: [],
    })),
  ]
  const byKey = new Map(sections.map(section => [section.key, section]))

  for (const achievement of all) {
    const section = byKey.get(sectionKeyOf(achievement))!
    section.total++
    if (achievement.achieved) section.unlocked++
  }
  for (const achievement of visible) {
    byKey.get(sectionKeyOf(achievement))!.visible.push(achievement)
  }

  return sections.filter(section => section.visible.length > 0)
}
