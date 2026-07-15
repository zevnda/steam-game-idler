import Fuse from 'fuse.js'

interface NamedItem {
  name: string
}

// A separate, smaller instance from `@/shared/search/fuzzySearch.ts` - this overlay's search is a
// different mechanism entirely (a local `<Input>` inside a modal tab, not the titlebar bar/modal
// driven by `searchStore`/`SEARCH_SCOPES`, since the titlebar isn't interactive while this overlay
// is open), and `AchievementDto`/`StatDto` have no AppID-equivalent numeric field worth a second
// weighted key the way `OwnedGame`'s AppID is - just the display `name`.
function buildIndex<T extends NamedItem>(items: T[]) {
  return new Fuse(items, {
    keys: ['name'],
    threshold: 0.35,
    ignoreLocation: true,
  })
}

export function searchByName<T extends NamedItem>(items: T[], query: string) {
  const trimmed = query.trim()
  if (!trimmed) return items
  return buildIndex(items)
    .search(trimmed)
    .map(result => result.item)
}
