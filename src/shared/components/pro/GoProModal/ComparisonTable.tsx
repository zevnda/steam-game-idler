import type { ComparisonRowDef, PriceData } from './types'
import { useTranslation } from 'react-i18next'
import { FaArrowRight, FaCheck, FaXmark } from 'react-icons/fa6'
import { PRO_DOCS_URL } from './data'
import { openExternalLink } from '@/shared/utils/links'

// Ported from `main` - rows animated in on scroll (`whileInView`) there; here they animate in on
// mount instead (`.pro-fade-in-up` + staggered `animationDelay`), since this section only ever
// renders once the modal is already open and framer-motion's viewport observer was dropped along
// with the dependency. The table sits below the fold,
// so in practice this plays out slightly before a user scrolls to it rather than exactly as they
// arrive - a minor, deliberate trade-off, not a bug.
export function ComparisonTable({
  rows,
  priceData,
}: {
  rows: ComparisonRowDef[]
  priceData: PriceData
}) {
  const { t } = useTranslation()

  return (
    <div className='relative mx-auto w-214'>
      <div className='grid grid-cols-[1fr_7rem_9.5rem_9.5rem] overflow-hidden rounded-4xl border border-white/5 bg-[#101013]'>
        <div className='flex items-center px-6 py-5' />

        <div className='flex flex-col items-center justify-center gap-1 border-l border-white/5 px-3 py-5'>
          <span className='text-xl font-black uppercase text-muted'>
            {t('dashboard.sidebar.tier.free')}
          </span>
          <span className='text-[11px] text-muted'>
            ${0}
            {t('proMode.tier.perMonth')}
          </span>
        </div>

        <div className='flex flex-col items-center justify-center gap-1 border-l border-white/5 px-3 py-5'>
          <span className='text-xl font-black uppercase' style={{ color: '#3b82f6' }}>
            {t('proMode.tier.casual.name')}
          </span>
          <span className='text-[11px] text-muted'>
            ${priceData.tierOne.price}
            {t('proMode.tier.perMonth')}
          </span>
        </div>

        <div className='relative flex flex-col items-center justify-center gap-1 px-3 py-5'>
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
          <span className='relative z-10 text-[11px] text-white/60'>
            ${priceData.tierTwo.price}
            {t('proMode.tier.perMonth')}
          </span>
        </div>

        {rows.map((row, i) => (
          <div
            className='pro-fade-in-up contents'
            key={row.label}
            style={{ animationDelay: `${i * 35}ms` }}
          >
            <div
              className={`flex items-center gap-3 border-t border-white/5 px-6 py-3.5 text-sm font-semibold ${
                i % 2 === 0 ? 'bg-white/1.5' : ''
              }`}
            >
              <row.icon size={16} className='shrink-0 text-muted' />
              {row.label}
            </div>

            <div
              className={`flex items-center justify-center border-l border-t border-white/5 ${
                i % 2 === 0 ? 'bg-white/1.5' : ''
              }`}
            >
              {row.freeValue ? (
                <span className='text-sm font-black text-muted'>{row.freeValue}</span>
              ) : (
                <FaXmark size={14} className='text-white/15' />
              )}
            </div>

            <div
              className={`flex items-center justify-center border-l border-t border-white/5 ${
                i % 2 === 0 ? 'bg-white/1.5' : ''
              }`}
            >
              {row.casualValue ? (
                <span className='text-sm font-black' style={{ color: '#3b82f6' }}>
                  {row.casualValue}
                </span>
              ) : row.tier === 'casual' ? (
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
              {row.gamerValue ? (
                <span className='relative z-10 text-sm font-black' style={{ color: '#d6a8ff' }}>
                  {row.gamerValue}
                </span>
              ) : (
                <FaCheck size={14} style={{ color: '#d6a8ff' }} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className='mt-6 flex justify-center'>
        <button
          className='flex cursor-pointer items-center gap-1.5 rounded-full bg-field px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted duration-150 hover:bg-field-hover hover:text-foreground'
          type='button'
          onClick={() => openExternalLink(`${PRO_DOCS_URL}#feature-details`)}
        >
          {t('proMode.comparisonTable.learnMoreFeatures')}
          <FaArrowRight className='h-2.5 w-2.5' />
        </button>
      </div>
    </div>
  )
}
