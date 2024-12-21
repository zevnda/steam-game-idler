import React from 'react';
import { Button, Modal, ModalContent, ModalBody, useDisclosure, Input, ModalFooter, Alert, ModalHeader } from '@nextui-org/react';
import { IoAdd } from 'react-icons/io5';
import useManualAdd from '../hooks/useManualAdd';

export default function ManualAdd({ setFavorites }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { inputValue, isLoading, setInputValue, handleAdd, handleChange } = useManualAdd(setFavorites);

    return (
        <React.Fragment>
            <Button
                size='sm'
                color='primary'
                isIconOnly
                className='rounded-full'
                startContent={<IoAdd fontSize={18} />}
                onPress={onOpen}
            />

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} onClose={() => setInputValue('')} className='bg-container'>
                <ModalContent>
                    {(onClose) => (
                        <React.Fragment>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                Add A Game
                            </ModalHeader>
                            <ModalBody className='my-4'>
                                <p className='text-sm'>
                                    Add games that you do not own, but have in your library, such as family shared games.
                                </p>

                                <Alert
                                    color='primary'
                                    radius='sm'
                                    className='border border-border'
                                    classNames={{
                                        base: ['flex items-center border border-border py-0.5'],
                                        title: ['text-sm font-normal'],
                                        iconWrapper: ['h-6 w-6'],
                                        alertIcon: ['h-4 w-4']
                                    }}
                                    title='Games will be added to your &apos;Favorites&apos; list.'
                                />

                                <Input
                                    isClearable
                                    placeholder='Enter a game ID'
                                    classNames={{
                                        inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded group-data-[focus-within=true]:!bg-titlebar group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent'],
                                        input: ['text-sm']
                                    }}
                                    value={inputValue}
                                    onChange={handleChange}
                                    onClear={() => { setInputValue(''); }}
                                    autoFocus
                                />
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
                                    isLoading={isLoading}
                                    isDisabled={inputValue.length === 0}
                                    className='font-semibold rounded'
                                    onPress={() => handleAdd(onClose)}
                                >
                                    Add
                                </Button>
                            </ModalFooter>
                        </React.Fragment>
                    )}
                </ModalContent>
            </Modal>
        </React.Fragment>
    );
}