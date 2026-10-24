import { CheckoutSuccess } from '@/app/(marketing)/_components/CheckoutResult'

export const metadata = {
  title: 'Subscription Created',
  robots: { index: false, follow: false },
  alternates: { canonical: '/stripe/return' },
}

// Where Stripe sends a buyer after a completed checkout - see CheckoutSuccess
export default function StripeReturnPage() {
  return <CheckoutSuccess />
}
