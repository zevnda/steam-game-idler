import { useUserStore } from '@/shared/stores'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export const AuthProvider = ({ children }: React.PropsWithChildren) => {
  const router = useRouter()
  const { userSummary } = useUserStore()

  useEffect(() => {
    if (!userSummary.steamId || userSummary.steamId === '') {
      router.replace('/')
    }
  }, [userSummary, router])

  // Show nothing while redirecting
  if (!userSummary.steamId || userSummary.steamId === '') {
    return null
  }

  return <>{children}</>
}
