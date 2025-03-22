import { invoke } from '@tauri-apps/api/core';
import { useState, useContext } from 'react';

import { UserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/global/tasks';
import { showDangerToast, showWarningToast } from '@/utils/global/toasts';

export default function useManualAdd(listName, setList) {
    const { userSummary } = useContext(UserContext);
    const [appNameValue, setAppNameValue] = useState('');
    const [appIdValue, setAppIdValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = async (onClose) => {
        setIsLoading(true);
        try {

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
            showDangerToast('An error occurred. Check the logs for more information');
            console.error('Error in (handleAdd):', error);
            logEvent(`[Error] in (handleAdd): ${error}`);
        }
    };

    const handleNameChange = (e) => {
        try {
            setAppNameValue(e.target.value || '');
        } catch (error) {
            showDangerToast('An error occurred. Check the logs for more information');
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
            showDangerToast('An error occurred. Check the logs for more information');
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