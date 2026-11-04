import type { RecommendedSlide } from '../hooks/useRecommendedSlides'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaDiscord } from 'react-icons/fa6'
import {
  TbBell,
  TbChevronLeft,
  TbChevronRight,
  TbLifebuoy,
  TbMessages,
  TbPlayerPlayFilled,
  TbPlayerStopFilled,
  TbTrophyFilled,
} from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import { Unbounded } from 'next/font/google'
import Image from 'next/image'
import { Logo } from '@/shared/components/dashboard/Logo'
import { CDN_BASE_URL } from '@/shared/constants'
import { useAchievementManagerStore } from '@/shared/stores/achievementManagerStore'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { gameCardContextAttrs } from '@/shared/utils/gameCardContext'
import { DISCORD_URL, openExternalLink } from '@/shared/utils/links'
import { revealTitleIfTruncated } from '@/shared/utils/revealTitleIfTruncated'

const AUTO_ADVANCE_MS = 7000
const DISCORD_SLIDE_KEY = 'discord'
// On the CDN like the app's other artwork, so it can be swapped without a release
const DISCORD_SLIDE_ART = `${CDN_BASE_URL}/recommended/discord-banner.webp`
// English-only on purpose: the slide is meant to read as one piece of artwork, and the art's own text
// is English too. So don't move these to en-US.json or flag them as hardcoded strings.
const DISCORD_SLIDE_CTA = 'Join our Discord'
const DISCORD_SLIDE_PERKS = [
  { icon: TbMessages, label: 'Community chat' },
  { icon: TbLifebuoy, label: 'Help & support' },
  { icon: TbBell, label: 'App updates' },
]

const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
})

// Where a slide came from doesn't matter to the carousel itself, only what it shows
interface BannerSlide {
  key: string | number
  hero: string
  slide: RecommendedSlide | null
}

interface RecommendedBannerProps {
  slides: RecommendedSlide[]
  idlingAppIds: number[]
  idlePendingAppIds: Set<number>
  onToggleIdle: (appId: number) => void
}

