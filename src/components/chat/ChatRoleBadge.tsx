import { Tooltip } from '@heroui/react'
import React from 'react'
import { FaCrown } from 'react-icons/fa'
import { FaRocket, FaShield } from 'react-icons/fa6'

interface ChatRoleBadgeProps {
  role: string
}

const ChatRoleBadge: React.FC<ChatRoleBadgeProps> = ({ role }) => {
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
  return null
}

export default ChatRoleBadge
