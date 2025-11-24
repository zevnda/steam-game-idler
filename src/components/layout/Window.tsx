import type { ReactElement } from 'react'

import { Spinner } from '@heroui/react'

import { useStateContext } from '@/components/contexts/StateContext'
import { useUserContext } from '@/components/contexts/UserContext'
import Dashboard from '@/components/layout/Dashboard'
import SignIn from '@/components/layout/SignIn'
import SteamWarning from '@/components/ui/SteamWarning'
import useWindow from '@/hooks/layout/useWindow'

export default function Window(): ReactElement {
  const { userSummary } = useUserContext()
  const { loadingUserSummary } = useStateContext()
  useWindow()

  if (loadingUserSummary)
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Spinner variant='simple' />
      </div>
    )

  if (!userSummary) return <SignIn />

  return (
    <div className='bg-sidebar min-h-calc'>
      <Dashboard />
      <SteamWarning />
    </div>
  )
}
