import { useEffect } from 'react';

export default function useStatisticsList(statisticsList, setInitialStatValues, setNewStatValues) {
    useEffect(() => {
        const initialValues = {};
        if (statisticsList && statisticsList.length > 0) {
            statisticsList.forEach(item => {
                initialValues[item.name] = item.value || 0;
            });
        }
        setInitialStatValues(initialValues);
        setNewStatValues(prevValues => {
            return Object.keys(prevValues).length === 0 ? initialValues : prevValues;
        });
    }, []);
}
