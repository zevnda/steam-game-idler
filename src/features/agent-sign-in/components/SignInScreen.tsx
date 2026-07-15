import { useEffect } from 'react'
import { useAgentQrSignIn } from '../hooks/useAgentQrSignIn'
import { useAgentSignIn } from '../hooks/useAgentSignIn'
import CredentialsForm from './CredentialsForm'
import GuardCodeForm from './GuardCodeForm'
import QrSignInPanel from './QrSignInPanel'
import { Spinner } from '@heroui/react'
import { useRouter } from 'next/router'
import AuthCard from '@/shared/components/AuthCard'
import BackButton from '@/shared/components/BackButton'

interface SignInScreenProps {
  onBack: () => void
}

const SignInScreen = ({ onBack }: SignInScreenProps) => {
  const router = useRouter()
  const { phase, errorCode, signIn, submitGuardCode, cancel } = useAgentSignIn()
  const qr = useAgentQrSignIn()

  // Lifted here (rather than owned by `QrSignInPanel`) so the QR attempt keeps running in the
  // background for the whole screen's lifetime - both sign-in methods are shown side by side and
  // are live concurrently, exactly like Steam's own sign-in page, so switching to the guard-code
  // view (which hides the QR column) must not tear the attempt down.
  useEffect(() => {
    qr.start()
    return () => {
      qr.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase.kind === 'success' || qr.phase.kind === 'success') {
      router.push('/dashboard')
    }
  }, [phase.kind, qr.phase.kind, router])

  // Whichever method the user actually completes first wins - the other attempt is now pointless
  // (this screen is about to unmount anyway), so tear it down explicitly rather than leaving it to
  // resolve later into a second, unwanted account. `login`'s in-flight credentials round trip has
  // no equivalent cancel - if it resolves after QR already succeeded, that's an accepted pre-
  // existing gap, not something this step needs to close.
  useEffect(() => {
    if (phase.kind === 'success') {
      qr.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.kind])

  return (
    <>
      {/* Only offered at the idle/submitting phases - once guard-code is in play, cancel()
          (wired to GuardCodeForm's own cancel control) is the way out, not this button, since
          abandoning that phase here wouldn't clean up the in-flight attempt. */}
      {phase.kind === 'form' || phase.kind === 'submitting' ? (
        <BackButton onPress={onBack} />
      ) : null}
      {phase.kind === 'guardCode' ? (
        <GuardCodeForm
          detail={phase.detail}
          guardType={phase.guardType}
          isIncorrect={phase.isIncorrect}
          isSubmitting={phase.isSubmitting}
          onCancel={cancel}
          onSubmit={submitGuardCode}
        />
      ) : phase.kind === 'success' ? (
        <Spinner size='lg' />
      ) : (
        <AuthCard className='w-auto'>
          <div className='flex items-stretch gap-6'>
            <CredentialsForm
              errorCode={errorCode}
              isSubmitting={phase.kind === 'submitting'}
              onSubmit={signIn}
            />
            <div className='w-px self-stretch bg-border' />
            <QrSignInPanel errorCode={qr.errorCode} phase={qr.phase} onRetry={qr.start} />
          </div>
        </AuthCard>
      )}
    </>
  )
}

export default SignInScreen
