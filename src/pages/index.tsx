import { useState } from 'react'
import SignInScreen from '@/features/agent-sign-in/components/SignInScreen'
import LocalSignInScreen from '@/features/local-sign-in/components/LocalSignInScreen'
import SignInLanding from '@/features/sign-in-landing/components/SignInLanding'
import { AuthLayout } from '@/shared/components/AuthLayout'
import { UpdateButton } from '@/shared/components/UpdateButton'
import { useUpdateStore } from '@/shared/stores/updateStore'

type SignInMethod = 'landing' | 'agent' | 'local'

const Index = () => {
  // useCheckForUpdates itself lives in _app.tsx now (see its comment) so it keeps running
  // regardless of route - updateAvailable is still read from the shared store here for
  // UpdateButton's placement (see UpdateButton's doc comment on that gap).
  const updateAvailable = useUpdateStore(state => state.updateAvailable)
  const [signInMethod, setSignInMethod] = useState<SignInMethod>('landing')

  return (
    <>
      {/* useSessionBootstrap is root-mounted in `_app.tsx` now (see its own doc comment) - this
          page never mounts at all until that hook has already resumed/re-validated any persisted
          session and settled out of 'checking', so by the time this renders, landing here for real
          means there's genuinely no session to resume (or it's fully signed out). */}
      <AuthLayout>
        {signInMethod === 'landing' ? (
          <SignInLanding
            onSelectAgent={() => setSignInMethod('agent')}
            onSelectLocal={() => setSignInMethod('local')}
          />
        ) : signInMethod === 'agent' ? (
          <SignInScreen onBack={() => setSignInMethod('landing')} />
        ) : (
          <LocalSignInScreen onBack={() => setSignInMethod('landing')} />
        )}
      </AuthLayout>
      {/* Pre-sign-in placement - DashboardShell mounts the same button for signed-in users, see
          UpdateButton's doc comment. Positioned below the global Titlebar (h-10) so it doesn't
          sit under the window control buttons. */}
      {updateAvailable ? (
        <div className='fixed right-4 top-14'>
          <UpdateButton />
        </div>
      ) : null}
    </>
  )
}

export default Index
