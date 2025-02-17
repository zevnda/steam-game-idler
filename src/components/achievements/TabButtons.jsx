import { Fragment, useContext, useState } from 'react';

import { Modal, ModalContent, ModalBody, Button, useDisclosure, ModalFooter, ModalHeader, Select, SelectItem } from '@heroui/react';

import { handleUnlockAll, handleLockAll, handleUpdateAllStats, handleResetAll } from '@/src/utils/achievements/tabButtonsHandler';
import { sortOptions, handleChange } from '@/src/utils/achievements/pageHeaderHandler';
import { AppContext } from '@/src/components/layout/AppContext';

import { TbSortDescending2 } from 'react-icons/tb';

export default function TabButtons({ initialStatValues, newStatValues, setNewStatValues, setIsSorted, userGameAchievementsMap, percentageMap }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [state, setState] = useState('');
    const [type, setType] = useState('');
    const {
        appId,
        appName,
        achievementQueryValue,
        achievementList,
        setAchievementList,
        achievementsUnavailable,
        statisticsUnavailable,
        currentTab
    } = useContext(AppContext);

    const handleSetState = (state, type) => {
        setState(state);
        setType(type);
        onOpen();
    };

    return (
        <Fragment>
            <div className='flex justify-center items-center w-full min-h-8'>
                <div className='flex justify-end w-full'>
                    {!achievementsUnavailable && currentTab === 'achievements' && (
                        <div className='flex items-center gap-2'>
                            <Button
                                size='sm'
                                isDisabled={!achievementList || achievementQueryValue.length > 0 || currentTab === 'statistics'}
                                className='font-semibold rounded-lg bg-dynamic text-dynamic-text'
                                onPress={() => handleSetState('unlock', 'achievements')}
                            >
                                Unlock All
                            </Button>
                            <Button
                                size='sm'
                                color='danger'
                                isDisabled={!achievementList || achievementQueryValue.length > 0}
                                className='font-semibold rounded-lg'
                                onPress={() => handleSetState('lock', 'achievements')}
                            >
                                Lock All
                            </Button>
                        </div>
                    )}
                    {!statisticsUnavailable && currentTab === 'statistics' && (
                        <div className='flex items-center gap-2'>
                            <Button
                                size='sm'
                                isDisabled={Object.keys(initialStatValues).length === 0}
                                className='font-semibold rounded-lg bg-dynamic text-dynamic-text'
                                onPress={() => handleUpdateAllStats(appId, appName, initialStatValues, newStatValues)}
                            >
                                Save Changes
                            </Button>
                            <Button
                                size='sm'
                                color='danger'
                                isDisabled={Object.keys(initialStatValues).length === 0}
                                className='font-semibold rounded-lg'
                                onPress={() => handleSetState('reset', 'statistics')}
                            >
                                Reset All
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {!achievementsUnavailable && currentTab === 'achievements' && (
                <Select
                    size='sm'
                    aria-label='sort'
                    isDisabled={achievementQueryValue.length > 0 || achievementsUnavailable || currentTab === 'statistics'}
                    disallowEmptySelection
                    radius='none'
                    startContent={<TbSortDescending2 fontSize={26} />}
                    items={sortOptions}
                    className='w-[230px]'
                    classNames={{
                        listbox: ['p-0'],
                        value: ['text-sm'],
                        trigger: ['bg-titlebar border border-border data-[hover=true]:!bg-input data-[open=true]:!bg-input duration-100 rounded-lg'],
                        popoverContent: ['bg-titlebar border border-border rounded-lg justify-start'],
                    }}
                    defaultSelectedKeys={['percent']}
                    onSelectionChange={(e) => { handleChange(e, achievementList, setAchievementList, percentageMap, userGameAchievementsMap, setIsSorted); }}
                >
                    {(item) => <SelectItem classNames={{ title: ['text-sm'], base: ['rounded data-[hover=true]:!bg-titlehover'] }}>{item.label}</SelectItem>}
                </Select>
            )}

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-container'>
                <ModalContent>
                    {(onClose) => (
                        <Fragment>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                Confirm
                            </ModalHeader>
                            <ModalBody className='my-4'>
                                <p className='text-sm'>
                                    Are you sure you want to <strong>{state}</strong> all {type}?
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
                                    className='font-semibold rounded-lg bg-dynamic text-dynamic-text'
                                    onPress={
                                        type === 'statistics' ?
                                            () => handleResetAll(appId, appName, setNewStatValues, onClose) :
                                            state === 'unlock' ?
                                                () => handleUnlockAll(appId, appName, achievementList, onClose) :
                                                () => handleLockAll(appId, appName, achievementList, onClose)
                                    }
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