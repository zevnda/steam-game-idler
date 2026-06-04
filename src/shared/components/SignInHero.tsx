import { Trans, useTranslation } from 'react-i18next'
import Image from 'next/image'
import { CDN_BASE_URL } from '@/shared/constants'

const COVER_ARTS = [
  1091500, 1174180, 381210, 1623730, 1938090, 271590, 413150, 230410, 2767030, 3564740, 252490,
  1172470, 2507950, 1808500, 578080, 221100, 322170, 1030300, 1172710, 1449110, 1771300, 2001120,
  2246340, 2322010, 2531310, 2592160, 2651280, 3008130, 3241660,
].map(id => `${CDN_BASE_URL}/cover-art/${id}.webp`)

export const SignInHero = () => {
  const { t } = useTranslation()

  const items = Array.from({ length: 2 }).flatMap((_, repeat) =>
    COVER_ARTS.map((src, idx) => ({ src, key: `${idx}-${repeat}` })),
  )

  return (
    <div className='relative flex items-center justify-center h-[75vh] w-full mt-12 overflow-hidden rounded-3xl inner-glow'>
      <div className='pointer-events-none absolute left-0 bottom-0 w-full h-1/4 z-20' />
      <div className='absolute flex flex-col items-center justify-between w-[90%] h-[90%] z-10 pointer-events-none'>
        <p className='font-black text-[52px] leading-14 text-center'>
          <Trans i18nKey='signIn.hero.title'>
            The Only Steam
            <br />
            Automation Tool
            <br />
            You Will Ever Need
          </Trans>
        </p>

        <p className='text-lg mt-4 text-center'>{t('signIn.hero.subtitle')}</p>

        <Image
          src={`${CDN_BASE_URL}/mock.webp`}
          alt='app mockup'
          width={730}
          height={380}
          className='mt-10 -translate-x-3'
          loading='eager'
        />
      </div>

      <div className='relative w-full h-full opacity-15'>
        <div className='mx-auto h-full w-[170%] -translate-x-72 -translate-y-18 animate-skew-scroll grid grid-cols-8 gap-3'>
          {items.map((item, idx) => (
            <div
              key={item.key}
              className={`relative ${idx % 2 === 1 ? '-translate-y-16' : ''}`}
              style={{ breakInside: 'avoid' }}
            >
              <Image
                loading='lazy'
                src={item.src}
                alt={item.src}
                width={130}
                height={130}
                className='rounded-lg w-full h-full object-cover hover:scale-105 duration-150'
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
