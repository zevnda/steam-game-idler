import type { TranslationKey } from '@/i18n'
import type { ActiveBanner, PromoColor } from '@/shared/hooks/useBanners'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbAlertTriangle, TbCircleCheck, TbInfoCircle, TbX } from 'react-icons/tb'
import { Button } from '@heroui/react'
import Image from 'next/image'
import { CDN_BASE_URL } from '@/shared/constants'
import { useBanners } from '@/shared/hooks/useBanners'
import { openExternalLink } from '@/shared/utils/links'

// A system banner carries translation keys instead of rendered strings (see `useBanners.ts`) -
// this is the one non-`main` shape difference, everything else (variants, colors, dismissal,
// starfield/shimmer/float visuals) is a deliberate pixel-for-pixel port of `main`'s Banner.tsx.
type DisplayBanner = ActiveBanner & { messageKey?: TranslationKey; ctaLabelKey?: TranslationKey }

type AlertVariant = Exclude<ActiveBanner['variant'], 'promo'>

interface VariantStyle {
  wrapperClassName: string
  icon: typeof TbAlertTriangle
  iconClassName: string
  titleClassName: string
  messageClassName: string
  ctaClassName: string
}

const ALERT_VARIANT_STYLES: Record<AlertVariant, VariantStyle> = {
  danger: {
    wrapperClassName: 'bg-linear-to-r from-red-950 via-red-900 to-zinc-950',
    icon: TbAlertTriangle,
    iconClassName: 'text-red-400',
    titleClassName: 'font-semibold text-content',
    messageClassName: 'text-content',
    ctaClassName: 'bg-white text-black font-semibold',
  },
  warning: {
    wrapperClassName: 'bg-linear-to-r from-yellow-950 via-yellow-900 to-zinc-950',
    icon: TbAlertTriangle,
    iconClassName: 'text-yellow-400',
    titleClassName: 'font-semibold text-content',
    messageClassName: 'text-content',
    ctaClassName: 'bg-white text-black font-semibold',
  },
  info: {
    wrapperClassName: 'bg-linear-to-r from-blue-950 via-blue-900 to-zinc-950',
    icon: TbInfoCircle,
    iconClassName: 'text-blue-400',
    titleClassName: 'font-semibold text-content',
    messageClassName: 'text-content',
    ctaClassName: 'bg-white text-black font-semibold',
  },
  success: {
    wrapperClassName: 'bg-linear-to-r from-green-950 via-green-900 to-zinc-950',
    icon: TbCircleCheck,
    iconClassName: 'text-green-400',
    titleClassName: 'font-semibold text-content',
    messageClassName: 'text-content',
    ctaClassName: 'bg-white text-black font-semibold',
  },
}

const PROMO_COLOR_STYLES: Record<
  PromoColor,
  { background: string; glow: string; ctaTextClassName: string; rainbowShimmer?: boolean }
> = {
  'purple': {
    background: 'linear-gradient(to bottom, #1a0b2eff 0%, #0c0612ff 100%)',
    glow: 'rgba(160, 40, 211, 0.35)',
    ctaTextClassName: 'text-purple-700',
  },
  'blue': {
    background: 'linear-gradient(to bottom, #0b1430ff 0%, #060a18ff 100%)',
    glow: 'rgba(37, 99, 235, 0.4)',
    ctaTextClassName: 'text-blue-700',
  },
  'red': {
    background: 'linear-gradient(to bottom, #2e0b14ff 0%, #120609ff 100%)',
    glow: 'rgba(220, 38, 38, 0.4)',
    ctaTextClassName: 'text-red-700',
  },
  'orange': {
    background: 'linear-gradient(to bottom, #2e1a0bff 0%, #120d06ff 100%)',
    glow: 'rgba(234, 88, 12, 0.4)',
    ctaTextClassName: 'text-orange-700',
  },
  'green': {
    background: 'linear-gradient(to bottom, #0b2e1aff 0%, #06120dff 100%)',
    glow: 'rgba(22, 163, 74, 0.4)',
    ctaTextClassName: 'text-green-700',
  },
  'gold': {
    background: 'linear-gradient(to bottom, #2e2710ff 0%, #121006ff 100%)',
    glow: 'rgba(217, 119, 6, 0.4)',
    ctaTextClassName: 'text-amber-700',
  },
  'black-gold': {
    background: 'linear-gradient(to bottom, #161310ff 0%, #0a0908ff 100%)',
    glow: 'rgba(250, 204, 21, 0.3)',
    ctaTextClassName: 'text-amber-600',
  },
  'rainbow': {
    background: 'linear-gradient(to bottom, #1a0b2eff 0%, #0c0612ff 100%)',
    glow: 'rgba(255, 255, 255, 0.25)',
    ctaTextClassName: 'text-purple-700',
    rainbowShimmer: true,
  },
}

