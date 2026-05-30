import { FaArrowRight } from 'react-icons/fa'
import { FiBook, FiCheck, FiDownload, FiX } from 'react-icons/fi'
import { TbAward, TbCards, TbTrendingUp } from 'react-icons/tb'
import FooterSection from '@docs/components/home/FooterSection'
import NavBar from '@docs/components/home/NavBar'
import Link from 'next/link'

export const metadata = {
  title: 'Steam Achievement Manager Feature Comparison',
  description:
    'See why Steam Game Idler is the best alternative to Steam Achievement Manager for Steam automation. Compare features like card farming, achievement management, and user experience',
  keywords: [
    'Steam Achievement Manager alternative',
    'Steam Achievement Manager comparison',
    'Steam Achievement Manager features',
    'Steam Game Idler features',
    'Steam Game Idler',
    'Steam Idler',
    'Steam Card Idler',
    'Steam Automation',
    'Steam Trading Cards',
  ],
  openGraph: {
    url: 'https://steamgameidler.com/alternatives/steam-achievement-manager',
    siteName: 'Steam Game Idler',
    title: 'Steam Achievement Manager Feature Comparison | Steam Game Idler',
    description:
      'See why Steam Game Idler is the best alternative to Steam Achievement Manager for Steam automation. Compare features like card farming, achievement management, and user experience',
    images: 'https://steamgameidler.com/sam-og-image.png',
    type: 'article',
  },
  twitter: {
    title: 'Steam Achievement Manager Feature Comparison | Steam Game Idler',
    description:
      'See why Steam Game Idler is the best alternative to Steam Achievement Manager for Steam automation. Compare features like card farming, achievement management, and user experience',
    image: 'https://steamgameidler.com/sam-og-image.png',
  },
  alternates: {
    canonical: '/alternatives/steam-achievement-manager',
  },
}

const comparisonData = [
  {
    category: 'Core Features',
    features: [
      { name: 'Achievement Management', steamGameIdler: true, alt: true },
      { name: 'Automated Achievement Unlocker', steamGameIdler: true, alt: false },
      { name: 'Unlock/Lock Single Achievements', steamGameIdler: true, alt: true },
      { name: 'Unlock/Lock All Achievements', steamGameIdler: true, alt: true },
      { name: 'Statistics Editor', steamGameIdler: true, alt: true },
      { name: 'Queue-based Unlocking', steamGameIdler: true, alt: false },
      { name: 'Custom Queue Order', steamGameIdler: true, alt: false },
      { name: 'Automated Card Farming', steamGameIdler: true, alt: false },
      { name: 'Inventory Manager', steamGameIdler: true, alt: false },
      { name: 'Playtime Boosting', steamGameIdler: true, alt: false },
      { name: 'Game Cover Art', steamGameIdler: true, alt: true },
    ],
  },
  {
    category: 'Technical',
    features: [
      { name: 'Graphical User Interface', steamGameIdler: 'Native', alt: 'Native' },
      { name: 'Setup Complexity', steamGameIdler: 'Simple', alt: 'Simple' },
      { name: 'Multi-language Support', steamGameIdler: 'Partial Translations', alt: false },
      { name: 'Resource Usage', steamGameIdler: 'Moderate', alt: 'Low' },
      { name: 'Platform Support', steamGameIdler: 'Windows', alt: 'Windows' },
      { name: 'Installation', steamGameIdler: 'Installer & Portable', alt: 'Portable' },
      { name: 'Updates', steamGameIdler: 'Automatic', alt: 'Manual' },
    ],
  },
]

function ComparisonIcon({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return (
      <div className='flex justify-center'>
        {value ? (
          <FiCheck className='w-5 h-5 text-emerald-400' />
        ) : (
          <FiX className='w-5 h-5 text-red-400' />
        )}
      </div>
    )
  }
  return <span className='text-sm font-medium text-text-muted'>{value}</span>
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  'headline': 'Steam Achievement Manager Feature Comparison | Steam Game Idler',
  'description':
    'See why Steam Game Idler is the best alternative to Steam Achievement Manager for Steam automation. Compare features like card farming, achievement management, and user experience',
  'url': 'https://steamgameidler.com/alternatives/steam-achievement-manager',
  'image': 'https://steamgameidler.com/sam-og-image.png',
  'author': { '@type': 'Person', 'name': 'zevnda', 'url': 'https://github.com/zevnda' },
  'publisher': {
    '@type': 'Organization',
    'name': 'Steam Game Idler',
    'url': 'https://steamgameidler.com',
  },
}

