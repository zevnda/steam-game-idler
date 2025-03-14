import { useContext, useState, useRef, useEffect } from 'react';

import { StateContext } from '@/components/contexts/StateContext';
import { UserContext } from '@/components/contexts/UserContext';

export default function useCustomList(listName) {
    const { isAchievementUnlocker, isCardFarming } = useContext(StateContext);
    const { gameList } = useContext(UserContext);
    const [list, setList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInList, setShowInList] = useState(false);
    const [visibleGames, setVisibleGames] = useState(50);
    const containerRef = useRef(null);

    const handleScroll = () => {
        if (containerRef.current) {
            if (containerRef.current.scrollTop + containerRef.current.clientHeight >= containerRef.current.scrollHeight - 10) {
                setVisibleGames((prevVisibleGames) => prevVisibleGames + 50);
            }
        }
    };

    const filteredGamesList = gameList.filter(game =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddGame = (game) => {
        const cachedList = JSON.parse(localStorage.getItem(`${listName}Cache`)) || [];
        const gameExists = cachedList.find(item => item.appid === game.appid);
        if (!gameExists) {
            const updatedList = [...cachedList, game];
            localStorage.setItem(`${listName}Cache`, JSON.stringify(updatedList));
            setList(updatedList);
        }
    };

    const handleRemoveGame = (game) => {
        const cachedList = JSON.parse(localStorage.getItem(`${listName}Cache`)) || [];
        const gameExists = cachedList.find(item => item.appid === game.appid);
        if (gameExists) {
            const updatedList = list.filter(item => item.appid !== game.appid);
            localStorage.setItem(`${listName}Cache`, JSON.stringify(updatedList));
            setList(updatedList);
            if (updatedList.length === 0) {
                setShowInList(false);
            }
        }
    };

    const updateListOrder = (newList) => {
        localStorage.setItem(`${listName}Cache`, JSON.stringify(newList));
        setList(newList);
    };

    useEffect(() => {
        const cachedList = JSON.parse(localStorage.getItem(`${listName}Cache`)) || [];
        setList(cachedList);
    }, [isAchievementUnlocker, isCardFarming, listName]);

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
        handleRemoveGame,
        updateListOrder
    };
}