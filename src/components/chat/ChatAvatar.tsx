import type { ReactElement } from 'react'

import Image from 'next/image'

import ExtLink from '@/components/ui/ExtLink'

interface ChatAvatarProps {
  userId: string
  username: string
  avatarUrl?: string
  avatarColor: string
}

export default function ChatAvatar({ userId, username, avatarUrl, avatarColor }: ChatAvatarProps): ReactElement {
  return (
    <ExtLink href={`https://steamcommunity.com/profiles/${userId}`} className='shrink-0 mt-1 select-none'>
      <Image
        src={avatarUrl || `https://ui-avatars.com/api/?name=${username}&background=${avatarColor}&color=fff`}
        alt={username}
        width={32}
        height={32}
        className='rounded-full'
      />
    </ExtLink>
  )
}
