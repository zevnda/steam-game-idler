import { Button, Modal, ModalContent, ModalBody, ModalFooter, ModalHeader } from '@heroui/react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { TbEraser } from 'react-icons/tb';

import useClearData from '@/hooks/settings/useClearData';

export default function ClearData(): ReactElement {
    const { t } = useTranslation();
    const { isOpen, onOpen, onOpenChange, handleClearData } = useClearData();

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

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-modalbody text-content' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
                <ModalContent>
                    {(onClose: () => void) => (
                        <>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                {t('common.confirm')}
                            </ModalHeader >
                            <ModalBody className='my-4'>
                                <p className='text-sm'>
                                    {t('confirmation.clearData')}
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
                                    className='font-semibold rounded-lg bg-dynamic text-button-text'
                                    onPress={() => handleClearData(onClose)}
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