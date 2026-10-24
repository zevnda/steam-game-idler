import { FiGithub } from 'react-icons/fi'
import { Logo } from './Logo'
import Link from 'next/link'
import DownloadButton from '@/app/(marketing)/(home)/_components/DownloadButton'

/**
 * The closing call to action on a docs page - a small version of the marketing pages' FinalCta
 * (same rainbow rim, white download pill and ghost pill), so the docs end the way the rest of
 * the site does.
 */
export default function DocsCTA() {
  return (
    // generous margin: the rim's blurred glow spreads ~40px past the card, so it needs that much
    // clear space before it reaches the surrounding text
    <div className='not-prose my-20'>
      <div className='cta-rim'>
        <div className='cta-rim__inner px-6 py-9 sm:px-10 sm:py-11'>
          <div className='absolute -right-4 -bottom-8 pointer-events-none -rotate-20'>
            <Logo width='48' height='48' />
          </div>

          <div className='relative z-10'>
            <h3 className='text-[clamp(1.6rem,3vw,2.1rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-text-primary'>
              Ready to get started?
            </h3>

            <p className='mt-3 max-w-md text-base text-text-muted leading-relaxed'>
              Join thousands of users who are already using Steam Game Idler to enhance their Steam
              experience.
            </p>

            {/* leading-normal + items-center: the hero's own button sizes (the docs' taller
                line-height and the row's stretch made these ~5px taller) */}
            <div className='mt-7 flex flex-col sm:flex-row sm:items-center gap-3 leading-normal'>
              <DownloadButton />

              <Link
                prefetch={false}
                href='https://github.com/zevnda/steam-game-idler'
                target='_blank'
                rel='noopener noreferrer'
                className='btn-ghost px-6 py-3 rounded-full'
              >
                <FiGithub className='w-4 h-4' />
                View on GitHub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
