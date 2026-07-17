import type { Competitor } from '@/app/(marketing)/alternatives/_data/competitors'
import { FiRefreshCw } from 'react-icons/fi'
import { TbAward, TbCards, TbEye, TbShield, TbTrendingUp, TbUsers } from 'react-icons/tb'
import SectionHeading from '@/app/(marketing)/pro/_components/SectionHeading'
import { FadeIn, StaggerGroup, StaggerItem } from '@/app/lib/animations'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  TbUsers,
  TbCards,
  TbShield,
  FiRefreshCw,
  TbEye,
  TbAward,
  TbTrendingUp,
}

interface WhyChooseSectionProps {
  competitor: Competitor
}

export default function WhyChooseSection({ competitor }: WhyChooseSectionProps) {
  return (
    <div className='max-w-5xl mx-auto'>
      <FadeIn>
        <SectionHeading label='Why Choose Steam Game Idler' />
      </FadeIn>

      <StaggerGroup className='grid sm:grid-cols-3 gap-4 mb-8'>
        {competitor.whyChooseCards.map(card => {
          const Icon = ICONS[card.icon]
          return (
            <StaggerItem key={card.title}>
              <div className='rounded-3xl p-6 text-center h-full border border-white/5 bg-[#101013]'>
                <Icon className={`w-7 h-7 mx-auto mb-4 ${competitor.accentTextClassName}`} />
                <h3 className='font-semibold text-white mb-2'>{card.title}</h3>
                <p className='text-sm text-white/60 leading-relaxed'>{card.description}</p>
              </div>
            </StaggerItem>
          )
        })}
      </StaggerGroup>

      <FadeIn
        delay={0.15}
        className='rounded-3xl p-8 text-center border border-white/5 bg-[#101013]'
      >
        <p className='text-white/60 leading-relaxed max-w-2xl mx-auto'>
          {competitor.whyChooseSummary}
        </p>
      </FadeIn>
    </div>
  )
}
