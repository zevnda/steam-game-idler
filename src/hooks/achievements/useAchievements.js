import { useContext, useEffect, useState, useMemo } from 'react';

import { AppContext } from '@/components/layout/AppContext';
import { fetchAchievementData, sortAchievements, filterAchievements } from '@/utils/achievements/achievementsHandler';
import { addToast } from '@heroui/react';

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
    const percentageMap = useMemo(() => {
        const map = new Map();
        gameAchievementsPercentages.forEach(item => map.set(item.name, item.percent));
        return map;
    }, [gameAchievementsPercentages]);

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
                addToast({ description: `Error in (getAchievementData): ${error?.message}`, color: 'danger' });
                console.error('Error in (getAchievementData):', error);
            }
        };
        getAchievementData();
    }, [userSummary.steamId, appId, setAchievementList, setAchievementsUnavailable, setStatisticsList, setStatisticsUnavailable]);

    useEffect(() => {
        // Sort achievements if not sorted
        if (!isSorted && achievementList.length > 0) {
            setAchievementList(sortAchievements(achievementList, percentageMap));
            setIsSorted(true);
        }
    }, [isSorted, achievementList, percentageMap, setAchievementList]);

    useEffect(() => {
        // Filter achievements based on input value
        if (achievementQueryValue.length > 0) {
            setAchievementList(filterAchievements(originalAchievementList, achievementQueryValue));
        } else {
            setAchievementList(originalAchievementList);
        }
    }, [achievementQueryValue, originalAchievementList, setAchievementList]);

    return {
        isLoading,
        isSorted,
        setIsSorted,
        userGameStats,
        gameAchievementsPercentages,
        initialStatValues,
        setInitialStatValues,
        newStatValues,
        setNewStatValues,
        userGameAchievementsMap,
        userGameStatsMap,
        percentageMap
    };
}
