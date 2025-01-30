import { Fragment } from 'react';

import { Button, Modal, ModalContent, ModalBody, ModalFooter, ModalHeader } from '@heroui/react';

import { handleResetSettings } from '@/src/utils/settings/settingsHandler';
import useResetSettings from '@/src/hooks/settings/useResetSettings';

export default function ResetSettings({ setSettings, setRefreshKey }) {
    const { isOpen, onOpen, onOpenChange } = useResetSettings();

    return (
        <Fragment>
            <Button
                size='sm'
                color='danger'
                className='font-semibold rounded'
                onPress={onOpen}
            >
                Reset Settings
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
                                    Are you sure you want to reset settings to default?
                                </p>
                            </ModalBody>
                            <ModalFooter className='border-t border-border bg-footer px-4 py-3'>
                                <Button
                                    size='sm'
                                    color='danger'
                                    variant='light'
                                    className='font-semibold rounded'
                                    onPress={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size='sm'
                                    color='primary'
                                    className='font-semibold rounded'
                                    onPress={() => handleResetSettings(onClose, setSettings, setRefreshKey)}
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