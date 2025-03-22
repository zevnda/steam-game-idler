import { invoke } from '@tauri-apps/api/core';
import { useContext, useState, useRef, useEffect } from 'react';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import { showDangerToast } from '@/utils/global/toasts';

export default function useCustomList(listName) {
    const { isAchievementUnlocker, isCardFarming } = useContext(StateContext);
    const { userSummary, gamesList } = useContext(UserContext);
    const [list, setList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInList, setShowInList] = useState(false);
    const [visibleGames, setVisibleGames] = useState(50);
    const containerRef = useRef(null);

    const filteredGamesList = gamesList.filter(game =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const getCustomLists = async () => {
            const response = await invoke('get_custom_lists', { steamId: userSummary.steamId, list: listName });
            if (!response.error) {
                setList(response.list_data);
            } else {
                showDangerToast(response.error);
                setList([]);
            }
        };
        getCustomLists();
    }, [userSummary.steamId, isAchievementUnlocker, isCardFarming, listName]);

    useEffect(() => {
        setVisibleGames(50);
    }, [searchTerm]);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => {
                container.removeEventListener('scroll', handleScroll);
            };
        }
    }, [filteredGamesList, visibleGames]);

    const handleScroll = () => {
        if (containerRef.current) {
            if (containerRef.current.scrollTop + containerRef.current.clientHeight >= containerRef.current.scrollHeight - 10) {
                setVisibleGames((prevVisibleGames) => prevVisibleGames + 50);
            }
        }
    };

    const handleAddGame = async (game) => {
        const response = await invoke('add_game_to_custom_list', {
            steamId: userSummary.steamId,
            game: { appid: game.appid, name: game.name },
            list: listName
        });
        if (!response.error) {
            setList(response.list_data);
        } else {
            showDangerToast(response.error);
        }
    };

    const handleAddAllGames = async (games) => {
        const clearResponse = await invoke('update_custom_list', {
            steamId: userSummary.steamId,
            list: listName,
            newList: []
        });
        if (!clearResponse.error) {
            const addResponse = await invoke('update_custom_list', {
                steamId: userSummary.steamId,
                list: listName,
                newList: games
            });
            if (!addResponse.error) {
                setList(addResponse.list_data);
            } else {
                showDangerToast(addResponse.error);
            }
        } else {
            showDangerToast(clearResponse.error);
        }
    };

    const handleRemoveGame = async (game) => {
        const response = await invoke('remove_game_from_custom_list', {
            steamId: userSummary.steamId,
            game: { appid: game.appid, name: game.name },
            list: listName
        });
        if (!response.error) {
            setList(response.list_data);
            if (response.list_data.length === 0) {
                setShowInList(false);
            }
        } else {
            showDangerToast(response.error);
        }
    };

    const handleUpdateListOrder = async (newList) => {
        const response = await invoke('update_custom_list', {
            steamId: userSummary.steamId,
            list: listName,
            newList
        });
        if (!response.error) {
            setList(response.list_data);
        } else {
            showDangerToast(response.error);
        }
    };

    const handleClearList = async () => {
        const response = await invoke('update_custom_list', {
            steamId: userSummary.steamId,
            list: listName,
            newList: []
        });
        if (!response.error) {
            setList([]);
            setShowInList(false);
        } else {
            showDangerToast(response.error);
        }
    };

    return {
        list,
        setList,
        visibleGames,
        filteredGamesList,
        containerRef,
        searchTerm,
        setSearchTerm,
        showInList,
        setShowInList,
        handleAddGame,
        handleAddAllGames,
        handleRemoveGame,
        handleUpdateListOrder,
        handleClearList
    };
}