import { ChangelogModal, Dashboard, GoProModal, SignIn, SteamWarning } from '@/shared/components'
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
import { useLoaderStore, useUserStore } from '@/shared/stores'

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
  useKeyboardShortcuts()
  useSteamMonitor()
  useDiscordPresence()

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
