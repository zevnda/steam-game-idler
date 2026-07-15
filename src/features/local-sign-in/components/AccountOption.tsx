import type { SteamAccount } from '../types'
import { Avatar, Radio } from '@heroui/react'

interface AccountOptionProps {
  account: SteamAccount
}

// One selectable avatar card within the `RadioGroup` in `AccountPicker`. No separate radio
// dot/control is rendered - a gradient-filled box behind the selected avatar is the selection
// indicator, matching `main`'s actual avatar-picker UX (its
// `bg-linear-to-tr from-cyan-500 via-blue-500 to-violet-700` selected-state style). `group` on
// `Radio.Content` plus `group-data-selected:` on the inner wrapper is how the gradient reaches the
// avatar specifically without also painting the persona-name text below it.
const AccountOption = ({ account }: AccountOptionProps) => {
  const initial = account.personaName.trim().charAt(0).toUpperCase() || '?'

  return (
    <Radio value={account.steamId}>
      <Radio.Content className='group flex w-36 cursor-pointer flex-col items-center gap-2 rounded-lg p-2 outline-none data-focus-visible:ring-2 data-focus-visible:ring-focus'>
        <div className='rounded-lg p-1 group-data-selected:bg-linear-to-tr group-data-selected:from-cyan-500 group-data-selected:via-blue-500 group-data-selected:to-violet-700'>
          {/* Square-rounded and large, not HeroUI's default small circular sizing - matches
              main's 128x128 `rounded-md` avatar (its `UserSelectionArea`). tailwind-merge resolves the
              `size-*`/`rounded-*` conflicts in favor of this className over Avatar's own slot
              classes. */}
          <Avatar className='size-32 rounded-lg' size='lg'>
            {account.avatarUrl ? (
              <Avatar.Image alt={account.personaName} src={account.avatarUrl} />
            ) : null}
            <Avatar.Fallback className='rounded-lg text-2xl'>{initial}</Avatar.Fallback>
          </Avatar>
        </div>
        {/* Plain element, not `Typography` - `Typography` renders react-aria-components' `Text`,
            which throws ("A slot prop is required") when nested inside `Radio`, since `Radio`
            only publishes a "description" text slot and this is the option's label, not a
            description. */}
        <span className='w-full truncate text-center text-sm'>{account.personaName}</span>
      </Radio.Content>
    </Radio>
  )
}

export default AccountOption
