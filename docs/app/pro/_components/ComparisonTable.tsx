import type { Feature } from '@/app/pro/_components/data'
import { FaCheck, FaXmark } from 'react-icons/fa6'
import { StaggerGroup, StaggerItem } from '@/app/lib/animations'

interface ComparisonTableProps {
  rows: Feature[]
  casualPrice: string
  gamerPrice: string
}

export default function ComparisonTable({ rows, casualPrice, gamerPrice }: ComparisonTableProps) {
  return (
    <div className='rounded-3xl overflow-hidden bg-[#101013] border border-white/5'>
      <div className='grid grid-cols-[1fr_4.5rem_4.5rem] sm:grid-cols-[1fr_7rem_7rem]'>
        {/* Header row */}
        <div className='flex items-center px-4 sm:px-6 py-5' />

        <div className='flex flex-col items-center justify-center gap-1 py-5 px-2 border-l border-white/5'>
          <span className='text-sm sm:text-xl font-black uppercase' style={{ color: '#3b82f6' }}>
            Casual
          </span>
          <span className='text-white/50 text-[10px] sm:text-[11px]'>${casualPrice}/mo</span>
        </div>

        <div className='relative flex flex-col items-center justify-center gap-1 py-5 px-2'>
          <div
            className='absolute inset-0 -top-6'
            style={{
              background: 'linear-gradient(180deg, #630064 0%, #2f0474 100%)',
              boxShadow: '0 0 24px 6px rgba(146, 51, 234, 0.25)',
            }}
          />
          <span
            className='relative z-10 text-sm sm:text-xl font-black uppercase'
            style={{ color: '#d6a8ff' }}
          >
            Gamer
          </span>
          <span className='relative z-10 text-white/60 text-[10px] sm:text-[11px]'>
            ${gamerPrice}/mo
          </span>
        </div>

        {/* Rows */}
        <StaggerGroup className='contents'>
          {rows.map((row, i) => (
            <StaggerItem key={row.title} className='contents'>
              <div
                className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-white border-t border-white/5 ${
                  i % 2 === 0 ? 'bg-white/1.5' : ''
                }`}
              >
                <row.icon className='w-4 h-4 text-white/50 shrink-0' />
                <span>{row.tierLabel ?? row.title}</span>
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
                  background:
                    'linear-gradient(180deg, rgba(138,96,255,0.12), rgba(171,38,211,0.07))',
                }}
              >
                <FaCheck size={14} style={{ color: '#d6a8ff' }} />
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </div>
  )
}
