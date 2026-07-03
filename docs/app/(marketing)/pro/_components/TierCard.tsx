import type { TierFeature } from '@/app/(marketing)/pro/_components/data'
import { TbSparkles } from 'react-icons/tb'
import PaymentButtons from '@/app/(marketing)/pro/_components/PaymentButtons'

interface TierCardProps {
  tier: 'casual' | 'gamer'
  name: string
  price: string
  stripeUrl: string
  features: TierFeature[]
  isMostPopular?: boolean
}

export default function TierCard({
  tier,
  name,
  price,
  stripeUrl,
  features,
  isMostPopular,
}: TierCardProps) {
  const isCasual = tier === 'casual'
  const accent = isCasual ? '#3b82f6' : '#8a60ff'
  const accentTo = isCasual ? '#38bdf8' : '#ab26d3'

  return (
    <div
      className='relative rounded-3xl overflow-hidden flex flex-col p-7 h-full'
      style={{
        background: isCasual ? '#161b2b' : 'linear-gradient(145deg, #630064 0%, #2f0474 100%)',
      }}
    >
      {!isCasual && (
        <div
          className='absolute -top-8 -right-8 pointer-events-none'
          style={{ color: '#9333ea', opacity: 0.08 }}
        >
          <TbSparkles size={160} />
        </div>
      )}

      {isMostPopular && (
        <div className='absolute top-4 right-4 z-10'>
          <span
            className='px-2.5 py-1 text-[10px] font-black uppercase rounded-full tracking-widest text-white'
            style={{ background: `linear-gradient(90deg, ${accent}, ${accentTo})` }}
          >
            Most Popular
          </span>
        </div>
      )}

      <span className='text-xl font-black uppercase mb-2' style={{ color: accent }}>
        {name}
      </span>

      <div className='flex items-end gap-1.5 mb-5'>
        <span className='text-5xl font-black leading-none text-white'>${price}</span>
        <span className='text-white/50 text-sm mb-1.5'>/month</span>
      </div>

      {!isCasual && <p className='text-white/70 text-sm mb-2'>Everything in casual, plus</p>}

      <ul className='space-y-2.5 flex-1 mb-6'>
        {features.map(f => (
          <li key={f.title} className='flex items-center gap-2.5'>
            <f.icon className='w-5 h-5 text-white/80 shrink-0' />
            <span className='text-white text-sm'>{f.title}</span>
          </li>
        ))}
      </ul>

      <PaymentButtons tier={tier} stripeUrl={stripeUrl} />
    </div>
  )
}
