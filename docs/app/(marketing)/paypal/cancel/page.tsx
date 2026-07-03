import { FaArrowRight } from 'react-icons/fa6'
import { FiX } from 'react-icons/fi'
import Link from 'next/link'
import FooterSection from '@/app/(marketing)/(home)/_components/FooterSection'
import NavBar from '@/app/(marketing)/(home)/_components/NavBar'

export const metadata = {
  title: 'Checkout Cancelled | Steam Game Idler',
  robots: { index: false, follow: false },
  alternates: { canonical: '/paypal/cancel' },
}

export default function PayPalCancelPage() {
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
                background: 'linear-gradient(135deg, #f75555, #f16363)',
                boxShadow: '0 0 32px 4px rgba(234, 51, 106, 0.35)',
              }}
            >
              <FiX className='w-6 h-6 text-white' />
            </div>

            <h1 className='text-4xl sm:text-5xl font-bold leading-none tracking-tight mb-5 text-text-primary'>
              Checkout cancelled
            </h1>

            <p className='text-text-muted leading-relaxed mb-10'>
              No subscription was created and you haven&apos;t been charged. You can try again
              anytime from Steam Game Idler.
            </p>

            <div className='flex flex-col sm:flex-row gap-3 justify-center mb-10'>
              <Link prefetch={false} href='/pro' className='btn-primary px-6 py-3'>
                Try again
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