// Angle/travel math ported verbatim from `main`'s `PROMO_STARS`; `main` animated these with
// framer-motion (`animate={{x:[0,dx],y:[0,dy],opacity:[0,1,0]}}`, `repeat: Infinity,
// repeatDelay`) - dropped project-wide. Reuses `.pro-shooting-star` (globals.css)
// rather than a near-duplicate class - the exact same technique already backs GoProModal's own
// ambient starfield (`BackgroundEffects.tsx`'s `ShootingStar`): per-instance travel via
// `--pro-shooting-star-tx/-ty`, with `repeatDelay` folded into `animationDuration` as dead time
// (duration+repeatDelay = one CSS animation cycle) since CSS has no separate "pause between
// iterations" concept.
const PROMO_STARS = [
  { top: '20%', left: '6%', width: 46, angle: 26, delay: 0, duration: 0.8, repeatDelay: 5.5 },
  { top: '65%', left: '24%', width: 36, angle: 20, delay: 1.6, duration: 0.85, repeatDelay: 6.5 },
  { top: '30%', left: '48%', width: 42, angle: 30, delay: 3.1, duration: 0.9, repeatDelay: 6 },
  { top: '70%', left: '70%', width: 34, angle: 22, delay: 2.2, duration: 0.85, repeatDelay: 7 },
  { top: '18%', left: '88%', width: 38, angle: 28, delay: 4.4, duration: 0.8, repeatDelay: 6.2 },
]
const PROMO_STAR_TRAVEL = 80

function PromoStarfield() {
  return (
    <>
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.55) 1px, transparent 0)',
          backgroundSize: '22px 22px',
          opacity: 0.18,
        }}
      />
      {PROMO_STARS.map(star => {
        const rad = (star.angle * Math.PI) / 180
        const tx = PROMO_STAR_TRAVEL * Math.cos(rad)
        const ty = PROMO_STAR_TRAVEL * Math.sin(rad)
        return (
          <div
            key={`${star.top}-${star.left}`}
            className='pro-shooting-star absolute pointer-events-none'
            style={
              {
                'top': star.top,
                'left': star.left,
                'width': star.width,
                'rotate': `${star.angle}deg`,
                '--pro-shooting-star-tx': `${tx}px`,
                '--pro-shooting-star-ty': `${ty}px`,
                'animationDuration': `${star.duration + star.repeatDelay}s`,
                'animationDelay': `${star.delay}s`,
              } as React.CSSProperties
            }
          />
        )
      })}
    </>
  )
}

interface BannerVisualProps {
  banner: DisplayBanner
  message: string
  title?: string
  ctaLabel?: string
  isExiting: boolean
  onDismiss: () => void
}

