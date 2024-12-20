import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { fetchAchievementData, sortAchievements, filterAchievements } from '../utils/achievementsHandler';

export default function useAchievements(steamId, appId) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSorted, setIsSorted] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [achievementList, setAchievementList] = useState([]);
    const [originalAchievementList, setOriginalAchievementList] = useState([]);
    const [statisticsList, setStatisticsList] = useState([]);
    const [userGameStats, setUserGameStats] = useState({});
    const [gameAchievementsPercentages, setGameAchievementsPercentages] = useState([]);
    const [achievementsUnavailable, setAchievementsUnavailable] = useState(false);
    const [statisticsUnavailable, setStatisticsUnavailable] = useState(false);
    const [btnLoading, setBtnLoading] = useState(false);
    const [currentTab, setCurrentTab] = useState(null);
    const [initialStatValues, setInitialStatValues] = useState({});
    const [newStatValues, setNewStatValues] = useState({});

    const userGameAchievementsMap = new Map();
    if (userGameStats?.achievements) {
        userGameStats.achievements.forEach(item => {
            userGameAchievementsMap.set(item.name, item.achieved);
        });
    }

    const userGameStatsMap = new Map();
    if (userGameStats?.stats) {
        userGameStats.stats.forEach(item => {
            userGameStatsMap.set(item.name, item.value);
        });
    }

    const percentageMap = new Map();
    gameAchievementsPercentages.forEach(item => percentageMap.set(item.name, item.percent));

    useEffect(() => {
        const getAchievementData = async () => {
            try {
                const data = await fetchAchievementData(steamId, appId);
                setAchievementList(data.achievementList);
                setOriginalAchievementList(data.achievementList);
                setStatisticsList(data.statisticsList);
                setUserGameStats(data.userGameStats);
                setGameAchievementsPercentages(data.gameAchievementsPercentages);
                setAchievementsUnavailable(data.achievementsUnavailable);
                setStatisticsUnavailable(data.statisticsUnavailable);
                setIsLoading(false);
            } catch (error) {
                toast.error(`Error in (getAchievementData): ${error?.message}`);
                console.error('Error in (getAchievementData):', error);
            }
        };
        getAchievementData();
    }, [steamId, appId]);

    useEffect(() => {
        if (!isSorted && achievementList.length > 0) {
            setAchievementList(sortAchievements(achievementList, percentageMap));
            setIsSorted(true);
        }
    }, [isSorted, achievementList, percentageMap]);

    useEffect(() => {
        if (inputValue.length > 0) {
            setAchievementList(filterAchievements(originalAchievementList, inputValue));
        } else {
            setAchievementList(originalAchievementList);
        }
    }, [inputValue, originalAchievementList]);

    return {
        isLoading,
        isSorted,
        setIsSorted,
        inputValue,
        setInputValue,
        achievementList,
        setAchievementList,
        statisticsList,
        userGameStats,
        gameAchievementsPercentages,
        achievementsUnavailable,
        statisticsUnavailable,
        btnLoading,
        setBtnLoading,
        currentTab,
        setCurrentTab,
        initialStatValues,
        setInitialStatValues,
        newStatValues,
        setNewStatValues,
        userGameAchievementsMap,
        userGameStatsMap,
        percentageMap
    };
}
