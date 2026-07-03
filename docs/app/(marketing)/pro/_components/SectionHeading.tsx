interface SectionHeadingProps {
  label: string
}

export default function SectionHeading({ label }: SectionHeadingProps) {
  return (
    <div className='flex items-center gap-3 mb-10'>
      <div
        className='h-px flex-1'
        style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15))' }}
      />
      <span className='text-text-muted/70 font-black uppercase tracking-[0.22em] text-sm'>
        {label}
      </span>
      <div
        className='h-px flex-1'
        style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.15))' }}
      />
    </div>
  )
}
