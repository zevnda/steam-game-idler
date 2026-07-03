import PayPalButton from '@/app/(marketing)/pro/_components/PayPalButton'
import StripeButton from '@/app/(marketing)/pro/_components/StripeButton'

interface PaymentButtonsProps {
  tier: 'casual' | 'gamer'
  stripeUrl: string
}

export default function PaymentButtons({ tier, stripeUrl }: PaymentButtonsProps) {
  const buttonClass =
    'flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-black uppercase text-xs cursor-pointer transition-transform duration-150 hover:scale-105 text-white'

  return (
    <div className='flex flex-row gap-2.5'>
      <StripeButton url={stripeUrl} className={buttonClass} />
      <PayPalButton tier={tier} className={buttonClass} />
    </div>
  )
}
