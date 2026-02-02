import Router from 'next/router'
import i18next from 'i18next'
import { useUserStore } from '@/shared/stores'
import { showAccountMismatchToast, showDangerToast } from '@/shared/ui'
import { checkSteamStatus, logEvent } from '@/shared/utils'
import { invoke } from '@tauri-apps/api/core'

export const handleSignIn = async (index: number) => {
  try {
    const steamRunning = await checkSteamStatus()
    const devAccounts = JSON.parse(process.env.NEXT_PUBLIC_DEV_ACCOUNTS ?? '[]')
    const isDev = await invoke<boolean>('is_dev')
    const { steamUsers, setUserSummary, setSelectedUser } = useUserStore.getState()

    // Prevent sign-in if Steam is not running, unless in dev mode with a dev account
    if (!steamRunning && !isDev && !devAccounts.includes(steamUsers[index]?.steamId ?? '')) return

    const selectedUser = steamUsers[index]

    // mostRecent !== 1 means this isn't the account that's currently logged in to Steam
    // so show a warning to the user when they log in
    if (selectedUser?.mostRecent !== 1) showAccountMismatchToast('warning')

    // Store selected user in global persistent state
    setUserSummary(selectedUser)
    setSelectedUser(null)
    logEvent(`[System] Signed in as ${selectedUser?.personaName} (${selectedUser?.steamId})`)

    Router.push('/dashboard')
  } catch (error) {
    console.error('[Error] in (handleSignIn):', error)
    logEvent(`[Error] in (handleSignIn): ${error}`)
    showDangerToast(i18next.t('common.an_error_occurred'))
  }
}
