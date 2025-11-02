import type { ReactElement } from 'react'

import { FaCircleXmark } from 'react-icons/fa6'

interface ChatReplyPreviewProps {
  username: string
  onCancel: () => void
}

export default function ChatReplyPreview({ username, onCancel }: ChatReplyPreviewProps): ReactElement {
  return (
    <div className='-mb-1 flex items-center gap-2 px-4 py-2 bg-[#2b2d31] border border-border rounded-tl-md rounded-tr-md'>
      <div className='flex justify-between items-center w-full'>
        <div className='text-[10px] text-[#b5bac1] font-semibold w-full'>Replying to {username}</div>
        <FaCircleXmark onClick={onCancel} size={14} className='hover:text-altwhite cursor-pointer' />
      </div>
    </div>
  )
}
