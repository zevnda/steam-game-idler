import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, Modal, Spinner, toast } from '@heroui/react'
import { useRouter } from 'next/router'
import GuardCodeForm from '@/features/agent-sign-in/components/GuardCodeForm'
import SteamSignInForm from '@/features/agent-sign-in/components/SteamSignInForm'
import { useAgentQrSignIn } from '@/features/agent-sign-in/hooks/useAgentQrSignIn'
import { useAgentSignIn } from '@/features/agent-sign-in/hooks/useAgentSignIn'
import AccountPicker from '@/features/local-sign-in/components/AccountPicker'
import { useLocalSignIn } from '@/features/local-sign-in/hooks/useLocalSignIn'
import SignInLanding from '@/features/sign-in-landing/components/SignInLanding'
import BackButton from '@/shared/components/BackButton'
import { ModalDragRegion } from '@/shared/components/ModalDragRegion'
import { useAddAccountModalStore } from '@/shared/stores/addAccountModalStore'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { resolveAccountSummary } from '@/shared/utils/resolveAccountSummary'
import { hasGamerAccess, maxConcurrentAgentAccounts } from '@/shared/utils/subscriptionAccess'

type AddAccountPhase = 'landing' | 'agent' | 'local'

interface AddAccountModalBodyProps {
  onClose: () => void
}

interface StepHeaderProps {
  title: string
  onBack: () => void
  // Keeps the button's space, so the title doesn't jump when it's hidden
  isBackHidden?: boolean
}

// The back arrow and title share one row here, unlike the sign-in screen's separate rows, so the
// Steam sign-in step fits at the window's minimum height without the modal having to scroll. The
// right padding keeps a long translated title clear of the modal's close button.
const StepHeader = ({ title, onBack, isBackHidden = false }: StepHeaderProps) => (
  <div className='flex items-center gap-3 pr-8'>
    <div className={cn('shrink-0', isBackHidden && 'invisible')}>
      <BackButton inline onPress={onBack} />
    </div>
    <h2 className='min-w-0 text-[28px] font-bold tracking-tight text-foreground'>{title}</h2>
  </div>
)

