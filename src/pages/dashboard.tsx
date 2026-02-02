import { useLoaderStore, useUserStore } from '@/shared/stores'
import { PrimaryButton, AuthProvider } from '@/shared/ui'
import { useEffect } from 'react'

export const Dashboard = () => {
  const { hideLoader } = useLoaderStore()
  const setUserSummary = useUserStore(state => state.setUserSummary)

  useEffect(() => {
    setTimeout(() => hideLoader(), 750)
  }, [hideLoader])

  const handleSignOut = () => {
    setUserSummary({
      steamId: '',
      personaName: '',
      avatar: '',
    })
  }

  return (
    <AuthProvider>
      <PrimaryButton className='mt-20' onPress={handleSignOut}>
        Sign Out
      </PrimaryButton>
    </AuthProvider>
  )
}

export default Dashboard
