import { useTranslation } from 'react-i18next'
import { TbEraser } from 'react-icons/tb'
import { Button, useDisclosure } from '@heroui/react'
import { handleClearData } from '@/features/settings'
import { CustomModal } from '@/shared/components'
import { useUserStore } from '@/shared/stores'

export const ClearData = () => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const setUserSummary = useUserStore(state => state.setUserSummary)

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
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              onPress={() => handleClearData(onOpenChange, setUserSummary)}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />
    </>
  )
}
