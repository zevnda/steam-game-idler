import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, NumberInput } from '@heroui/react';
import { useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { StateContext } from '@/components/contexts/StateContext';

export default function GameSettings({ isOpen, onOpenChange }) {
    const { t } = useTranslation();
    const { appId, appName } = useContext(StateContext);
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
        setMaxIdleTime(e.target?.value || 0);
    };

    const handleMaxAchievementUnlocksChange = (e) => {
        setMaxAchievementUnlocks(e.target?.value || 0);
    };

    const handleMaxCardDropsChange = (e) => {
        setMaxCardDrops(e.target?.value || 0);
    };

    const isSaveDisabled = () => {
        return (
            maxIdleTime === (initialSettings.maxIdleTime || '') &&
            maxCardDrops === (initialSettings.maxCardDrops || '') &&
            maxAchievementUnlocks === (initialSettings.maxAchievementUnlocks || '')
        );
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} className='bg-modalbody text-content' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                            <p className='truncate'>
                                {t('settings.title')} - {appName}
                            </p>
                        </ModalHeader>
                        <ModalBody className='max-h-[300px] overflow-y-auto'>
                            <div className='grid grid-cols-2 gap-4 w-full my-4'>
                                <div className='flex flex-col gap-2 w-full'>
                                    <p className='text-xs'>
                                        {t('gameSettings.idle')}
                                    </p>
                                    <NumberInput
                                        hideStepper
                                        size='sm'
                                        value={maxIdleTime || 0}
                                        maxValue={99999}
                                        formatOptions={{ useGrouping: false }}
                                        aria-label='max idle'
                                        className='max-w-[80px]'
                                        classNames={{
                                            inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar h-8'],
                                            input: ['!text-content']
                                        }}
                                        onChange={handleMaxIdleTimeChange}
                                    />
                                </div>

                                <div className='flex flex-col gap-2 w-full'>
                                    <p className='text-xs'>
                                        {t('gameSettings.drops')}
                                    </p>
                                    <NumberInput
                                        hideStepper
                                        size='sm'
                                        value={maxCardDrops || 0}
                                        maxValue={99999}
                                        formatOptions={{ useGrouping: false }}
                                        aria-label='max drops'
                                        className='max-w-[80px]'
                                        classNames={{
                                            inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar h-8'],
                                            input: ['!text-content']
                                        }}
                                        onChange={handleMaxCardDropsChange}
                                    />
                                </div>

                                <div className='flex flex-col gap-2 w-full'>
                                    <p className='text-xs'>
                                        {t('gameSettings.achievements')}
                                    </p>
                                    <NumberInput
                                        hideStepper
                                        size='sm'
                                        value={maxAchievementUnlocks || 0}
                                        maxValue={99999}
                                        formatOptions={{ useGrouping: false }}
                                        aria-label='max unlocks'
                                        className='max-w-[80px]'
                                        classNames={{
                                            inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar h-8'],
                                            input: ['!text-content']
                                        }}
                                        onChange={handleMaxAchievementUnlocksChange}
                                    />
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter className='border-t border-border bg-modalfooter px-4 py-3'>
                            <Button
                                size='sm'
                                color='danger'
                                variant='light'
                                className='font-semibold rounded-lg'
                                onPress={() => {
                                    onClose();
                                }}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                size='sm'
                                className='font-semibold rounded-lg bg-dynamic text-button'
                                isDisabled={isSaveDisabled()}
                                onPress={() => {
                                    handleSave();
                                    onClose();
                                }}
                            >
                                {t('common.save')}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}