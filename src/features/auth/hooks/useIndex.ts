import Router from 'next/router'
import { useLoaderStore, useUserStore } from '@/shared/stores'
import { emit } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { getSteamUsers } from '../utils/getSteamUsers'

interface UseIndexProps {
  refreshKey: number
}

export const useIndex = ({ refreshKey }: UseIndexProps) => {
  const { showLoader, hideLoader } = useLoaderStore()
  const { userSummary } = useUserStore()

  useEffect(() => {
    // Show the full screen loader on mount
    showLoader()
    // Notify backend that the frontend is ready
    emit('ready')

    // If a user is already signed in, show the dashboard
    if (userSummary.steamId) {
      Router.push('/dashboard')
      setTimeout(() => hideLoader(), 750)
      return
    }

    // Fetch Steam users and hide loader when done
    getSteamUsers().finally(() => {
      // Delay hiding the loader to ensure smooth UX
      setTimeout(() => hideLoader(), 1500)
    })
  }, [showLoader, hideLoader, refreshKey, userSummary])
}
