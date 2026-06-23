import type { Feature } from '@/app/pro/_components/data'
import Image from 'next/image'

interface FeatureCardProps {
  feature: Feature
}

export default function FeatureCard({ feature: f }: FeatureCardProps) {
  return (
    <div
      className='relative rounded-3xl overflow-hidden h-full min-h-95'
      style={{ background: '#131313' }}
    >
      {f.imgBg && <Image src={f.imgBg} alt='' fill className='object-cover opacity-80' />}

      <div className={`relative z-10 p-4 flex flex-col h-full ${f.darkText ? 'text-black' : ''}`}>
        <p className='text-xl font-black mb-1.5'>{f.title}</p>
        <p className='text-sm font-semibold leading-relaxed flex-1'>{f.description}</p>
      </div>
    </div>
  )
}
