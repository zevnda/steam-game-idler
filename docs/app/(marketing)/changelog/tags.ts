// The release-note kinds a changelog entry's `tags` frontmatter uses - the filter chips' options,
// in the order the notes themselves list their sections. Shared by the server page (entry tags)
// and the client (chips), so it can't live in either.
export const CHANGELOG_TAGS = ['New', 'Improved', 'Fixed'] as const
export type ChangelogTag = (typeof CHANGELOG_TAGS)[number]

/** Colour class for a tag pill or chip; an unknown tag gets the neutral one. */
export function tagClass(tag: string) {
  switch (tag) {
    case 'New':
      return 'changelog-tag--new'
    case 'Improved':
      return 'changelog-tag--improved'
    case 'Fixed':
      return 'changelog-tag--fixed'
    default:
      return ''
  }
}
