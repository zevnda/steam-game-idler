import type { Dispatch, ReactElement, SetStateAction } from 'react'

import { Button } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbRotateClockwise } from 'react-icons/tb'

import CustomModal from '@/components/ui/CustomModal'
import useResetSettings from '@/hooks/settings/useResetSettings'

interface ResetSettingsProps {
  setRefreshKey: Dispatch<SetStateAction<number>>
}

export default function ResetSettings({ setRefreshKey }: ResetSettingsProps): ReactElement {
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
              className='font-semibold rounded-lg'
              onPress={onOpenChange}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size='sm'
              className='font-semibold rounded-lg bg-dynamic text-button-text'
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
