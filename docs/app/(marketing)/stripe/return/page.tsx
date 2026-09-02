import { FaArrowRight } from 'react-icons/fa6'
import { FiBook } from 'react-icons/fi'
import Link from 'next/link'
import FooterSection from '@/app/(marketing)/(home)/_components/FooterSection'
import NavBar from '@/app/(marketing)/(home)/_components/NavBar'

export const metadata = {
  title: 'Subscription Created | Steam Game Idler',
  robots: { index: false, follow: false },
  alternates: { canonical: '/stripe/return' },
}

export default function StripeReturnPage() {
  return (
    <div className='min-h-screen bg-background'>
      <NavBar />

      <section className='relative py-32 sm:py-62 overflow-hidden'>
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
          <div className='max-w-xl mx-auto text-center'>
            <h1 className='text-4xl sm:text-5xl font-bold leading-none tracking-tight mb-5'>
              <span className='text-text-primary'>Thank you for supporting </span>
              <span className='gradient-text'>Steam Game Idler</span>
            </h1>

            <p className='leading-relaxed my-4 font-bold text-2xl text-green-400'>
              Check your email for your license key.
            </p>

            <p className='text-text-muted leading-relaxed mb-10'>
              If you do not see it, check your spam folder. Still stuck? Contact us at{' '}
              <a
                href='mailto:contact@steamgameidler.com'
                target='_blank'
                className='text-blue-500 hover:underline'
              >
                contact@steamgameidler.com
              </a>
              .
            </p>

            <div className='flex flex-col sm:flex-row gap-3 justify-center mb-10'>
              <Link prefetch={false} href='/docs/pro' className='btn-download px-6 py-3'>
                <FiBook className='w-4 h-4' />
                Read the PRO documentation
                <FaArrowRight className='w-3.5 h-3.5' />
              </Link>
              <Link prefetch={false} href='/' className='btn-ghost px-6 py-3'>
                Back to homepage
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className='section-divider' />
      <FooterSection />
    </div>
  )
}
