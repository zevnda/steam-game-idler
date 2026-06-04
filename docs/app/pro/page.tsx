import { FaArrowRight, FaCheck, FaDiscord } from 'react-icons/fa6'
import { FiBook } from 'react-icons/fi'
import {
  TbAd,
  TbCards,
  TbClock,
  TbCurrencyDollar,
  TbDeviceGamepad2,
  TbGift,
  TbKey,
  TbPalette,
  TbRefresh,
  TbSparkles,
} from 'react-icons/tb'
import Link from 'next/link'
import FooterSection from '@/app/(home)/_components/FooterSection'
import NavBar from '@/app/(home)/_components/NavBar'

export const metadata = {
  title: { absolute: 'Steam Game Idler PRO' },
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
    images: 'https://steamgameidler.com/og-image.png',
    type: 'website',
  },
  twitter: {
    title: 'Steam Game Idler PRO',
    description:
      'Upgrade to Steam Game Idler PRO. Remove ads, unlock exclusive themes, automate Steam credentials, free game redemption, and more.',
    image: 'https://steamgameidler.com/og-image.png',
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
  {
    icon: TbClock,
    title: 'Import Achievement Unlock Timings',
    description:
      'Copy the exact achievement unlock order and timing delays from any public Steam profile.',
    tier: 'gamer',
    span: 1,
  },
  {
    icon: TbCards,
    title: 'Auto Card Farming',
    description:
      'Automatically detects games with card drops remaining after every library sync and starts farming them — no manual check needed.',
    tier: 'gamer',
    span: 2,
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
    <div className='min-h-screen bg-background'>
      <NavBar />
      <div className='relative'>
        {/* Hero */}
        <section className='pt-36 pb-24 sm:pt-44 sm:pb-32 relative overflow-hidden'>
          <div
            className='absolute inset-0 pointer-events-none'
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.055) 1px, transparent 0)',
              backgroundSize: '24px 24px',
              maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)',
            }}
          />

          <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
            <div className='max-w-3xl mx-auto text-center'>
              <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium mb-8'>
                <TbSparkles className='w-4 h-4' />
                Support Steam Game Idler &amp; unlock more
              </div>

              <h1 className='text-5xl sm:text-6xl md:text-7xl font-bold leading-none tracking-tight mb-6'>
                <span className='text-text-primary'>STEAM GAME IDLER</span>
                <span
                  className='block'
                  style={{
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  PRO
                </span>
              </h1>

              <p className='text-lg text-text-muted max-w-2xl mx-auto leading-relaxed'>
                SGI&apos;s core features are free, and always will be. PRO exists purely for users
                who wish to support the ongoing development of SGI — the extra features are our way
                of saying <span className='font-semibold text-text-primary'>thank you</span> for
                your support.
              </p>
            </div>
          </div>
        </section>

        <div className='section-divider' />

        {/* Tier cards */}
        <section className='py-20 sm:py-24 relative'>
          <div className='container mx-auto px-4 sm:px-6 md:px-8'>
            <div className='max-w-5xl mx-auto'>
              <div className='text-center mb-14'>
                <h2 className='text-3xl sm:text-4xl md:text-5xl text-text-primary mb-4 leading-tight tracking-tight'>
                  Choose your <span className='gradient-text'>tier</span>
                </h2>
                <p className='text-text-muted'>Unlock the benefits that matter to you.</p>
              </div>

              <div className='grid md:grid-cols-2 gap-6'>
                {/* Casual card */}
                <div
                  className='card flex flex-col p-8'
                  style={{ borderColor: 'rgba(59,130,246,0.25)' }}
                >
                  <div className='mb-6'>
                    <span className='inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wide border border-blue-500/20 mb-4'>
                      Casual
                    </span>
                    <div className='flex items-end gap-1'>
                      <span className='text-5xl font-bold text-text-primary'>
                        ${priceData.tierOne.price}
                      </span>
                      <span className='text-text-muted mb-2'>/month</span>
                    </div>
                  </div>

                  <ul className='space-y-3 flex-1 mb-8'>
                    {allFeatures
                      .filter(f => f.tier === 'casual')
                      .map(f => (
                        <li key={f.title} className='flex items-start gap-3'>
                          <FaCheck className='w-4 h-4 text-emerald-400 mt-0.5 shrink-0' />
                          <p className='font-medium text-text-primary text-sm'>{f.title}</p>
                        </li>
                      ))}
                  </ul>

                  <a
                    href={priceData.tierOne.url}
                    className='btn-primary w-full justify-center py-3'
                  >
                    Get Started
                    <FaArrowRight className='w-4 h-4' />
                  </a>
                </div>

                {/* Gamer card */}
                <div
                  className='card flex flex-col p-8 relative overflow-hidden'
                  style={{ borderColor: 'rgba(168,85,247,0.35)' }}
                >
                  <div className='absolute top-4 right-4'>
                    <span className='inline-block px-3 py-1 bg-purple-500/15 text-purple-300 text-xs font-bold rounded-full uppercase tracking-wide border border-purple-500/25'>
                      Most Popular
                    </span>
                  </div>

                  <div className='mb-6'>
                    <span className='inline-block px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-full uppercase tracking-wide border border-purple-500/20 mb-4'>
                      Gamer
                    </span>
                    <div className='flex items-end gap-1'>
                      <span className='text-5xl font-bold text-text-primary'>
                        ${priceData.tierTwo.price}
                      </span>
                      <span className='text-text-muted mb-2'>/month</span>
                    </div>
                  </div>

                  <ul className='space-y-3 flex-1 mb-8'>
                    <li className='flex items-start gap-3'>
                      <TbSparkles className='w-4 h-4 text-purple-400 mt-0.5 shrink-0' />
                      <p className='font-medium text-text-muted text-sm italic'>
                        Everything in Casual
                      </p>
                    </li>
                    {allFeatures
                      .filter(f => f.tier === 'gamer')
                      .map(f => (
                        <li key={f.title} className='flex items-start gap-3'>
                          <FaCheck className='w-4 h-4 text-emerald-400 mt-0.5 shrink-0' />
                          <p className='font-medium text-text-primary text-sm'>{f.title}</p>
                        </li>
                      ))}
                  </ul>

                  <a
                    href={priceData.tierTwo.url}
                    className='w-full inline-flex items-center justify-center gap-2 py-3 rounded-md font-semibold text-sm text-white transition-opacity duration-150 hover:opacity-80'
                    style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
                  >
                    Get Started
                    <FaArrowRight className='w-4 h-4' />
                  </a>
                </div>
              </div>

              <p className='text-xs text-center text-text-muted mt-4'>
                Prices in USD, excluding taxes. Cancel anytime.
              </p>
            </div>
          </div>
        </section>

        <div className='section-divider' />

        {/* Features section */}
        <section className='py-20 sm:py-24 relative'>
          <div className='container mx-auto px-4 sm:px-6 md:px-8'>
            <div className='max-w-5xl mx-auto'>
              <div className='text-center mb-14'>
                <h2 className='text-3xl sm:text-4xl md:text-5xl text-text-primary mb-4 leading-tight tracking-tight'>
                  Everything you <span className='gradient-text'>get</span>
                </h2>
                <p className='text-text-muted'>A closer look at every benefit included with PRO.</p>
              </div>

              <div className='grid grid-cols-3 gap-4 auto-rows-fr'>
                {allFeatures.map(f => (
                  <div
                    key={f.title}
                    className={[
                      'card flex flex-col p-6',
                      f.span === 2 ? 'col-span-2' : 'col-span-1',
                    ].join(' ')}
                    style={{
                      borderColor:
                        f.tier === 'casual' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)',
                    }}
                  >
                    <f.icon
                      className={`w-7 h-7 mb-4 ${f.tier === 'casual' ? 'text-blue-400' : 'text-purple-400'}`}
                    />
                    <h3 className='font-semibold text-text-primary mb-2'>{f.title}</h3>
                    <p className='text-sm text-text-muted leading-relaxed'>{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className='section-divider' />

        {/* Why support section */}
        <section className='py-20 sm:py-24 relative'>
          <div className='container mx-auto px-4 sm:px-6 md:px-8'>
            <div className='max-w-5xl mx-auto'>
              <div className='text-center mb-14'>
                <h2 className='text-3xl sm:text-4xl md:text-5xl text-text-primary mb-4 leading-tight tracking-tight'>
                  Why support <span className='gradient-text'>Steam Game Idler?</span>
                </h2>
                <p className='text-text-muted max-w-2xl mx-auto'>
                  SGI is a solo passion project built entirely in spare time. It&apos;s always been
                  free and always will be, but keeping it running and improving takes real time and
                  money. PRO subscribers make that possible.
                </p>
              </div>

              <div className='grid sm:grid-cols-3 gap-4 mb-6'>
                <div className='card p-6'>
                  <TbDeviceGamepad2 className='w-7 h-7 text-purple-400 mb-4' />
                  <h3 className='font-semibold text-text-primary mb-2'>Funds Development</h3>
                  <p className='text-sm text-text-muted leading-relaxed'>
                    Every subscription directly funds the time spent building new features, fixing
                    bugs, and keeping SGI compatible with Steam updates.
                  </p>
                </div>
                <div className='card p-6'>
                  <TbCards className='w-7 h-7 text-purple-400 mb-4' />
                  <h3 className='font-semibold text-text-primary mb-2'>Covers Running Costs</h3>
                  <p className='text-sm text-text-muted leading-relaxed'>
                    Hosting, APIs, infrastructure, and tooling all cost money. PRO subscriptions
                    keep those bills paid so SGI stays online and reliable.
                  </p>
                </div>
                <div className='card p-6'>
                  <FaDiscord className='w-7 h-7 text-purple-400 mb-4' />
                  <h3 className='font-semibold text-text-primary mb-2'>Builds the Community</h3>
                  <p className='text-sm text-text-muted leading-relaxed'>
                    PRO subscribers get a dedicated Discord role and help shape the direction of SGI
                    through direct feedback and early access to new ideas.
                  </p>
                </div>
              </div>

              <div className='card p-8 text-center' style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
                <p className='text-text-muted leading-relaxed max-w-2xl mx-auto'>
                  SGI has always been free because it should be. But if you get value from it, PRO
                  is the best way to say thanks, and you get genuinely useful extras in return. No
                  lock-ins, no paywalls on core features. Just an honest way to support something
                  you use.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className='section-divider' />

        {/* CTA */}
        <section className='py-24 sm:py-32 relative'>
          <div className='container mx-auto relative z-10 px-4 sm:px-6 md:px-8'>
            <div className='text-center max-w-2xl mx-auto'>
              <h2 className='text-4xl sm:text-5xl md:text-6xl text-text-primary mb-6 leading-tight tracking-tight'>
                Ready to go <span className='gradient-text'>PRO?</span>
              </h2>
              <p className='text-text-muted text-lg mb-10'>
                Start with Casual at ${priceData.tierOne.price}/month, or jump straight to Gamer at
                ${priceData.tierTwo.price}/month. Cancel anytime.
              </p>

              <div className='flex flex-col sm:flex-row gap-4 justify-center mb-10'>
                <a href={priceData.tierOne.url} className='btn-primary px-8 py-3.5 text-base'>
                  Casual — ${priceData.tierOne.price}/mo
                  <FaArrowRight className='w-4 h-4' />
                </a>
                <a
                  href={priceData.tierTwo.url}
                  className='btn-primary px-8 py-3.5 text-base'
                  style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
                >
                  Gamer — ${priceData.tierTwo.price}/mo
                  <FaArrowRight className='w-4 h-4' />
                </a>
              </div>

              <Link
                prefetch={false}
                href='/docs/pro'
                className='inline-flex items-center gap-2 text-text-muted hover:text-text-primary text-sm font-medium transition-colors duration-150'
              >
                <FiBook className='w-4 h-4' />
                Read the full PRO documentation
              </Link>
            </div>
          </div>
        </section>

        <div className='section-divider' />

        <FooterSection />
      </div>
    </div>
  )
}
