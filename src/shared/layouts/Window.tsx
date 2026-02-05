import type { ReactElement } from 'react'
import { Spinner } from '@heroui/react'
import Dashboard from '@/shared/layouts/Dashboard'
import useWindow from '@/shared/layouts/hooks/useWindow'
import SignIn from '@/shared/layouts/SignIn'
import { useStateStore } from '@/shared/stores/stateStore'
import { useUserStore } from '@/shared/stores/userStore'
import ChangelogModal from '@/shared/ui/ChangelogModal'
import GoProModal from '@/shared/ui/pro/GoProModal'
import SteamWarning from '@/shared/ui/SteamWarning'

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
      <GoProModal />
      <ChangelogModal />
    </div>
  )
}
