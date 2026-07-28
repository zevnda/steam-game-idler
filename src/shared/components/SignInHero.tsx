import { Trans, useTranslation } from 'react-i18next'
import Image from 'next/image'
import { CDN_BASE_URL } from '@/shared/constants'

// Same curated AppID list as main's SignInHero.tsx - real games' cover art, not placeholder
// content, doubled below so the scroll loop has no visible seam.
const COVER_ARTS = [
  1091500, 1174180, 381210, 1623730, 1938090, 271590, 413150, 230410, 2767030, 3564740, 252490,
  1172470, 2507950, 1808500, 578080, 221100, 322170, 1030300, 1172710, 1449110, 1771300, 2001120,
  2246340, 2322010, 2531310, 2592160, 2651280, 3008130, 3241660,
].map(id => `${CDN_BASE_URL}/cover-art/${id}.webp`)

// Marketing panel that fills the right column of AuthLayout - ported from main's SignInHero.tsx.
// A continuously scrolling wall of game cover art behind a headline/subtitle/product mockup.
export const SignInHero = () => {
  const { t } = useTranslation()

  const items = Array.from({ length: 2 }).flatMap((_, repeat) =>
    COVER_ARTS.map((src, idx) => ({ src, key: `${idx}-${repeat}` })),
  )

  return (
    <div className='inner-glow relative flex h-[75vh] w-full items-center justify-center overflow-hidden rounded-3xl'>
      <div className='pointer-events-none absolute z-10 flex h-[90%] w-[90%] flex-col items-center justify-between'>
        {/* This panel is a fixed 40% of the window (AuthLayout's `w-3/5`/`flex-1` split isn't
            itself responsive), so at the window's minWidth its available width is a fraction of
            what the original fixed `text-[52px]`/730px-wide mockup assumed - both scale down here
            instead of overflowing/clipping against `overflow-hidden` above. Breakpoints are window
            width (this column is a constant 40% of it): `lg` (1024px window ~= 370px column) and
            `xl` (1280px window ~= 470px column, close to this app's `tauri.conf.json` default
            width) restore the size step by step, landing back at the original 52px/730px only
            once the window's actually wide enough for it. */}
        <p className='text-center text-[26px] font-black leading-8 lg:text-[36px] lg:leading-10 xl:text-[52px] xl:leading-14'>
          <Trans components={{ 1: <br /> }} i18nKey='auth.hero.title' />
        </p>

        <p className='mt-2 text-center text-sm lg:mt-3 lg:text-base xl:mt-4 xl:text-lg'>
          {t('auth.hero.subtitle')}
        </p>

        <Image
          alt='App screenshot'
          className='-translate-x-3 mt-4 h-auto w-full max-w-182.5 lg:mt-6 xl:mt-10'
          height={380}
          loading='eager'
          src={`${CDN_BASE_URL}/mock.webp`}
          width={730}
        />
      </div>

      <div className='relative h-full w-full opacity-15'>
        <div className='animate-skew-scroll mx-auto grid h-full w-[170%] -translate-x-72 -translate-y-18 grid-cols-8 gap-3'>
          {items.map((item, idx) => (
            <div
              key={item.key}
              className={idx % 2 === 1 ? '-translate-y-16 relative' : 'relative'}
              style={{ breakInside: 'avoid' }}
            >
              <Image
                alt=''
                className='h-full w-full rounded-lg object-cover duration-150 hover:scale-105'
                height={130}
                loading='lazy'
                src={item.src}
                width={130}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
