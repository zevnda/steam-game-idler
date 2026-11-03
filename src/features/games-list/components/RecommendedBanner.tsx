import type { RecommendedSlide } from '../hooks/useRecommendedSlides'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TbChevronLeft,
  TbChevronRight,
  TbPlayerPlayFilled,
  TbPlayerStopFilled,
  TbTrophyFilled,
} from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import Image from 'next/image'
import { useAchievementManagerStore } from '@/shared/stores/achievementManagerStore'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { gameCardContextAttrs } from '@/shared/utils/gameCardContext'
import { revealTitleIfTruncated } from '@/shared/utils/revealTitleIfTruncated'

const AUTO_ADVANCE_MS = 7000

interface RecommendedBannerProps {
  slides: RecommendedSlide[]
  idlingAppIds: number[]
  idlePendingAppIds: Set<number>
  onToggleIdle: (appId: number) => void
}

// One large crossfading tile at the top of the games list, with its heading and every control
// inside it. Slides arrive already loaded (see `useRecommendedSlides`), so each image stays mounted
// and only its opacity changes, which is what keeps the fade smooth.
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

  // More slides can arrive while this is showing, and fewer if the account's games change.
  const index = activeIndex % slides.length
  const { game, logo } = slides[index]
  const name = game.name ?? t('dashboard.games.unknownName', { appId: game.appId })
  const isIdling = idlingAppIds.includes(game.appId)
  const hasMultipleSlides = slides.length > 1

  const goTo = (next: number) => setActiveIndex((next + slides.length) % slides.length)

  // Restarts whenever the slide changes, so a slide picked by hand still gets its full time.
  useEffect(() => {
    if (isPaused || !hasMultipleSlides) return
    const timeout = setTimeout(
      () => setActiveIndex(current => (current + 1) % slides.length),
      AUTO_ADVANCE_MS,
    )
    return () => clearTimeout(timeout)
  }, [index, isPaused, hasMultipleSlides, slides.length])

  return (
    <div
      className='relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-surface text-white'
      onBlur={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      {...gameCardContextAttrs(game.appId, name)}
    >
      {/* Fades up from dark while settling out of a slight zoom. The per-image transition below gives
          each slide change the same motion, but can't cover arriving on the page: the banner mounts
          with its active image already in its end state, so nothing changes for a transition to
          animate. */}
      <div className={cn('absolute inset-0', !forceReducedMotion && 'banner-settle')}>
        {slides.map((slide, slideIndex) => (
          <Image
            fill
            key={slide.game.appId}
            alt=''
            className={cn(
              'object-cover',
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
      <div className='pointer-events-none absolute inset-0 bg-linear-to-r from-black/85 via-black/35 to-transparent' />
      <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 to-transparent to-50%' />

      <div className='absolute inset-0 flex flex-col justify-between gap-4 p-6'>
        <h2 className='text-3xl font-black tracking-tight drop-shadow-md'>
          {t('dashboard.games.carousels.recommended')}
        </h2>

        <div className='flex items-end justify-between gap-6'>
          <div className='flex min-w-0 flex-1 flex-col gap-4'>
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
                {t(isIdling ? 'common.gameCardMenu.stopIdling' : 'common.gameCardMenu.startIdling')}
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
          </div>

          {hasMultipleSlides && (
            <div className='flex shrink-0 items-center gap-2'>
              <Button
                isIconOnly
                className='bg-white/15 text-white backdrop-blur-sm hover:bg-white/25'
                size='sm'
                onPress={() => goTo(index - 1)}
              >
                <TbChevronLeft fontSize={16} />
              </Button>
              <div className='flex items-center gap-1.5 px-1'>
                {slides.map((slide, slideIndex) => (
                  <button
                    key={slide.game.appId}
                    aria-current={slideIndex === index}
                    aria-label={slide.game.name ?? String(slide.game.appId)}
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
