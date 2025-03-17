import { Modal, ModalContent, ModalBody, Button, useDisclosure, ModalFooter, ModalHeader, Select, SelectItem } from '@heroui/react';
import { useState, useContext } from 'react';
import { TbSortDescending2 } from 'react-icons/tb';

import { StateContext } from '@/components/contexts/StateContext';
import useAchievementButtons from '@/hooks/achievements/useAchievementButtons';

const sortOptions = [
    { key: 'percent', label: 'Percentage' },
    { key: 'title', label: 'Alphabetically' },
    { key: 'state', label: 'Locked/Unlocked' },
    { key: 'protected', label: 'Unprotected' },
];

export default function AchievementButtons({ achievements, setAchievements, protectedAchievements }) {
    const { appId, appName } = useContext(StateContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { handleChange, handleUnlockAll, handleLockAll } = useAchievementButtons(achievements, setAchievements);
    const [state, setState] = useState('');

    const handleShowModal = (onOpen, state) => {
        setState(state);
        onOpen();
    };

    return (
        <div className='absolute top-0 right-0 flex gap-2'>
            <Button
                isDisabled={protectedAchievements}
                size='sm'
                className='font-semibold rounded-lg bg-dynamic text-button'
                onPress={() => handleShowModal(onOpen, 'unlock')}
            >
                Unlock All
            </Button>

            <Button
                isDisabled={protectedAchievements}
                size='sm'
                color='danger'
                className='font-semibold rounded-lg'
                onPress={() => handleShowModal(onOpen, 'lock')}
            >
                Lock All
            </Button>

            <Select
                size='sm'
                aria-label='sort'
                disallowEmptySelection
                radius='none'
                startContent={<TbSortDescending2 fontSize={26} />}
                items={sortOptions}
                // isDisabled={achievementQueryValue.length > 0 || currentTab === 'statistics'}
                className='w-[230px]'
                classNames={{
                    listbox: ['p-0'],
                    value: ['text-sm !text-content'],
                    trigger: ['bg-titlebar border border-border data-[hover=true]:!bg-input data-[open=true]:!bg-input duration-100 rounded-lg'],
                    popoverContent: ['bg-titlebar border border-border rounded-lg justify-start !text-content'],
                }}
                defaultSelectedKeys={['percent']}
                onSelectionChange={(e) => { handleChange(e, achievements, setAchievements); }}
            >
                {(item) => <SelectItem classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>{item.label}</SelectItem>}
            </Select>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-modalbody text-content' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                Confirm
                            </ModalHeader>
                            <ModalBody className='my-4'>
                                <p className='text-sm'>
                                    Are you sure you want to <strong>{state}</strong> all achievements?
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
                                    onPress={() => {
                                        if (state === 'unlock') {
                                            handleUnlockAll(appId, appName, achievements, onClose);
                                        } else {
                                            handleLockAll(appId, appName, achievements, onClose);
                                        }
                                    }}
                                >
                                    Confirm
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}