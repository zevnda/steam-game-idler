import type { MouseEvent } from 'react'

// `onMouseEnter` handler for a `truncate`/`line-clamp-*` element showing translated text: sets a
// native `title` with the full text only when it's actually clipped, and clears it otherwise.
//
// Why conditional rather than a static `title`: most of these labels fit in English, and an
// always-on browser tooltip over text that's already fully visible just reads as noise (see
// GoPro.tsx's comment). Measured on hover instead of with a ResizeObserver since hover is the only
// moment the title matters, and it stays correct across locale switches, zoom and window resizes
// without any per-element observer cost.
export const revealTitleIfTruncated = (event: MouseEvent<HTMLElement>) => {
  const el = event.currentTarget
  const isClipped = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight
  el.title = isClipped ? (el.textContent ?? '') : ''
}
