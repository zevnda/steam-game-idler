import type { ReactNode } from 'react'
import { Separator, Typography } from '@heroui/react'

interface SettingsRowProps {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  // Default true - the last row in a tab passes false so the tab doesn't end on a trailing rule.
  showDivider?: boolean
}

// One label+description-left / control-right row, matching `main`'s recurring settings-screen
// structure - there's no `Divider` export from `@heroui/react` v3, so the rule below reuses the same
// `border-t border-border` convention AccountSwitcher.tsx already established for its own divider.
// Wrap consecutive rows in a `flex flex-col gap-4` container (each row + its divider are separate
// flex children, so the gap spaces both evenly - no extra margin needed on the divider itself).
export const SettingsRow = ({
  title,
  description,
  children,
  showDivider = true,
}: SettingsRowProps) => (
  <>
    <div className='flex items-center justify-between gap-4'>
      <div className='flex flex-col gap-0.5'>
        <Typography type='body-sm' weight='semibold'>
          {title}
        </Typography>
        {description && (
          <Typography color='muted' type='body-xs' className='max-w-[70ch]'>
            {description}
          </Typography>
        )}
      </div>
      {children}
    </div>
    {showDivider && <Separator className='border-t border-border my-2' />}
  </>
)
