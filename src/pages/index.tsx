import { useState } from 'react'
import SignInScreen from '@/features/agent-sign-in/components/SignInScreen'
import LocalSignInScreen from '@/features/local-sign-in/components/LocalSignInScreen'
import SignInLanding from '@/features/sign-in-landing/components/SignInLanding'
import { AuthLayout } from '@/shared/components/AuthLayout'

type SignInMethod = 'landing' | 'agent' | 'local'

const Index = () => {
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
    </>
  )
}

export default Index
