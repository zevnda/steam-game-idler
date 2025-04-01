import { Button, Modal, ModalContent, ModalBody, ModalFooter, ModalHeader, useDisclosure, NumberInput, Input } from '@heroui/react';
import type { Dispatch, KeyboardEvent, ReactElement, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { TbPlus } from 'react-icons/tb';

import useManualAdd from '@/hooks/customlists/useManualAdd';
import type { Game } from '@/types/game';

interface ManualAddProps {
    listName: string;
    setList: Dispatch<SetStateAction<Game[]>>;
}

export default function ManualAdd({ listName, setList }: ManualAddProps): ReactElement {
    const { t } = useTranslation();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const manualAdd = useManualAdd(listName, setList);

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>, onClose: () => void): void => {
        if (e.key === 'Enter') {
            manualAdd.handleAdd(onClose);
        }
    };

    const handleClose = (): void => {
        manualAdd.setAppNameValue('');
        manualAdd.setAppIdValue(0);
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
                    {(onClose: () => void) => (
                        <>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                {t('customLists.manualAdd.title')}
                            </ModalHeader>
                            <ModalBody className='my-4'>
                                <Input
                                    autoFocus
                                    size='sm'
                                    placeholder={t('customLists.manualAdd.gameName')}
                                    value={manualAdd.appNameValue || ''}
                                    classNames={{
                                        inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent'],
                                        input: ['!text-content placeholder:text-altwhite/50'],
                                    }}
                                    onChange={manualAdd.handleNameChange}
                                />

                                <NumberInput
                                    hideStepper
                                    label={t('customLists.manualAdd.gameId')}
                                    value={Number(manualAdd.appIdValue)}
                                    formatOptions={{ useGrouping: false }}
                                    aria-label='manual add'
                                    classNames={{
                                        inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-transparent'],
                                        input: ['text-sm !text-content placeholder:text-altwhite/50'],
                                    }}
                                    onChange={(e) => manualAdd.handleIdChange(e)}
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
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    size='sm'
                                    isLoading={manualAdd.isLoading}
                                    isDisabled={!manualAdd.appNameValue || !manualAdd.appIdValue}
                                    className='font-semibold rounded-lg bg-dynamic text-button'
                                    onPress={() => manualAdd.handleAdd(onClose)}
                                >
                                    {t('common.add')}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}