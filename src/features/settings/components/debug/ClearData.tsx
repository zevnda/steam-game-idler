import { useTranslation } from 'react-i18next'
import { TbEraser } from 'react-icons/tb'
import { Button, useDisclosure } from '@heroui/react'
import { CustomModal } from '@/shared/components/CustomModal'
import { logEvent } from '@/shared/services/logService'
import { useUserStore } from '@/shared/stores'
import { preserveKeysAndClearData } from '@/shared/utils'

export function ClearData() {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const setUserSummary = useUserStore(s => s.setUserSummary)

  const handleClearData = async (onClose: () => void) => {
    onClose()
    await preserveKeysAndClearData()
    setUserSummary(null)
    await logEvent('[Settings] Cleared all data successfully')
  }

  return (
    <>
      <Button
        size='sm'
        variant='light'
        radius='full'
        color='danger'
        onPress={onOpen}
        startContent={<TbEraser size={20} />}
      >
        {t('settings.clearData.button')}
      </Button>
      <CustomModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={t('common.confirm')}
        body={t('confirmation.clearData')}
        buttons={
          <>
            <Button
              size='sm'
              color='danger'
              variant='light'
              radius='full'
              className='font-semibold'
              onPress={onOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-semibold'
              radius='full'
              onPress={() => handleClearData(onOpenChange)}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />
    </>
  )
}
