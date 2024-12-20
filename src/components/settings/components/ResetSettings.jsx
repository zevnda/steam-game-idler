import React from 'react';
import { Button, Modal, ModalContent, ModalBody, ModalFooter } from '@nextui-org/react';
import { handleResetSettings } from '../utils/resetSettingsHandler';
import useResetSettings from '../hooks/useResetSettings';

export default function ResetSettings({ setSettings, setRefreshKey }) {
    const { isOpen, onOpen, onOpenChange } = useResetSettings();

    return (
        <React.Fragment>
            <Button
                size='sm'
                color='danger'
                className='font-semibold rounded'
                onClick={onOpen}
            >
                Reset settings
            </Button>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-container border border-border rounded-md w-[350px]'>
                <ModalContent>
                    {(onClose) => (
                        <React.Fragment>
                            <ModalBody className='flex gap-5 p-4'>
                                <p className='text-sm font-semibold uppercase'>
                                    Confirm
                                </p>
                                <p className='text-xs mb-2'>
                                    Are you sure you want to reset settings to default?
                                </p>
                            </ModalBody>
                            <ModalFooter className='border-t border-border bg-footer px-4 py-3'>
                                <Button
                                    size='sm'
                                    color='danger'
                                    variant='light'
                                    className='max-h-[25px] font-semibold rounded'
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size='sm'
                                    color='primary'
                                    className='max-h-[25px] font-semibold rounded'
                                    onClick={() => handleResetSettings(onClose, setSettings, setRefreshKey)}
                                >
                                    Confirm
                                </Button>
                            </ModalFooter>
                        </React.Fragment>
                    )}
                </ModalContent>
            </Modal>
        </React.Fragment>
    );
}