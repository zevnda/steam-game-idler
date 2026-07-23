import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Modal } from '@heroui/react'
import { errorMessageKey } from '@/features/agent-sign-in/utils/errorMessageKey'
import { useAddAccountModalStore } from '@/shared/stores/addAccountModalStore'
import { useReauthModalStore } from '@/shared/stores/reauthModalStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'

interface ReauthModalBodyProps {
  username: string
  onClose: () => void
}

type ReconnectPhase =
  { kind: 'idle' } | { kind: 'reconnecting' } | { kind: 'failed'; errorCode: string }

// Re-establishes one specific already-known agent-mode account's session (flagged by
// agentReauthStore after a concurrent-login kick) via `agent_login_with_token`, the same
// saved-refresh-token resume every account already uses on app boot (useSessionBootstrap.ts's
// `resumeAccount`), rather than asking for a password again: the daemon process for this account
// is still alive (see steam_agent::process::handle_session_superseded's doc comment - deliberately
// not killed), just logged off, so resuming it re-establishes the CM connection/logon and - since
// only one session of this login type can be active - takes the account back from whichever device
// is currently holding it, the same way that device took it from this one.
//
// "Use a different sign-in method" defers entirely to the normal AddAccountModal flow (same one
// "+ Add another account" opens) rather than a locked-username password form of its own - that's
// the only path that actually lets the user reach Legacy Sign-in (a different sign-in mode
// entirely, not just different credentials for this same agent-mode account), which is exactly
// what methodExplainer below is telling them to consider. Also used as the automatic fallback when
// there's no saved token left to reconnect with (`agent_no_saved_credentials`) - nothing left to
// retry in that case either. On a successful reconnect, agentReauthStore's flag clears itself via
// useAgentReauthWatcher's `loggedOn: true` branch once the daemon's next status_changed event
// confirms it - not from here directly.
const ReauthModalBody = ({ username, onClose }: ReauthModalBodyProps) => {
  const { t } = useTranslation()
  const [reconnect, setReconnect] = useState<ReconnectPhase>({ kind: 'idle' })
  const openAddAccount = useAddAccountModalStore(state => state.open)

  const switchSignInMethod = () => {
    onClose()
    openAddAccount()
  }

  const handleReconnect = async () => {
    setReconnect({ kind: 'reconnecting' })
    try {
      const resumed = await invoke<boolean>('agent_login_with_token', { username })
      if (resumed) {
        onClose()
        return
      }
      setReconnect({ kind: 'failed', errorCode: 'agent_resume_failed' })
    } catch (error) {
      const errorCode = String(error)
      setReconnect({ kind: 'failed', errorCode })
      if (errorCode === 'agent_no_saved_credentials') switchSignInMethod()
    }
  }

  return (
    <div className='flex flex-col items-center gap-4'>
      {/* Explains why this dialog appeared unprompted - this modal can auto-open the instant
          useAgentReauthWatcher detects the kick (see that hook), not just from clicking the
          switcher badge, so it can't assume the user already knows why they're seeing this.
          Mirrors SteamWarning.tsx's title+description framing for the same reason. */}
      <p className='text-center text-sm text-muted'>
        {t('dashboard.sidebar.accountSwitcher.reauth.modalDescription', { account: username })}
      </p>
      <p className='text-center text-sm text-muted'>
        {t('dashboard.sidebar.accountSwitcher.reauth.methodExplainer')}
      </p>
      {reconnect.kind === 'failed' ? (
        <Alert className='w-full' status='danger'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              {t(errorMessageKey(reconnect.errorCode), { code: reconnect.errorCode })}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <Button
        className='w-full'
        isPending={reconnect.kind === 'reconnecting'}
        onPress={() => void handleReconnect()}
      >
        {t('dashboard.sidebar.accountSwitcher.reauth.reconnect')}
      </Button>
      <Button className='w-full' variant='secondary' onPress={switchSignInMethod}>
        {t('dashboard.sidebar.accountSwitcher.reauth.useDifferentMethod')}
      </Button>
    </div>
  )
}

// Rendered once in DashboardShell, driven entirely by reauthModalStore - mirrors AddAccountModal's
// always-mounted-but-store-driven shape. Resolves the target username from sessionStore rather
// than trusting reauthModalStore to carry it, since the account could in principle have been
// signed out entirely between the badge being flagged and the row being clicked.
export const ReauthModal = () => {
  const { t } = useTranslation()
  const accountKey = useReauthModalStore(state => state.accountKey)
  const close = useReauthModalStore(state => state.close)
  const account = useSessionStore(state => (accountKey ? state.accounts[accountKey] : undefined))
  const username = account?.mode === 'agent' ? account.username : null

  return (
    <Modal
      isOpen={Boolean(accountKey) && username !== null}
      onOpenChange={open => !open && close()}
    >
      <Modal.Backdrop>
        <Modal.Container size='md'>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {t('dashboard.sidebar.accountSwitcher.reauth.modalTitle')}
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>
              {username ? <ReauthModalBody username={username} onClose={close} /> : null}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
