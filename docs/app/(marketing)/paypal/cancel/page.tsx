import { FaArrowRight } from 'react-icons/fa6'
import Link from 'next/link'
import CheckoutResult from '@/app/(marketing)/_components/CheckoutResult'

export const metadata = {
  title: 'Checkout Canceled',
  robots: { index: false, follow: false },
  alternates: { canonical: '/paypal/cancel' },
}

// Where PayPal sends a buyer who backs out of checkout
export default function PayPalCancelPage() {
  return (
    <CheckoutResult
      lead='Checkout'
      tail='canceled.'
      sub="No subscription was created and you haven't been charged. You can try again anytime."
    >
      <div className='mt-10 flex flex-col sm:flex-row gap-3 justify-center'>
        <Link prefetch={false} href='/pro' className='btn-download px-6 py-3'>
          Try again
          <FaArrowRight className='w-3.5 h-3.5' aria-hidden='true' />
        </Link>
        <Link prefetch={false} href='/' className='btn-ghost rounded-full px-6 py-3'>
          Back to homepage
        </Link>
      </div>

      <p className='mt-10 text-center text-sm text-text-muted'>
        You can safely close this window now.
      </p>
    </CheckoutResult>
  )
}
