import React from 'react';
import { Button, Modal, ModalContent, ModalBody, useDisclosure, Input, ModalFooter } from '@nextui-org/react';
import { IoAdd } from 'react-icons/io5';
import { FaInfoCircle } from 'react-icons/fa';
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
                onClick={onOpen}
            />

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} onClose={() => setInputValue('')} className='bg-container border border-border rounded-md w-[350px]'>
                <ModalContent>
                    {(onClose) => (
                        <React.Fragment>
                            <ModalBody className='flex gap-5 p-4'>
                                <p className='text-sm font-semibold uppercase'>
                                    Add a game
                                </p>
                                <p className='text-xs'>
                                    Add games that you do not own, but have in your library, such as family shared games.
                                </p>

                                <div className='flex items-center gap-1 w-full p-1 bg-[#c3e3fb] dark:text-[#bdddff] dark:bg-[#366f9b] border border-[#93c4e9] dark:border-[#5585aa] rounded-sm'>
                                    <FaInfoCircle fontSize={14} />
                                    <p className='text-xs'>
                                        Games will be added to your &apos;Favorites&apos; list.
                                    </p>
                                </div>

                                <Input
                                    isClearable
                                    size='sm'
                                    placeholder='Enter a game ID'
                                    classNames={{
                                        inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent'],
                                        input: ['text-xs']
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
                                    className='max-h-[25px] font-semibold rounded'
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size='sm'
                                    color='primary'
                                    isLoading={isLoading}
                                    isDisabled={inputValue.length === 0}
                                    className='max-h-[25px] font-semibold rounded'
                                    onClick={() => handleAdd(onClose)}
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