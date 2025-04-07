import type { ReactElement } from 'react'

import { Button } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbEraser } from 'react-icons/tb'

import CustomModal from '@/components/ui/CustomModal'
import useClearData from '@/hooks/settings/useClearData'

export default function ClearData(): ReactElement {
  const { t } = useTranslation()
  const { isOpen, onOpen, onOpenChange, handleClearData } = useClearData()

  return (
    <>
      <Button
        size='sm'
        color='danger'
        className='font-semibold rounded-lg'
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
              className='font-semibold rounded-lg'
              onPress={onOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='font-semibold rounded-lg bg-dynamic text-button-text'
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