// One large crossfading tile at the top of the games list, with its heading and every control
// inside it. Slides arrive already loaded (see `useRecommendedSlides`), so each image stays mounted
// and only its opacity changes, which is what keeps the fade smooth.
//
// A "join our Discord" slide sits in the middle of the games. Rounded up, so a game is always first:
// that's the slide the page opens on, and it stays the first thing someone sees while the games are
// still loading in one at a time. The whole slide links to Discord. Its art has the character on the
// left and empty space on the right, so its text goes on the right and it skips the heading and the
// dark gradients game art needs.
export const RecommendedBanner = ({
  slides,
  idlingAppIds,
  idlePendingAppIds,
  onToggleIdle,
}: RecommendedBannerProps) => {
  const { t } = useTranslation()
  const openAchievementManager = useAchievementManagerStore(state => state.open)
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const bannerSlides = useMemo(() => {
    const games = slides.map<BannerSlide>(slide => ({
      key: slide.game.appId,
      hero: slide.hero,
      slide,
    }))
    games.splice(Math.ceil(games.length / 2), 0, {
      key: DISCORD_SLIDE_KEY,
      hero: DISCORD_SLIDE_ART,
      slide: null,
    })
    return games
  }, [slides])

  // More slides can arrive while this is showing, and fewer if the account's games change.
  const index = activeIndex % bannerSlides.length
  const current = bannerSlides[index]
  const game = current.slide?.game ?? null
  const logo = current.slide?.logo ?? null
  const name = game ? (game.name ?? t('dashboard.games.unknownName', { appId: game.appId })) : ''
  const isIdling = game !== null && idlingAppIds.includes(game.appId)
  const isDiscordSlide = game === null
  const hasMultipleSlides = bannerSlides.length > 1

  const goTo = (next: number) => setActiveIndex((next + bannerSlides.length) % bannerSlides.length)

  // Restarts whenever the slide changes, so a slide picked by hand still gets its full time.
  useEffect(() => {
    if (isPaused || !hasMultipleSlides) return
    const timeout = setTimeout(
      () => setActiveIndex(previous => (previous + 1) % bannerSlides.length),
      AUTO_ADVANCE_MS,
    )
    return () => clearTimeout(timeout)
  }, [index, isPaused, hasMultipleSlides, bannerSlides.length])

  return (
    <div
      // `@container` so the Discord slide's text can size to the banner, whose width doesn't simply
      // follow the window's: the sidebar can be expanded or collapsed at the same window size.
      className='@container relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-surface text-white'
      onBlur={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      {...(game ? gameCardContextAttrs(game.appId, name) : {})}
    >
      {/* Fades up from dark while settling out of a slight zoom. The per-image transition below gives
          each slide change the same motion, but can't cover arriving on the page: the banner mounts
          with its active image already in its end state, so nothing changes for a transition to
          animate. */}
      <div className={cn('absolute inset-0', !forceReducedMotion && 'banner-settle')}>
        {bannerSlides.map((slide, slideIndex) => (
          <Image
            fill
            key={slide.key}
            alt=''
            className={cn(
              'object-cover',
              // A narrow banner crops the art's sides. Taking more of that from the left keeps the
              // empty space on the right wide enough for the slide's text, at the cost of a little
              // of the character's headset.
              slide.slide === null && 'object-[65%_center]',
              !forceReducedMotion &&
                'motion-safe:transition-[opacity,scale] motion-safe:duration-700 motion-safe:ease-smooth',
              slideIndex === index ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0',
            )}
            loading='eager'
            src={slide.hero}
          />
        ))}
      </div>

      {/* Hero art has no safe area for text, so this keeps the text readable over a bright image. */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-700',
          isDiscordSlide && 'opacity-0',
        )}
      >
        <div className='absolute inset-0 bg-linear-to-r from-black/85 via-black/35 to-transparent' />
        <div className='absolute inset-0 bg-linear-to-t from-black/60 to-transparent to-50%' />
      </div>

      {isDiscordSlide && (
        <>
          {/* The whole slide's click target. Hidden from assistive tech and the tab order because
              the visible button below does the same thing. */}
          <button
            aria-hidden
            className='absolute inset-0 cursor-pointer'
            tabIndex={-1}
            type='button'
            onClick={() => openExternalLink(DISCORD_URL)}
          />
          {/* Sized to the art's empty right side, which stays about 36% of the banner at any width
              with the crop above. `pointer-events-none` so a click on the text reaches the button
              above. */}
          <div
            className={cn(
              'pointer-events-none absolute inset-y-0 right-0 z-10 flex w-[36%] flex-col items-center justify-center gap-3 px-4 pb-8 text-center',
              !forceReducedMotion && 'banner-title-fade',
            )}
          >
            <Logo className='text-white' height={44} width={44} />
            <p
              className={cn(
                unbounded.className,
                'text-lg font-semibold @2xl:text-xl @4xl:text-2xl',
              )}
            >
              Steam Game Idler
            </p>
            {/* Separate pills rather than one sentence, so they wrap between items, never mid-phrase */}
            <ul className='flex flex-wrap justify-center gap-1.5'>
              {DISCORD_SLIDE_PERKS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className='flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white/85'
                >
                  <Icon fontSize={13} />
                  {label}
                </li>
              ))}
            </ul>
            <Button
              className='pointer-events-auto mt-1 bg-[#5865F2] text-white shadow-[0_0_24px_-4px_#5865F2] hover:bg-[#6D78F5]'
              onPress={() => openExternalLink(DISCORD_URL)}
            >
              <FaDiscord fontSize={18} />
              {DISCORD_SLIDE_CTA}
            </Button>
          </div>
        </>
      )}

      {/* `pointer-events-none` so this full-size layer doesn't cover the Discord slide's click target.
          The controls inside turn pointer events back on. */}
      <div className='pointer-events-none absolute inset-0 z-10 flex flex-col justify-between gap-4 p-6'>
        <h2
          className={cn(
            'text-3xl font-black tracking-tight drop-shadow-md transition-opacity duration-700',
            isDiscordSlide && 'opacity-0',
          )}
        >
          {t('dashboard.games.carousels.recommended')}
        </h2>

        <div className='flex items-end justify-between gap-6'>
          <div className='pointer-events-auto flex min-w-0 flex-1 flex-col gap-4'>
            {game && (
              <>
                {/* Keyed so the title fades in at the same speed as each new image. The buttons stay outside
                it so they hold still between slides, and the fixed height stops a text title, which
                is shorter than a logo, from shifting them. */}
                <div
                  className={cn('flex h-40 items-end', !forceReducedMotion && 'banner-title-fade')}
                  key={game.appId}
                >
                  {logo ? (
                    <div className='relative h-full w-full max-w-160'>
                      <Image
                        fill
                        alt={name}
                        className='object-contain object-left drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]'
                        src={logo}
                      />
                    </div>
                  ) : (
                    <p
                      className='line-clamp-2 max-w-md text-2xl font-bold drop-shadow-md'
                      onMouseEnter={revealTitleIfTruncated}
                    >
                      {name}
                    </p>
                  )}
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  <Button
                    className='bg-white text-black hover:bg-white/85'
                    isPending={idlePendingAppIds.has(game.appId)}
                    onPress={() => onToggleIdle(game.appId)}
                  >
                    {isIdling ? (
                      <TbPlayerStopFilled fontSize={16} />
                    ) : (
                      <TbPlayerPlayFilled fontSize={16} />
                    )}
                    {t(
                      isIdling
                        ? 'common.gameCardMenu.stopIdling'
                        : 'common.gameCardMenu.startIdling',
                    )}
                  </Button>
                  <Button
                    isIconOnly
                    aria-label={t('common.gameCardMenu.manageAchievements')}
                    className='bg-white/15 text-white backdrop-blur-sm hover:bg-white/25'
                    onPress={() => openAchievementManager(game.appId, name)}
                  >
                    <TbTrophyFilled fontSize={16} />
                  </Button>
                </div>
              </>
            )}
          </div>

          {hasMultipleSlides && (
            <div className='pointer-events-auto flex shrink-0 items-center gap-2'>
              <Button
                isIconOnly
                className='bg-white/15 text-white backdrop-blur-sm hover:bg-white/25'
                size='sm'
                onPress={() => goTo(index - 1)}
              >
                <TbChevronLeft fontSize={16} />
              </Button>
              <div className='flex items-center gap-1.5 px-1'>
                {bannerSlides.map((slide, slideIndex) => (
                  <button
                    key={slide.key}
                    aria-current={slideIndex === index}
                    aria-label={
                      slide.slide
                        ? (slide.slide.game.name ?? String(slide.slide.game.appId))
                        : DISCORD_SLIDE_CTA
                    }
                    className={cn(
                      'h-1.5 cursor-pointer rounded-full transition-all duration-300',
                      slideIndex === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70',
                    )}
                    type='button'
                    onClick={() => goTo(slideIndex)}
                  />
                ))}
              </div>
              <Button
                isIconOnly
                className='bg-white/15 text-white backdrop-blur-sm hover:bg-white/25'
                size='sm'
                onPress={() => goTo(index + 1)}
              >
                <TbChevronRight fontSize={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
