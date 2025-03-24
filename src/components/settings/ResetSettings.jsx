import { Button, Modal, ModalContent, ModalBody, ModalFooter, ModalHeader } from '@heroui/react';
import { useTranslation } from 'react-i18next';

import useResetSettings from '@/hooks/settings/useResetSettings';

export default function ResetSettings({ setSettings, setRefreshKey }) {
    const { t } = useTranslation();
    const { handleResetSettings, isOpen, onOpen, onOpenChange } = useResetSettings();

    return (
        <>
            <Button
                size='sm'
                color='danger'
                className='font-semibold rounded-lg'
                onPress={onOpen}
            >
                {t('settings.resetSettings.button')}
            </Button>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-modalbody text-content' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                {t('common.confirm')}
                            </ModalHeader >
                            <ModalBody className='my-4'>
                                <p className='text-sm'>
                                    {t('confirmation.resetSettings')}
                                </p>
                            </ModalBody>
                            <ModalFooter className='border-t border-border bg-modalfooter px-4 py-3'>
                                <Button
                                    size='sm'
                                    color='danger'
                                    variant='light'
                                    className='font-semibold rounded-lg'
                                    onPress={onClose}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    size='sm'
                                    className='font-semibold rounded-lg bg-dynamic text-button'
                                    onPress={() => handleResetSettings(onClose, setSettings, setRefreshKey)}
                                >
                                    {t('common.confirm')}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}