import { invoke } from '@tauri-apps/api/core'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, useDisclosure } from '@heroui/react'
import { CustomModal } from '@/shared/components/CustomModal'
import { useUiStore, useUserStore } from '@/shared/stores'

export function SteamWarning() {
  const { t } = useTranslation()
  const showSteamWarning = useUiStore(s => s.showSteamWarning)
  const setShowSteamWarning = useUiStore(s => s.setShowSteamWarning)
  const userSummary = useUserStore(s => s.userSummary)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const check = async () => {
      const devAccounts = ['76561198158912649', '76561198999797359']
      const isDev = await invoke('is_dev')
      const isDevAccount = devAccounts.includes(userSummary?.steamId ?? '')
      if (showSteamWarning && !isDev && !isDevAccount) onOpen()
    }
    check()
  }, [onOpen, showSteamWarning, userSummary?.steamId])

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

  return (
    <CustomModal
      hideCloseButton
      isOpen={isOpen}
      title={t('common.notice')}
      body={t('confirmation.steamClosed')}
      buttons={
        <Button
          size='sm'
          className='bg-btn-secondary text-btn-text font-semibold'
          radius='full'
          onPress={() => invoke('launch_steam')}
        >
          {t('common.continue')}
        </Button>
      }
    />
  )
}