function PromoBanner({
  banner,
  message,
  title,
  ctaLabel,
  isExiting,
  onDismiss,
}: BannerVisualProps) {
  const colorStyle = PROMO_COLOR_STYLES[banner.color ?? 'purple']

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 overflow-hidden ${
        isExiting ? 'banner-promo-exit' : 'banner-promo-enter'
      }`}
      style={{ background: colorStyle.background }}
    >
      <PromoStarfield />
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background: `radial-gradient(ellipse 60% 120% at 50% 100%, ${colorStyle.glow} 0%, transparent 70%)`,
        }}
      />
      {colorStyle.rainbowShimmer && (
        <div
          className='banner-promo-rainbow absolute inset-0 pointer-events-none'
          style={{
            backgroundImage:
              'linear-gradient(90deg, #f87171, #fb923c, #facc15, #4ade80, #38bdf8, #818cf8, #f472b6, #f87171)',
            backgroundSize: '300% 100%',
            opacity: 0.25,
            mixBlendMode: 'screen',
          }}
        />
      )}
      {banner.asset && (
        <div className='absolute inset-y-0 left-8 flex items-center pointer-events-none select-none'>
          <div className='banner-asset-float'>
            <Image
              alt=''
              className='w-32 h-32 object-contain drop-shadow-2xl'
              height={300}
              loading='eager'
              src={`${CDN_BASE_URL}/frosted/${banner.asset}`}
              width={300}
            />
          </div>
        </div>
      )}
      <div className='relative flex items-center justify-between gap-6 px-8 py-5 min-h-28'>
        <div className={`flex items-center gap-4 ${banner.asset ? 'ml-38' : ''}`}>
          <div className='flex flex-col gap-0.5'>
            {title && (
              <span className='text-lg font-black uppercase tracking-wide text-white leading-tight'>
                {title}
              </span>
            )}
            <span className='text-sm text-white/70'>{message}</span>
          </div>
        </div>
        <div className='flex items-center gap-3 shrink-0'>
          {banner.ctaUrl && ctaLabel && (
            <Button
              className={`bg-white ${colorStyle.ctaTextClassName} font-bold px-6 shadow-lg hover:scale-105 transition-transform duration-150`}
              size='md'
              onPress={() => openExternalLink(banner.ctaUrl as string)}
            >
              {ctaLabel}
            </Button>
          )}
          <button
            className='flex items-center justify-center hover:bg-white/10 rounded-full p-1 duration-150 cursor-pointer'
            onClick={onDismiss}
          >
            <TbX className='text-white/70 hover:text-white' fontSize={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

function AlertBanner({
  banner,
  message,
  title,
  ctaLabel,
  isExiting,
  onDismiss,
}: BannerVisualProps) {
  const {
    wrapperClassName,
    icon: Icon,
    iconClassName,
    titleClassName,
    messageClassName,
    ctaClassName,
  } = ALERT_VARIANT_STYLES[banner.variant as AlertVariant]

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 ${wrapperClassName} ${
        isExiting ? 'banner-alert-exit' : 'banner-alert-enter'
      }`}
    >
      <div className='relative flex items-center justify-between gap-4 px-6 py-3'>
        <div className='flex items-center gap-3'>
          <Icon className={`${iconClassName} shrink-0`} fontSize={20} />
          <p className='text-sm'>
            {title && <span className={`${titleClassName} mr-1`}>{title}</span>}
            <span className={messageClassName}>{message}</span>
          </p>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          {banner.ctaUrl && ctaLabel && (
            <Button
              className={ctaClassName}
              size='sm'
              onPress={() => openExternalLink(banner.ctaUrl as string)}
            >
              {ctaLabel}
            </Button>
          )}
          <button
            aria-label='Close'
            className='flex items-center justify-center hover:bg-white/10 rounded-full p-1 duration-150 cursor-pointer'
            onClick={onDismiss}
          >
            <TbX className='text-content' fontSize={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Bottom-of-screen system/promo banner (see `useBanners.ts`) - a past-due-subscription alert or
// the remote `banner.json` promo, never both at once. No framer-motion `AnimatePresence` (dropped
// project-wide): dismissal instead flips local `isExiting` state, which swaps in
// the CSS exit-animation class, then the actual `dismiss()` call (which drops the banner from
// `useBanners`' eligible set) is deferred until the animation's own duration has elapsed via
// `setTimeout` below - `EXIT_DURATION_MS` must stay in sync with `.banner-*-exit`'s animation-
// duration in globals.css.
const EXIT_DURATION_MS = 300

export const Banner = () => {
  const { t } = useTranslation()
  const { activeBanner, dismiss } = useBanners()
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    setIsExiting(false)
  }, [activeBanner?.id])

  if (!activeBanner) return null

  const banner = activeBanner as DisplayBanner
  const message = banner.messageKey ? t(banner.messageKey) : banner.message
  const title = banner.title
  const ctaLabel = banner.ctaLabelKey ? t(banner.ctaLabelKey) : banner.ctaLabel

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => dismiss(activeBanner), EXIT_DURATION_MS)
  }

  const visualProps: BannerVisualProps = {
    banner,
    message,
    title,
    ctaLabel,
    isExiting,
    onDismiss: handleDismiss,
  }

  return banner.variant === 'promo' ? (
    <PromoBanner key={banner.id} {...visualProps} />
  ) : (
    <AlertBanner key={banner.id} {...visualProps} />
  )
}
