import { Button, Modal, ModalContent, ModalBody, ModalFooter, ModalHeader, useDisclosure, NumberInput, Input } from '@heroui/react';
import { TbPlus } from 'react-icons/tb';

import useManualAdd from '@/hooks/customlists/useManualAdd';

export default function ManualAdd({ listName, setList }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const {
        isLoading,
        appNameValue,
        appIdValue,
        setAppNameValue,
        setAppIdValue,
        handleNameChange,
        handleIdChange,
        handleAdd
    } = useManualAdd(listName, setList);

    const handleKeyPress = (e, onClose) => {
        if (e.key === 'Enter') {
            handleAdd(onClose);
        }
    };

    const handleClose = () => {
        setAppNameValue('');
        setAppIdValue('');
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

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} onClose={handleClose} className='bg-modalbody text-content' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                Add A Game
                            </ModalHeader>
                            <ModalBody className='my-4'>
                                <p className='text-sm mb-2'>
                                    Manually add a game to your list by entering the game&apos;s name and appid
                                </p>

                                <Input
                                    autoFocus
                                    size='sm'
                                    placeholder='Game Name'
                                    value={appNameValue || ''}
                                    classNames={{
                                        inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent'],
                                        input: ['!text-content placeholder:text-altwhite/50'],
                                    }}
                                    onChange={handleNameChange}
                                />

                                <NumberInput
                                    hideStepper
                                    label='Game ID'
                                    value={appIdValue || 0}
                                    formatOptions={{ useGrouping: false }}
                                    aria-label='manual add'
                                    classNames={{
                                        inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent'],
                                        input: ['text-sm !text-content placeholder:text-altwhite/50'],
                                    }}
                                    onChange={handleIdChange}
                                    onKeyDown={(e) => handleKeyPress(e, onClose)}
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
                                    isDisabled={!appNameValue || !appIdValue}
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