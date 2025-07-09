import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Button, useDisclosure } from '@heroui/react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useStateContext } from '@/components/contexts/StateContext'
import { useUserContext } from '@/components/contexts/UserContext'
import CustomModal from '@/components/ui/CustomModal'
import { checkSteamStatus } from '@/utils/tasks'

export default function SteamWarning(): ReactElement {
  const { t } = useTranslation()
  const { showSteamWarning, setShowSteamWarning } = useStateContext()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { userSummary } = useUserContext()

  useEffect(() => {
    const shouldShowWarning = async (): Promise<void> => {
      const devAccounts = ['76561198158912649', '76561198999797359']
      const isDev = await invoke('is_dev')

      const isUserDev = devAccounts.includes(userSummary?.steamId ?? '')

      if (showSteamWarning && !isDev && !isUserDev) {
        onOpen()
      }
    }

    shouldShowWarning()
  }, [onOpen, showSteamWarning, userSummary?.steamId])

  const verifySteamStatus = async (): Promise<void> => {
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
