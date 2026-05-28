import { invoke } from '@tauri-apps/api/core'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, useDisclosure } from '@heroui/react'
import { CustomModal } from '@/shared/components'
import { useStateStore, useUserStore } from '@/shared/stores'

export const SteamWarning = () => {
  const { t } = useTranslation()
  const showSteamWarning = useStateStore(state => state.showSteamWarning)
  const setShowSteamWarning = useStateStore(state => state.setShowSteamWarning)
  const userSummary = useUserStore(state => state.userSummary)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const shouldShowWarning = async () => {
      const devAccounts = ['76561198158912649', '76561198999797359']
      const isDev = await invoke('is_dev')
      const isDevAccount = devAccounts.includes(userSummary?.steamId ?? '')
      if (showSteamWarning && !isDev && !isDevAccount) {
        onOpen()
      }
    }
    shouldShowWarning()
  }, [onOpen, showSteamWarning, userSummary?.steamId])

  // Poll every second while modal is open; auto-close when Steam is detected
  useEffect(() => {
    if (!isOpen) return

    pollRef.current = setInterval(async () => {
      const running = await invoke<boolean>('is_steam_running')
      if (running) {
        clearInterval(pollRef.current!)
        pollRef.current = null
        setShowSteamWarning(false)
        onOpenChange()
      }
    }, 1000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [isOpen, onOpenChange, setShowSteamWarning])

  const launchAndWaitForSteam = async () => {
    await invoke('launch_steam')
  }

  return (
    <CustomModal
      hideCloseButton
      isOpen={isOpen}
      title={t('common.notice')}
      body={t('confirmation.steamClosed')}
      buttons={
        <Button
          size='sm'
          className='bg-btn-secondary text-btn-text font-bold'
          radius='full'
          onPress={launchAndWaitForSteam}
        >
          {t('common.continue')}
        </Button>
      }
    />
  )
}
