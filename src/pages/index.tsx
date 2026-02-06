import { Spinner } from '@heroui/react'
import {
  useAutoIdleGames,
  useCheckForPro,
  useCheckForUpdates,
  useContextMenu,
  useFreeGames,
  useInit,
  useInitSettings,
  useSteamMonitor,
  useThemes,
  useZoomControls,
} from '@/shared/hooks'
import { Dashboard, SignIn } from '@/shared/layouts'
import { useStateStore, useUserStore } from '@/shared/stores'
import { ChangelogModal, GoProModal, SteamWarning } from '@/shared/ui'

const Index = () => {
  const userSummary = useUserStore(state => state.userSummary)
  const loadingUserSummary = useStateStore(state => state.loadingUserSummary)

  useInit()
  useThemes()
  useInitSettings()
  useCheckForUpdates()
  useAutoIdleGames()
  useCheckForPro()
  useFreeGames()
  useZoomControls()
  useContextMenu()
  useSteamMonitor()

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

export default Index
