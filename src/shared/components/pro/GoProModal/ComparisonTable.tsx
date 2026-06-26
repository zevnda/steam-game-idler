import type { ComparisonRowDef, PriceData } from './types'
import { useTranslation } from 'react-i18next'
import { FaCheck, FaXmark } from 'react-icons/fa6'
import { motion } from 'framer-motion'

interface ComparisonTableProps {
  rows: ComparisonRowDef[]
  priceData: PriceData
}

export function ComparisonTable({ rows, priceData }: ComparisonTableProps) {
  const { t } = useTranslation()

  return (
    <div className='relative w-214 mx-auto'>
      <div className='grid grid-cols-[1fr_9.5rem_9.5rem] rounded-4xl overflow-hidden bg-[#101013] border border-white/5'>
        {/* Header row */}
        <div className='flex items-center px-6 py-5' />

        <div className='flex flex-col items-center justify-center gap-1 py-5 px-3 border-l border-white/5'>
          <span className='text-xl font-black uppercase' style={{ color: '#3b82f6' }}>
            {t('proMode.tier.casual.name')}
          </span>
          <span className='text-altwhite text-[11px]'>
            ${priceData.tierOne.price}
            {t('proMode.tier.perMonth')}
          </span>
        </div>

        <div className='relative flex flex-col items-center justify-center gap-1 py-5 px-3'>
          <div
            className='absolute inset-0 -top-6'
            style={{
              background: 'linear-gradient(180deg, #630064 0%, #2f0474 100%)',
              boxShadow: '0 0 24px 6px rgba(146, 51, 234, 0.25)',
            }}
          />
          <span className='relative z-10 text-xl font-black uppercase' style={{ color: '#d6a8ff' }}>
            {t('proMode.tier.gamer.name')}
          </span>
          <span className='relative z-10 text-white/60 text-[11px]'>
            ${priceData.tierTwo.price}
            {t('proMode.tier.perMonth')}
          </span>
        </div>

        {/* Rows */}
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.035, duration: 0.35, ease: 'easeOut' as const }}
            className='contents'
          >
            <div
              className={`flex items-center gap-3 px-6 py-3.5 text-sm font-semibold border-t border-white/5 ${
                i % 2 === 0 ? 'bg-white/1.5' : ''
              }`}
            >
              <row.icon size={16} className='text-altwhite shrink-0' />
              {row.label}
            </div>

            <div
              className={`flex items-center justify-center border-t border-l border-white/5 ${
                i % 2 === 0 ? 'bg-white/1.5' : ''
              }`}
            >
              {row.tier === 'casual' ? (
                <FaCheck size={14} style={{ color: '#3b82f6' }} />
              ) : (
                <FaXmark size={14} className='text-white/15' />
              )}
            </div>

            <div
              className='relative flex items-center justify-center border-t border-white/10'
              style={{
                background: 'linear-gradient(180deg, rgba(138,96,255,0.12), rgba(171,38,211,0.07))',
              }}
            >
              <FaCheck size={14} style={{ color: '#d6a8ff' }} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
