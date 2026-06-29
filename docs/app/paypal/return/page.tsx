import { FaArrowRight, FaCheck } from 'react-icons/fa6'
import { FiBook } from 'react-icons/fi'
import Link from 'next/link'
import FooterSection from '@/app/(home)/_components/FooterSection'
import NavBar from '@/app/(home)/_components/NavBar'

export const metadata = {
  title: 'Subscription Created | Steam Game Idler',
  robots: { index: false, follow: false },
  alternates: { canonical: '/paypal/return' },
}

export default function PayPalReturnPage() {
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
            <div
              className='w-16 h-16 rounded-full mx-auto mb-8 flex items-center justify-center'
              style={{
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                boxShadow: '0 0 32px 4px rgba(147,51,234,0.35)',
              }}
            >
              <FaCheck className='w-6 h-6 text-white' />
            </div>

            <h1 className='text-4xl sm:text-5xl font-bold leading-none tracking-tight mb-5'>
              <span className='text-text-primary'>Welcome to </span>
              <span className='gradient-text'>PRO</span>
            </h1>

            <p className='leading-relaxed my-4 font-bold text-lg text-green-400'>
              Check your email for your license key.
            </p>
            <p className='text-text-muted leading-relaxed mb-10'>
              Open Steam Game Idler, go to{' '}
              <span className='text-text-primary font-medium'>Settings → Subscription</span>, and
              paste your license key to activate PRO on this device.
            </p>

            <div className='flex flex-col sm:flex-row gap-3 justify-center mb-10'>
              <Link prefetch={false} href='/docs/pro' className='btn-primary px-6 py-3'>
                <FiBook className='w-4 h-4' />
                Read the PRO documentation
                <FaArrowRight className='w-3.5 h-3.5' />
              </Link>
              <Link prefetch={false} href='/' className='btn-ghost px-6 py-3'>
                Back to homepage
              </Link>
            </div>

            <p className='text-xs text-text-muted'>You can safely close this window now.</p>
          </div>
        </div>
      </section>

      <div className='section-divider' />
      <FooterSection />
    </div>
  )
}
