import type { ChatUser } from '@/components/contexts/SupabaseContext'
import type { ReactElement } from 'react'

import { useMemo } from 'react'
import Image from 'next/image'

import ChatRoleBadge from '@/components/chat/ChatRoleBadge'
import { useSupabase } from '@/components/contexts/SupabaseContext'
import ExtLink from '@/components/ui/ExtLink'

interface RoleGroup {
  role: string
  roleName: string
  online: ChatUser[]
  offline: ChatUser[]
}

export default function ChatUserList(): ReactElement {
  const { allUsers, onlineUsers, userRoles } = useSupabase()

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
        return 'Admin'
      case 'moderator':
        return 'Moderator'
      case 'early_supporter':
        return 'Early Supporter'
      case 'donator':
        return 'Donator'
      default:
        return 'Members'
    }
  }

  const getRolePriority = (role: string): number => {
    switch (role) {
      case 'admin':
        return 0
      case 'moderator':
        return 1
      case 'early_supporter':
        return 2
      case 'donator':
        return 3
      case 'banned':
        return 5
      default:
        return 4
    }
  }

  const { roleGroups, offlineUsers } = useMemo(() => {
    // Create a map of all users from database for quick lookup
    const allUsersMap = new Map(allUsers.map(u => [u.user_id, u]))
    const onlineIds = new Set(onlineUsers.map(u => u.user_id))

    // Group users by role
    const groups = new Map<string, RoleGroup>()
    const offline: ChatUser[] = []

    // First, process all online users (including those not in database)
    onlineUsers.forEach(onlineUser => {
      if (!onlineUser.user_id) return

      const dbUser = allUsersMap.get(onlineUser.user_id)
      const user = dbUser || onlineUser
      const userRole = (user.user_id && userRoles[user.user_id]) ?? 'user'

      if (!groups.has(userRole)) {
        groups.set(userRole, {
          role: userRole,
          roleName: getRoleName(userRole),
          online: [],
          offline: [],
        })
      }
      groups.get(userRole)!.online.push(user)
    })

    // Then, process offline users (in database but not online)
    allUsers.forEach(user => {
      if (user.user_id && !onlineIds.has(user.user_id)) {
        offline.push(user)
      }
    })

    // Sort users within each group alphabetically
    groups.forEach(group => {
      group.online.sort((a, b) => a.username.localeCompare(b.username))
    })

    // Sort offline users by role priority, then alphabetically
    offline.sort((a, b) => {
      const roleA = (a.user_id && userRoles[a.user_id]) ?? 'user'
      const roleB = (b.user_id && userRoles[b.user_id]) ?? 'user'
      const priorityA = getRolePriority(roleA)
      const priorityB = getRolePriority(roleB)

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      return a.username.localeCompare(b.username)
    })

    // Convert to array and sort by role priority
    const sortedGroups = Array.from(groups.values()).sort((a, b) => getRolePriority(a.role) - getRolePriority(b.role))

    return { roleGroups: sortedGroups, offlineUsers: offline }
  }, [allUsers, onlineUsers, userRoles])

  return (
    <div className='user-render w-[230px] h-full border-l border-border px-2 py-3 overflow-y-auto'>
      <div className='flex flex-col gap-4'>
        {roleGroups.map(group => (
          <div key={group.role}>
            <p className='flex items-center gap-1 text-[10px] text-altwhite mb-2 select-none uppercase font-semibold'>
              <ChatRoleBadge role={group.role} />
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
                    <div className='absolute bottom-0 right-1 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background' />
                  </div>

                  <span className={`text-xs truncate ${getRoleStyles(group.role)}`}>{user.username}</span>
                </ExtLink>
              ))}
            </div>
          </div>
        ))}

        {/* Offline users section */}
        {offlineUsers.length > 0 && (
          <div>
            <p className='text-[10px] text-altwhite mb-2 select-none uppercase font-semibold'>
              Offline — {offlineUsers.length}
            </p>
            <div className='flex flex-col'>
              {offlineUsers.map(user => {
                const userRole = (user.user_id && userRoles[user.user_id]) ?? 'user'
                return (
                  <ExtLink
                    key={user.user_id}
                    href={`https://steamcommunity.com/profiles/${user.user_id}`}
                    className='flex items-center gap-2 w-full hover:bg-white/5 p-1 rounded-sm brightness-40 hover:brightness-100 cursor-pointer'
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
                    </div>

                    <span className={`text-xs truncate ${getRoleStyles(userRole)}`}>{user.username}</span>
                  </ExtLink>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
