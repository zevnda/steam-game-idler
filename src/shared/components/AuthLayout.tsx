import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from './LanguageSwitch'
import { SignInHero } from './SignInHero'
import { openExternalLink } from '@/shared/utils/links'

interface AuthLayoutProps {
  children: ReactNode
}

// A solid panel holds every sign-in step in one fixed place, and SignInHero's game art fills the
// rest of the window. The Titlebar overlays both with no background of its own on this route (see
// Titlebar.tsx), so the panel starts below it via `pt-22` rather than being offset by the layout.
export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { t } = useTranslation()

  return (
    <div className='relative flex h-screen w-screen overflow-hidden bg-background'>
      <div className='relative z-10 flex h-full w-115 shrink-0 flex-col border-r border-border bg-background pb-8 pt-22 shadow-[30px_0_80px_-20px_rgba(0,0,0,0.8)]'>
        {/* Reserved on every step, so the content doesn't shift when BackButton (which is fixed
            over this row, see its own comment) appears on the screens that have one. */}
        <div className='h-10 shrink-0' />

        {/* Only this region scrolls. The Steam sign-in screen's form plus QR code is taller than
            the space left at the window's minHeight (620px), and the language picker should stay
            put when that happens. `my-auto` rather than `justify-center`, which would clip the
            top of content taller than the scroller instead of letting it scroll. */}
        <div className='flex min-h-0 flex-1 flex-col overflow-y-auto px-12'>
          <div className='my-auto py-2'>{children}</div>
        </div>

        <div className='flex shrink-0 items-center justify-center gap-4 px-12 pt-2'>
          <LanguageSwitch className='w-44' />
          <button
            className='cursor-pointer text-sm text-muted duration-150 hover:text-foreground'
            type='button'
            onClick={() =>
              openExternalLink('https://steamgameidler.com/docs/get-started/how-to-sign-in')
            }
          >
            {t('common.needHelp')}
          </button>
        </div>
      </div>

      <SignInHero />
    </div>
  )
}
