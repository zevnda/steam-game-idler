import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from './LanguageSwitch'
import { SignInHero } from './SignInHero'
import { cn } from '@heroui/react'
import { Logo } from '@/shared/components/dashboard/Logo'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { openExternalLink } from '@/shared/utils/links'

interface AuthLayoutProps {
  children: ReactNode
}

// Two-pane shell behind every pre-sign-in screen (landing, agent credentials/guard-code, local
// account picker) - ported from main's SignIn.tsx layout split. Unlike main (one screen, no
// sub-navigation), this rewrite has three sign-in screens sharing one flow, so the logo/glow,
// hero panel, and language switch live here instead of being duplicated per screen - only the
// left column's content (`children`) actually changes as the flow progresses.
export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { t } = useTranslation()
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true

  return (
    <div className='relative flex h-screen w-screen overflow-hidden bg-background'>
      <div className='flex w-3/5 flex-col items-center justify-center gap-8 overflow-y-auto px-6 py-10'>
        {/* Logo tile with the turning rainbow rim + glow (globals.css `.auth-logo`) - the glow is
            a sibling behind the tile rather than a shadow on it, so its blur can't be clipped */}
        <div className='relative flex items-center justify-center'>
          <span
            aria-hidden
            className={cn(
              'auth-logo-glow absolute inset-0 rounded-[22px]',
              forceReducedMotion && 'force-reduced-motion',
            )}
          />
          <div
            className={cn(
              'auth-logo relative flex size-18 items-center justify-center rounded-[22px]',
              forceReducedMotion && 'force-reduced-motion',
            )}
          >
            <Logo height={40} width={40} />
          </div>
        </div>

        {children}
      </div>

      <div className='flex flex-1 items-center justify-center pt-22 pb-8 pr-10'>
        <SignInHero />
      </div>

      <div className='pointer-events-none absolute bottom-0 left-0 z-10 flex items-center gap-4 p-10'>
        <div className='pointer-events-auto'>
          <LanguageSwitch />
        </div>
        <button
          className='pointer-events-auto text-sm text-muted duration-150 hover:text-foreground cursor-pointer'
          type='button'
          onClick={() =>
            openExternalLink('https://steamgameidler.com/docs/get-started/how-to-sign-in')
          }
        >
          {t('common.needHelp')}
        </button>
      </div>
    </div>
  )
}
