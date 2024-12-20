export const sortOptions = [
    { key: 'percent', label: 'Percentage' },
    { key: 'title', label: 'Alphabetically' },
    { key: 'status', label: 'Locked/Unlocked' },
];

export const handleChange = (e, achievementList, setAchievementList, percentageMap, userGameAchievementsMap, setIsSorted) => {
    if (e.currentKey === 'title') {
        const sortedList = [...achievementList].sort((a, b) => {
            return a.displayName.localeCompare(b.displayName);
        });
        setAchievementList(sortedList);
    }
    if (e.currentKey === 'percent') {
        const sortedList = [...achievementList].sort((a, b) => {
            const percentA = percentageMap.get(a.name) || 0;
            const percentB = percentageMap.get(b.name) || 0;
            return percentB - percentA;
        });
        setAchievementList(sortedList);
    }
    if (e.currentKey === 'status') {
        const sortedList = [...achievementList].sort((a, b) => {
            const isUnlockedA = userGameAchievementsMap.get(a.name) || false;
            const isUnlockedB = userGameAchievementsMap.get(b.name) || false;
            return Number(isUnlockedB) - Number(isUnlockedA);
        });
        setAchievementList(sortedList);
    }
    setIsSorted(true);
};
