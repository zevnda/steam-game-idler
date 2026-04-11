import { FaArrowLeft, FaArrowRight, FaCheck, FaDiscord } from 'react-icons/fa6'
import { FiBook } from 'react-icons/fi'
import {
  TbAd,
  TbCards,
  TbCurrencyDollar,
  TbDeviceGamepad2,
  TbGift,
  TbKey,
  TbPalette,
  TbRefresh,
  TbSparkles,
} from 'react-icons/tb'
import Link from 'next/link'

export const metadata = {
  title: 'Steam Game Idler PRO',
  description:
    'Upgrade to Steam Game Idler PRO. Remove ads, unlock exclusive themes, automate Steam credentials, free game redemption, and more. Starting at $2/month.',
  keywords: [
    'Steam Game Idler PRO',
    'Steam Game Idler subscription',
    'Steam automation PRO',
    'Steam card farming PRO',
    'Steam Game Idler upgrade',
  ],
  openGraph: {
    url: 'https://steamgameidler.com/pro',
    siteName: 'Steam Game Idler',
    title: 'Steam Game Idler PRO',
    description:
      'Upgrade to Steam Game Idler PRO. Remove ads, unlock exclusive themes, automate Steam credentials, free game redemption, and more.',
    type: 'website',
  },
  alternates: {
    canonical: '/pro',
  },
}

const allFeatures = [
  {
    icon: TbAd,
    title: 'Ad-Free Experience',
    description: 'Enjoy SGI without any advertisements for a completely clean interface.',
    tier: 'casual',
    span: 1,
  },
  {
    icon: TbPalette,
    title: 'Exclusive Themes',
    description: 'Customize SGI with 6 unique themes available only to PRO subscribers.',
    tier: 'casual',
    span: 1,
  },
  {
    icon: FaDiscord,
    title: 'Unique Discord Role',
    description: 'Stand out in our Discord community with a special @PRO role.',
    tier: 'casual',
    span: 1,
  },
  {
    icon: TbKey,
    title: 'Automated Steam Credentials',
    description: 'Instantly retrieve your Steam credentials without any manual input.',
    tier: 'gamer',
    span: 1,
  },
  {
    icon: TbRefresh,
    title: 'Automated Games List Updates',
    description: 'Your games list updates automatically every 15 minutes as you add games.',
    tier: 'gamer',
    span: 2,
  },
  {
    icon: TbGift,
    title: 'Automated Free Game Redemption',
    description: 'Automatically redeem free games on Steam the moment they become available.',
    tier: 'gamer',
    span: 2,
  },
  {
    icon: TbCurrencyDollar,
    title: 'Sell Duplicate Inventory Items',
    description: 'Instantly list all duplicate inventory items for sale with a single click.',
    tier: 'gamer',
    span: 1,
  },
]

async function fetchProData() {
  try {
    const res = await fetch('https://apibase.vercel.app/api/pro-data', {
      next: { revalidate: 3600 },
    })
    const data = await res.json()
    return data as {
      tierOne: { url: string; price: string }
      tierTwo: { url: string; price: string }
    }
  } catch {
    return {
      tierOne: { url: '', price: '2' },
      tierTwo: { url: '', price: '4' },
    }
  }
}

