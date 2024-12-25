import React, { useContext, useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@nextui-org/react';
import { AppContext } from '../../layout/components/AppContext';

export default function GameSettings({ isOpen, onOpenChange }) {
    const { appId, appName } = useContext(AppContext);
    const [maxIdleTime, setMaxIdleTime] = useState('');
    const [maxCardDrops, setMaxCardDrops] = useState('');
    const [maxAchievementUnlocks, setMaxAchievementUnlocks] = useState('');
    const [initialSettings, setInitialSettings] = useState({});

    useEffect(() => {
        if (isOpen) {
            const gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
            const settings = gameSettings[appId] || {};
            setMaxIdleTime(settings.maxIdleTime || '');
            setMaxCardDrops(settings.maxCardDrops || '');
            setMaxAchievementUnlocks(settings.maxAchievementUnlocks || '');
            setInitialSettings(settings);
        }
    }, [appId, isOpen]);

    const handleSave = () => {
        const gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
        gameSettings[appId] = {
            ...gameSettings[appId],
            maxIdleTime: parseInt(maxIdleTime, 10) || 0,
            maxCardDrops: parseInt(maxCardDrops, 10) || 0,
            maxAchievementUnlocks: parseInt(maxAchievementUnlocks, 10) || 0
        };
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    };

    const handleMaxIdleTimeChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setMaxIdleTime(value);
        }
    };

    const handleMaxAchievementUnlocksChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setMaxAchievementUnlocks(value);
        }
    };

    const handleMaxCardDropsChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setMaxCardDrops(value);
        }
    };

    const isSaveDisabled = () => {
        return (
            maxIdleTime === (initialSettings.maxIdleTime || '') &&
            maxCardDrops === (initialSettings.maxCardDrops || '') &&
            maxAchievementUnlocks === (initialSettings.maxAchievementUnlocks || '')
        );
    };

    return (
        <React.Fragment>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-container '>
                <ModalContent>
                    {(onClose) => (
                        <React.Fragment>
                            <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                                <p className='truncate'>
                                    Settings - {appName}
                                </p>
                            </ModalHeader>
                            <ModalBody className='max-h-[300px] overflow-y-auto'>
                                <div className='grid grid-cols-2 gap-4 w-full my-4'>
                                    <div className='flex flex-col gap-2 w-full'>
                                        <p className='text-xs'>
                                            Max idle time (minutes)
                                        </p>
                                        <Input
                                            size='sm'
                                            aria-label='max idle time'
                                            placeholder=' '
                                            className='max-w-[80px]'
                                            classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded-md group-data-[focus-within=true]:!bg-titlebar'] }}
                                            value={maxIdleTime}
                                            onChange={handleMaxIdleTimeChange}
                                        />
                                    </div>

                                    <div className='flex flex-col gap-2 w-full'>
                                        <p className='text-xs'>
                                            Max card drops
                                        </p>
                                        <Input
                                            size='sm'
                                            aria-label='max card drops'
                                            placeholder=' '
                                            className='max-w-[80px]'
                                            classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded-md group-data-[focus-within=true]:!bg-titlebar'] }}
                                            value={maxCardDrops}
                                            onChange={handleMaxCardDropsChange}
                                        />
                                    </div>

                                    <div className='flex flex-col gap-2 w-full'>
                                        <p className='text-xs'>
                                            Max achievement unlocks
                                        </p>
                                        <Input
                                            size='sm'
                                            aria-label='max achievement unlocks'
                                            placeholder=' '
                                            className='max-w-[80px]'
                                            classNames={{ inputWrapper: ['bg-input border border-inputborder hover:!bg-titlebar rounded-md group-data-[focus-within=true]:!bg-titlebar'] }}
                                            value={maxAchievementUnlocks}
                                            onChange={handleMaxAchievementUnlocksChange}
                                        />
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter className='border-t border-border bg-footer px-4 py-3'>
                                <Button
                                    size='sm'
                                    color='danger'
                                    variant='light'
                                    className='font-semibold rounded'
                                    onPress={() => {
                                        onClose();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size='sm'
                                    color='primary'
                                    className='font-semibold rounded'
                                    isDisabled={isSaveDisabled()}
                                    onPress={() => {
                                        handleSave();
                                        onClose();
                                    }}
                                >
                                    Save
                                </Button>
                            </ModalFooter>
                        </React.Fragment>
                    )}
                </ModalContent>
            </Modal>
        </React.Fragment>
    );
}