import type { GameData } from '../_data/games'
import { TbCircleCheck, TbInfoCircle } from 'react-icons/tb'
import { getFeatureDocsLink } from '../_data/featureLinks'
import Link from 'next/link'
import CardBorder from '@/app/(marketing)/(home)/_components/CardBorder'

export default function GameHighlights({ game }: { game: GameData }) {
  return (
    <section className='py-16 sm:py-20 relative'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8 max-w-4xl'>
        <div className='max-w-none mb-12'>
          {game.summary.map(paragraph => (
            <p
              key={paragraph}
              className='text-text-muted leading-relaxed mb-4 text-base sm:text-lg'
            >
              {paragraph}
            </p>
          ))}
        </div>

        {game.gcTitle && (
          <div className='flex items-start gap-3 p-4 rounded-lg border border-border bg-white/3 mb-12'>
            <TbInfoCircle className='w-5 h-5 text-blue-400 shrink-0 mt-0.5' />
            <p className='text-sm text-text-muted leading-relaxed'>
              {game.name} is one of Valve&apos;s Game Coordinator titles, so idling it requires{' '}
              <Link
                prefetch={false}
                href='/docs/get-started/how-to-sign-in'
                className='text-accent hover:opacity-80 transition-opacity duration-150'
              >
                Legacy Sign-in
              </Link>{' '}
              with a real local Steam client - Agent Mode can&apos;t reach its Game Coordinator.
            </p>
          </div>
        )}

        <div className='grid sm:grid-cols-3 gap-4'>
          {game.highlights.map(highlight => {
            const docsHref = getFeatureDocsLink(highlight.title)

            return (
              <div
                key={highlight.title}
                className='relative overflow-hidden p-5'
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 'var(--radius-card)',
                }}
              >
                <CardBorder />
                <TbCircleCheck className='w-5 h-5 text-emerald-400 mb-3' />
                <h3 className='text-sm font-semibold mb-1.5'>
                  {docsHref ? (
                    <Link
                      prefetch={false}
                      href={docsHref}
                      className='text-text-primary hover:text-accent transition-colors duration-150 underline decoration-border underline-offset-4 hover:decoration-accent'
                    >
                      {highlight.title}
                    </Link>
                  ) : (
                    <span className='text-text-primary'>{highlight.title}</span>
                  )}
                </h3>
                <p className='text-sm text-text-muted leading-relaxed'>{highlight.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
