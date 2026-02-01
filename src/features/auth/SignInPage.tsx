import { PrimaryButton } from '@/shared/ui'
import { useRuntimeConfig } from '@/shared/ui/providers/ConfigProvider'
import { useRouter } from 'next/navigation'

export const SignInPage = () => {
  const { isPortable } = useRuntimeConfig()
  const router = useRouter()

  return (
    <div>
      <p>{isPortable ? 'Portable Mode' : 'Standard Mode'}</p>
      <PrimaryButton onPress={() => router.push('/dashboard')}>Sign In</PrimaryButton>
    </div>
  )
}
