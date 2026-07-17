import type { Competitor } from '@/app/(marketing)/alternatives/_data/competitors'
import { TbCards } from 'react-icons/tb'

interface AlternativeHeroProps {
  competitor: Competitor
}

export default function AlternativeHero({ competitor }: AlternativeHeroProps) {
  return (
    <section className='pt-36 pb-24 sm:pt-44 sm:pb-32 relative overflow-hidden'>
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.055) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)',
        }}
      />

      <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
        <div className='max-w-4xl mx-auto text-center'>
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${competitor.accentBorderClassName} ${competitor.accentBgClassName} ${competitor.accentClassName} text-sm font-medium mb-8`}
          >
            <TbCards className='w-4 h-4' />
            {competitor.badgeLabel}
          </div>

          <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold leading-none tracking-tight mb-6'>
            <span className='text-text-primary'>{competitor.shortTagline}</span>
            <span className='block text-text-muted'>VS</span>
            <span
              className='block'
              style={{
                background: `linear-gradient(135deg, ${competitor.gradientFrom}, ${competitor.gradientTo})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              STEAM GAME IDLER
            </span>
          </h1>

          <p className='text-lg text-text-muted max-w-2xl mx-auto leading-relaxed'>
            {competitor.intro}
          </p>
        </div>
      </div>
    </section>
  )
}
