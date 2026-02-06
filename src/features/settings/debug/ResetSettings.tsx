import { useTranslation } from 'react-i18next'
import { TbRotateClockwise } from 'react-icons/tb'
import { Button } from '@heroui/react'
import { useResetSettings } from '@/features/settings'
import { CustomModal } from '@/shared/ui'

interface ResetSettingsProps {
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>
}

export const ResetSettings = ({ setRefreshKey }: ResetSettingsProps) => {
  const { t } = useTranslation()
  const { handleResetSettings, isOpen, onOpen, onOpenChange } = useResetSettings()

  return (
    <>
      <Button
        size='sm'
        variant='light'
        radius='full'
        color='danger'
        onPress={onOpen}
        startContent={<TbRotateClockwise className='rotate-90' size={20} />}
      >
        {t('settings.resetSettings.button')}
      </Button>

      <CustomModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={t('common.confirm')}
        body={t('confirmation.resetSettings')}
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
              onPress={() => handleResetSettings(onOpenChange, setRefreshKey)}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      />
    </>
  )
}
