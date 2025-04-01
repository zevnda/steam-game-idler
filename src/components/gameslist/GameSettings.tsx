import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, NumberInput } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect } from 'react';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { useStateContext } from '@/components/contexts/StateContext';
import { useUserContext } from '@/components/contexts/UserContext';
import type { InvokeSettings } from '@/types/invoke';
import type { GameSpecificSettings } from '@/types/settings';

interface GameSettingsProps {
    isOpen: boolean;
    onOpenChange: () => void;
}

export default function GameSettings({ isOpen, onOpenChange }: GameSettingsProps): JSX.Element {
    const { t } = useTranslation();
    const { userSummary, userSettings, setUserSettings } = useUserContext();
    const { appId, appName, setIsGameSettingsOpen } = useStateContext();
    const [maxIdleTime, setMaxIdleTime] = useState(0);
    const [maxCardDrops, setMaxCardDrops] = useState(0);
    const [maxAchievementUnlocks, setMaxAchievementUnlocks] = useState(0);

    useEffect(() => {
        const fetchGameSettings = async (): Promise<void> => {
            const gameSettings: GameSpecificSettings = (userSettings.gameSettings && appId && userSettings.gameSettings[appId]) || {};
            setMaxIdleTime(gameSettings.maxIdleTime || 0);
            setMaxCardDrops(gameSettings.maxCardDrops || 0);
            setMaxAchievementUnlocks(gameSettings.maxAchievementUnlocks || 0);
        };
        fetchGameSettings();
    }, [appId, userSettings.gameSettings]);

    const handleSave = async (): Promise<void> => {
        if (!appId) return;

        const gameSettings = userSettings.gameSettings || {};

        gameSettings[appId] = {
            ...gameSettings[appId],
            maxIdleTime: maxIdleTime || 0,
            maxCardDrops: maxCardDrops || 0,
            maxAchievementUnlocks: maxAchievementUnlocks || 0
        };

        const updateResponse = await invoke<InvokeSettings>('update_user_settings', {
            steamId: userSummary?.steamId,
            key: 'gameSettings',
            value: gameSettings
        });
        setUserSettings(updateResponse.settings);
    };

    const handleMaxIdleTimeChange = (value: number): void => {
        setMaxIdleTime(value || 0);
    };

    const handleMaxAchievementUnlocksChange = (value: number): void => {
        setMaxAchievementUnlocks(value || 0);
    };

    const handleMaxCardDropsChange = (value: number): void => {
        setMaxCardDrops(value || 0);
    };

    const isSaveDisabled = (): boolean => {
        return (
            maxIdleTime === (userSettings.gameSettings?.maxIdleTime || '') &&
            maxCardDrops === (userSettings.gameSettings?.maxCardDrops || '') &&
            maxAchievementUnlocks === (userSettings.gameSettings?.maxAchievementUnlocks || '')
        );
    };

    const handleModalClose = (): void => {
        setIsGameSettingsOpen(false);
        onOpenChange();
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={handleModalClose} className='bg-modalbody text-content z-[999]' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
            <ModalContent>
                {(onClose: () => void) => (
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
                                        onValueChange={handleMaxIdleTimeChange}
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
                                        onValueChange={handleMaxCardDropsChange}
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
                                        onValueChange={handleMaxAchievementUnlocksChange}
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