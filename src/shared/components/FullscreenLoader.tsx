import { cn, Spinner } from '@heroui/react'
import { Unbounded } from 'next/font/google'

const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
})

export const FullscreenLoader = ({ loaderFadeOut = false }: { loaderFadeOut?: boolean }) => {
  return (
    <div
      className={cn(
        'fixed inset-0 w-screen h-screen z-9998 bg-base transition-opacity duration-250',
        {
          'opacity-0 pointer-events-none': loaderFadeOut,
          'opacity-100': !loaderFadeOut,
        },
      )}
    >
      <video
        src='/loader.webm'
        autoPlay
        loop
        muted
        playsInline
        className='w-screen h-screen object-cover absolute blur inset-0'
      />
      <div className='flex flex-col space-y-10 absolute inset-0 items-center justify-center z-10'>
        <p className={`${unbounded.className} text-4xl font-black uppercase text-content`}>
          Steam Game Idler
        </p>
        <Spinner size='lg' variant='simple' color='white' />
      </div>
    </div>
  )
}
