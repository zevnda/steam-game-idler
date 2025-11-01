import type { ReactElement } from 'react'

import { useMemo } from 'react'
import Image from 'next/image'

import { useSupabase } from '@/components/contexts/SupabaseContext'
import ExtLink from '@/components/ui/ExtLink'

export default function ChatUsers(): ReactElement {
  const { allUsers, onlineUsers } = useSupabase()

  const { online, offline } = useMemo(() => {
    // Create a map of all users from database for quick lookup
    const allUsersMap = new Map(allUsers.map(u => [u.user_id, u]))

    // Merge online users with database info
    const online = onlineUsers.map(onlineUser => {
      const dbUser = allUsersMap.get(onlineUser.user_id)
      return dbUser || onlineUser
    })

    // Get offline users (in database but not online)
    const onlineIds = new Set(onlineUsers.map(u => u.user_id))
    const offline = allUsers.filter(u => u.user_id && !onlineIds.has(u.user_id))

    return { online, offline }
  }, [allUsers, onlineUsers])

  return (
    <div className='user-render w-[230px] h-full border-l border-border px-2 py-3 overflow-y-auto'>
      <div className='flex flex-col gap-4'>
        <div>
          <p className='text-[10px] text-altwhite mb-2'>Online — {online.length}</p>

          <div className='flex flex-col'>
            {online.map(user => (
              <ExtLink
                key={user.user_id}
                href={`https://steamcommunity.com/profiles/${user.user_id}`}
                className='flex items-center gap-2 w-full hover:bg-white/5 p-1 rounded-sm cursor-pointer'
              >
                <div className='relative'>
                  <Image
                    src={
                      user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=5865f2&color=fff`
                    }
                    alt={`Avatar of ${user.username}`}
                    className='w-7 h-7 rounded-full mr-2'
                    width={28}
                    height={28}
                  />
                  <div className='absolute bottom-0 right-1 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background' />
                </div>

                <span className='text-xs truncate'>{user.username}</span>
              </ExtLink>
            ))}
          </div>
        </div>

        <div>
          <p className='text-[10px] text-altwhite my-2'>Offline — {offline.length}</p>

          <div className='flex flex-col'>
            {offline.map(user => (
              <ExtLink
                key={user.user_id}
                href={`https://steamcommunity.com/profiles/${user.user_id}`}
                className='flex items-center gap-2 w-full hover:bg-white/5 p-1 rounded-sm brightness-40 hover:brightness-100 cursor-pointer'
              >
                <div className='relative'>
                  <Image
                    src={
                      user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=5865f2&color=fff`
                    }
                    alt={`Avatar of ${user.username}`}
                    className='w-7 h-7 rounded-full mr-2'
                    width={28}
                    height={28}
                  />
                </div>

                <span className='text-xs truncate'>{user.username}</span>
              </ExtLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
