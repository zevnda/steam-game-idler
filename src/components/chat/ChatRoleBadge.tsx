import type { ReactElement } from 'react'

import { cn, Tooltip } from '@heroui/react'
import { FaBan, FaGithub, FaRocket, FaShield } from 'react-icons/fa6'

interface ChatRoleBadgeProps {
  role: string
  className?: string
}

export default function ChatRoleBadge({ role, className }: ChatRoleBadgeProps): ReactElement | null {
  if (role === 'admin') {
    return (
      <Tooltip content='Developer' className='text-xs' delay={500} closeDelay={0} showArrow>
        <FaGithub className={`inline ml-1 -translate-y-px ${className}`} size={14} />
      </Tooltip>
    )
  }
  if (role === 'moderator') {
    return (
      <Tooltip content='Moderator' className='text-xs' delay={500} closeDelay={0} showArrow>
        <FaShield className={`inline ml-1 -translate-y-px ${className}`} size={14} />
      </Tooltip>
    )
  }
  if (role === 'early_supporter') {
    return (
      <Tooltip content='Early Supporter' className='text-xs' delay={500} closeDelay={0} showArrow>
        <FaRocket className={`inline ml-1 -translate-y-px ${className}`} size={12} />
      </Tooltip>
    )
  }
  if (role === 'donator') {
    return (
      <Tooltip content='Donator' className='text-xs' delay={500} closeDelay={0} showArrow>
        <span
          className={cn(
            'donator-badge inline-block rounded-full px-2 font-black text-white italic select-none scale-80 -ml-px -mr-1',
          )}
          style={{
            backgroundImage: 'linear-gradient(100deg, #154d66ff 0%, #227ca5ff 40%, #2eabe5ff 70%, #34bfffff 100%)',
          }}
        >
          PRO
        </span>
      </Tooltip>
    )
  }
  if (role === 'banned') {
    return (
      <Tooltip content='Banned User' className='text-xs' delay={500} closeDelay={0} showArrow>
        <FaBan className={`inline ml-1 -translate-y-px text-[#525252] ${className}`} size={14} />
      </Tooltip>
    )
  }

  return null
}