export default async function ProPage() {
  const priceData = await fetchProData()
  return (
    <div className='min-h-screen bg-linear-to-b from-white via-gray-50 to-white overflow-x-hidden'>
      {/* Go Back Button */}
      <Link
        prefetch={false}
        href='/'
        className='fixed top-6 left-6 z-50 inline-flex items-center px-4 py-2 bg-white/90 hover:bg-white border border-gray-200 rounded-lg text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 shadow-sm hover:shadow-md'
      >
        <FaArrowLeft className='w-4 h-4 mr-2' />
        Go Back
      </Link>

      {/* Hero */}
      <section className='py-20 md:py-28 relative overflow-hidden'>
        <div
          className='absolute inset-0 opacity-[0.35]'
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgb(139 69 193) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className='absolute inset-0 bg-linear-to-b from-white via-transparent to-white' />

        <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
          <div className='max-w-3xl mx-auto text-center'>
            <div className='inline-flex items-center px-4 py-2 bg-linear-to-r from-purple-100 to-indigo-100 border border-purple-300 rounded-full text-purple-800 text-sm font-semibold shadow mb-6'>
              <TbSparkles className='w-4 h-4 mr-2' />
              Support SGI &amp; unlock more
            </div>

            <h1 className='text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight'>
              <span className='text-gray-900'>STEAM GAME IDLER</span>
              <span className='block text-transparent bg-clip-text bg-linear-to-r from-purple-500 to-indigo-500'>
                PRO
              </span>
            </h1>

            <p className='text-base sm:text-lg text-gray-500 mb-10 leading-relaxed'>
              Core features of SGI are and always will be free. PRO just makes it{' '}
              <span className='font-semibold text-gray-700'>better</span> — less friction, more
              automation, and a few extras that are genuinely worth having.
            </p>
          </div>
        </div>
      </section>

      {/* Tier cards */}
      <section className='py-16 relative'>
        <div className='absolute inset-0 bg-linear-to-b from-slate-50 to-white' />
        <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
          <div className='max-w-5xl mx-auto'>
            <h2 className='text-3xl sm:text-4xl font-black text-gray-800 mb-4 text-center'>
              CHOOSE YOUR
              <span className='block text-transparent bg-clip-text bg-linear-to-r from-purple-500 to-indigo-500'>
                TIER
              </span>
            </h2>
            <p className='text-center text-gray-500 mb-12'>
              Unlock the benefits that matter to you.
            </p>

            <div className='grid md:grid-cols-2 gap-8'>
              {/* Casual card */}
              <div className='bg-white border-2 border-blue-200 rounded-2xl p-8 shadow-lg flex flex-col'>
                <div className='mb-6'>
                  <span className='inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide mb-3'>
                    Casual
                  </span>
                  <div className='flex items-end gap-1'>
                    <span className='text-5xl font-black text-gray-900'>
                      ${priceData.tierOne.price}
                    </span>
                    <span className='text-gray-500 mb-2'>/month</span>
                  </div>
                </div>

                <ul className='space-y-3 flex-1 mb-8'>
                  {allFeatures
                    .filter(f => f.tier === 'casual')
                    .map(f => (
                      <li key={f.title} className='flex items-start gap-3'>
                        <FaCheck className='w-4 h-4 text-emerald-500 mt-0.5 shrink-0' />
                        <div>
                          <p className='font-semibold text-gray-800 text-sm'>{f.title}</p>
                        </div>
                      </li>
                    ))}
                </ul>

                <a
                  href={priceData.tierOne.url}
                  className='w-full inline-flex items-center justify-center px-6 py-3 bg-linear-to-r from-blue-400 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity duration-200'
                >
                  Get Started
                  <FaArrowRight className='w-4 h-4 ml-2' />
                </a>
              </div>

              {/* Gamer card */}
              <div className='bg-white border-2 border-purple-400 rounded-2xl p-8 shadow-xl flex flex-col relative overflow-hidden'>
                <div className='absolute top-4 right-4'>
                  <span className='inline-block px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full uppercase tracking-wide'>
                    Most Popular
                  </span>
                </div>

                <div className='mb-6'>
                  <span className='inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full uppercase tracking-wide mb-3'>
                    Gamer
                  </span>
                  <div className='flex items-end gap-1'>
                    <span className='text-5xl font-black text-gray-900'>
                      ${priceData.tierTwo.price}
                    </span>
                    <span className='text-gray-500 mb-2'>/month</span>
                  </div>
                </div>

                <ul className='space-y-3 flex-1 mb-8'>
                  <li className='flex items-start gap-3'>
                    <TbSparkles className='w-4 h-4 text-purple-400 mt-0.5 shrink-0' />
                    <p className='font-semibold text-gray-800 text-sm italic'>
                      Everything in Casual
                    </p>
                  </li>
                  {allFeatures
                    .filter(f => f.tier === 'gamer')
                    .map(f => (
                      <li key={f.title} className='flex items-start gap-3'>
                        <FaCheck className='w-4 h-4 text-emerald-500 mt-0.5 shrink-0' />
                        <div>
                          <p className='font-semibold text-gray-800 text-sm'>{f.title}</p>
                        </div>
                      </li>
                    ))}
                </ul>

                <a
                  href={priceData.tierTwo.url}
                  className='w-full inline-flex items-center justify-center px-6 py-3 bg-linear-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity duration-200 shadow-md'
                >
                  Get Started
                  <FaArrowRight className='w-4 h-4 ml-2' />
                </a>
              </div>
            </div>

            <p className='text-xs text-center text-gray-400 mt-4'>
              Prices in USD, excluding taxes. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className='py-16 relative'>
        <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
          <div className='max-w-5xl mx-auto'>
            <h2 className='text-3xl sm:text-4xl font-black text-gray-800 mb-4 text-center'>
              EVERYTHING YOU
              <span className='block text-transparent bg-clip-text bg-linear-to-r from-purple-500 to-indigo-500'>
                GET
              </span>
            </h2>
            <p className='text-center text-gray-500 mb-12'>
              A closer look at every benefit included with PRO.
            </p>

            <div className='grid grid-cols-3 gap-4 auto-rows-fr'>
              {allFeatures.map(f => (
                <div
                  key={f.title}
                  className={[
                    'bg-white rounded-2xl p-6 shadow-sm border flex flex-col',
                    f.span === 2 ? 'col-span-2' : 'col-span-1',
                    f.tier === 'casual' ? 'border-blue-100' : 'border-purple-100',
                  ].join(' ')}
                >
                  <div className='flex items-start justify-between mb-4'>
                    <f.icon
                      className={`w-8 h-8 ${
                        f.tier === 'casual' ? 'text-blue-500' : 'text-purple-500'
                      }`}
                    />
                  </div>
                  <h3 className='font-bold text-gray-800 mb-2'>{f.title}</h3>
                  <p className='text-sm text-gray-500 leading-relaxed'>{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why support section */}
      <section className='py-16 relative'>
        <div className='absolute inset-0 bg-linear-to-br from-purple-50 to-indigo-50' />
        <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
          <div className='max-w-5xl mx-auto'>
            <h2 className='text-3xl sm:text-4xl font-black text-gray-800 mb-4 text-center'>
              WHY SUPPORT
              <span className='block text-transparent bg-clip-text bg-linear-to-r from-purple-500 to-indigo-500'>
                STEAM GAME IDLER?
              </span>
            </h2>
            <p className='text-center text-gray-500 max-w-2xl mx-auto mb-12'>
              SGI is a solo passion project built entirely in spare time. It&apos;s always been free
              and always will be — but keeping it running and improving takes real time and money.
              PRO subscribers make that possible.
            </p>

            <div className='grid sm:grid-cols-3 gap-6 mb-8'>
              <div className='bg-white border-2 border-gray-100 rounded-2xl p-6'>
                <TbDeviceGamepad2 className='w-8 h-8 text-purple-500 mb-3' />
                <h3 className='font-bold text-gray-800 mb-2'>Funds Development</h3>
                <p className='text-sm text-gray-500 leading-relaxed'>
                  Every subscription directly funds the time spent building new features, fixing
                  bugs, and keeping SGI compatible with Steam updates.
                </p>
              </div>
              <div className='bg-white border-2 border-gray-100 rounded-2xl p-6'>
                <TbCards className='w-8 h-8 text-purple-500 mb-3' />
                <h3 className='font-bold text-gray-800 mb-2'>Covers Running Costs</h3>
                <p className='text-sm text-gray-500 leading-relaxed'>
                  Hosting, APIs, infrastructure, and tooling all cost money. PRO subscriptions keep
                  those bills paid so SGI stays online and reliable.
                </p>
              </div>
              <div className='bg-white border-2 border-gray-100 rounded-2xl p-6'>
                <FaDiscord className='w-8 h-8 text-purple-500 mb-3' />
                <h3 className='font-bold text-gray-800 mb-2'>Builds the Community</h3>
                <p className='text-sm text-gray-500 leading-relaxed'>
                  PRO subscribers get a dedicated Discord role and help shape the direction of SGI
                  through direct feedback and early access to new ideas.
                </p>
              </div>
            </div>

            <div className='bg-white border-2 border-purple-100 rounded-2xl p-8 text-center'>
              <p className='text-gray-600 leading-relaxed max-w-2xl mx-auto'>
                SGI has always been free because it should be. But if you get value from it, PRO is
                the best way to say thanks — and you get genuinely useful extras in return. No
                lock-ins, no paywalls on core features. Just an honest way to support something you
                use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='py-20 relative overflow-hidden'>
        <div className='absolute inset-0 bg-linear-to-br from-purple-600 to-indigo-600' />
        <div
          className='absolute inset-0 opacity-10'
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
          <div className='text-center max-w-2xl mx-auto'>
            <h2 className='text-3xl sm:text-4xl font-black text-white mb-4'>READY TO GO PRO?</h2>
            <p className='text-white/80 text-lg mb-10'>
              Start with Casual at ${priceData.tierOne.price}/month, or jump straight to Gamer at $
              {priceData.tierTwo.price}/month. Cancel anytime.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center mb-8'>
              <a
                href={priceData.tierOne.url}
                className='inline-flex items-center justify-center px-8 py-4 bg-white text-purple-700 font-bold rounded-xl hover:bg-gray-100 transition-colors duration-200 shadow-lg'
              >
                Casual — ${priceData.tierOne.price}/mo
                <FaArrowRight className='w-4 h-4 ml-3' />
              </a>
              <a
                href={priceData.tierTwo.url}
                className='inline-flex items-center justify-center px-8 py-4 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-colors duration-200'
              >
                Gamer — ${priceData.tierTwo.price}/mo
                <FaArrowRight className='w-4 h-4 ml-3' />
              </a>
            </div>

            <Link
              prefetch={false}
              href='/docs/pro'
              className='inline-flex items-center text-white/70 hover:text-white text-sm font-medium transition-colors duration-200'
            >
              <FiBook className='w-4 h-4 mr-2' />
              Read the full PRO documentation
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
