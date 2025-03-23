import { invoke } from '@tauri-apps/api/core';
import { useContext, useState, useRef, useEffect } from 'react';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';
import { showDangerToast } from '@/utils/toasts';

export default function useCustomList(listName) {
    const { isAchievementUnlocker, isCardFarming } = useContext(StateContext);
    const { userSummary, gamesList } = useContext(UserContext);
    const [list, setList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInList, setShowInList] = useState(false);
    const [visibleGames, setVisibleGames] = useState(50);
    const containerRef = useRef(null);

    // Filter games based on search term
    const filteredGamesList = gamesList.filter(game =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const getCustomLists = async () => {
            // Fetch the custom list data
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
        // Reset visible games when search changes
        setVisibleGames(50);
    }, [searchTerm]);

    useEffect(() => {
        // Setup infinite scroll
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
            // Load more games when scrolled near bottom
            if (containerRef.current.scrollTop + containerRef.current.clientHeight >= containerRef.current.scrollHeight - 10) {
                setVisibleGames((prevVisibleGames) => prevVisibleGames + 50);
            }
        }
    };

    const handleAddGame = async (game) => {
        // Add single game to the custom list
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
        // First clear the list, then add all games in one go
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
        // Remove a game from the custom list
        const response = await invoke('remove_game_from_custom_list', {
            steamId: userSummary.steamId,
            game: { appid: game.appid, name: game.name },
            list: listName
        });
        if (!response.error) {
            setList(response.list_data);
            if (response.list_data.length === 0) {
                // Switch view mode if list becomes empty
                setShowInList(false);
            }
        } else {
            showDangerToast(response.error);
        }
    };

    const handleUpdateListOrder = async (newList) => {
        // Save the new order of games in the list (after drag n drop)
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
        // Remove all games from the list
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