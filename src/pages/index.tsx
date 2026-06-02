import {
  ChangelogModal,
  Dashboard,
  GoProModal,
  SignIn,
  SteamWarning,
  UpdateLoader,
} from '@/shared/components'
import {
  useAutoIdleGames,
  useCheckForPro,
  useCheckForUpdates,
  useContextMenu,
  useDiscordPresence,
  useFreeGames,
  useInit,
  useInitSettings,
  useKeyboardShortcuts,
  useSteamMonitor,
  useThemes,
  useZoomControls,
} from '@/shared/hooks'
import { useSessionStore, useUserStore } from '@/shared/stores'

const Index = () => {
  const userSummary = useUserStore(s => s.userSummary)
  const loaderVisible = useSessionStore(s => s.loaderVisible)
  const isUpdating = useSessionStore(s => s.isUpdating)

  useInit()
  useThemes()
  useInitSettings()
  useCheckForUpdates()
  useAutoIdleGames()
  useCheckForPro()
  useFreeGames()
  useZoomControls()
  useContextMenu()
  useKeyboardShortcuts()
  useSteamMonitor()
  useDiscordPresence()

  if (loaderVisible) return null
  if (isUpdating) return <UpdateLoader />

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