export default function page() {
  return (
    <div className='min-h-screen bg-background'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
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
            <div className='max-w-4xl mx-auto text-center'>
              <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm font-medium mb-8'>
                <TbAward className='w-4 h-4' />
                Detailed Comparison
              </div>

              <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold leading-none tracking-tight mb-6'>
                <span className='text-text-primary'>STEAM ACHIEVEMENT MANAGER</span>
                <span className='block text-text-muted'>VS</span>
                <span
                  className='block'
                  style={{
                    background: 'linear-gradient(135deg, #34d399, #10b981)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  STEAM GAME IDLER
                </span>
              </h1>

              <p className='text-lg text-text-muted max-w-2xl mx-auto leading-relaxed'>
                Compare core features, usability, and capabilities of Steam Game Idler against Steam
                Achievement Manager to make an informed choice for your Steam automation needs.
              </p>
            </div>
          </div>
        </section>

        <div className='section-divider' />

        {/* Comparison Table */}
        <section className='py-20 sm:py-24 relative'>
          <div className='container mx-auto px-4 sm:px-6 md:px-8'>
            <div className='max-w-5xl mx-auto'>
              <div className='text-center mb-14'>
                <h2 className='text-3xl sm:text-4xl md:text-5xl text-text-primary mb-4 leading-tight tracking-tight'>
                  Detailed feature <span className='gradient-text'>comparison</span>
                </h2>
              </div>

              <div className='space-y-6'>
                {comparisonData.map(section => (
                  <div key={section.category} className='card overflow-hidden'>
                    <div
                      className='px-6 py-4'
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <h3 className='text-base font-semibold text-text-primary'>
                        {section.category}
                      </h3>
                    </div>

                    <div className='overflow-x-auto'>
                      <table className='w-full'>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <th
                              className='text-left py-3 px-6 text-xs font-semibold text-text-muted uppercase tracking-wider'
                              style={{ background: 'rgba(255,255,255,0.03)' }}
                            >
                              Feature
                            </th>
                            <th
                              className='text-center py-3 px-6 text-xs font-semibold text-emerald-400 uppercase tracking-wider'
                              style={{ background: 'rgba(255,255,255,0.03)' }}
                            >
                              Steam Game Idler
                            </th>
                            <th
                              className='text-center py-3 px-6 text-xs font-semibold text-text-muted uppercase tracking-wider'
                              style={{ background: 'rgba(255,255,255,0.03)' }}
                            >
                              Steam Achievement Manager
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.features.map((feature, index) => (
                            <tr
                              key={feature.name}
                              style={{
                                background:
                                  index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                                borderBottom:
                                  index < section.features.length - 1
                                    ? '1px solid var(--color-border)'
                                    : 'none',
                              }}
                            >
                              <td className='py-3.5 px-6 text-sm font-medium text-text-primary'>
                                {feature.name}
                              </td>
                              <td className='py-3.5 px-6 text-center'>
                                <ComparisonIcon value={feature.steamGameIdler} />
                              </td>
                              <td className='py-3.5 px-6 text-center'>
                                <ComparisonIcon value={feature.alt} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className='section-divider' />

        {/* Narrative */}
        <section className='py-20 sm:py-24 relative'>
          <div className='container mx-auto px-4 sm:px-6 md:px-8'>
            <div className='max-w-3xl mx-auto text-center'>
              <h2 className='text-2xl sm:text-3xl font-bold text-text-primary mb-6 leading-tight tracking-tight'>
                How does Steam Game Idler compare to Steam Achievement Manager?
              </h2>
              <p className='text-text-muted leading-relaxed mb-4'>
                Steam Achievement Manager lets you manually unlock and lock achievements for any
                game you own, you select them and apply the change instantly. It&apos;s a useful
                tool for that specific task, but the approach is entirely manual and the scope stops
                at achievements.
              </p>
              <p className='text-text-muted leading-relaxed mb-4'>
                Steam Game Idler includes a manual achievement manager that works the same way, but
                also adds an automated achievement unlocker, a separate mode that works through your
                achievement list on its own, unlocking them gradually over time. By default it
                follows the order of global unlock percentage, so common achievements unlock first
                and rarer ones come later, the same pattern you&apos;d see from natural play. You
                can also set a custom unlock order, configure per-achievement delays, and add an
                initial wait period before the first unlock — giving you full control over how the
                progression looks.
              </p>
              <p className='text-text-muted leading-relaxed'>
                On top of that, card farming, inventory selling, and playtime boosting are all built
                in, so Steam Game Idler covers the whole picture rather than just one part of it.
              </p>
            </div>
          </div>
        </section>

        <div className='section-divider' />

        {/* Why Choose SGI */}
        <section className='py-20 sm:py-24 relative'>
          <div className='container mx-auto px-4 sm:px-6 md:px-8'>
            <div className='max-w-5xl mx-auto'>
              <div className='text-center mb-14'>
                <h2 className='text-3xl sm:text-4xl md:text-5xl text-text-primary mb-4 leading-tight tracking-tight'>
                  Why choose <span className='gradient-text'>Steam Game Idler?</span>
                </h2>
              </div>

              <div className='grid sm:grid-cols-3 gap-4 mb-8'>
                <div className='card p-6 text-center'>
                  <TbAward className='w-7 h-7 text-emerald-400 mx-auto mb-4' />
                  <h3 className='font-semibold text-text-primary mb-2'>Automated Unlocker</h3>
                  <p className='text-sm text-text-muted leading-relaxed'>
                    Automatically unlocks achievements over time with configurable delays — dripping
                    them in the order real players earn them to mimic natural progression
                  </p>
                </div>
                <div className='card p-6 text-center'>
                  <TbCards className='w-7 h-7 text-emerald-400 mx-auto mb-4' />
                  <h3 className='font-semibold text-text-primary mb-2'>All-in-One</h3>
                  <p className='text-sm text-text-muted leading-relaxed'>
                    Card farming, inventory selling, and playtime boosting alongside full
                    achievement management — no need to run separate tools
                  </p>
                </div>
                <div className='card p-6 text-center'>
                  <TbTrendingUp className='w-7 h-7 text-emerald-400 mx-auto mb-4' />
                  <h3 className='font-semibold text-text-primary mb-2'>Custom Control</h3>
                  <p className='text-sm text-text-muted leading-relaxed'>
                    Set a custom unlock order, per-achievement delays, and an initial wait period —
                    or let the default mode handle everything automatically
                  </p>
                </div>
              </div>

              <div className='card p-8 text-center'>
                <p className='text-text-muted leading-relaxed max-w-2xl mx-auto'>
                  Steam Achievement Manager handles achievements manually. Steam Game Idler does the
                  same — and automates it, with timing you control and card farming built in.
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
                Ready to upgrade from{' '}
                <span className='gradient-text'>Steam Achievement Manager?</span>
              </h2>
              <p className='text-text-muted text-lg mb-10'>
                Experience the next generation of Steam automation. Download Steam Game Idler and
                discover what modern achievement management can do.
              </p>

              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <Link
                  prefetch={false}
                  href='https://github.com/zevnda/steam-game-idler/releases/latest'
                  className='btn-download'
                >
                  <FiDownload className='w-4 h-4' />
                  Download Now
                  <FaArrowRight className='w-4 h-4' />
                </Link>
                <Link prefetch={false} href='/docs' className='btn-ghost px-8 py-3.5'>
                  <FiBook className='w-4 h-4' />
                  Documentation
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className='section-divider' />

        <FooterSection />
      </div>
    </div>
  )
}
