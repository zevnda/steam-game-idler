import { useLoaderStore } from '@/shared/stores'
import { emit } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { getSteamUsers } from '../utils'

export const useIndex = () => {
  const { showLoader, hideLoader } = useLoaderStore()

  useEffect(() => {
    // Show the full screen loader on mount
    showLoader()
    // Notify backend that the frontend is ready
    emit('ready')

    // Fetch Steam users and hide loader when done
    getSteamUsers().finally(() => {
      // Delay hiding the loader to ensure smooth UX
      setTimeout(() => {
        hideLoader()
      }, 2500)
    })
  }, [showLoader, hideLoader])
}
