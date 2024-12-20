import React, { useState } from 'react';
import { Modal, ModalContent, ModalBody, Button, useDisclosure, ModalFooter, Tooltip } from '@nextui-org/react';
import { handleUnlockAll, handleLockAll, handleUpdateAll } from '@/src/components/achievements/utils/tabButtonsHandler';
import ExtLink from '../../ui/components/ExtLink';
import { SiSteamdb } from 'react-icons/si';

export default function TabButtons({ appId, appName, achievementsUnavailable, statisticsUnavailable, btnLoading, achievementList, inputValue, setBtnLoading, currentTab, initialStatValues, newStatValues }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [state, setState] = useState('');

    const handleSetState = (state) => {
        setState(state);
        onOpen();
    };

    return (
        <React.Fragment>
            <div className='flex justify-center items-center w-full min-h-8'>
                <div className='flex items-center gap-2 w-full'>
                    <p className='m-0 p-0'>
                        {appName}
                    </p>
                    <Tooltip content='View achievement details on SteamDB' placement='right' closeDelay={0} size='sm'>
                        <div>
                            <ExtLink href={`https://steamdb.info/app/${appId}/stats/`}>
                                <SiSteamdb className='text-sgi' />
                            </ExtLink>
                        </div>
                    </Tooltip>
                </div>
                <div className='flex justify-end w-full'>
                    {!achievementsUnavailable && currentTab === 'achievements' && (
                        <div className='flex items-center gap-2'>
                            <Button
                                size='sm'
                                color='primary'
                                isLoading={btnLoading}
                                isDisabled={!achievementList || inputValue.length > 0 || currentTab === 'statistics'}
                                className='font-semibold rounded'
                                onClick={() => handleSetState('unlock')}
                            >
                                Unlock all
                            </Button>
                            <Button
                                size='sm'
                                color='danger'
                                isLoading={btnLoading}
                                isDisabled={!achievementList || inputValue.length > 0}
                                className='font-semibold rounded'
                                onClick={() => handleSetState('lock')}
                            >
                                Lock all
                            </Button>
                        </div>
                    )}
                    {!statisticsUnavailable && currentTab === 'statistics' && (
                        <div className='flex items-center gap-2'>
                            <Button
                                size='sm'
                                color='primary'
                                isLoading={btnLoading}
                                isDisabled={Object.keys(initialStatValues).length < 1}
                                className='font-semibold rounded'
                                onClick={() => handleUpdateAll(appId, appName, initialStatValues, newStatValues)}
                            >
                                Save changes
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-container border border-border rounded-md w-[350px]'>
                <ModalContent>
                    {(onClose) => (
                        <React.Fragment>
                            <ModalBody className='flex gap-5 p-4'>
                                <p className='text-sm font-semibold uppercase'>
                                    Confirm
                                </p>
                                <p className='text-xs mb-2'>
                                    Are you sure you want to {state} all achievements?
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
                                    onClick={state === 'unlock' ? () => handleUnlockAll(appId, appName, achievementList, setBtnLoading, onClose) : () => handleLockAll(appId, appName, achievementList, setBtnLoading, onClose)}
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