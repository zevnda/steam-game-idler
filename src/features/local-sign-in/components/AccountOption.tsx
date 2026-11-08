import type { SteamAccount } from '../types'
import { useTranslation } from 'react-i18next'
import { TbCheck } from 'react-icons/tb'
import { Avatar, Radio, Skeleton } from '@heroui/react'
import { timeAgo } from '@/shared/hooks/useNotifications'

interface AccountOptionProps {
  account: SteamAccount
}

// Matches a real row's size exactly, so swapping one for the other doesn't move anything
export const AccountOptionSkeleton = () => (
  <div className='flex w-full items-center gap-3 rounded-2xl bg-foreground/4 p-3 ring-1 ring-foreground/8'>
    <Skeleton className='size-11 shrink-0 rounded-full' />
    <div className='flex flex-1 flex-col gap-2'>
      <Skeleton className='h-3.5 w-28 rounded-md' />
      <Skeleton className='h-3 w-40 rounded-md' />
    </div>
  </div>
)

// One selectable row within the `RadioGroup` in `AccountPicker`. Uses plain elements rather than
// `Typography` for the text, which throws ("A slot prop is required") when nested inside `Radio`,
// and `group-data-selected:` to reach the tick, since `Radio.Content` is what carries the state.
// `mt-0!` cancels the 16px HeroUI's vertical RadioGroup puts above every radio; `AccountPicker` sets
// the spacing between rows itself.
const AccountOption = ({ account }: AccountOptionProps) => {
  const { t, i18n } = useTranslation()
  const initial = account.personaName.trim().charAt(0).toUpperCase() || '?'

  return (
    <Radio className='mt-0! w-full' value={account.steamId}>
      <Radio.Content className='group flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-foreground/4 p-3 outline-none ring-1 ring-foreground/8 transition-colors hover:bg-foreground/7 data-focus-visible:ring-2 data-focus-visible:ring-focus data-selected:bg-accent/12 data-selected:ring-2 data-selected:ring-accent'>
        <Avatar className='size-11 shrink-0'>
          {account.avatarUrl ? (
            <Avatar.Image alt={account.personaName} src={account.avatarUrl} />
          ) : null}
          <Avatar.Fallback>{initial}</Avatar.Fallback>
        </Avatar>
        <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span className='truncate text-[15px] font-semibold'>{account.personaName}</span>
          {account.mostRecent ? (
            <span className='flex items-center gap-1.5 text-xs text-success'>
              <span aria-hidden className='size-1.5 shrink-0 rounded-full bg-success' />
              <span className='truncate'>{t('auth.localSignIn.mostRecent')}</span>
            </span>
          ) : account.lastUsed ? (
            <span className='truncate text-xs text-muted'>
              {t('auth.localSignIn.lastUsed', { when: timeAgo(account.lastUsed, i18n.language) })}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden
          className='flex size-5 shrink-0 items-center justify-center rounded-full text-accent-foreground ring-1 ring-foreground/25 group-data-selected:bg-accent group-data-selected:ring-0'
        >
          <TbCheck className='hidden group-data-selected:block' fontSize={12} strokeWidth={3} />
        </span>
      </Radio.Content>
    </Radio>
  )
}

export default AccountOption
