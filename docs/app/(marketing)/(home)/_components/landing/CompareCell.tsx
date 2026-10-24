import { TbCheck, TbMinus } from 'react-icons/tb'

/**
 * One value in a comparison table (`.cmp`): a tick, a dash, or a short note like "Plugin
 * required". Shared by the home page's four-tool Compare section and the per-competitor tables
 * on /alternatives/[tool], so both read the same.
 */
export default function CompareCell({ value, sgi }: { value: boolean | string; sgi?: boolean }) {
  if (typeof value === 'string') {
    return (
      <span className='text-[13px] font-semibold text-text-muted text-center leading-tight'>
        {value}
      </span>
    )
  }
  return value ? (
    <span className={`cmp-yes ${sgi ? 'cmp-yes--sgi' : ''}`} aria-label='Supported'>
      <TbCheck />
    </span>
  ) : (
    <TbMinus className='text-white/15 w-4 h-4' aria-label='Not supported' />
  )
}
