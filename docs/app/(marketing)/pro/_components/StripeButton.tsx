import { BsStripe } from 'react-icons/bs'
import { FaArrowRight } from 'react-icons/fa6'

interface StripeButtonProps {
  url: string
  className?: string
}

export default function StripeButton({ url, className }: StripeButtonProps) {
  return (
    <a
      href={url}
      className={className}
      style={{ background: 'linear-gradient(110deg, #635bff, #7a73ff)' }}
    >
      <BsStripe className='w-4 h-4' />
      Stripe
      <FaArrowRight className='w-4 h-4' />
    </a>
  )
}
