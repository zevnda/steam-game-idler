import type { ReactElement } from 'react'

import { Button, useDisclosure } from '@heroui/react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useStateContext } from '@/components/contexts/StateContext'
import CustomModal from '@/components/ui/CustomModal'
import { checkSteamStatus } from '@/utils/tasks'

export default function SteamWarning(): ReactElement {
  const { t } = useTranslation()
  const { showSteamWarning, setShowSteamWarning } = useStateContext()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  useEffect(() => {
    if (showSteamWarning) {
      onOpen()
    }
  }, [onOpen, showSteamWarning])

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
        <Button size='sm' className='font-semibold rounded-lg bg-dynamic text-button-text' onPress={verifySteamStatus}>
          {t('common.confirm')}
        </Button>
      }
    />
  )
}
