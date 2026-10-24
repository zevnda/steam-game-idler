'use client'

import { useState } from 'react'

/**
 * Replays the home page's `.swap-in` crossfade (globals.css) on content swapped in place when
 * `value` changes - e.g. the /download page switching between Windows and Linux. Spread the result
 * onto each element whose content changes: the `key` remounts it so the animation replays, and the
 * class is only applied after the first real change, so nothing crossfades on initial load (same
 * rule as GetStarted.tsx's Step). Swapped elements that are siblings need distinct keys - prefix
 * them, e.g. key={`spec-${swap.key}`}.
 */
export function useSwapKey(value: unknown) {
  // React's "adjust state when a prop changes" pattern: compare during render, no effect needed
  const [prev, setPrev] = useState(value)
  const [count, setCount] = useState(0)
  if (value !== prev) {
    setPrev(value)
    setCount(count + 1)
  }
  return { key: count, className: count > 0 ? 'swap-in' : '' }
}
