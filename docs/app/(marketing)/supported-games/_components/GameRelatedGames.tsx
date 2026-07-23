import type { GameData } from '../_data/games'
import { FiArrowUpRight } from 'react-icons/fi'
import { GAMES } from '../_data/games'
import Link from 'next/link'
import CardBorder from '@/app/(marketing)/(home)/_components/CardBorder'

function pickRelated(game: GameData, count = 3) {
  const others = GAMES.filter(candidate => candidate.slug !== game.slug)
  const sameGenre = others.filter(candidate => candidate.genre === game.genre)
  const rest = others.filter(candidate => candidate.genre !== game.genre)

  return [...sameGenre, ...rest].slice(0, count)
}

export default function GameRelatedGames({ game }: { game: GameData }) {
  const related = pickRelated(game)
  if (related.length === 0) return null

  return (
    <section className='py-16 sm:py-20 relative'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8 max-w-4xl'>
        <h2 className='text-3xl sm:text-4xl text-text-primary mb-10 text-center tracking-tight'>
          Other games you can <span className='gradient-text'>idle</span>
        </h2>

        <div className='grid sm:grid-cols-3 gap-4'>
          {related.map(candidate => (
            <Link
              key={candidate.slug}
              prefetch={false}
              href={`/supported-games/${candidate.slug}`}
              className='relative overflow-hidden p-5 group block'
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-card)',
              }}
            >
              <CardBorder />
              <div className='flex items-start justify-between gap-2 mb-1.5'>
                <h3 className='text-sm font-semibold text-text-primary'>{candidate.name}</h3>
                <FiArrowUpRight className='w-4 h-4 text-text-muted shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150' />
              </div>
              <p className='text-xs text-text-muted uppercase tracking-wider'>{candidate.genre}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
