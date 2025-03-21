import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useState, useContext } from 'react';

import { UserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/global/tasks';

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
                addToast({ description: response.error, color: 'warning' });
                return;
            } else {
                setList(response.list_data);
                setIsLoading(false);
                onClose();
            }
        } catch (error) {
            setIsLoading(false);
            addToast({ description: `Error in (handleAdd): ${error?.message || error}`, color: 'danger' });
            console.error('Error in (handleAdd):', error);
            logEvent(`[Error] in (handleAdd): ${error}`);
        }
    };

    const handleNameChange = (e) => {
        try {
            setAppNameValue(e.target.value || '');
        } catch (error) {
            addToast({ description: `Error in (handleChange): ${error?.message || error}`, color: 'danger' });
            console.error('Error in (handleChange):', error);
            logEvent(`[Error] in (handleChange): ${error}`);
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
            addToast({ description: `Error in (handleChange): ${error?.message || error}`, color: 'danger' });
            console.error('Error in (handleChange):', error);
            logEvent(`[Error] in (handleChange): ${error}`);
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