import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserContext } from '@/components/contexts/UserContext';
import type { Game, InvokeCustomList } from '@/types';
import { logEvent } from '@/utils/tasks';
import { showDangerToast, showWarningToast } from '@/utils/toasts';

interface ManualAddHook {
    isLoading: boolean;
    appNameValue: string;
    appIdValue: number | string;
    setAppNameValue: Dispatch<SetStateAction<string>>;
    setAppIdValue: Dispatch<SetStateAction<number>>;
    handleNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleIdChange: (e: number | ChangeEvent<HTMLInputElement>) => void;
    handleAdd: (onClose: () => void) => Promise<void>;
}

export default function useManualAdd(
    listName: string,
    setList: Dispatch<SetStateAction<Game[]>>
): ManualAddHook {
    const { t } = useTranslation();
    const { userSummary } = useUserContext();
    const [appNameValue, setAppNameValue] = useState('');
    const [appIdValue, setAppIdValue] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = async (onClose: () => void): Promise<void> => {
        setIsLoading(true);
        try {
            // Add game to custom list
            const response = await invoke<InvokeCustomList>('add_game_to_custom_list', {
                steamId: userSummary?.steamId,
                game: { appid: Number(appIdValue), name: appNameValue },
                list: listName
            });
            if (response.error) {
                setIsLoading(false);
                showWarningToast(response.error);
                return;
            } else {
                setList(response.list_data);
                setIsLoading(false);
                onClose();
            }
        } catch (error) {
            setIsLoading(false);
            showDangerToast(t('common.error'));
            console.error('Error in (handleAdd):', error);
            logEvent(`[Error] in (handleAdd): ${error}`);
        }
    };

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
        try {
            setAppNameValue(e.target.value || '');
        } catch (error) {
            showDangerToast(t('common.error'));
            console.error('Error in (handleNameChange):', error);
            logEvent(`[Error] in (handleNameChange): ${error}`);
        }
    };

    const handleIdChange = (e: number | ChangeEvent<HTMLInputElement>): void => {
        try {
            // If input value starts with 0, remove it
            // Happens when user copy-pastes the appid into the input
            const value = typeof e === 'number' ? e : Number(e.target.value);
            if (String(value).startsWith('0')) {
                setAppIdValue(Number(String(value).slice(1)) || 0);
            } else {
                setAppIdValue(Number(value) || 0);
            }
        } catch (error) {
            showDangerToast(t('common.error'));
            console.error('Error in (handleIdChange):', error);
            logEvent(`[Error] in (handleIdChange): ${error}`);
        }
    };

    return {
        isLoading,
        appNameValue,
        appIdValue,
        setAppNameValue,
        setAppIdValue,
        handleNameChange,
        handleIdChange,
        handleAdd
    };
}