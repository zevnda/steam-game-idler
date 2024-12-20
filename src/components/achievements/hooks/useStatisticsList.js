import { useEffect } from 'react';

export default function useStatisticsList(statisticsList, userGameStatsMap, setInitialStatValues, setNewStatValues) {
    useEffect(() => {
        const initialValues = {};
        if (statisticsList) {
            statisticsList.forEach(item => {
                initialValues[item.name] = userGameStatsMap.get(item.name) || 0;
            });
        }
        setInitialStatValues(initialValues);
        setNewStatValues(prevValues => {
            return Object.keys(prevValues).length === 0 ? initialValues : prevValues;
        });
    }, [statisticsList, userGameStatsMap, setInitialStatValues, setNewStatValues]);
}
