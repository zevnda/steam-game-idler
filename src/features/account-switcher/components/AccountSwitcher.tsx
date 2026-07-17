import type { AccountKey, SignedInAccount } from '@/shared/stores/sessionStore'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbAlertTriangle, TbChevronDown, TbLogout, TbPlus } from 'react-icons/tb'
import { AlertDialog, Avatar, Button, cn, Popover, Spinner, toast } from '@heroui/react'
import { useRouter } from 'next/router'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { TierBadge } from '@/shared/components/TierBadge'
import { signOutAccount } from '@/shared/hooks/signOutAccount'
import { useAccountSummaryStore } from '@/shared/stores/accountSummaryStore'
import { useAchievementUnlockerStore } from '@/shared/stores/achievementUnlockerStore'
import { useAddAccountModalStore } from '@/shared/stores/addAccountModalStore'
import { useAgentReauthStore } from '@/shared/stores/agentReauthStore'
import { useCardFarmingStore } from '@/shared/stores/cardFarmingStore'
import { useIdlingStore } from '@/shared/stores/idlingStore'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useReauthModalStore } from '@/shared/stores/reauthModalStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSteamWarningStore } from '@/shared/stores/steamWarningStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'
import { computeAllowedAccountKeys } from '@/shared/utils/subscriptionAccess'

const identifierFor = (account: SignedInAccount) =>
  account.mode === 'agent' ? account.username : account.steamId

interface AccountRowProps {
  accountKey: AccountKey
  account: SignedInAccount
  isActive: boolean
  // True once this account falls outside the current tier's concurrent-agent-account cap (see
  // `computeAllowedAccountKeys`) - a subscription downgrade below the number of accounts already
  // signed in, not a fresh cap hit (that's AddAccountModal's `agentCapReached`). Still signed in,
  // just not switchable - per the "never silently force-sign-out" rule, sign-out
  // stays live regardless (see the row's own logout button below, untouched by this prop).
  isOverCap: boolean
  // True while this specific row's `handleSwitch` is in flight (the local-mode `is_steam_running`
  // pre-flight check) - see AccountSwitcher's `switchingKey`. Swaps the sign-out button for a
  // spinner and makes the row non-interactive so a slow check doesn't look like an unresponsive
  // click.
  isSwitching: boolean
  // True while agentReauthStore has this account flagged (kicked by a concurrent login on
  // another device/session) - see useAgentReauthWatcher. Takes priority over isOverCap: an
  // over-cap account is still a normal live session just not switchable, while this one has
  // already had its automation stopped and needs fresh credentials before anything else applies.
  needsReauth: boolean
  onSwitch: (key: AccountKey) => void
  onUpsell: () => void
  onReauth: (key: AccountKey) => void
  onRequestSignOut: (
    accountKey: AccountKey,
    displayName: string,
    hasActiveAutomation: boolean,
  ) => void
}

