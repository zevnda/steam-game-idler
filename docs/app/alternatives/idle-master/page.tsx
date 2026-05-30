import { FaArrowRight } from 'react-icons/fa'
import { FiBook, FiCheck, FiDownload, FiRefreshCw, FiX } from 'react-icons/fi'
import { TbCards, TbEye, TbShield } from 'react-icons/tb'
import FooterSection from '@docs/components/home/FooterSection'
import NavBar from '@docs/components/home/NavBar'
import Link from 'next/link'

export const metadata = {
  title: 'Idle Master Feature Comparison',
  description:
    'See why Steam Game Idler is the best alternative to Idle Master for Steam automation. Compare features like card farming, achievement management, and user experience',
  keywords: [
    'Idle Master alternative',
    'Idle Master comparison',
    'Idle Master features',
    'Steam Game Idler features',
    'Steam Game Idler',
    'Steam Idler',
    'Steam Card Idler',
    'Steam Automation',
    'Steam Trading Cards',
  ],
  openGraph: {
    url: 'https://steamgameidler.com/alternatives/idle-master',
    siteName: 'Steam Game Idler',
    title: 'Idle Master Feature Comparison | Steam Game Idler',
    description:
      'See why Steam Game Idler is the best alternative to Idle Master for Steam automation. Compare features like card farming, achievement management, and user experience',
    images: 'https://steamgameidler.com/im-og-image.png',
    type: 'article',
  },
  twitter: {
    title: 'Idle Master Feature Comparison | Steam Game Idler',
    description:
      'See why Steam Game Idler is the best alternative to Idle Master for Steam automation. Compare features like card farming, achievement management, and user experience',
    image: 'https://steamgameidler.com/im-og-image.png',
  },
  alternates: {
    canonical: '/alternatives/idle-master',
  },
}

const comparisonData = [
  {
    category: 'Core Features',
    features: [
      { name: 'Automated Card Farming', steamGameIdler: true, alt: true },
      { name: 'Queue-based Farming', steamGameIdler: true, alt: true },
      { name: 'Custom Queue Order', steamGameIdler: true, alt: false },
      { name: 'Simultaneous Game Farming', steamGameIdler: true, alt: false },
      { name: 'Achievement Management', steamGameIdler: true, alt: false },
      { name: 'Inventory Manager', steamGameIdler: true, alt: false },
      { name: 'Marketplace Integration', steamGameIdler: true, alt: false },
      { name: 'Playtime Boosting', steamGameIdler: true, alt: false },
    ],
  },
  {
    category: 'Technical',
    features: [
      { name: 'Graphical User Interface', steamGameIdler: 'Native', alt: 'Native' },
      { name: 'Setup Complexity', steamGameIdler: 'Simple', alt: 'Simple' },
      {
        name: 'Multi-language Support',
        steamGameIdler: 'Partial Translations',
        alt: '24 Languages',
      },
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
  'headline': 'Idle Master Feature Comparison | Steam Game Idler',
  'description':
    'See why Steam Game Idler is the best alternative to Idle Master for Steam automation. Compare features like card farming, achievement management, and user experience',
  'url': 'https://steamgameidler.com/alternatives/idle-master',
  'image': 'https://steamgameidler.com/im-og-image.png',
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
              <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-sm font-medium mb-8'>
                <TbCards className='w-4 h-4' />
                Detailed Comparison
              </div>

              <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold leading-none tracking-tight mb-6'>
                <span className='text-text-primary'>IDLE MASTER</span>
                <span className='block text-text-muted'>VS</span>
                <span
                  className='block'
                  style={{
                    background: 'linear-gradient(135deg, #fb923c, #f87171)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  STEAM GAME IDLER
                </span>
              </h1>

              <p className='text-lg text-text-muted max-w-2xl mx-auto leading-relaxed'>
                Compare core features, usability, and capabilities of Steam Game Idler against Idle
                Master to make an informed choice for your Steam automation needs.
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
                              className='text-center py-3 px-6 text-xs font-semibold text-orange-400 uppercase tracking-wider'
                              style={{ background: 'rgba(255,255,255,0.03)' }}
                            >
                              Steam Game Idler
                            </th>
                            <th
                              className='text-center py-3 px-6 text-xs font-semibold text-text-muted uppercase tracking-wider'
                              style={{ background: 'rgba(255,255,255,0.03)' }}
                            >
                              Idle Master
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
                  <FiRefreshCw className='w-7 h-7 text-orange-400 mx-auto mb-4' />
                  <h3 className='font-semibold text-text-primary mb-2'>Active Development</h3>
                  <p className='text-sm text-text-muted leading-relaxed'>
                    Regular updates and new features versus Idle Master&apos;s abandoned status
                  </p>
                </div>
                <div className='card p-6 text-center'>
                  <TbEye className='w-7 h-7 text-orange-400 mx-auto mb-4' />
                  <h3 className='font-semibold text-text-primary mb-2'>Modern Interface</h3>
                  <p className='text-sm text-text-muted leading-relaxed'>
                    Beautiful, intuitive design with real-time progress tracking
                  </p>
                </div>
                <div className='card p-6 text-center'>
                  <TbShield className='w-7 h-7 text-orange-400 mx-auto mb-4' />
                  <h3 className='font-semibold text-text-primary mb-2'>Enhanced Security</h3>
                  <p className='text-sm text-text-muted leading-relaxed'>
                    Modern safety features and VAC detection avoidance
                  </p>
                </div>
              </div>

              <div className='card p-8 text-center'>
                <p className='text-text-muted leading-relaxed max-w-2xl mx-auto'>
                  While Idle Master was revolutionary in its time, Steam Game Idler represents the
                  modern evolution of card farming tools with comprehensive features, active
                  development, and enhanced security.
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
                Ready to upgrade from <span className='gradient-text'>Idle Master?</span>
              </h2>
              <p className='text-text-muted text-lg mb-10'>
                Experience the next generation of Steam card farming. Download Steam Game Idler and
                discover what modern automation can do.
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
