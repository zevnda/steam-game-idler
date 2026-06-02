import { useTranslation } from 'react-i18next'
import { cn, Progress } from '@heroui/react'
import { Unbounded } from 'next/font/google'

const unbounded = Unbounded({ subsets: ['latin'], variable: '--font-unbounded' })

export function UpdateLoader() {
  const { t } = useTranslation()

  return (
    <div className={cn('fixed inset-0 w-screen h-screen z-9998 bg-base')}>
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
        <div className='flex flex-col items-center space-y-3 w-64'>
          <p className='text-sm text-content/60'>{t('common.downloadingUpdate')}</p>
          <Progress
            isIndeterminate
            classNames={{ base: 'w-full', track: 'bg-white/20', indicator: 'bg-white' }}
          />
        </div>
      </div>
    </div>
  )
}
