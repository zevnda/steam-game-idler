import { Fragment } from 'react';

import { Button, Modal, ModalContent, ModalBody, ModalFooter, ModalHeader } from '@heroui/react';

import useClearData from '@/src/hooks/settings/useClearData';

export default function ClearData() {
    const { isOpen, onOpen, onOpenChange, handleClearData } = useClearData();

    return (
        <Fragment>
            <Button
                size='sm'
                color='danger'
                className='font-semibold rounded-lg'
                onPress={onOpen}
            >
                Clear Data
            </Button>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-container'>
                <ModalContent>
                    {(onClose) => (
                        <Fragment>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                Confirm
                            </ModalHeader >
                            <ModalBody className='my-4'>
                                <p className='text-sm'>
                                    Are you sure you want to clear all data?
                                </p>
                            </ModalBody>
                            <ModalFooter className='border-t border-border bg-footer px-4 py-3'>
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
                                    color='primary'
                                    className='font-semibold rounded-lg'
                                    onPress={() => handleClearData(onClose)}
                                >
                                    Confirm
                                </Button>
                            </ModalFooter>
                        </Fragment>
                    )}
                </ModalContent>
            </Modal>
        </Fragment>
    );
}