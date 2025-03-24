import { invoke } from '@tauri-apps/api/core';
import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { UserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/tasks';
import { showDangerToast, showWarningToast } from '@/utils/toasts';

export default function useManualAdd(listName, setList) {
    const { t } = useTranslation();
    const { userSummary } = useContext(UserContext);
    const [appNameValue, setAppNameValue] = useState('');
    const [appIdValue, setAppIdValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = async (onClose) => {
        setIsLoading(true);
        try {
            // Add game to custom list
            const response = await invoke('add_game_to_custom_list', {
                steamId: userSummary.steamId,
                game: { appid: parseInt(appIdValue), name: appNameValue },
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

    const handleNameChange = (e) => {
        try {
            setAppNameValue(e.target.value || '');
        } catch (error) {
            showDangerToast(t('common.error'));
            console.error('Error in (handleNameChange):', error);
            logEvent(`[Error] in (handleNameChange): ${error}`);
        }
    };

    const handleIdChange = (e) => {
        try {
            // If input value starts with 0, remove it
            // Happens when user copy-pastes the appid into the input
            if (e.target?.value.startsWith('0')) {
                setAppIdValue(e.target?.value.slice(1) || 0);
            } else {
                setAppIdValue(e.target?.value || 0);
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