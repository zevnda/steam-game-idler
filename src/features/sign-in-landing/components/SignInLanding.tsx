import { Trans, useTranslation } from 'react-i18next'
import { Button, Typography } from '@heroui/react'
import AuthCard from '@/shared/components/AuthCard'
import { TierBadge } from '@/shared/components/TierBadge'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { openExternalLink } from '@/shared/utils/links'

interface SignInLandingProps {
  onSelectAgent: () => void
  onSelectLocal: () => void
  // Used when this is reused inside AddAccountModal (the account switcher's "add account" flow) -
  // hides the legal footer, since that acknowledgment only makes sense at the very first sign-in,
  // not when adding an additional account to an already-agreed-to install. Defaults to false so
  // the sign-in landing page's own usage (pages/index.tsx) is unaffected.
  embedded?: boolean
  // Also AddAccountModal-only - CLI mode is a hard one-account ceiling (a real local Steam client
  // can only ever be signed into one account at a time),
  // so the local-sign-in option is disabled once one is already signed in. This is a genuine
  // technical ceiling, not a monetization gate, so it stays a real native-disabled Button.
  // Irrelevant on Linux, where the button is hidden entirely (see the `isLinux` check below) - no
  // local Steam client concept exists there at all, so there's no ceiling to reach in the first
  // place.
  localDisabled?: boolean
  // Tier cap on concurrent agent-mode accounts -
  // computed by the caller from subscriptionStore + sessionStore, since this component has no
  // session/subscription awareness of its own. Two distinct cases, both surfaced via
  // `agentDisabledReason` (a caller-translated string) shown under the button:
  // - `agentDisabled`: a genuine hard ceiling (Gamer tier's own sanity-capped 10 concurrent
  //   accounts) with no upgrade left to offer - a real native-disabled Button.
  // - `agentUpsell`: capped below what a tier upgrade would allow (free/casual hitting their
  //   lower cap) - a pro-gated block, so per every other gamer-gated control in this codebase
  //   the button stays real/pressable with a Gamer `TierBadge`, and `onPress`
  //   reroutes to `onAgentUpsell` instead of starting sign-in. Never `isDisabled` here - HeroUI
  //   maps that to a native `disabled` attribute that swallows the very click the upsell needs.
  agentDisabled?: boolean
  agentDisabledReason?: string
  agentUpsell?: boolean
  onAgentUpsell?: () => void
}

// Entry point shown before either sign-in method - agent mode (username/password) is presented as
// the primary/recommended action (it's the new, no-local-client-needed method users should be
// steered toward), with local/CLI mode as the
// secondary fallback for users who'd rather not enter their Steam credentials into the app. On
// Linux the local/CLI button is hidden outright (not just disabled) - no local Steam client
// concept exists there at all, so agent mode is the only sign-in path; see `isLinux` below. The
// full-screen two-pane shell (logo/glow, hero panel, language switch) lives one level up in
// AuthLayout, not here - this only ever renders the card itself now.
const SignInLanding = ({
  onSelectAgent,
  onSelectLocal,
  embedded = false,
  localDisabled = false,
  agentDisabled = false,
  agentDisabledReason,
  agentUpsell = false,
  onAgentUpsell,
}: SignInLandingProps) => {
  const { t } = useTranslation()
  // `null` (not yet checked) reads as "not Linux" - see platformStore's own doc comment on why
  // every consumer fails open onto pre-existing Windows-only behavior rather than hiding the
  // button for one frame on every platform while the check is in flight.
  const isLinux = usePlatformStore(state => state.currentOs) === 'linux'

  return (
    <AuthCard title={t('auth.landing.title')}>
      <div className='flex flex-col gap-4'>
        <Button
          fullWidth
          className={agentUpsell ? 'opacity-50' : undefined}
          isDisabled={agentDisabled}
          onPress={agentUpsell ? onAgentUpsell : onSelectAgent}
        >
          {t('auth.landing.agentButton')}
          {agentUpsell && <TierBadge tier='gamer' />}
        </Button>
        {(agentDisabled || agentUpsell) && agentDisabledReason && (
          <Typography align='center' color='muted' type='body-xs'>
            {agentDisabledReason}
          </Typography>
        )}
        {isLinux ? null : (
          <>
            <Button
              fullWidth
              isDisabled={localDisabled}
              variant='secondary'
              onPress={onSelectLocal}
            >
              {t('auth.landing.localButton')}
            </Button>
            {localDisabled ? (
              <Typography align='center' color='muted' type='body-xs'>
                {t('auth.landing.localAlreadySignedIn')}
              </Typography>
            ) : null}
          </>
        )}

        {embedded ? null : (
          <Typography align='center' className='mt-4' color='muted' type='body-xs'>
            <Trans
              components={[
                <button
                  key='tos'
                  className='font-semibold text-accent hover:opacity-90 cursor-pointer'
                  type='button'
                  onClick={() => openExternalLink('https://steamgameidler.com/tos')}
                >
                  Terms of Service
                </button>,
                <button
                  key='privacy'
                  className='font-semibold text-accent hover:opacity-90 cursor-pointer'
                  type='button'
                  onClick={() => openExternalLink('https://steamgameidler.com/privacy')}
                >
                  Privacy Policy
                </button>,
              ]}
              i18nKey='auth.landing.acknowledge'
            />
          </Typography>
        )}
      </div>
    </AuthCard>
  )
}

export default SignInLanding
