// Ported verbatim from `main` (no framer-motion involved) - a divider-flanked section label
// shared by the features/tiers/comparison/FAQ sections.
export function SectionHeading({ label }: { label: string }) {
  return (
    <div className='mb-10 mt-15 flex items-center gap-3'>
      <div
        className='h-px flex-1'
        style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15))' }}
      />
      <span className='font-black uppercase tracking-[0.22em] text-white/35'>{label}</span>
      <div
        className='h-px flex-1'
        style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.15))' }}
      />
    </div>
  )
}