// Reuses the same building blocks the sign-in screen uses (SignInLanding, SteamSignInForm,
// GuardCodeForm, AccountPicker, and the useAgentSignIn/useLocalSignIn hooks), so the two look the
// same; SignInLanding's embedded prop only drops the parts that don't apply here. On success
// this closes the modal and routes to /dashboard, mirroring AccountSwitcher's post-switch toast +
// navigation - useAgentSignIn/useLocalSignIn's setAccount call already made the new account active
// by the time that fires.
const AddAccountModalBody = ({ onClose }: AddAccountModalBodyProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const [phase, setPhase] = useState<AddAccountPhase>('landing')
  const hasLocalAccount = useSessionStore(state =>
    Object.values(state.accounts).some(account => account.mode === 'local'),
  )
  const agentAccountCount = useSessionStore(
    state => Object.values(state.accounts).filter(account => account.mode === 'agent').length,
  )
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const agentAccountLimit = maxConcurrentAgentAccounts(subscriptionTier)
  const agentCapReached = agentAccountCount >= agentAccountLimit
  const isGamerTier = hasGamerAccess(subscriptionTier)
  // Split by whether a tier upgrade would actually help - a Gamer account hitting its own
  // sanity-capped ceiling (10) has nothing left to upsell, so that case stays a real
  // native-disabled button. A free/casual account hitting its lower cap is a pro-gated block:
  // per SignInLanding's doc comment (and every other gamer-gated control in this codebase), the
  // button stays real/pressable with a Gamer badge and opens the upgrade modal on press instead
  // of a native-disabled control that would swallow the click entirely.
  const agentHardDisabled = agentCapReached && isGamerTier
  const agentUpsell = agentCapReached && !isGamerTier
  const openProModalWithTier = useProModalStore(state => state.openWithTier)
  const agent = useAgentSignIn()
  const qr = useAgentQrSignIn()
  const local = useLocalSignIn()
  // setAccount (called by useAgentSignIn/useLocalSignIn on success, see sessionStore.ts) already
  // made the new account active before this fires, so `account`/`activeAccountKey` here already
  // point at the newly added account - same lookup AccountSwitcher's switch toast uses.
  const newAccount = useSessionStore(state => state.account)
  const newAccountKey = useSessionStore(state => state.activeAccountKey)

  // Mirrors AccountSwitcher's post-switch behavior: land on the games page and surface a toast.
  // Unlike the switch toast, a freshly added account has never been resolved into
  // accountSummaryStore yet, so this awaits resolveAccountSummary directly rather than reading a
  // (guaranteed-empty) store entry - otherwise the toast would show the raw identifier instead of
  // the persona name. resolveAccountSummary de-dupes against useAccountSummaries' own background
  // pass for the same key, so this doesn't double-fetch.
  const announceAdded = async () => {
    if (!newAccount || !newAccountKey) return
    const identifier = newAccount.mode === 'agent' ? newAccount.username : newAccount.steamId
    let displayName = identifier
    try {
      const summary = await resolveAccountSummary(newAccountKey, newAccount)
      if (summary?.personaName) displayName = summary.personaName
    } catch (error) {
      console.error('Error resolving newly added account summary:', error)
    }
    toast.success(t('dashboard.sidebar.accountSwitcher.addAccount.added', { name: displayName }))
    void router.push('/dashboard')
    onClose()
  }

  useEffect(() => {
    if (agent.phase.kind === 'success') void announceAdded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.phase.kind])

  useEffect(() => {
    if (qr.phase.kind === 'success') void announceAdded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qr.phase.kind])

  useEffect(() => {
    if (local.phase === 'success') void announceAdded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.phase])

  // Mirrors SignInScreen.tsx's QR lifecycle: only start the QR attempt once the user has actually
  // chosen agent mode (not while still on the landing phase), and tear it down again on leaving
  // the agent phase or unmounting, same as the standalone sign-in screen.
  useEffect(() => {
    if (phase !== 'agent') return
    qr.start()
    return () => {
      qr.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Whichever method completes first wins - see SignInScreen.tsx for why the credentials round
  // trip has no equivalent cancel in the other direction.
  useEffect(() => {
    if (agent.phase.kind === 'success') qr.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.phase.kind])

  if (phase === 'agent') {
    if (agent.phase.kind === 'guardCode') {
      return (
        <GuardCodeForm
          detail={agent.phase.detail}
          guardType={agent.phase.guardType}
          isIncorrect={agent.phase.isIncorrect}
          isSubmitting={agent.phase.isSubmitting}
          onCancel={agent.cancel}
          onSubmit={agent.submitGuardCode}
        />
      )
    }
    if (agent.phase.kind === 'success' || qr.phase.kind === 'success') {
      return (
        <div className='flex justify-center py-8'>
          <Spinner size='lg' />
        </div>
      )
    }
    return (
      <SteamSignInForm
        errorCode={agent.errorCode}
        header={<StepHeader title={t('auth.signIn.title')} onBack={() => setPhase('landing')} />}
        isSubmitting={agent.phase.kind === 'submitting'}
        qrErrorCode={qr.errorCode}
        qrPhase={qr.phase}
        onQrNewCode={qr.requestNewCode}
        onQrRetry={qr.start}
        onSubmit={agent.signIn}
      />
    )
  }

  if (phase === 'local') {
    if (local.phase === 'success') {
      return (
        <div className='flex justify-center py-8'>
          <Spinner size='lg' />
        </div>
      )
    }
    return (
      <div className='flex flex-col gap-4'>
        <StepHeader
          isBackHidden={local.phase === 'continuing'}
          title={t('auth.localSignIn.title')}
          onBack={() => setPhase('landing')}
        />
        <AccountPicker
          embedded
          accounts={local.accounts}
          actionErrorCode={local.actionErrorCode}
          isContinuing={local.phase === 'continuing'}
          isLoading={local.phase === 'loading'}
          selectedSteamId={local.selectedSteamId}
          summaryErrorCode={local.summaryErrorCode}
          onContinue={local.continueSignIn}
          onRefresh={local.refresh}
          onSelect={local.selectAccount}
        />
      </div>
    )
  }

  const agentDisabledReason = agentCapReached
    ? isGamerTier
      ? t('dashboard.sidebar.accountSwitcher.addAccount.capReachedMax')
      : t('dashboard.sidebar.accountSwitcher.addAccount.capReached', {
          count: agentAccountLimit,
          tier:
            subscriptionTier === 'casual'
              ? t('proMode.tier.casual.name')
              : t('dashboard.sidebar.tier.free'),
        })
    : undefined

  return (
    <SignInLanding
      embedded
      agentDisabled={agentHardDisabled}
      agentDisabledReason={agentDisabledReason}
      agentUpsell={agentUpsell}
      localDisabled={hasLocalAccount}
      onAgentUpsell={() => openProModalWithTier('gamer')}
      onSelectAgent={() => setPhase('agent')}
      onSelectLocal={() => setPhase('local')}
    />
  )
}

// Rendered once in DashboardShell, driven entirely by addAccountModalStore - mirrors SettingsModal's
// always-mounted-but-store-driven shape. The body above is only actually mounted while isOpen, not
// gated inside useAgentSignIn/useLocalSignIn themselves, so those hooks' effects (the agent event
// listener, the local account fetch) don't run for the whole app lifetime - matching how
// useSettingsModal already gates its own fetch on the modal being open, just via mount/unmount
// instead of an internal `if`. Each open starts back at the landing phase since the body remounts
// fresh every time.
export const AddAccountModal = () => {
  const isOpen = useAddAccountModalStore(state => state.isOpen)
  const close = useAddAccountModalStore(state => state.close)

  return (
    <Modal isOpen={isOpen} onOpenChange={open => !open && close()}>
      <Modal.Backdrop className='add-account-backdrop'>
        <ModalDragRegion />
        {/* `outside` so a dialog too tall for the window scrolls with the backdrop. Scrolling inside
            the body would clip the account list, whose scrollbar sits in the dialog's padding.
            `sm:py-4` trims HeroUI's 40px above and below so the Steam sign-in step fits at the
            window's minimum height. */}
        <Modal.Container className='sm:py-4' scroll='outside' size='md'>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>{isOpen ? <AddAccountModalBody onClose={close} /> : null}</Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
