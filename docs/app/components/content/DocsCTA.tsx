import Link from 'next/link'
import { FaArrowRight, FaWindows } from 'react-icons/fa'
import { FiGithub } from 'react-icons/fi'
import { HiOutlineLightningBolt } from 'react-icons/hi'

export default function DocsCTA({ content }: { content: string }) {
  return (
    <div className='not-prose my-8'>
      <div className='relative overflow-hidden rounded-lg border border-neutral-200 bg-linear-to-br from-blue-50 to-indigo-50 p-8 dark:border-neutral-800 dark:from-blue-950/30 dark:to-indigo-950/30'>
        <div className='absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-blue-400/10 blur-2xl' />
        <div className='absolute bottom-0 left-0 h-24 w-24 -translate-x-4 translate-y-4 rounded-full bg-indigo-400/10 blur-2xl' />

        <div className='relative'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'>
            <HiOutlineLightningBolt size={20} />
            Get Started Now
          </div>

          <h3 className='mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100'>
            Ready to try Steam Game Idler?
          </h3>

          <p className='mb-6 text-neutral-600 dark:text-neutral-400'>{content}</p>

          {/* GitHub link */}
          <div className='flex justify-center lg:justify-start px-4 sm:px-0'>
            <Link
              prefetch={false}
              href='https://github.com/zevnda/steam-game-idler'
              target='_blank'
              rel='noopener noreferrer'
              className='group inline-flex items-center hover:text-purple-600 transition-colors duration-200 text-sm'
            >
              <FiGithub className='w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200' />
              View the best Steam idler on GitHub
              <FaArrowRight className='w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform duration-200' />
            </Link>
          </div>

          {/* Action buttons */}
          <div className='flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start px-4 sm:px-0 mt-6'>
            <Link
              prefetch={false}
              href='https://github.com/zevnda/steam-game-idler/releases/latest'
              className='group inline-flex items-center justify-center px-6 sm:px-6 md:px-8 py-3 sm:py-3 md:py-4 bg-linear-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm md:text-base'
            >
              <FaWindows className='w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3' />
              DOWNLOAD
              <FaArrowRight className='w-3 h-3 md:w-4 md:h-4 ml-2 md:ml-3 group-hover:translate-x-1 transition-transform duration-200' />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
