import type { CardDef } from './types'
import { useTranslation } from 'react-i18next'
import { FaArrowRight } from 'react-icons/fa6'
import Image from 'next/image'
import { openExternalLink } from '@/shared/utils/links'

// Ported from `main` - the staggered mount-in (`motion.div` + `transition={{ delay }}`) is now
// `.pro-fade-in-up` with an inline `animationDelay`, see globals.css's Go Pro modal section.
export function FeatureCard({ card, index }: { card: CardDef; index: number }) {
  const { t } = useTranslation()

  return (
    <div
      className='pro-fade-in-up group relative min-h-87.5 overflow-hidden rounded-4xl bg-[#131313]'
      style={{
        gridColumn: card.colSpan === 2 ? 'span 2' : 'span 1',
        animationDelay: `${index * 55}ms`,
      }}
    >
      <Image src={card.imgBg} alt='' fill className='object-cover opacity-80' />

      <div
        className={`relative z-10 flex h-full flex-col p-4 ${card.darkText ? 'text-black' : 'text-white'}`}
      >
        <p className='mb-1.5 text-xl font-black'>{card.title}</p>
        <p className='flex-1 text-sm font-semibold leading-relaxed'>{card.description}</p>

        <button
          className='mt-3 flex cursor-pointer items-center gap-1.5 self-start rounded-full bg-black/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-sm duration-150 hover:bg-black/50'
          type='button'
          onClick={() => openExternalLink(card.learnMoreUrl)}
        >
          {t('common.learnMore')}
          <FaArrowRight className='h-2.5 w-2.5' />
        </button>
      </div>
    </div>
  )
}
