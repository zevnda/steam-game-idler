import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Spinner, toast } from '@heroui/react'
import { useRouter } from 'next/router'
import CredentialsForm from '@/features/agent-sign-in/components/CredentialsForm'
import GuardCodeForm from '@/features/agent-sign-in/components/GuardCodeForm'
import QrSignInPanel from '@/features/agent-sign-in/components/QrSignInPanel'
import { useAgentQrSignIn } from '@/features/agent-sign-in/hooks/useAgentQrSignIn'
import { useAgentSignIn } from '@/features/agent-sign-in/hooks/useAgentSignIn'
import AccountPicker from '@/features/local-sign-in/components/AccountPicker'
import { useLocalSignIn } from '@/features/local-sign-in/hooks/useLocalSignIn'
import SignInLanding from '@/features/sign-in-landing/components/SignInLanding'
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

// Reuses the same building blocks the sign-in landing page uses (SignInLanding, CredentialsForm/
// GuardCodeForm, AccountPicker, and the useAgentSignIn/useLocalSignIn hooks) completely unmodified
// except for SignInLanding's new embedded/localDisabled props. On success
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
    // Stacked rather than SignInScreen.tsx's side-by-side columns - the modal is a narrow, vertical
    // context (unlike the full-width standalone sign-in page), so credentials sit above a divider
    // above the QR panel instead of competing for horizontal space.
    return (
      <div className='flex flex-col items-center gap-6'>
        <CredentialsForm
          errorCode={agent.errorCode}
          isSubmitting={agent.phase.kind === 'submitting'}
          onSubmit={agent.signIn}
        />
        <div className='h-px w-full bg-border' />
        <QrSignInPanel errorCode={qr.errorCode} phase={qr.phase} onRetry={qr.start} />
      </div>
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
      <AccountPicker
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
      <Modal.Backdrop>
        <Modal.Container size='md'>
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
