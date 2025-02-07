import React from 'react';

import { Button, Modal, ModalContent, ModalBody, Input, ModalFooter, ModalHeader, useDisclosure } from '@heroui/react';

import useManualAdd from '@/src/hooks/customlists/useManualAdd';

import { IoMdAdd } from 'react-icons/io';

export default function ManualAdd({ setList }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { inputValue, isLoading, setInputValue, handleAdd, handleChange } = useManualAdd(setList);

    return (
        <React.Fragment>
            <Button
                size='sm'
                color='primary'
                isIconOnly
                className='rounded-full'
                startContent={<IoMdAdd fontSize={18} />}
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
                                <p className='text-sm mb-2'>
                                    Add games that you do not own, but have in your library, such as family shared games.
                                </p>

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