import type { CardDef } from './types'
import { useTranslation } from 'react-i18next'
import { FaArrowRight } from 'react-icons/fa6'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { openExternalLink } from '@/shared/utils'

export function FeatureCard({ card, index }: { card: CardDef; index: number }) {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.45, ease: 'easeOut' as const }}
      style={{
        gridColumn: card.colSpan === 2 ? 'span 2' : 'span 1',
        background: card.bg,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      className='relative rounded-4xl overflow-hidden cursor-default group min-h-87.5'
    >
      {card.imgBg && <Image src={card.imgBg} alt='' fill className='object-cover opacity-80' />}

      <div
        className={`relative z-10 p-4 flex flex-col h-full ${card.darkText ? 'text-black' : ''}`}
      >
        <p className='text-xl font-black mb-1.5'>{card.title}</p>
        <p className='text-sm font-semibold leading-relaxed flex-1'>{card.description}</p>

        {card.learnMoreUrl && (
          <button
            onClick={() => openExternalLink(card.learnMoreUrl as string)}
            className='self-start flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm duration-150 cursor-pointer'
          >
            {t('common.learnMore')}
            <FaArrowRight className='w-2.5 h-2.5' />
          </button>
        )}
      </div>
    </motion.div>
  )
}
