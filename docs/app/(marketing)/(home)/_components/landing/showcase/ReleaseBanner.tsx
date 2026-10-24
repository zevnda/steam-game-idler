'use client'

import { useEffect, useState } from 'react'
import { FiArrowRight, FiX } from 'react-icons/fi'
import Link from 'next/link'
import { useGlobalStore } from '@/app/lib/globalStore'

// The version the visitor last dismissed. Dismissing is per release: a newer version no longer
// matches, so the banner comes back for it.
const DISMISSED_KEY = 'sgi:release-banner-dismissed'

// localStorage can throw (private windows, blocked site data) - the banner then just behaves as
// never dismissed, which is the safe default.
function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY)
  } catch {
    return null
  }
}

function writeDismissed(version: string) {
  try {
    window.localStorage.setItem(DISMISSED_KEY, version)
  } catch {
    // storage unavailable: it hides for this visit only
  }
}

/**
 * The hero's "vX.Y.Z is out" banner, in the rainbow rim the 3D window glows with (`.rainbow-chip`),
 * with the nav PRO's glow (`.rainbow-chip--glow`). The whole chip links to the changelog - the
 * link's hit area is stretched over it in CSS - except the dismiss button.
 *
 * It sits in the hero's own flow (ShowcaseHero.tsx) and that slot is always reserved, so showing
 * or dismissing it never moves the headline - the hero -> playground hand-over measures the copy's
 * layout. It starts invisible and fades in once the real version has loaded (the store holds a
 * '0.0.0' placeholder until StoreLoader's GitHub fetch lands) and only if that version wasn't
 * dismissed - so there's no placeholder flash and no flash-then-vanish for anyone who dismissed
 * it. The wrapper's `hero-recede` gives it the badge's scroll fade into the playground.
 */
export default function ReleaseBanner() {
  const latestVersion = useGlobalStore(state => state.latestVersion)
  const hasVersion = Boolean(latestVersion) && latestVersion !== '0.0.0'
  // null until read on the client - storage doesn't exist during the static render
  const [dismissed, setDismissed] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setDismissed(readDismissed())
    setReady(true)
  }, [])

  const visible = ready && hasVersion && dismissed !== latestVersion

  const dismiss = () => {
    writeDismissed(latestVersion)
    setDismissed(latestVersion)
  }

  return (
    <div className='hero-recede' style={{ '--i': 0 } as React.CSSProperties}>
      {/* hidden (incl. before the version loads), `visibility: hidden` in .release-banner also takes
          it out of the tab order and the accessibility tree */}
      <div
        className={`release-banner rainbow-chip rainbow-chip--glow ${visible ? 'release-banner--on' : ''}`}
      >
        <span className='rainbow-chip__inner release-banner__inner'>
          <Link prefetch={false} href='/changelog' className='release-banner__link'>
            v{hasVersion ? latestVersion : ''} is out
            {/* Every piece - text and the dot - is its own flex item, so the link's one gap spaces
                them evenly (a dot typed inside the text got a narrow space on one side only) */}
            <span className='text-text-muted' aria-hidden='true'>
              ·
            </span>
            <span className='release-banner__more'>
              See what&apos;s new
              <FiArrowRight className='w-3.5 h-3.5' aria-hidden='true' />
            </span>
          </Link>
          <button
            type='button'
            onClick={dismiss}
            className='release-banner__close'
            aria-label={`Dismiss the v${latestVersion} release banner`}
          >
            <FiX className='w-3.5 h-3.5' aria-hidden='true' />
          </button>
        </span>
      </div>
    </div>
  )
}
