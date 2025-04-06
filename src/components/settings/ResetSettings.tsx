import type { Dispatch, ReactElement, SetStateAction } from 'react'

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { TbRotateClockwise } from 'react-icons/tb'

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
        color='danger'
        className='font-semibold rounded-lg'
        onPress={onOpen}
        startContent={<TbRotateClockwise className='rotate-90' size={20} />}
      >
        {t('settings.resetSettings.button')}
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className='bg-modalbody text-content'
        classNames={{
          closeButton: ['text-altwhite hover:bg-titlehover duration-200'],
        }}
      >
        <ModalContent>
          {(onClose: () => void) => (
            <>
              <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                {t('common.confirm')}
              </ModalHeader>
              <ModalBody className='my-4'>
                <p className='text-sm'>{t('confirmation.resetSettings')}</p>
              </ModalBody>
              <ModalFooter className='border-t border-border bg-modalfooter px-4 py-3'>
                <Button size='sm' color='danger' variant='light' className='font-semibold rounded-lg' onPress={onClose}>
                  {t('common.cancel')}
                </Button>
                <Button
                  size='sm'
                  className='font-semibold rounded-lg bg-dynamic text-button-text'
                  onPress={() => handleResetSettings(onClose, setRefreshKey)}
                >
                  {t('common.confirm')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
