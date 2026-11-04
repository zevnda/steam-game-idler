import type { OwnedGame } from '../types'
import { useEffect, useMemo, useState } from 'react'
import { fetchGameArt } from '@/shared/stores/gameArtStore'

const MAX_SLIDES = 6
const LOOKUP_BATCH_SIZE = 8
const CDN_BASE = 'https://cdn.cloudflare.steamstatic.com/steam/apps'

interface SlideArt {
  hero: string
  // Steam's transparent title artwork. About 98% of games with hero art have one at this path, and
  // the store API doesn't report it, so it can only be found by trying it. `null` shows the name
  // as text instead.
  logo: string | null
}

export interface RecommendedSlide extends SlideArt {
  game: OwnedGame
}

// Survives the Games page unmounting, so coming back to it shows the banner straight away instead
// of re-testing every image behind a skeleton. `null` means the game has no usable hero art.
const checkedArt = new Map<number, SlideArt | null>()

const imageLoads = (url: string) =>
  new Promise<boolean>(resolve => {
    const image = new window.Image()
    image.onload = () => resolve(true)
    image.onerror = () => resolve(false)
    image.src = url
  })

// Actually loads the images rather than trusting that a URL exists, since a slide with broken art
// must never reach the banner. This also means a slide's images are already in the browser's cache
// by the time it's shown, so the crossfade never reveals a half-loaded image.
const checkSlideArt = async (appId: number, resolvedHero: string | null) => {
  // The plain path is still worth trying after the store's: it works for many games the store API
  // has no data on, and in testing it found art for slightly more games overall.
  const heroes = [resolvedHero, `${CDN_BASE}/${appId}/library_hero.jpg`]
  let hero: string | null = null
  for (const url of heroes) {
    if (url && (await imageLoads(url))) {
      hero = url
      break
    }
  }
  if (!hero) return null

  const logo = `${CDN_BASE}/${appId}/logo.png`
  return { hero, logo: (await imageLoads(logo)) ? logo : null }
}

// The games the Recommended banner can actually show: only those whose art has loaded successfully.
// Checks candidates a batch at a time and stops once there are enough slides, so a large list of
// candidates doesn't turn into a burst of image requests nobody will see.
export const useRecommendedSlides = (games: OwnedGame[]) => {
  const [checkCount, setCheckCount] = useState(0)

  useEffect(() => {
    let isCancelled = false

    const checkCandidates = async () => {
      while (!isCancelled) {
        // Keeps going until there are enough games with title art too, not just hero art (see the
        // slide selection below)
        const found = games.filter(game => checkedArt.get(game.appId)?.logo).length
        if (found >= MAX_SLIDES) return

        const batch = games
          .filter(game => !checkedArt.has(game.appId))
          .slice(0, LOOKUP_BATCH_SIZE)
          .map(game => game.appId)
        if (batch.length === 0) return

        const art = await fetchGameArt(batch)
        await Promise.all(
          batch.map(async appId => {
            checkedArt.set(appId, await checkSlideArt(appId, art[appId].hero))
            // One at a time, so the banner can appear as soon as its first slide is ready.
            if (!isCancelled) setCheckCount(count => count + 1)
          }),
        )
      }
    }

    void checkCandidates()
    return () => {
      isCancelled = true
    }
  }, [games])

  // Games with both hero and title art come first. Games with hero art only (their name shows as
  // text instead) are just a fallback to fill the banner, so they're only added once every candidate
  // has been checked: adding them earlier would mean swapping them back out as better games turn
  // up, changing slides under the user. This way the slide list only ever grows.
  return useMemo(() => {
    const slides: RecommendedSlide[] = []
    const heroOnly: RecommendedSlide[] = []
    for (const game of games) {
      const art = checkedArt.get(game.appId)
      if (!art) continue
      if (art.logo) {
        if (slides.length < MAX_SLIDES) slides.push({ game, ...art })
      } else {
        heroOnly.push({ game, ...art })
      }
    }
    const isChecking = slides.length < MAX_SLIDES && games.some(game => !checkedArt.has(game.appId))
    if (!isChecking) slides.push(...heroOnly.slice(0, MAX_SLIDES - slides.length))
    return { slides, isChecking }
    // `checkCount` is what signals that `checkedArt`, which React can't observe, has changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, checkCount])
}
