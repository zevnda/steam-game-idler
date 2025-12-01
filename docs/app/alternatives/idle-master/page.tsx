import type { ReactElement } from 'react'

import Link from 'next/link'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import { FiBook, FiCheck, FiDownload, FiRefreshCw, FiX } from 'react-icons/fi'
import { TbCards, TbEye, TbShield } from 'react-icons/tb'

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
      { name: 'Trading Card Manager', steamGameIdler: true, alt: false },
      { name: 'Marketplace Integration', steamGameIdler: true, alt: false },
      { name: 'Playtime Boosting', steamGameIdler: true, alt: false },
    ],
  },
  {
    category: 'Technical',
    features: [
      { name: 'Graphical User Interface', steamGameIdler: 'Native', alt: 'Native' },
      { name: 'Setup Complexity', steamGameIdler: 'Simple', alt: 'Simple' },
      { name: 'Multi-language Support', steamGameIdler: '30 Languages', alt: '24 Languages' },
      { name: 'Resource Usage', steamGameIdler: 'Moderate', alt: 'Low' },
      { name: 'Platform Support', steamGameIdler: 'Windows', alt: 'Windows' },
      { name: 'Installation', steamGameIdler: 'Installer & Portable', alt: 'Portable' },
      { name: 'Updates', steamGameIdler: 'Automatic', alt: 'Manual' },
    ],
  },
]

function ComparisonIcon({ value }: { value: boolean | string }): ReactElement | null {
  if (typeof value === 'boolean') {
    return (
      <div className='flex justify-center'>
        {value ? <FiCheck className='w-5 h-5 text-emerald-600' /> : <FiX className='w-5 h-5 text-red-500' />}
      </div>
    )
  }
  return <span className='text-sm font-medium text-gray-700'>{value}</span>
}

