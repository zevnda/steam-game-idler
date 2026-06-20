export function SectionHeading({ label }: { label: string }) {
  return (
    <div className='flex items-center gap-3 mb-10 mt-15'>
      <div
        className='h-px flex-1'
        style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15))' }}
      />
      <span className='text-white/35 font-black uppercase tracking-[0.22em]'>{label}</span>
      <div
        className='h-px flex-1'
        style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.15))' }}
      />
    </div>
  )
}
