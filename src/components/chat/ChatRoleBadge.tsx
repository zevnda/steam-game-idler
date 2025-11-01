import type { ReactElement } from 'react'

import { Tooltip } from '@heroui/react'
import { FaCrown } from 'react-icons/fa'
import { FaBan, FaRocket, FaShield } from 'react-icons/fa6'

interface ChatRoleBadgeProps {
  role: string
}

export default function ChatRoleBadge({ role }: ChatRoleBadgeProps): ReactElement | null {
  if (role === 'admin') {
    return (
      <Tooltip content='Admin' className='text-xs' delay={500} closeDelay={0} showArrow>
        <FaCrown className='inline ml-1 -translate-y-0.5' size={14} />
      </Tooltip>
    )
  }
  if (role === 'moderator') {
    return (
      <Tooltip content='Moderator' className='text-xs' delay={500} closeDelay={0} showArrow>
        <FaShield className='inline ml-1 -translate-y-0.5' size={14} />
      </Tooltip>
    )
  }
  if (role === 'early_supporter') {
    return (
      <Tooltip content='Early Supporter' className='text-xs' delay={500} closeDelay={0} showArrow>
        <FaRocket className='inline ml-1 -translate-y-0.5' size={14} />
      </Tooltip>
    )
  }
  if (role === 'banned') {
    return (
      <Tooltip content='Banned User' className='text-xs' delay={500} closeDelay={0} showArrow>
        <FaBan className='inline ml-1 -translate-y-0.5 text-[#525252]' size={14} />
      </Tooltip>
    )
  }

  return null
}
