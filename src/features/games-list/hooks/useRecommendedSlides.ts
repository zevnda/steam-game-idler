import type { HeroArt } from '@/shared/utils/heroArt'
import type { OwnedGame } from '../types'
import { useEffect, useMemo, useState } from 'react'
import { fetchGameArt } from '@/shared/stores/gameArtStore'
import { checkedHeroArt as checkedArt, checkHeroArt } from '@/shared/utils/heroArt'

const MAX_SLIDES = 6
const LOOKUP_BATCH_SIZE = 8

export interface RecommendedSlide extends HeroArt {
  game: OwnedGame
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
            checkedArt.set(appId, await checkHeroArt(appId, art[appId].hero))
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
      // Stops at the first candidate still being checked. A batch's checks finish in whatever order
      // their images load, so skipping past an unchecked game let a later one become slide 1, and
      // then the earlier one, once checked, was inserted in front of it - changing the slide on
      // screen. Only ever using a fully checked prefix keeps new slides added at the end.
      if (!checkedArt.has(game.appId)) break
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
