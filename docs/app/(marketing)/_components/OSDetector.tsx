'use client'

import { useEffect } from 'react'
import { detectOS } from '@/app/lib/detectOS'
import { useGlobalStore } from '@/app/lib/globalStore'

/**
 * Mounted once in the shared marketing layout (not just the home/download pages) so every page -
 * including docs pages, whose CTAs also read `selectedOS` (see DocsCTA.tsx) - gets a platform
 * default before the user ever interacts with a download button. Runs once; never overwrites a
 * manual choice made via `overrideOS` (see globalStore.ts's `osOverridden` guard).
 */
export default function OSDetector() {
  useEffect(() => {
    if (useGlobalStore.getState().osOverridden) return
    const detected = detectOS()
    if (detected) useGlobalStore.getState().setSelectedOS(detected)
  }, [])

  return null
}
