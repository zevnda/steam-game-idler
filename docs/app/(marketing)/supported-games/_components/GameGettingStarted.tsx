import type { GameData } from '../_data/games'
import { TbDownload, TbLogin2, TbPlayerPlay, TbSearch } from 'react-icons/tb'
import CardBorder from '@/app/(marketing)/(home)/_components/CardBorder'

export default function GameGettingStarted({ game }: { game: GameData }) {
  const steps = [
    {
      icon: TbDownload,
      title: 'Download Steam Game Idler',
      description: 'Free for Windows 10/11 - no sign-up, no credit card, roughly a 7 MB installer.',
    },
    {
      icon: TbLogin2,
      title: game.gcTitle ? 'Sign in with Legacy Sign In' : 'Sign in with Agent Mode',
      description: game.gcTitle
        ? `${game.name} needs a real local Steam client, so use Legacy Sign In for this one.`
        : 'Sign in with your Steam username and password - no local Steam client required.',
    },
    {
      icon: TbSearch,
      title: `Find ${game.name} in your library`,
      description: 'Search or browse your owned games list to select it.',
    },
    {
      icon: TbPlayerPlay,
      title: 'Start idling',
      description: `Click start and let ${game.name} idle in the background - check progress any time from the dashboard.`,
    },
  ]

  return (
    <section className='py-16 sm:py-20 relative'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8 max-w-4xl'>
        <h2 className='text-3xl sm:text-4xl text-text-primary mb-10 text-center tracking-tight'>
          Getting started with <span className='gradient-text'>{game.name}</span>
        </h2>

        <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className='relative overflow-hidden p-5'
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 'var(--radius-card)',
                }}
              >
                <CardBorder />
                <div className='flex items-center gap-2 mb-3'>
                  <div className='p-2 rounded-lg bg-white/4 border border-white/8 shrink-0'>
                    <Icon className='w-4 h-4 text-text-muted' />
                  </div>
                  <span className='text-xs font-mono text-text-muted opacity-50'>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className='text-sm font-semibold text-text-primary mb-1.5'>{step.title}</h3>
                <p className='text-sm text-text-muted leading-relaxed'>{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
