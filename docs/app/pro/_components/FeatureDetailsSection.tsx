import { FaArrowRight } from 'react-icons/fa6'
import Link from 'next/link'
import { FadeIn, StaggerGroup, StaggerItem } from '@/app/lib/animations'
import { allFeatures } from '@/app/pro/_components/data'
import SectionHeading from '@/app/pro/_components/SectionHeading'

export default function FeatureDetailsSection() {
  return (
    <section className='py-12 sm:py-16 relative'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8'>
        <div className='max-w-3xl mx-auto'>
          <FadeIn>
            <SectionHeading label='Every Feature, Explained' />
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className='rounded-3xl overflow-hidden bg-[#101013] border border-white/5'>
              <StaggerGroup className='divide-y divide-white/5'>
                {allFeatures.map(f => {
                  const isCasual = f.tier === 'casual'
                  return (
                    <StaggerItem key={f.title}>
                      <div
                        id={f.id}
                        className='flex gap-4 sm:gap-5 items-start px-5 sm:px-7 py-5 sm:py-6 scroll-mt-24'
                      >
                        <div
                          className='shrink-0 w-10 h-10 rounded-xl flex items-center justify-center'
                          style={{
                            background: isCasual
                              ? 'rgba(59, 130, 246, 0.12)'
                              : 'linear-gradient(135deg, rgba(138,96,255,0.20), rgba(171,38,211,0.14))',
                          }}
                        >
                          <f.icon size={18} style={{ color: isCasual ? '#3b82f6' : '#d6a8ff' }} />
                        </div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 mb-1.5 flex-wrap'>
                            <h3 className='text-base sm:text-lg font-black text-white'>
                              {f.title}
                            </h3>
                            <span
                              className='text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white'
                              style={{
                                background: isCasual
                                  ? 'linear-gradient(90deg, #3b82f6, #38bdf8)'
                                  : 'linear-gradient(90deg, #8a60ff, #ab26d3)',
                              }}
                            >
                              {isCasual ? 'Casual' : 'Gamer'}
                            </span>
                          </div>
                          <p className='text-sm text-white/60 leading-relaxed'>{f.detail}</p>

                          {f.cta && (
                            <Link
                              prefetch={false}
                              href={f.cta.url}
                              target='_blank'
                              className='inline-flex items-center gap-1.5 mt-2.5 text-sm font-bold duration-150 hover:gap-2'
                              style={{ color: isCasual ? '#3b82f6' : '#d6a8ff' }}
                            >
                              {f.cta.label}
                              <FaArrowRight className='w-3 h-3' />
                            </Link>
                          )}
                        </div>
                      </div>
                    </StaggerItem>
                  )
                })}
              </StaggerGroup>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
