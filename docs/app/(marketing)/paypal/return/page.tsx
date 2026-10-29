import { CheckoutSuccess } from '@/app/(marketing)/_components/CheckoutResult'

export const metadata = {
  title: 'Subscription Created',
  robots: { index: false, follow: false },
  alternates: { canonical: '/paypal/return' },
}

// Where PayPal sends a buyer after a completed checkout - see CheckoutSuccess
export default function PayPalReturnPage() {
  return <CheckoutSuccess provider='paypal' />
}
