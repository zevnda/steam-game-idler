import { addToast } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { useState, useContext } from 'react';

import { UserContext } from '@/components/contexts/UserContext';
import { logEvent } from '@/utils/utils';

export default function useManualAdd(listName, setList) {
    const { userSummary } = useContext(UserContext);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = async (onClose) => {
        setIsLoading(true);
        try {
            const res = await invoke('get_game_details', { appId: inputValue.toString() });

            if (res[inputValue].success === false) {
                setIsLoading(false);
                addToast({ description: 'A game with that ID does not exist', color: 'danger' });
                return;
            }

            const data = res[inputValue].data;
            const game = { appid: data.steam_appid, name: data.name };

            const response = await invoke('add_game_to_custom_list', {
                steamId: userSummary.steamId,
                game: { appid: game.appid, name: game.name },
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

    const handleChange = (e) => {
        try {
            setInputValue(e.target?.value || 0);
        } catch (error) {
            addToast({ description: `Error in (handleChange): ${error?.message || error}`, color: 'danger' });
            console.error('Error in (handleChange):', error);
            logEvent(`[Error] in (handleChange): ${error}`);
        }
    };

    return {
        inputValue,
        isLoading,
        setInputValue,
        handleAdd,
        handleChange
    };
}