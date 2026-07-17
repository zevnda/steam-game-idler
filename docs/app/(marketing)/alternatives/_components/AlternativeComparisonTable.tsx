import type { Competitor } from '@/app/(marketing)/alternatives/_data/competitors'
import { FaCheck, FaXmark } from 'react-icons/fa6'
import { StaggerGroup, StaggerItem } from '@/app/lib/animations'

interface AlternativeComparisonTableProps {
  competitor: Competitor
}

function ComparisonValue({
  value,
  accentColor,
}: {
  value: boolean | string
  accentColor?: string
}) {
  if (typeof value === 'boolean') {
    return (
      <div className='flex justify-center'>
        {value ? (
          <FaCheck
            size={16}
            style={accentColor ? { color: accentColor } : undefined}
            className={accentColor ? undefined : 'text-emerald-400'}
          />
        ) : (
          <FaXmark size={16} className='text-white/15' />
        )}
      </div>
    )
  }
  return (
    <span
      className={`text-sm font-semibold ${accentColor ? '' : 'font-medium text-white/70'}`}
      style={accentColor ? { color: accentColor } : undefined}
    >
      {value}
    </span>
  )
}

export default function AlternativeComparisonTable({
  competitor,
}: AlternativeComparisonTableProps) {
  return (
    <StaggerGroup className='space-y-6'>
      {competitor.comparisonData.map(section => (
        <StaggerItem key={section.category}>
          <div className='rounded-3xl overflow-hidden bg-[#101013] border border-white/5'>
            <div className='px-6 py-4 border-b border-white/5'>
              <h3 className='text-base font-semibold text-white'>{section.category}</h3>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-white/5'>
                    <th
                      className='text-left py-4 px-6 text-xs font-semibold text-white/40 uppercase tracking-wider'
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      Feature
                    </th>
                    <th className='relative py-4 px-2 sm:px-4 border-l border-white/10'>
                      <div
                        className='absolute inset-0'
                        style={{
                          background: competitor.headerGlowGradient,
                          boxShadow: competitor.headerGlowShadow,
                        }}
                      />
                      <span
                        className='relative z-10 block text-center text-sm sm:text-base font-black uppercase tracking-wider whitespace-nowrap'
                        style={{ color: competitor.headerGlowTextColor }}
                      >
                        Steam Game Idler
                      </span>
                    </th>
                    <th
                      className='text-center py-4 px-6 text-xs font-medium text-white/30 uppercase tracking-wider whitespace-nowrap'
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      {competitor.name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {section.features.map((feature, index) => (
                    <tr
                      key={feature.name}
                      className={`border-t border-white/5 ${index % 2 === 0 ? '' : 'bg-white/2'}`}
                    >
                      <td className='py-3.5 px-6 text-sm font-medium text-white'>{feature.name}</td>
                      <td
                        className='py-3.5 px-6 text-center border-l border-white/10'
                        style={{ background: competitor.rowTintGradient }}
                      >
                        <ComparisonValue
                          value={feature.steamGameIdler}
                          accentColor={competitor.headerGlowTextColor}
                        />
                      </td>
                      <td className='py-3.5 px-6 text-center'>
                        <ComparisonValue value={feature.alt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}
