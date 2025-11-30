import type { ChatUser } from '@/components/chat/SupabaseContext'
import type { ReactElement } from 'react'

import { Spinner } from '@heroui/react'
import { useMemo } from 'react'
import Image from 'next/image'

import ChatRoleBadge from '@/components/chat/ChatRoleBadge'
import { useSupabase } from '@/components/chat/SupabaseContext'
import ExtLink from '@/components/ui/ExtLink'

interface RoleGroup {
  role: string
  roleName: string
  online: ChatUser[]
}

export default function ChatUserList(): ReactElement {
  const { onlineUsers, userRoles } = useSupabase()
  const isUserRolesEmpty = Object.keys(userRoles).length === 0

  const getRoleStyles = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'text-[#e91e63] font-bold'
      case 'moderator':
        return 'text-[#1eb6e9ff] font-bold'
      case 'early_supporter':
        return 'text-[#43b581] font-bold'
      case 'donator':
        return 'donator-role font-bold'
      case 'banned':
        return 'text-[#525252] line-through italic'
      default:
        return 'text-[#dbdee1]'
    }
  }

  const getRoleName = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'Developer'
      case 'moderator':
        return 'Moderator'
      case 'early_supporter':
        return 'Early Supporter'
      case 'donator':
        return 'Donator'
      case 'banned':
        return 'Banned'
      default:
        return 'Member'
    }
  }

  const getRolePriority = (role: string): number => {
    switch (role) {
      case 'admin':
        return 0
      case 'moderator':
        return 1
      case 'donator':
        return 2
      case 'early_supporter':
        return 3
      case 'banned':
        return 5
      default:
        return 4
    }
  }

  const { roleGroups } = useMemo(() => {
    // Group users by role using only onlineUsers
    const groups = new Map<string, RoleGroup>()

    onlineUsers.forEach(user => {
      if (!user.user_id) return
      const userRole = (user.user_id && userRoles[user.user_id]) ?? 'user'
      if (!groups.has(userRole)) {
        groups.set(userRole, {
          role: userRole,
          roleName: getRoleName(userRole),
          online: [],
        })
      }
      groups.get(userRole)!.online.push(user)
    })

    // Sort users within each group alphabetically
    groups.forEach(group => {
      group.online.sort((a, b) => a.username.localeCompare(b.username))
    })

    // Convert to array and sort by role priority
    const sortedGroups = Array.from(groups.values()).sort((a, b) => getRolePriority(a.role) - getRolePriority(b.role))

    return { roleGroups: sortedGroups }
  }, [onlineUsers, userRoles])

  return (
    <div className='user-render w-[230px] h-full border-l border-border px-2 py-3 ml-0.5 overflow-y-auto'>
      <div className='flex flex-col gap-4'>
        {isUserRolesEmpty ? (
          <div className='flex justify-center items-center h-full py-10'>
            <Spinner variant='simple' />
          </div>
        ) : (
          <>
            {roleGroups.map(group => (
              <div key={group.role}>
                <p className='flex items-center gap-1 text-[10px] text-altwhite mb-2 select-none uppercase font-semibold'>
                  <ChatRoleBadge role={group.role} className={getRoleStyles(group.role)} />
                  {group.roleName} — {group.online.length}
                </p>

                <div className='flex flex-col'>
                  {group.online.map(user => (
                    <ExtLink
                      key={user.user_id}
                      href={`https://steamcommunity.com/profiles/${user.user_id}`}
                      className='flex items-center gap-2 w-full hover:bg-white/5 p-1 rounded-sm cursor-pointer'
                    >
                      <div className='relative'>
                        <Image
                          src={
                            user.avatar_url ||
                            `https://ui-avatars.com/api/?name=${user.username}&background=5865f2&color=fff`
                          }
                          alt={`Avatar of ${user.username}`}
                          className='w-7 h-7 rounded-full mr-2'
                          width={28}
                          height={28}
                        />
                        <div className='absolute bottom-0 right-1 h-3 w-3 rounded-full bg-success-500 border-2 border-border' />
                      </div>

                      <span className={`text-xs truncate ${getRoleStyles(group.role)}`}>{user.username}</span>
                    </ExtLink>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
