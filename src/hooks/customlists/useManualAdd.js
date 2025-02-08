import { useState } from 'react';
import { toast } from 'react-toastify';
import { invoke } from '@tauri-apps/api/tauri';
import { logEvent } from '@/src/utils/utils';

export default function useManualAdd(listName, setList) {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = async (onClose) => {
        setIsLoading(true);
        try {
            const res = await invoke('get_game_details', { appId: inputValue });

            if (res[inputValue].success === false) {
                setIsLoading(false);
                toast.error('A game with that ID does not exist');
                return;
            }

            const data = res[inputValue].data;
            const game = { appid: data.steam_appid, name: data.name };

            const cachedList = JSON.parse(localStorage.getItem(`${listName}Cache`)) || [];
            const gameExists = cachedList.find(item => item.appid === game.appid);
            if (!gameExists) {
                const updatedList = [...cachedList, game];
                localStorage.setItem(`${listName}Cache`, JSON.stringify(updatedList));
                setList(updatedList);
                setIsLoading(false);
                onClose();
            } else {
                setIsLoading(false);
                toast.error('Game already exists in the list');
            }
        } catch (error) {
            setIsLoading(false);
            toast.error(`Error in (handleAdd): ${error?.message || error}`);
            console.error('Error in (handleAdd):', error);
            logEvent(`[Error] in (handleAdd): ${error}`);
        }
    };

    const handleChange = (e) => {
        try {
            const value = e.target.value;
            const numericValue = value.replace(/[^0-9]/g, '');
            setInputValue(numericValue);
        } catch (error) {
            toast.error(`Error in (handleChange): ${error?.message || error}`);
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