const AccountRow = ({
  accountKey,
  account,
  isActive,
  isOverCap,
  isSwitching,
  needsReauth,
  onSwitch,
  onUpsell,
  onReauth,
  onRequestSignOut,
}: AccountRowProps) => {
  const { t } = useTranslation()
  const summary = useAccountSummaryStore(state => state.summaries[accountKey])
  const isIdling = useIdlingStore(state => (state.entries[accountKey]?.appIds.length ?? 0) > 0)
  const isFarming = useCardFarmingStore(state => state.entries[accountKey]?.isFarming ?? false)
  const isUnlocking = useAchievementUnlockerStore(
    state => state.entries[accountKey]?.isRunning ?? false,
  )
  const isActiveAutomation = isIdling || isFarming || isUnlocking

  const displayName = summary?.personaName || identifierFor(account)
  const initial = displayName.trim().charAt(0).toUpperCase() || '?'

  // Not a native-disabled control - it stays a real, pressable row (rerouted to the upsell modal
  // or the re-auth modal instead of switching) matching every other gamer-gated control's
  // convention - a native `disabled` swallows the click entirely, which would leave a locked
  // account with no way to explain itself. `isSwitching` is the one exception - a row already
  // mid-switch ignores further clicks rather than re-dispatching the pre-flight check.
  const handleActivate = () => {
    if (isSwitching) return
    if (needsReauth) {
      onReauth(accountKey)
    } else if (isOverCap) {
      onUpsell()
    } else {
      onSwitch(accountKey)
    }
  }

  return (
    <div
      className={cn(
        'flex w-full items-center gap-2 rounded-2xl px-2 py-1.5 text-left outline-none transition-colors',
        'hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus cursor-pointer',
        isActive && 'bg-accent-soft',
        isSwitching && 'pointer-events-none opacity-70',
      )}
      role='button'
      tabIndex={isSwitching ? -1 : 0}
      onClick={handleActivate}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') handleActivate()
      }}
    >
      <span className={cn('relative shrink-0', (isOverCap || needsReauth) && 'opacity-50')}>
        <Avatar size='sm'>
          {summary?.avatarUrl ? <Avatar.Image alt={displayName} src={summary.avatarUrl} /> : null}
          <Avatar.Fallback>{initial}</Avatar.Fallback>
        </Avatar>
        {isActiveAutomation ? (
          <span
            aria-hidden
            className='absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-accent ring-2 ring-background'
          />
        ) : null}
      </span>
      <div
        className={cn('flex min-w-0 flex-1 flex-col', (isOverCap || needsReauth) && 'opacity-50')}
      >
        <span className='truncate text-sm font-medium text-foreground'>{displayName}</span>
        <span className='flex min-w-0 items-center gap-1.5 text-xs text-muted'>
          {/* `truncate` lives on this inner span, not the flex row above - `text-overflow:
              ellipsis` only affects text content, so applying it to the row directly would just
              hard-clip the badge (a nested pill element) with no ellipsis instead of shrinking
              the mode label to make room for it. */}
          <span className='truncate'>
            {account.mode === 'agent'
              ? t('dashboard.sidebar.accountSwitcher.modeAgent')
              : t('dashboard.sidebar.accountSwitcher.modeLocal')}
          </span>
          {isOverCap ? <TierBadge className='shrink-0' tier='gamer' /> : null}
          {needsReauth ? (
            <AppTooltip.Root delay={300}>
              <AppTooltip.Trigger>
                <span className='flex shrink-0 items-center gap-1 rounded-full bg-danger/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest leading-3.5 text-danger'>
                  <TbAlertTriangle fontSize={10} />
                  {t('dashboard.sidebar.accountSwitcher.reauth.badge')}
                </span>
              </AppTooltip.Trigger>
              <AppTooltip.Content placement='top'>
                {t('dashboard.sidebar.accountSwitcher.reauth.tooltip')}
              </AppTooltip.Content>
            </AppTooltip.Root>
          ) : null}
        </span>
      </div>
      {isSwitching ? (
        <Spinner className='shrink-0' size='sm' />
      ) : (
        <button
          aria-label={`Sign out of ${displayName}`}
          className='shrink-0 rounded-md p-1.5 text-muted outline-none transition-colors hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus cursor-pointer'
          type='button'
          onClick={event => {
            event.stopPropagation()
            onRequestSignOut(accountKey, displayName, isActiveAutomation)
          }}
        >
          <TbLogout fontSize={16} />
        </button>
      )}
    </div>
  )
}

interface PendingSignOut {
  key: AccountKey
  displayName: string
}

// Dropdown/listbox off the sidebar avatar. Uses Popover, not Dropdown/Menu, since each row needs a
// nested interactive sign-out button, which fights react-aria's Menu item semantics. Controlled
// (isOpen/onOpenChange) since switching accounts or opening the add-account modal need to close
// this popover programmatically.
//
// This is the app's only sign-out entry point. Sign-out is decided here rather than per-row: a row
// with no automation running signs out immediately, but a row whose account has idling/
// card-farming/achievement-unlocking actually running asks for confirmation first - losing live
// automation state is the one sign-out consequence worth a pause.
interface AccountSwitcherProps {
  // Driven by `sidebarStore` (Ctrl+W, see Sidebar.tsx/useDashboardShortcuts.ts) - renders the
  // trigger as an avatar-only button (name moved into a hover tooltip) so this still fits a
  // collapsed icon-rail sidebar. The popover content itself (the account list) is unchanged either
  // way - only the trigger's own layout differs.
  compact?: boolean
}

