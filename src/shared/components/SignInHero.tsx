import type { TranslationKey } from '@/i18n'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@heroui/react'
import { Unbounded } from 'next/font/google'
import Image from 'next/image'
import { CDN_BASE_URL } from '@/shared/constants'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { imageLoads } from '@/shared/utils/heroArt'

const ART_BASE = `${CDN_BASE_URL}/cover-art`

// Hand-picked for bright colour and a subject that survives the crop, in the order they play (so
// neighbouring slides differ in colour). Each is a 3:2 crop: wider than this panel at the default
// window size so it still covers a maximised window, with the subject in the middle. `focusX` is the
// CSS object-position, off-centre only where the subject sits against the edge of the source art.
//
// Served with an immutable one-year cache. To replace an image, upload it under a new filename and
// change it here: overwriting a file wouldn't reach anyone who already has it cached.
const HERO_ART = [
  { src: `${ART_BASE}/gta-vi.webp`, focusX: 50 },
  { src: `${ART_BASE}/blood-of-dawnwalker.webp`, focusX: 50 },
  { src: `${ART_BASE}/nba-2k27.webp`, focusX: 50 },
  { src: `${ART_BASE}/ac-shadows.webp`, focusX: 50 },
  { src: `${ART_BASE}/no-mans-sky.webp`, focusX: 50 },
  { src: `${ART_BASE}/cyberpunk-2077.webp`, focusX: 50 },
  { src: `${ART_BASE}/marvel-rivals.webp`, focusX: 50 },
  { src: `${ART_BASE}/red-dead-redemption-2.webp`, focusX: 50 },
  { src: `${ART_BASE}/aion-2.webp`, focusX: 100 },
  { src: `${ART_BASE}/dying-light-the-beast.webp`, focusX: 50 },
  { src: `${ART_BASE}/lost-ark.webp`, focusX: 50 },
  { src: `${ART_BASE}/borderlands-4.webp`, focusX: 50 },
  { src: `${ART_BASE}/ac-black-flag-resynced.webp`, focusX: 50 },
  { src: `${ART_BASE}/dragons-dogma-2.webp`, focusX: 50 },
  { src: `${ART_BASE}/baldurs-gate-3.webp`, focusX: 25 },
  { src: `${ART_BASE}/gta-v.webp`, focusX: 50 },
  { src: `${ART_BASE}/battlefield-6.webp`, focusX: 50 },
  { src: `${ART_BASE}/elden-ring.webp`, focusX: 50 },
  { src: `${ART_BASE}/arc-raiders.webp`, focusX: 50 },
  { src: `${ART_BASE}/sonic-racing-crossworlds.webp`, focusX: 50 },
]
const SLIDE_MS = 6000

const WORD_KEYS = [
  'auth.hero.idle',
  'auth.hero.farm',
  'dashboard.achievements.actions.unlock',
  'dashboard.freeGames.actions.claim',
] as const satisfies readonly TranslationKey[]
const MAX_WORD_PX = 84
// Unbounded is a very wide face: its capitals average about 0.9em, this leaves a little spare.
const WORD_EM_PER_CHAR = 0.95

// Includes latin-ext and cyrillic, unlike the Titlebar's wordmark, because this text is translated
const unbounded = Unbounded({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-unbounded',
})

// The sign-in screen's right side: game art crossfading behind four words that light up in turn.
// Each image is only shown once it has fully loaded, and one that fails is left out, so with no
// network the words simply sit on the plain background. Loaded one at a time to keep HERO_ART's order.
export const SignInHero = () => {
  const { t } = useTranslation()
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true
  const [heroes, setHeroes] = useState<typeof HERO_ART>([])
  const [activeHero, setActiveHero] = useState(0)
  const [litWord, setLitWord] = useState(0)
  const loadedCount = useRef(0)

  useEffect(() => {
    let isCancelled = false
    const loadInOrder = async () => {
      for (const art of HERO_ART) {
        const hasLoaded = await imageLoads(art.src)
        if (isCancelled) return
        if (hasLoaded) {
          loadedCount.current += 1
          setHeroes(previous => [...previous, art])
        }
      }
    }
    void loadInOrder()
    return () => {
      isCancelled = true
    }
  }, [])

  // One timer so the next word lights as the next image fades in. It runs even with no art, so the
  // words still cycle offline. The image index wraps at however many have loaded by that tick, so
  // one arriving later never changes which image is currently showing.
  useEffect(() => {
    if (forceReducedMotion) return
    const interval = setInterval(() => {
      setLitWord(previous => (previous + 1) % WORD_KEYS.length)
      setActiveHero(previous => (previous + 1) % Math.max(loadedCount.current, 1))
    }, SLIDE_MS)
    return () => clearInterval(interval)
  }, [forceReducedMotion])

  const words = WORD_KEYS.map(key => t(key))
  // Sized from the longest word so every locale fits on one line per word: some of these run twice
  // as long as English. `cqw` is the width of the `@container` wrapper below.
  const longestWord = Math.max(...words.map(word => word.length))
  const fontSize = `min(${MAX_WORD_PX}px, calc(100cqw / ${(longestWord * WORD_EM_PER_CHAR).toFixed(2)}))`

  return (
    <div className='relative min-w-0 flex-1 overflow-hidden'>
      {heroes.map((hero, index) => (
        <Image
          fill
          key={hero.src}
          alt=''
          className={cn(
            'object-cover transition-opacity duration-1000 ease-smooth',
            index === activeHero ? 'opacity-100' : 'opacity-0',
          )}
          loading='eager'
          src={hero.src}
          style={{ objectPosition: `${hero.focusX}% 50%` }}
        />
      ))}

      {/* Keeps the words and the window controls readable over bright art */}
      <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 to-transparent to-60%' />
      <div className='pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/50 to-transparent' />

      <div className='@container absolute inset-x-14 bottom-16'>
        <div
          aria-hidden
          className={cn(
            unbounded.className,
            'flex flex-col select-none font-extrabold uppercase leading-[0.92] tracking-[-0.02em] whitespace-nowrap',
          )}
          style={{ fontSize }}
        >
          {words.map((word, index) => (
            <span
              key={WORD_KEYS[index]}
              className={cn(
                'signin-word',
                index === litWord && 'signin-word--lit',
                forceReducedMotion && 'force-reduced-motion',
              )}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
