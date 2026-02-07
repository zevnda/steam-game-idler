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
import { useLoaderStore, useUserStore } from '@/shared/stores'
import { ChangelogModal, GoProModal, SteamWarning } from '@/shared/ui'

const Index = () => {
  const userSummary = useUserStore(state => state.userSummary)
  const { loaderVisible } = useLoaderStore()

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

  if (loaderVisible) return null

  if (!userSummary) {
    return (
      <>
        <SignIn />
        <ChangelogModal />
      </>
    )
  }

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
