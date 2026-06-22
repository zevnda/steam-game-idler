import type { Feature } from '@/app/pro/_components/data'

interface FeatureCardProps {
  feature: Feature
}

export default function FeatureCard({ feature: f }: FeatureCardProps) {
  return (
    <div
      className='relative rounded-3xl p-6 flex flex-col h-full'
      style={{ background: '#131313' }}
    >
      <f.icon
        className={`w-7 h-7 mb-4 ${f.tier === 'casual' ? 'text-blue-400' : 'text-purple-400'}`}
      />
      <h3 className='font-black uppercase text-text-primary mb-2'>{f.title}</h3>
      <p className='text-sm text-text-muted leading-relaxed'>{f.description}</p>
    </div>
  )
}
