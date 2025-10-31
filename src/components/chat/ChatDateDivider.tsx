import type { ReactElement } from 'react'

interface ChatDateDividerProps {
  date: string
}

export default function ChatDateDivider({ date }: ChatDateDividerProps): ReactElement {
  return (
    <div className='flex items-center my-4'>
      <div className='flex-1 h-px bg-[#3f4147]' />
      <span className='px-2 text-xs text-[#949ba4] font-semibold'>{date}</span>
      <div className='flex-1 h-px bg-[#3f4147]' />
    </div>
  )
}
