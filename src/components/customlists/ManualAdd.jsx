import { Button, Modal, ModalContent, ModalBody, Input, ModalFooter, ModalHeader, useDisclosure } from '@heroui/react';
import { TbPlus } from 'react-icons/tb';

import useManualAdd from '@/hooks/customlists/useManualAdd';

export default function ManualAdd({ listName, setList }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { inputValue, isLoading, setInputValue, handleAdd, handleChange } = useManualAdd(listName, setList);

    const handleKeyPress = (e, onClose) => {
        if (e.key === 'Enter') {
            handleAdd(onClose);
        }
    };

    return (
        <>
            <Button
                size='sm'
                isIconOnly
                className='rounded-full bg-dynamic text-button'
                startContent={<TbPlus fontSize={18} />}
                onPress={onOpen}
            />

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} onClose={() => setInputValue('')} className='bg-modalbody text-content' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
                <ModalContent>
                    {(onClose) => (
                        <>
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
                                        inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent'],
                                        input: ['text-sm !text-content placeholder:text-altwhite/50'],
                                    }}
                                    value={inputValue}
                                    onChange={handleChange}
                                    onClear={() => { setInputValue(''); }}
                                    onKeyDown={(e) => handleKeyPress(e, onClose)}
                                    autoFocus
                                />
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
                                    isLoading={isLoading}
                                    isDisabled={inputValue.length === 0}
                                    className='font-semibold rounded-lg bg-dynamic text-button'
                                    onPress={() => handleAdd(onClose)}
                                >
                                    Add
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}