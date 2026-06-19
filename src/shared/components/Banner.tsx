import type { BannerVariant } from '@/shared/types'
import { TbAlertTriangle, TbCircleCheck, TbInfoCircle, TbX } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useBanners } from '@/shared/hooks'
import { openExternalLink } from '@/shared/utils'

const VARIANT_STYLES: Record<
  BannerVariant,
  { gradient: string; icon: typeof TbAlertTriangle; iconColor: string }
> = {
  danger: {
    gradient: 'from-red-950 via-red-900 to-zinc-950',
    icon: TbAlertTriangle,
    iconColor: 'text-red-400',
  },
  warning: {
    gradient: 'from-yellow-950 via-yellow-900 to-zinc-950',
    icon: TbAlertTriangle,
    iconColor: 'text-yellow-400',
  },
  info: {
    gradient: 'from-blue-950 via-blue-900 to-zinc-950',
    icon: TbInfoCircle,
    iconColor: 'text-blue-400',
  },
  success: {
    gradient: 'from-green-950 via-green-900 to-zinc-950',
    icon: TbCircleCheck,
    iconColor: 'text-green-400',
  },
}

export const Banner = () => {
  const { activeBanner, dismiss } = useBanners()

  if (!activeBanner) return null

  const { gradient, icon: Icon, iconColor } = VARIANT_STYLES[activeBanner.variant]

  return (
    <AnimatePresence>
      <motion.div
        key={activeBanner.id}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-linear-to-r ${gradient}`}
      >
        <div className='flex items-center justify-between gap-4 px-6 py-3'>
          <div className='flex items-center gap-3'>
            <Icon fontSize={20} className={`${iconColor} shrink-0`} />
            <p className='text-sm text-content'>
              {activeBanner.title && <span className='font-semibold'>{activeBanner.title} </span>}
              {activeBanner.message}
            </p>
          </div>
          <div className='flex items-center gap-2 shrink-0'>
            {activeBanner.ctaUrl && activeBanner.ctaLabel && (
              <Button
                size='sm'
                radius='full'
                variant='solid'
                className='bg-white text-black font-semibold'
                onPress={() => openExternalLink(activeBanner.ctaUrl as string)}
              >
                {activeBanner.ctaLabel}
              </Button>
            )}
            <button
              onClick={() => dismiss(activeBanner)}
              className='flex items-center justify-center hover:bg-white/10 rounded-full p-1 duration-150 cursor-pointer'
            >
              <TbX fontSize={18} className='text-content' />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
