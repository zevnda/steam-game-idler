import Image from 'next/image'
import { Trans, useTranslation } from 'react-i18next'

export const Hero = () => {
  const { t } = useTranslation()

  const uniqueItems = [
    { id: '1', src: '/cover-art/1091500.webp' },
    { id: '2', src: '/cover-art/1174180.webp' },
    { id: '3', src: '/cover-art/381210.webp' },
    { id: '4', src: '/cover-art/1623730.webp' },
    { id: '5', src: '/cover-art/1938090.webp' },
    { id: '6', src: '/cover-art/271590.webp' },
    { id: '7', src: '/cover-art/413150.webp' },
    { id: '8', src: '/cover-art/230410.webp' },
    { id: '9', src: '/cover-art/2767030.webp' },
    { id: '10', src: '/cover-art/3564740.webp' },
    { id: '11', src: '/cover-art/252490.webp' },
    { id: '12', src: '/cover-art/1172470.webp' },
    { id: '13', src: '/cover-art/2507950.webp' },
    { id: '14', src: '/cover-art/1808500.webp' },
    { id: '15', src: '/cover-art/578080.webp' },
    { id: '16', src: '/cover-art/221100.webp' },
    { id: '17', src: '/cover-art/322170.webp' },
    { id: '18', src: '/cover-art/1030300.webp' },
    { id: '19', src: '/cover-art/1172710.webp' },
    { id: '20', src: '/cover-art/1449110.webp' },
    { id: '21', src: '/cover-art/1771300.webp' },
    { id: '22', src: '/cover-art/2001120.webp' },
    { id: '23', src: '/cover-art/2246340.webp' },
    { id: '24', src: '/cover-art/2322010.webp' },
    { id: '25', src: '/cover-art/2531310.webp' },
    { id: '26', src: '/cover-art/2592160.webp' },
    { id: '27', src: '/cover-art/2651280.webp' },
    { id: '28', src: '/cover-art/3008130.webp' },
    { id: '29', src: '/cover-art/3241660.webp' },
    { id: '30', src: '/cover-art/1091500.webp' },
    { id: '31', src: '/cover-art/1174180.webp' },
    { id: '32', src: '/cover-art/381210.webp' },
    { id: '33', src: '/cover-art/1623730.webp' },
  ]

  const items = Array.from({ length: 2 }).flatMap((_, repeat) =>
    uniqueItems.map(item => ({ ...item, repeat })),
  )

  return (
    <div className='relative flex items-center justify-center h-[75vh] w-full mt-9 overflow-hidden rounded-3xl inner-glow'>
      <div className='pointer-events-none absolute left-0 bottom-0 w-full h-1/4 z-20' />
      <div className='absolute flex flex-col items-center justify-between w-[90%] h-[90%] z-10 pointer-events-none'>
        <p className='font-black text-[52px] leading-14 text-center'>
          <Trans i18nKey='sign_in.hero.title'>
            The Only Steam
            <br />
            Automation Tool
            <br />
            You Will Ever Need
          </Trans>
        </p>

        <p className='text-lg mt-4 text-center'>{t('sign_in.hero.subtitle')}</p>

        <Image
          src='/mock.webp'
          alt='app mockup'
          width={730}
          height={380}
          className='mt-10 -translate-x-3'
        />
      </div>

      <div className='relative w-full h-full opacity-15'>
        <div className='mx-auto h-full w-[170%] -translate-x-72 -translate-y-18 animate-skew-scroll grid grid-cols-8 gap-3'>
          {items.map((item, idx) => (
            <div
              key={`${item.id}-${item.repeat}`}
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
