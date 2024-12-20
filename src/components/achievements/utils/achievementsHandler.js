import { invoke } from '@tauri-apps/api/tauri';
import { logEvent } from '@/src/utils/utils';

export const fetchAchievementData = async (steamId, appId) => {
    try {
        const apiKey = localStorage.getItem('apiKey');
        const res = await invoke('get_achievement_data', { steamId: steamId, appId: appId.toString(), apiKey: apiKey });
        const achievementList = res.schema.game?.availableGameStats?.achievements || [];
        const statisticsList = res.schema.game?.availableGameStats?.stats || [];
        const userGameStats = res.userStats?.playerstats;
        const gameAchievementsPercentages = res.percentages?.achievementpercentages?.achievements || [];
        const achievementsUnavailable = !res.schema.game?.availableGameStats?.achievements;
        const statisticsUnavailable = !res.schema.game?.availableGameStats?.stats;

        return {
            achievementList,
            statisticsList,
            userGameStats,
            gameAchievementsPercentages,
            achievementsUnavailable,
            statisticsUnavailable
        };
    } catch (error) {
        logEvent(`[Error] in (fetchAchievementData): ${error}`);
        throw error;
    }
};

export const sortAchievements = (achievementList, percentageMap) => {
    return [...achievementList].sort((a, b) => {
        const percentA = percentageMap.get(a.name) || 0;
        const percentB = percentageMap.get(b.name) || 0;
        return percentB - percentA;
    });
};

export const filterAchievements = (achievementList, inputValue) => {
    return achievementList.filter(achievement =>
        achievement.displayName.toLowerCase().includes(inputValue.toLowerCase())
    );
};