export const AccountSwitcher = ({ compact = false }: AccountSwitcherProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [pendingSignOut, setPendingSignOut] = useState<PendingSignOut | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [switchingKey, setSwitchingKey] = useState<AccountKey | null>(null)
  const accounts = useSessionStore(state => state.accounts)
  const activeAccountKey = useSessionStore(state => state.activeAccountKey)
  const activeAccount = useSessionStore(state => state.account)
  const switchAccount = useSessionStore(state => state.switchAccount)
  const setShowSteamWarning = useSteamWarningStore(state => state.setShowSteamWarning)
  const openAddAccount = useAddAccountModalStore(state => state.open)
  const openReauth = useReauthModalStore(state => state.open)
  const reauthEntries = useAgentReauthStore(state => state.entries)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)
  const summaries = useAccountSummaryStore(state => state.summaries)
  const activeSummary = useAccountSummaryStore(state =>
    activeAccountKey ? state.summaries[activeAccountKey] : undefined,
  )
  const allowedAccountKeys = computeAllowedAccountKeys(accounts, subscriptionTier)

  if (!activeAccount) return null

  const activeDisplayName = activeSummary?.personaName || identifierFor(activeAccount)
  const activeInitial = activeDisplayName.trim().charAt(0).toUpperCase() || '?'

  // Switching accounts always lands on the games page, regardless of which page triggered the
  // switch - a page scoped to the previous account (e.g. card farming mid-run) has no meaning for
  // the newly active one. The toast is the only switch feedback beyond the triggering row's own
  // `isSwitching` spinner - a fullscreen loader would be too blocking for what's usually just a
  // synchronous store update.
  //
  // Local-mode accounts require a real running local Steam client, so this pre-flights
  // `is_steam_running` - switching into one while Steam is down would silently land the user on an
  // account that can't do anything CLI-mode-dependent. A toast fires unconditionally, and
  // `setShowSteamWarning(true)` additionally raises the app's persistent Steam-down modal (dev-gated
  // by its own `is_dev` check). Fails toward blocking if the check itself errors.
  const handleSwitch = async (key: AccountKey) => {
    if (key === activeAccountKey) return
    const target = accounts[key]
    if (target.mode === 'local') {
      const steamIsRunning = await invoke<boolean>('is_steam_running').catch(error => {
        console.error('Error in (is_steam_running):', error)
        return false
      })
      if (!steamIsRunning) {
        toast.warning(t('dashboard.sidebar.accountSwitcher.steamRequired'))
        setShowSteamWarning(true)
        return
      }
    }
    switchAccount(key)
    const displayName = summaries[key]?.personaName || identifierFor(target)
    logFrontendInfo('accountSwitcher', 'switched active account', { mode: target.mode })
    toast.info(t('dashboard.sidebar.accountSwitcher.switched', { name: displayName }))
    void router.push('/dashboard')
  }

  const performSignOut = async (key: AccountKey) => {
    setIsSigningOut(true)
    const wasActive = key === activeAccountKey
    const { accountsRemaining, cleanupFailed } = await signOutAccount(key)
    if (cleanupFailed) {
      toast.danger(t('dashboard.sidebar.signOut.error'))
    }
    if (accountsRemaining === 0) {
      router.replace('/')
    } else if (wasActive) {
      // Signing out the active account auto-switches sessionStore to another signed-in one (see
      // clearAccount in sessionStore.ts) - same feedback as an explicit switch via handleSwitch,
      // since from the user's perspective this is a switch too, just one they didn't pick a target
      // for themselves.
      const { account: newActiveAccount, activeAccountKey: newActiveKey } =
        useSessionStore.getState()
      if (newActiveAccount && newActiveKey) {
        const displayName =
          useAccountSummaryStore.getState().summaries[newActiveKey]?.personaName ||
          identifierFor(newActiveAccount)
        toast.info(t('dashboard.sidebar.accountSwitcher.switched', { name: displayName }))
      }
    }
    setIsSigningOut(false)
    setPendingSignOut(null)
  }

  const handleRequestSignOut = (
    key: AccountKey,
    displayName: string,
    hasActiveAutomation: boolean,
  ) => {
    setIsOpen(false)
    if (hasActiveAutomation) {
      setPendingSignOut({ key, displayName })
    } else {
      void performSignOut(key)
    }
  }

  return (
    <>
      <Popover.Root isOpen={isOpen} onOpenChange={setIsOpen}>
        {compact ? (
          <AppTooltip.Root delay={300}>
            <AppTooltip.Trigger>
              <Popover.Trigger
                aria-label='Switch account'
                className='flex shrink-0 items-center justify-center rounded-lg p-1.5 outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus'
              >
                <Avatar size='sm'>
                  {activeSummary?.avatarUrl ? (
                    <Avatar.Image alt={activeDisplayName} src={activeSummary.avatarUrl} />
                  ) : null}
                  <Avatar.Fallback>{activeInitial}</Avatar.Fallback>
                </Avatar>
              </Popover.Trigger>
            </AppTooltip.Trigger>
            <AppTooltip.Content placement='right'>{activeDisplayName}</AppTooltip.Content>
          </AppTooltip.Root>
        ) : (
          <Popover.Trigger
            aria-label='Switch account'
            className={cn(
              'flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground',
              'outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus',
            )}
          >
            <Avatar size='sm'>
              {activeSummary?.avatarUrl ? (
                <Avatar.Image alt={activeDisplayName} src={activeSummary.avatarUrl} />
              ) : null}
              <Avatar.Fallback>{activeInitial}</Avatar.Fallback>
            </Avatar>
            <span className='min-w-0 flex-1 truncate text-left'>{activeDisplayName}</span>
            <TbChevronDown className='shrink-0' fontSize={16} />
          </Popover.Trigger>
        )}
        <Popover.Content placement='top'>
          <Popover.Dialog className='flex w-72 flex-col gap-1 p-2'>
            {Object.entries(accounts).map(([key, account]) => (
              <AccountRow
                key={key}
                account={account}
                accountKey={key}
                isActive={key === activeAccountKey}
                isOverCap={!allowedAccountKeys.has(key)}
                isSwitching={switchingKey === key}
                needsReauth={Boolean(reauthEntries[key])}
                onReauth={reauthKey => {
                  setIsOpen(false)
                  openReauth(reauthKey)
                }}
                onRequestSignOut={handleRequestSignOut}
                onSwitch={switchKey => {
                  void (async () => {
                    setSwitchingKey(switchKey)
                    try {
                      await handleSwitch(switchKey)
                    } finally {
                      setSwitchingKey(null)
                    }
                    setIsOpen(false)
                  })()
                }}
                onUpsell={() => {
                  setIsOpen(false)
                  openProModalWithTier('gamer')
                }}
              />
            ))}
            <div className='my-1 border-t border-border' />
            <button
              className='flex w-full items-center gap-2 rounded-full px-2 py-1.5 text-left text-xs font-medium text-muted outline-none transition-colors hover:bg-surface-hover cursor-pointer'
              type='button'
              onClick={() => {
                setIsOpen(false)
                openAddAccount()
              }}
            >
              <TbPlus fontSize={14} />
              {t('dashboard.sidebar.accountSwitcher.addAccount.trigger')}
            </button>
          </Popover.Dialog>
        </Popover.Content>
      </Popover.Root>

      <AlertDialog
        isOpen={pendingSignOut !== null}
        onOpenChange={open => {
          if (!open) setPendingSignOut(null)
        }}
      >
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {t('dashboard.sidebar.signOut.confirmTitle')}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {t('dashboard.sidebar.signOut.confirmDescription', {
                  name: pendingSignOut?.displayName,
                })}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  isDisabled={isSigningOut}
                  variant='secondary'
                  onPress={() => setPendingSignOut(null)}
                >
                  {t('common.actions.cancel')}
                </Button>
                <Button
                  isPending={isSigningOut}
                  variant='danger'
                  onPress={() => pendingSignOut && performSignOut(pendingSignOut.key)}
                >
                  {t('common.actions.signOut')}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  )
}
