import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { fetchAchievementData, sortAchievements, filterAchievements } from '../utils/achievementsHandler';
import { AppContext } from '../../layouts/components/AppContext';

export default function useAchievements() {
    const {
        userSummary,
        appId,
        achievementQueryValue,
        achievementList,
        setAchievementList,
        setStatisticsList,
        setAchievementsUnavailable,
        setStatisticsUnavailable
    } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(true);
    const [isSorted, setIsSorted] = useState(false);
    const [originalAchievementList, setOriginalAchievementList] = useState([]);
    const [userGameStats, setUserGameStats] = useState({});
    const [gameAchievementsPercentages, setGameAchievementsPercentages] = useState([]);
    const [btnLoading, setBtnLoading] = useState(false);
    const [initialStatValues, setInitialStatValues] = useState({});
    const [newStatValues, setNewStatValues] = useState({});

    // Map user game achievements
    const userGameAchievementsMap = new Map();
    if (userGameStats?.achievements) {
        userGameStats.achievements.forEach(item => {
            userGameAchievementsMap.set(item.name, item.achieved);
        });
    }

    // Map user game stats
    const userGameStatsMap = new Map();
    if (userGameStats?.stats) {
        userGameStats.stats.forEach(item => {
            userGameStatsMap.set(item.name, item.value);
        });
    }

    // Map game achievements percentages
    const percentageMap = new Map();
    gameAchievementsPercentages.forEach(item => percentageMap.set(item.name, item.percent));

    useEffect(() => {
        // Fetch achievement data
        const getAchievementData = async () => {
            try {
                const data = await fetchAchievementData(userSummary.steamId, appId);
                setGameAchievementsPercentages(data.gameAchievementsPercentages);
                const percentageMap = new Map();
                data.gameAchievementsPercentages.forEach(item => percentageMap.set(item.name, item.percent));
                const sortedAchievements = sortAchievements(data.achievementList, percentageMap);
                setAchievementList(sortedAchievements);
                setOriginalAchievementList(sortedAchievements);
                setStatisticsList(data.statisticsList);
                setUserGameStats(data.userGameStats);
                setAchievementsUnavailable(data.achievementsUnavailable);
                setStatisticsUnavailable(data.statisticsUnavailable);
                setIsLoading(false);
                setIsSorted(true);
            } catch (error) {
                toast.error(`Error in (getAchievementData): ${error?.message}`);
                console.error('Error in (getAchievementData):', error);
            }
        };
        getAchievementData();
    }, [userSummary.steamId, appId]);

    useEffect(() => {
        // Sort achievements if not sorted
        if (!isSorted && achievementList.length > 0) {
            setAchievementList(sortAchievements(achievementList, percentageMap));
            setIsSorted(true);
        }
    }, [isSorted, achievementList, percentageMap]);

    useEffect(() => {
        // Filter achievements based on input value
        if (achievementQueryValue.length > 0) {
            setAchievementList(filterAchievements(originalAchievementList, achievementQueryValue));
        } else {
            setAchievementList(originalAchievementList);
        }
    }, [achievementQueryValue, originalAchievementList]);

    return {
        isLoading,
        isSorted,
        setIsSorted,
        userGameStats,
        gameAchievementsPercentages,
        btnLoading,
        setBtnLoading,
        initialStatValues,
        setInitialStatValues,
        newStatValues,
        setNewStatValues,
        userGameAchievementsMap,
        userGameStatsMap,
        percentageMap
    };
}
