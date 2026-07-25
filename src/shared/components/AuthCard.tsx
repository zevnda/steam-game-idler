import type { ReactNode } from 'react'

interface AuthCardProps {
  title?: ReactNode
  children: ReactNode
  description?: ReactNode
  className?: string
  // Rendered alongside `title` in a `justify-between` row instead of the plain centered title -
  // only SteamCookiesConnectPanel's standalone variant needs this (its "Learn more" docs link),
  // every other AuthCard caller leaves it unset and keeps the original centered layout unchanged.
  titleAction?: ReactNode
}

// Shared by every sign-in screen (agent-mode credentials/guard-code, local-mode account picker)
// so the layout only exists in one place. Plain centered divs, not a HeroUI `Card` - main's
// SignIn.tsx has no panel around its sign-in content at all, just centered text/controls directly
// on the page (see AuthLayout.tsx's port comment), and `Card` kept dragging in panel chrome
// (padding, shadow, rounded corners) this screen never wanted.
const AuthCard = ({ title, children, className = 'w-96', titleAction }: AuthCardProps) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className='flex flex-col items-center gap-1 text-center'>
        {titleAction ? (
          <div className='mb-10 flex w-full items-center justify-between gap-4'>
            <p className='text-2xl font-semibold leading-6 text-foreground'>{title}</p>
            {titleAction}
          </div>
        ) : (
          <p className='text-2xl font-semibold leading-6 text-foreground mb-10'>{title}</p>
        )}
      </div>
      <div className='flex flex-1 flex-col gap-1'>{children}</div>
    </div>
  )
}

export default AuthCard
