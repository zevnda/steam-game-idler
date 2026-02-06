import { useTranslation } from 'react-i18next'
import { TbEraser } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { useClearData } from '@/features/settings'
import { CustomModal } from '@/shared/ui'

export const ClearData = () => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange, handleClearData } = useClearData()

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
