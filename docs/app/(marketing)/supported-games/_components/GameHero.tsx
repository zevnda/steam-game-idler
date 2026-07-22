import type { GameData } from '../_data/games'
import { FiArrowUpRight } from 'react-icons/fi'
import { TbDeviceGamepad2 } from 'react-icons/tb'
import Link from 'next/link'
import DownloadButton from '@/app/(marketing)/(home)/_components/DownloadButton'

export default function GameHero({ game }: { game: GameData }) {
  return (
    <section className='pt-32 pb-16 sm:pt-40 sm:pb-20 relative overflow-hidden'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8 max-w-4xl text-center'>
        <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-xs text-text-muted mb-6'>
          <TbDeviceGamepad2 className='w-3.5 h-3.5' />
          {game.genre} · {game.developer}
        </div>

        <h1 className='text-4xl sm:text-5xl md:text-6xl text-text-primary mb-6 leading-tight tracking-tight'>
          Idle <span className='gradient-text'>{game.name}</span> on Steam
        </h1>

        <p className='text-lg text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed'>
          {game.tagline}
        </p>

        <div className='flex flex-wrap gap-3 justify-center'>
          <DownloadButton iconClassName='w-4 h-4' />
          <Link prefetch={false} href='/docs/features/idling' className='btn-ghost px-6 py-3 group'>
            How idling works
            <FiArrowUpRight className='w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150' />
          </Link>
        </div>
      </div>
    </section>
  )
}
