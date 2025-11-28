import type { ReactElement } from 'react'

import { Spinner } from '@heroui/react'
import { useStateStore } from '@/stores/stateStore'
import { useUserStore } from '@/stores/userStore'

import Dashboard from '@/components/layout/Dashboard'
import SignIn from '@/components/layout/SignIn'
import ChangelogModal from '@/components/ui/ChangelogModal'
import SteamWarning from '@/components/ui/SteamWarning'
import useWindow from '@/hooks/layout/useWindow'

export default function Window(): ReactElement {
  const userSummary = useUserStore(state => state.userSummary)
  const loadingUserSummary = useStateStore(state => state.loadingUserSummary)

  useWindow()

  if (loadingUserSummary)
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Spinner variant='simple' />
      </div>
    )

  if (!userSummary)
    return (
      <>
        <SignIn />
        <ChangelogModal />
      </>
    )

  return (
    <div className='min-h-calc'>
      <Dashboard />
      <SteamWarning />
      <ChangelogModal />
    </div>
  )
}
