import { useActiveThemeStore } from '@/shared/stores/activeThemeStore'

// A small per-game-card touch for holidays that suit one - snow piled along the top edge of each
// thumbnail at Christmas, a corner cobweb at Halloween. Rendered inside `GameThumbnail`'s
// `relative overflow-hidden` wrapper, so it's clipped to the image's rounded corners; purely
// decorative and `pointer-events-none`, so it never interferes with the card's own hover/click.
// Kept to the image's outer edge to stay clear of overlay badges (idle timers etc.).
export const HolidayThumbnailAccent = () => {
  const preset = useActiveThemeStore(state => state.preset)

  if (preset === 'christmas') {
    return (
      <svg
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 top-0 z-10 h-3.5 w-full drop-shadow-sm'
        preserveAspectRatio='none'
        viewBox='0 0 200 14'
      >
        <path
          d='M0 0 H200 V5 Q192 9 186 6 Q180 12 172 7 Q164 5 158 8 Q150 13 142 6 Q134 4 126 7 Q118 11 110 6 Q102 3 94 7 Q86 12 78 6 Q70 4 62 8 Q54 13 46 6 Q38 3 30 7 Q22 11 14 6 Q8 4 0 7 Z'
          fill='#f4f7fb'
        />
      </svg>
    )
  }

  if (preset === 'halloween') {
    return (
      <svg
        aria-hidden='true'
        className='pointer-events-none absolute top-0 left-0 z-10'
        height='34'
        viewBox='0 0 34 34'
        width='34'
      >
        <g fill='none' opacity='0.55' stroke='#f0ecf6' strokeWidth='0.7'>
          <path d='M0 0 L34 6 M0 0 L26 22 M0 0 L6 34 M0 0 L18 30 M0 0 L31 15' />
          <path d='M11 2 Q9 7 2 11 M20 4 Q17 13 4 20 M29 5 Q24 20 5 29' />
        </g>
      </svg>
    )
  }

  return null
}