export default function page(): ReactElement {
  return (
    <div className='min-h-screen bg-linear-to-b from-white via-gray-50 to-white'>
      {/* Hero Section */}
      <section className='py-16 sm:py-20 md:py-24 relative overflow-hidden'>
        {/* Go Back Button */}
        <Link
          prefetch={false}
          href='/'
          className='fixed top-6 left-6 z-50 inline-flex items-center px-4 py-2 bg-white/90 hover:bg-white border border-gray-200 rounded-lg text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 shadow-sm hover:shadow-md'
        >
          <FaArrowLeft className='w-4 h-4 mr-2' />
          Go Back
        </Link>

        <div
          className='absolute inset-0 opacity-[0.4]'
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(139 69 193) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className='absolute inset-0 bg-linear-to-b from-white via-transparent to-white' />

        <div className='container relative z-10 px-4 mt-10! md:mt-0! sm:px-6 md:px-8'>
          <div className='max-w-4xl mx-auto text-center'>
            <div className='inline-flex items-center px-4 py-2 bg-linear-to-r from-orange-200 to-red-200 border border-orange-300 rounded-full text-orange-800 text-sm font-medium shadow-lg mb-6'>
              <TbCards className='w-4 h-4 mr-2' />
              Detailed Comparison
            </div>

            <h1 className='text-3xl sm:text-4xl md:text-5xl font-black text-gray-800 mb-6 leading-tight'>
              IDLE MASTER
              <span className='block'>VS</span>
              <span className='block text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-red-500'>
                STEAM GAME IDLER
              </span>
            </h1>

            <p className='text-lg sm:text-xl text-gray-700 mb-8 leading-relaxed'>
              Compare core features, usability, and capabilities of Steam Game Idler against Idle Master to make an
              informed choice for your Steam automation needs.
            </p>
          </div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className='py-16 relative'>
        <div className='container px-4 sm:px-6 md:px-8'>
          <div className='max-w-6xl mx-auto'>
            <h2 className='text-3xl sm:text-4xl font-black text-gray-800 mb-12 text-center'>
              DETAILED FEATURE
              <span className='block text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-red-500'>
                COMPARISON
              </span>
            </h2>

            <div className='space-y-8'>
              {comparisonData.map(section => (
                <div
                  key={section.category}
                  className='bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg'
                >
                  <div className='bg-linear-to-r from-orange-500 to-red-500 px-6 py-4'>
                    <h3 className='text-xl font-bold text-white'>{section.category}</h3>
                  </div>

                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead>
                        <tr className='bg-gray-50'>
                          <th className='text-left py-4 px-6 font-semibold text-gray-800 text-base'>Feature</th>
                          <th className='text-center py-4 px-6 font-semibold text-orange-600 text-base'>
                            Steam Game Idler
                          </th>
                          <th className='text-center py-4 px-6 font-semibold text-gray-600 text-base'>Idle Master</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.features.map((feature, index) => (
                          <tr key={feature.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className='py-4 px-6 font-medium text-gray-800'>{feature.name}</td>
                            <td className='py-4 px-6 text-center'>
                              <ComparisonIcon value={feature.steamGameIdler} />
                            </td>
                            <td className='py-4 px-6 text-center'>
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

      {/* Why Choose Steam Game Idler */}
      <section className='py-16 relative'>
        <div className='absolute inset-0 bg-linear-to-br from-orange-50 to-red-50' />
        <div className='container relative z-10 px-4 sm:px-6 md:px-8'>
          <div className='max-w-4xl mx-auto text-center'>
            <h2 className='text-3xl sm:text-4xl font-black text-gray-800 mb-8'>
              WHY CHOOSE
              <span className='block text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-red-500'>
                STEAM GAME IDLER?
              </span>
            </h2>

            <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12'>
              <div className='bg-white border-2 border-orange-200 rounded-xl p-6 text-center'>
                <FiRefreshCw className='w-8 h-8 text-orange-600 mx-auto mb-4' />
                <h3 className='text-lg font-bold text-gray-800 mb-2'>Active Development</h3>
                <p className='text-sm text-gray-600'>
                  Regular updates and new features versus Idle Master&apos;s abandoned status
                </p>
              </div>

              <div className='bg-white border-2 border-orange-200 rounded-xl p-6 text-center'>
                <TbEye className='w-8 h-8 text-orange-600 mx-auto mb-4' />
                <h3 className='text-lg font-bold text-gray-800 mb-2'>Modern Interface</h3>
                <p className='text-sm text-gray-600'>Beautiful, intuitive design with real-time progress tracking</p>
              </div>

              <div className='bg-white border-2 border-orange-200 rounded-xl p-6 text-center sm:col-span-2 lg:col-span-1'>
                <TbShield className='w-8 h-8 text-orange-600 mx-auto mb-4' />
                <h3 className='text-lg font-bold text-gray-800 mb-2'>Enhanced Security</h3>
                <p className='text-sm text-gray-600'>Modern safety features and VAC detection avoidance</p>
              </div>
            </div>

            <p className='text-lg text-gray-700 mb-8'>
              While Idle Master was revolutionary in its time, Steam Game Idler represents the modern evolution of card
              farming tools with comprehensive features, active development, and enhanced security.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-16 relative overflow-hidden'>
        <div className='absolute inset-0 bg-linear-to-br from-orange-600 to-red-600' />

        <div className='container relative z-10 px-4 sm:px-6 md:px-8'>
          <div className='text-center max-w-3xl mx-auto'>
            <h2 className='text-3xl sm:text-4xl font-black text-white mb-6'>
              READY TO UPGRADE FROM
              <span className='block text-transparent bg-clip-text bg-linear-to-r from-cyan-200 to-blue-200'>
                IDLE MASTER?
              </span>
            </h2>

            <p className='text-lg text-white/90 mb-8'>
              Experience the next generation of Steam card farming. Download Steam Game Idler and discover what modern
              automation can do.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                prefetch={false}
                href='https://github.com/zevnda/steam-game-idler/releases/latest'
                className='inline-flex items-center justify-center px-8 py-4 bg-white text-orange-700 font-bold rounded-xl hover:bg-gray-100 transition-colors duration-200 shadow-lg'
              >
                <FiDownload className='w-5 h-5 mr-3' />
                DOWNLOAD NOW
                <FaArrowRight className='w-4 h-4 ml-3' />
              </Link>

              <Link
                prefetch={false}
                href='/docs'
                className='inline-flex items-center justify-center px-8 py-4 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-colors duration-200'
              >
                <FiBook className='w-5 h-5 mr-3' />
                VIEW DOCUMENTATION
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
