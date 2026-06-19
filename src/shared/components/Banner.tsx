import type { ActiveBanner, BannerVariant, PromoColor } from '@/shared/types'
import { TbAlertTriangle, TbCircleCheck, TbInfoCircle, TbX } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { CDN_BASE_URL } from '@/shared/constants'
import { useBanners } from '@/shared/hooks'
import { openExternalLink } from '@/shared/utils'

interface VariantStyle {
  wrapperClassName: string
  icon: typeof TbAlertTriangle
  iconClassName: string
  titleClassName: string
  messageClassName: string
  ctaClassName: string
}

type AlertVariant = Exclude<BannerVariant, 'promo'>

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

const PROMO_STARS = [
  { top: '20%', left: '6%', width: 46, angle: 26, delay: 0, duration: 0.8, repeatDelay: 5.5 },
  { top: '65%', left: '24%', width: 36, angle: 20, delay: 1.6, duration: 0.85, repeatDelay: 6.5 },
  { top: '30%', left: '48%', width: 42, angle: 30, delay: 3.1, duration: 0.9, repeatDelay: 6 },
  { top: '70%', left: '70%', width: 34, angle: 22, delay: 2.2, duration: 0.85, repeatDelay: 7 },
  { top: '18%', left: '88%', width: 38, angle: 28, delay: 4.4, duration: 0.8, repeatDelay: 6.2 },
]

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
        const travel = 80
        const dx = travel * Math.cos(rad)
        const dy = travel * Math.sin(rad)
        return (
          <motion.div
            key={`${star.top}-${star.left}`}
            className='absolute pointer-events-none'
            style={{
              top: star.top,
              left: star.left,
              height: 1.5,
              width: star.width,
              borderRadius: 9999,
              background:
                'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.9) 85%, white 100%)',
              rotate: star.angle,
              filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.75))',
            }}
            animate={{ x: [0, dx], y: [0, dy], opacity: [0, 1, 0] }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              repeatDelay: star.repeatDelay,
              delay: star.delay,
              ease: 'easeOut',
            }}
          />
        )
      })}
    </>
  )
}

function PromoBanner({ banner, onDismiss }: { banner: ActiveBanner; onDismiss: () => void }) {
  const colorStyle = PROMO_COLOR_STYLES[banner.color ?? 'purple']

  return (
    <motion.div
      initial={{ y: 140, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 140, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className='fixed bottom-0 left-0 right-0 z-50 overflow-hidden'
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
        <motion.div
          className='absolute inset-0 pointer-events-none'
          style={{
            backgroundImage:
              'linear-gradient(90deg, #f87171, #fb923c, #facc15, #4ade80, #38bdf8, #818cf8, #f472b6, #f87171)',
            backgroundSize: '300% 100%',
            opacity: 0.25,
            mixBlendMode: 'screen',
          }}
          animate={{ backgroundPositionX: ['0%', '100%', '0%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {banner.asset && (
        <div className='absolute inset-y-0 left-8 flex items-center pointer-events-none select-none'>
          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image
              src={`${CDN_BASE_URL}/frosted/${banner.asset}`}
              alt=''
              width={300}
              height={300}
              loading='eager'
              className='w-32 h-32 object-contain drop-shadow-2xl scale-x-[-1]'
            />
          </motion.div>
        </div>
      )}
      <div className='relative flex items-center justify-between gap-6 px-8 py-5 min-h-28'>
        <div className={`flex items-center gap-4 ${banner.asset ? 'ml-38' : ''}`}>
          <div className='flex flex-col gap-0.5'>
            {banner.title && (
              <span className='text-lg font-black uppercase tracking-wide text-white leading-tight'>
                {banner.title}
              </span>
            )}
            <span className='text-sm text-white/70'>{banner.message}</span>
          </div>
        </div>
        <div className='flex items-center gap-3 shrink-0'>
          {banner.ctaUrl && banner.ctaLabel && (
            <Button
              size='md'
              radius='full'
              variant='solid'
              className={`bg-white ${colorStyle.ctaTextClassName} font-bold px-6 shadow-lg hover:scale-105 duration-150`}
              onPress={() => openExternalLink(banner.ctaUrl as string)}
            >
              {banner.ctaLabel}
            </Button>
          )}
          <button
            onClick={onDismiss}
            className='flex items-center justify-center hover:bg-white/10 rounded-full p-1 duration-150 cursor-pointer'
          >
            <TbX fontSize={20} className='text-white/70 hover:text-white' />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function AlertBanner({ banner, onDismiss }: { banner: ActiveBanner; onDismiss: () => void }) {
  const {
    wrapperClassName,
    icon: Icon,
    iconClassName,
    titleClassName,
    messageClassName,
    ctaClassName,
  } = ALERT_VARIANT_STYLES[banner.variant as AlertVariant]

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`fixed bottom-0 left-0 right-0 z-50 ${wrapperClassName}`}
    >
      <div className='relative flex items-center justify-between gap-4 px-6 py-3'>
        <div className='flex items-center gap-3'>
          <Icon fontSize={20} className={`${iconClassName} shrink-0`} />
          <p className='text-sm'>
            {banner.title && <span className={`${titleClassName} mr-1`}>{banner.title}</span>}
            <span className={messageClassName}>{banner.message}</span>
          </p>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          {banner.ctaUrl && banner.ctaLabel && (
            <Button
              size='sm'
              radius='full'
              variant='solid'
              className={ctaClassName}
              onPress={() => openExternalLink(banner.ctaUrl as string)}
            >
              {banner.ctaLabel}
            </Button>
          )}
          <button
            onClick={onDismiss}
            className='flex items-center justify-center hover:bg-white/10 rounded-full p-1 duration-150 cursor-pointer'
          >
            <TbX fontSize={18} className='text-content' />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export const Banner = () => {
  const { activeBanner, dismiss } = useBanners()

  return (
    <AnimatePresence>
      {activeBanner?.variant === 'promo' && (
        <PromoBanner
          key={activeBanner.id}
          banner={activeBanner}
          onDismiss={() => dismiss(activeBanner)}
        />
      )}
      {activeBanner && activeBanner.variant !== 'promo' && (
        <AlertBanner
          key={activeBanner.id}
          banner={activeBanner}
          onDismiss={() => dismiss(activeBanner)}
        />
      )}
    </AnimatePresence>
  )
}
