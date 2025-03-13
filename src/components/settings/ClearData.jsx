import { Button, Modal, ModalContent, ModalBody, ModalFooter, ModalHeader } from '@heroui/react';

import useClearData from '@/hooks/settings/useClearData';

export default function ClearData() {
    const { isOpen, onOpen, onOpenChange, handleClearData } = useClearData();

    return (
        <>
            <Button
                size='sm'
                color='danger'
                className='font-semibold rounded-lg'
                onPress={onOpen}
            >
                Clear Data
            </Button>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-modalbody text-content' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                Confirm
                            </ModalHeader >
                            <ModalBody className='my-4'>
                                <p className='text-sm'>
                                    Are you sure you want to clear all data?
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
                                    Cancel
                                </Button>
                                <Button
                                    size='sm'
                                    className='font-semibold rounded-lg bg-dynamic text-button'
                                    onPress={() => handleClearData(onClose)}
                                >
                                    Confirm
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}