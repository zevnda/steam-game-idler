import { invoke } from '@tauri-apps/api/core'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, useDisclosure } from '@heroui/react'
import { CustomModal } from '@/shared/components'
import { useStateStore, useUserStore } from '@/shared/stores'
import { checkSteamStatus } from '@/shared/utils'

export const SteamWarning = () => {
  const { t } = useTranslation()
  const showSteamWarning = useStateStore(state => state.showSteamWarning)
  const setShowSteamWarning = useStateStore(state => state.setShowSteamWarning)
  const userSummary = useUserStore(state => state.userSummary)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  useEffect(() => {
    const shouldShowWarning = async () => {
      const devAccounts = ['76561198158912649', '76561198999797359']
      const isDev = await invoke('is_dev')

      const isUserDev = devAccounts.includes(userSummary?.steamId ?? '')

      if (showSteamWarning && !isDev && !isUserDev) {
        onOpen()
      }
    }

    shouldShowWarning()
  }, [onOpen, showSteamWarning, userSummary?.steamId])

  const verifySteamStatus = async () => {
    const isSteamRunning = await checkSteamStatus(true)
    if (isSteamRunning) {
      setShowSteamWarning(false)
      onOpenChange()
    }
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onOpenChange={verifySteamStatus}
      title={t('common.notice')}
      body={t('confirmation.steamClosed')}
      buttons={
        <Button
          size='sm'
          className='bg-btn-secondary text-btn-text font-bold'
          radius='full'
          onPress={verifySteamStatus}
        >
          {t('common.confirm')}
        </Button>
      }
    />
  )
}
