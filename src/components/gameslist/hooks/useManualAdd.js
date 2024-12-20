import { useState } from 'react';
import { toast } from 'react-toastify';
import { invoke } from '@tauri-apps/api/tauri';
import { logEvent } from '@/src/utils/utils';

export default function useManualAdd(setFavorites) {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAdd = async (onClose) => {
        setIsLoading(true);
        try {
            const res = await invoke('get_game_details', { appId: inputValue });
            const data = res[inputValue].data;
            const item = { appid: data.steam_appid, name: data.name };
            let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            favorites.push(JSON.stringify(item));
            localStorage.setItem('favorites', JSON.stringify(favorites));
            const newFavorites = (localStorage.getItem('favorites') && JSON.parse(localStorage.getItem('favorites'))) || [];
            setFavorites(newFavorites.map(JSON.parse));
            logEvent(`[Favorites] Added ${item.name} (${item.appid})`);
            setIsLoading(false);
            onClose();
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
